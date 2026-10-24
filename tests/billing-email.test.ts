import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import {
  sendPendingBillingEmails,
  billingRecipient,
} from "../src/lib/payments/billing-email";
import type { Database } from "../src/lib/payments/store";

test("billing email durable claims, retry rules and mode-isolated internal recipients", async (t) => {
  const engine = new PGlite();
  await engine.exec("CREATE ROLE anon;CREATE ROLE authenticated;");
  await engine.exec(
    await readFile(
      new URL(
        "../supabase/migrations/20261023061138_minimal_membership.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await engine.exec(
    await readFile(
      new URL(
        "../supabase/migrations/20261024090000_checkout_contact_and_welcome.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const db: Database = {
    query: async (text, values) =>
      engine.query<Record<string, unknown>>(text, values),
    transaction: (work) =>
      engine.transaction((tx) =>
        work({
          query: async (text, values) =>
            tx.query<Record<string, unknown>>(text, values),
        }),
      ),
  };
  const config = {
    mode: "test" as const,
    apiKey: "re_synthetic",
    from: "Billing <billing@example.test>",
  };
  async function fixture(mode: "test" | "live" = "test", reset = true) {
    if (reset)
      await engine.exec(
        "TRUNCATE webhook_events,subscriptions,members CASCADE",
      );
    const m = await engine.query<{ id: string }>(
      `INSERT INTO members(mode,full_name,email,phone) VALUES($1,'Test Contact','member@example.test','+919999999999') RETURNING id`,
      [mode],
    );
    await engine.query(
      `INSERT INTO subscriptions(id,mode,member_id,session_hash,plan,expected_amount,razorpay_plan_id,policy_version,failure_email_state) VALUES($1,$4,$2,$3,'monthly',49900,'plan_test','v1','pending')`,
      [randomUUID(), m.rows[0].id, "0".repeat(64), mode],
    );
  }
  const state = async () =>
    (
      await engine.query<{ failure_email_state: string }>(
        "SELECT failure_email_state FROM subscriptions",
      )
    ).rows[0].failure_email_state;
  try {
    await t.test(
      "missing key defers without claiming or blocking payment processing",
      async () => {
        await fixture();
        const result = await sendPendingBillingEmails(db, {
          ...config,
          apiKey: undefined,
        });
        assert.equal(result.state, "missing_api_key");
        assert.equal(await state(), "pending");
      },
    );
    await t.test(
      "concurrent/repeated dispatch sends once with a stable idempotency key",
      async () => {
        await fixture();
        let calls = 0;
        const send = async (
          message: { to: string; subject: string; text: string },
          key: string,
        ) => {
          calls++;
          assert.equal(message.to, billingRecipient);
          assert.match(message.subject, /TEST/);
          assert.match(message.text, /member@example.test/);
          assert.match(key, /^billing-failure\/test\//);
          return { accepted: true };
        };
        await Promise.all([
          sendPendingBillingEmails(db, config, send),
          sendPendingBillingEmails(db, config, send),
        ]);
        assert.equal(calls, 1);
        assert.equal(await state(), "sent");
        assert.equal(
          (await sendPendingBillingEmails(db, config, send)).sent,
          0,
        );
      },
    );
    await t.test(
      "definitive rejection can be retried; unknown outcome is never blindly resent",
      async () => {
        await fixture();
        await sendPendingBillingEmails(db, config, async () => ({
          accepted: false,
          definiteFailure: true,
        }));
        assert.equal(await state(), "failed");
        await sendPendingBillingEmails(db, config, async () => {
          throw new Error("timeout");
        });
        assert.equal(await state(), "sending");
        let calls = 0;
        await sendPendingBillingEmails(db, config, async () => {
          calls++;
          return { accepted: true };
        });
        assert.equal(calls, 0);
      },
    );
    await t.test(
      "live alerts send once to billing without processing test records",
      async () => {
        await fixture("test");
        await fixture("live", false);
        let calls = 0;
        const live = { ...config, mode: "live" as const };
        const send = async (
          message: { to: string; subject: string; text: string },
          key: string,
        ) => {
          calls++;
          assert.equal(message.to, billingRecipient);
          assert.doesNotMatch(message.subject, /TEST/);
          assert.match(message.text, /LIVE MODE/);
          assert.match(key, /^billing-failure\/live\//);
          return { accepted: true };
        };
        await Promise.all([
          sendPendingBillingEmails(db, live, send),
          sendPendingBillingEmails(db, live, send),
        ]);
        assert.equal(calls, 1);
        assert.equal((await sendPendingBillingEmails(db, live, send)).sent, 0);
        assert.deepEqual(
          (
            await engine.query(
              "SELECT mode,failure_email_state FROM subscriptions ORDER BY mode",
            )
          ).rows,
          [
            { mode: "live", failure_email_state: "sent" },
            { mode: "test", failure_email_state: "pending" },
          ],
        );
      },
    );
    await t.test(
      "missing key and delivery failures never change live payment or membership facts",
      async () => {
        await fixture("live");
        await engine.exec(`UPDATE members SET status='active';
        UPDATE subscriptions SET payment_status='paid',paid_until=now()+interval '30 days',last_payment_id='pay_verified'`);
        const facts = async () =>
          (
            await engine.query(`SELECT m.status,s.payment_status,s.paid_until,s.last_payment_id
        FROM subscriptions s JOIN members m ON m.id=s.member_id`)
          ).rows;
        const before = await facts();
        const live = { ...config, mode: "live" as const };
        assert.equal(
          (await sendPendingBillingEmails(db, { ...live, apiKey: undefined }))
            .state,
          "missing_api_key",
        );
        assert.equal(await state(), "pending");
        assert.deepEqual(await facts(), before);
        assert.equal(
          (
            await sendPendingBillingEmails(db, live, async () => ({
              accepted: false,
              definiteFailure: true,
            }))
          ).state,
          "send_failed",
        );
        assert.equal(await state(), "failed");
        assert.deepEqual(await facts(), before);
        assert.equal(
          (
            await sendPendingBillingEmails(db, live, async () => {
              throw new Error("timeout");
            })
          ).state,
          "delivery_uncertain",
        );
        assert.equal(await state(), "sending");
        assert.deepEqual(await facts(), before);
        let calls = 0;
        await sendPendingBillingEmails(db, live, async () => {
          calls++;
          return { accepted: true };
        });
        assert.equal(calls, 0);
      },
    );
  } finally {
    await engine.close();
  }
});
