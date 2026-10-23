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

test("billing email durable claims, retry rules and test-only internal recipients", async (t) => {
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
  async function fixture() {
    await engine.exec("TRUNCATE webhook_events,subscriptions,members CASCADE");
    const m = await engine.query<{ id: string }>(
      `INSERT INTO members(mode,full_name,email,phone) VALUES('test','Test Contact','member@example.test','+919999999999') RETURNING id`,
    );
    await engine.query(
      `INSERT INTO subscriptions(id,mode,member_id,session_hash,plan,expected_amount,razorpay_plan_id,policy_version,failure_email_state) VALUES($1,'test',$2,$3,'monthly',49900,'plan_test','v1','pending')`,
      [randomUUID(), m.rows[0].id, "0".repeat(64)],
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
    await t.test("live email dispatch remains disabled", async () => {
      await fixture();
      let calls = 0;
      const result = await sendPendingBillingEmails(
        db,
        { ...config, mode: "live" },
        async () => {
          calls++;
          return { accepted: true };
        },
      );
      assert.equal(result.state, "disabled_for_live");
      assert.equal(calls, 0);
      assert.equal(await state(), "pending");
    });
  } finally {
    await engine.close();
  }
});
