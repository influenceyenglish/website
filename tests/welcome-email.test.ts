import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import {
  sendPendingWelcomeEmails,
  welcomeMessage,
} from "../src/lib/payments/welcome-email";
import { communityInvite } from "../src/lib/community";
import type { Database } from "../src/lib/payments/store";

test("welcome delivery is live-only, paid-only, durable and independent of membership", async (t) => {
  const engine = new PGlite();
  await engine.exec("CREATE ROLE anon; CREATE ROLE authenticated;");
  for (const name of [
    "20261023061138_minimal_membership",
    "20261024090000_checkout_contact_and_welcome",
  ])
    await engine.exec(
      await readFile(
        new URL(`../supabase/migrations/${name}.sql`, import.meta.url),
        "utf8",
      ),
    );
  const db: Database = {
    query: (sql, values) => engine.query<Record<string, unknown>>(sql, values),
    transaction: (work) =>
      engine.transaction((tx) =>
        work({
          query: (sql, values) =>
            tx.query<Record<string, unknown>>(sql, values),
        }),
      ),
  };
  const config = {
    mode: "live" as const,
    apiKey: "synthetic",
    from: "Influency English <billing@example.test>",
    communityUrl: "https://chat.whatsapp.com/ValidInvite",
  };
  async function fixture(mode = "live", payment = "paid") {
    await engine.exec("TRUNCATE webhook_events,subscriptions,members CASCADE");
    const member = (
      await engine.query<{ id: string }>(
        `INSERT INTO members(mode,full_name,email,phone,status) VALUES($1,'Old name','member@example.test','+919876543210','active') RETURNING id`,
        [mode],
      )
    ).rows[0];
    await engine.query(
      `INSERT INTO subscriptions(id,mode,member_id,session_hash,plan,expected_amount,razorpay_plan_id,policy_version,checkout_name,checkout_email,checkout_phone,payment_status,paid_until,welcome_email_state)
      VALUES($1,$2,$3,$4,'monthly',49900,'plan_test','v1','Shafi','checkout@example.test','+919876543211',$5,CASE WHEN $5='paid' THEN now()+interval '30 days' ELSE NULL END,'pending')`,
      [randomUUID(), mode, member.id, "0".repeat(64), payment],
    );
  }
  const state = async () =>
    (
      await engine.query<{ welcome_email_state: string }>(
        "SELECT welcome_email_state FROM subscriptions",
      )
    ).rows[0].welcome_email_state;
  const facts = async () =>
    (
      await engine.query(
        "SELECT m.status,s.payment_status,s.paid_until FROM subscriptions s JOIN members m ON m.id=s.member_id",
      )
    ).rows;
  try {
    await t.test(
      "a verified welcome uses the checkout email and sends once across concurrent dispatches",
      async () => {
        await fixture();
        const before = await facts();
        let calls = 0;
        const send = async (
          message: { to: string; html?: string; text: string },
          key: string,
        ) => {
          calls++;
          assert.equal(message.to, "checkout@example.test");
          assert(message.html?.includes(config.communityUrl));
          assert(!message.text.includes("Old name"));
          assert.match(key, /^welcome\/live\//);
          return { accepted: true };
        };
        await Promise.all([
          sendPendingWelcomeEmails(db, config, send),
          sendPendingWelcomeEmails(db, config, send),
        ]);
        assert.equal(calls, 1);
        assert.equal(await state(), "sent");
        assert.equal(
          (await sendPendingWelcomeEmails(db, config, send)).sent,
          0,
        );
        assert.deepEqual(await facts(), before);
      },
    );
    await t.test(
      "pending, failed, refunded, expired and Test Mode records never send a welcome",
      async () => {
        let calls = 0;
        const send = async () => {
          calls++;
          return { accepted: true };
        };
        for (const payment of ["pending", "failed", "refunded"]) {
          await fixture("live", payment);
          assert.equal(
            (await sendPendingWelcomeEmails(db, config, send)).sent,
            0,
          );
        }
        await fixture();
        await engine.exec(
          "UPDATE subscriptions SET paid_until=now()-interval '1 day'",
        );
        assert.equal(
          (await sendPendingWelcomeEmails(db, config, send)).sent,
          0,
        );
        await fixture("test");
        assert.equal(
          (
            await sendPendingWelcomeEmails(
              db,
              { ...config, mode: "test" },
              send,
            )
          ).state,
          "disabled_for_test",
        );
        assert.equal(
          (await sendPendingWelcomeEmails(db, config, send)).sent,
          0,
        );
        assert.equal(calls, 0);
      },
    );
    await t.test(
      "missing settings leave email pending; delivery errors never affect paid access",
      async () => {
        await fixture();
        const before = await facts();
        assert.equal(
          (await sendPendingWelcomeEmails(db, { ...config, apiKey: undefined }))
            .state,
          "missing_api_key",
        );
        assert.equal(
          (
            await sendPendingWelcomeEmails(
              db,
              { ...config, communityUrl: undefined },
              async () => ({ accepted: true }),
            )
          ).state,
          "missing_community_url",
        );
        assert.equal(await state(), "pending");
        await sendPendingWelcomeEmails(db, config, async () => ({
          accepted: false,
          definiteFailure: true,
        }));
        assert.equal(await state(), "failed");
        assert.deepEqual(await facts(), before);
        await sendPendingWelcomeEmails(db, config, async () => {
          throw new Error("timeout");
        });
        assert.equal(await state(), "sending");
        assert.deepEqual(await facts(), before);
        let calls = 0;
        await sendPendingWelcomeEmails(db, config, async () => {
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

test("welcome template includes the charged annual total and only a valid WhatsApp link", () => {
  assert.equal(communityInvite("https://evil.example/invite"), null);
  assert.equal(communityInvite("https://user@chat.whatsapp.com/invite"), null);
  const message = welcomeMessage(
    "sender@example.test",
    "member@example.test",
    "yearly",
    478800,
    "https://chat.whatsapp.com/ValidInvite",
  );
  assert(message.text.includes("4,788"));
  assert(message.html?.includes("Yearly"));
  assert(message.text.includes("admin"));
});
