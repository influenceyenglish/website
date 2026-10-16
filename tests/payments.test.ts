import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  PaymentStore,
  type Database,
  type SQL,
} from "../src/lib/payments/store";
import { PaymentService } from "../src/lib/payments/service";
import { validSignature, hash } from "../src/lib/payments/signatures";
import {
  createCheckoutSchema,
  PaymentError,
  type PaymentGateway,
  type ProviderPayment,
  type ProviderInvoice,
  type ProviderSubscription,
} from "../src/lib/payments/types";

const keySecret = "isolated-test-signing-secret",
  webhookSecret = "isolated-test-webhook-secret";
const sign = (body: string | Buffer, secret = webhookSecret) =>
  createHmac("sha256", secret).update(body).digest("hex");
const sessionHash = hash("synthetic-session-token");
const config = {
  mode: "test" as const,
  keySecret,
  webhookSecret,
  monthlyPlanId: "plan_monthly",
  yearlyPlanId: "plan_yearly",
};
class Gateway implements PaymentGateway {
  calls = 0;
  end = Math.floor(Date.now() / 1000) + 28 * 86400;
  remote: ProviderSubscription = {
    id: "sub_member",
    plan_id: "plan_monthly",
    status: "active",
    current_end: this.end,
    notes: {},
  };
  payment: ProviderPayment = {
    id: "pay_member",
    amount: 49900,
    currency: "INR",
    status: "captured",
    amount_refunded: 0,
    invoice_id: "inv_member",
  };
  invoice: ProviderInvoice = {
    id: "inv_member",
    subscription_id: "sub_member",
    payment_id: "pay_member",
    status: "paid",
    amount_paid: 49900,
    currency: "INR",
    billing_end: this.end,
  };
  async getPlan(id: string) {
    return {
      id,
      period: id === "plan_monthly" ? "monthly" : "yearly",
      interval: 1,
      item: { amount: id === "plan_monthly" ? 49900 : 478800, currency: "INR" },
    };
  }
  async createSubscription(
    input: Parameters<PaymentGateway["createSubscription"]>[0],
  ) {
    this.calls++;
    this.remote = {
      ...this.remote,
      plan_id: input.plan_id,
      notes: input.notes,
    };
    return this.remote;
  }
  async getSubscription() {
    return this.remote;
  }
  async getPayment() {
    return this.payment;
  }
  async getInvoice() {
    return this.invoice;
  }
}
function event(id: string, type = "subscription.charged", end?: number) {
  return Buffer.from(
    JSON.stringify({
      event: type,
      created_at: Math.floor(Date.now() / 1000),
      payload: {
        subscription: { entity: { id: "sub_member", current_end: end } },
        payment: { entity: { id: "pay_member" } },
      },
    }),
  );
}

test("signature validation uses exact raw bytes, strict hex and a constant-time digest comparison", () => {
  const raw = Buffer.from('{"event":"subscription.charged"}');
  assert(validSignature(raw, sign(raw), webhookSecret));
  assert(
    !validSignature(
      Buffer.from('{ "event": "subscription.charged" }'),
      sign(raw),
      webhookSecret,
    ),
  );
  assert(!validSignature(raw, "bad", webhookSecret));
  assert(!validSignature(raw, "0".repeat(64), webhookSecret));
  assert(!validSignature(raw, null, webhookSecret));
});
test("the browser cannot set prices, consent defaults, plan IDs or extra provider parameters", () => {
  const base = {
    requestId: randomUUID(),
    plan: "monthly",
    name: "Test member",
    email: "member@example.test",
    consent: true,
  };
  assert(createCheckoutSchema.safeParse(base).success);
  assert(!createCheckoutSchema.safeParse({ ...base, amount: 1 }).success);
  assert(
    !createCheckoutSchema.safeParse({ ...base, plan: "plan_attacker" }).success,
  );
  assert(!createCheckoutSchema.safeParse({ ...base, consent: false }).success);
});

test("subscription service with the real SQL schema and transactional Postgres engine", async (t) => {
  const engine = new PGlite();
  await engine.exec(
    await readFile(
      new URL("../db/001_subscriptions.sql", import.meta.url),
      "utf8",
    ),
  );
  let failOutbox = false;
  const adapt = (sql: {
    query: <T>(query: string, params?: unknown[]) => Promise<{ rows: T[] }>;
  }): SQL => ({
    query: async (text, values) => {
      if (failOutbox && text.includes("INSERT INTO membership_outbox"))
        throw new Error("simulated storage failure");
      return sql.query<Record<string, unknown>>(text, values);
    },
  });
  const database: Database = {
    ...adapt(engine),
    transaction: (work) => engine.transaction((tx) => work(adapt(tx))),
  };
  async function fixture(plan: "monthly" | "yearly" = "monthly") {
    await engine.exec(
      "TRUNCATE membership_outbox,webhook_events,payment_reversals,payment_grants,subscription_states,checkout_attempts,payment_rate_limits RESTART IDENTITY CASCADE",
    );
    const store = new PaymentStore(database, "test"),
      gateway = new Gateway(),
      service = new PaymentService(config, store, gateway);
    const input = {
      requestId: randomUUID(),
      plan,
      name: "Test member",
      email: "member@example.test",
      consent: true as const,
    };
    if (plan === "yearly") {
      gateway.remote.plan_id = "plan_yearly";
      gateway.payment.amount = 478800;
      gateway.invoice.amount_paid = 478800;
      gateway.end = Math.floor(Date.now() / 1000) + 365 * 86400;
      gateway.remote.current_end = gateway.end;
      gateway.invoice.billing_end = gateway.end;
    }
    const attempt = await service.create(input, sessionHash);
    return { store, gateway, service, input, attempt };
  }
  const count = async (table: string) =>
    Number(
      (await engine.query<{ count: string }>(`SELECT count(*) FROM ${table}`))
        .rows[0].count,
    );
  try {
    await t.test(
      "creation retries reuse the server-stored subscription and preserve a single consent record",
      async () => {
        const f = await fixture();
        const again = await f.service.create(f.input, sessionHash);
        assert.equal(again.subscription_id, f.attempt.subscription_id);
        assert.equal(f.gateway.calls, 1);
        assert.equal(await count("checkout_attempts"), 1);
      },
    );
    await t.test(
      "a misconfigured provider plan is rejected before subscription creation and uncertain retries do not repeat POST",
      async () => {
        const f = await fixture();
        f.gateway.getPlan = async (id) => ({
          id,
          period: "monthly",
          interval: 1,
          item: { amount: 1, currency: "INR" },
        });
        const input = { ...f.input, requestId: randomUUID() };
        await assert.rejects(
          () => f.service.create(input, sessionHash),
          PaymentError,
        );
        assert.equal(f.gateway.calls, 1);
        await assert.rejects(
          () => f.service.create(input, sessionHash),
          PaymentError,
        );
        assert.equal(f.gateway.calls, 1);
      },
    );
    await t.test(
      "monthly and yearly checkout only activate a verified full invoice-backed payment",
      async () => {
        for (const plan of ["monthly", "yearly"] as const) {
          const f = await fixture(plan);
          const result = await f.service.verify(
            {
              requestId: f.input.requestId,
              razorpay_payment_id: "pay_member",
              razorpay_subscription_id: "sub_member",
              razorpay_signature: sign("pay_member|sub_member", keySecret),
            },
            sessionHash,
          );
          assert.equal(result.status, "active");
          assert.equal(await count("payment_grants"), 1);
          assert.equal(await count("membership_outbox"), 1);
        }
      },
    );
    await t.test(
      "existing subscriptions retain their stored plan when dashboard configuration changes",
      async () => {
        const f = await fixture();
        const rotated = new PaymentService(
          { ...config, monthlyPlanId: "plan_future" },
          f.store,
          f.gateway,
        );
        const result = await rotated.verify(
          {
            requestId: f.input.requestId,
            razorpay_payment_id: "pay_member",
            razorpay_subscription_id: "sub_member",
            razorpay_signature: sign("pay_member|sub_member", keySecret),
          },
          sessionHash,
        );
        assert.equal(result.status, "active");
      },
    );
    await t.test(
      "tampered signatures, foreign sessions and client-substituted subscriptions never grant access",
      async () => {
        const f = await fixture();
        const input = {
          requestId: f.input.requestId,
          razorpay_payment_id: "pay_member",
          razorpay_subscription_id: "sub_member",
          razorpay_signature: "0".repeat(64),
        };
        await assert.rejects(
          () => f.service.verify(input, sessionHash),
          PaymentError,
        );
        await assert.rejects(
          () =>
            f.service.verify(
              {
                ...input,
                razorpay_signature: sign("pay_member|sub_member", keySecret),
              },
              hash("foreign-session"),
            ),
          PaymentError,
        );
        await assert.rejects(
          () =>
            f.service.verify(
              {
                ...input,
                razorpay_subscription_id: "sub_other",
                razorpay_signature: sign("pay_member|sub_other", keySecret),
              },
              sessionHash,
            ),
          PaymentError,
        );
        assert.equal(await count("payment_grants"), 0);
      },
    );
    await t.test(
      "small authorisation charges, wrong currency, wrong amount and refunded payments do not activate",
      async () => {
        for (const mutation of [
          { amount: 100 },
          { currency: "USD" },
          { amount: 478801 },
          { status: "authorized" },
          { amount_refunded: 100 },
        ]) {
          const f = await fixture();
          Object.assign(f.gateway.payment, mutation);
          const result = await f.service.verify(
            {
              requestId: f.input.requestId,
              razorpay_payment_id: "pay_member",
              razorpay_subscription_id: "sub_member",
              razorpay_signature: sign("pay_member|sub_member", keySecret),
            },
            sessionHash,
          );
          assert.equal(result.status, "awaiting_full_payment");
          assert.equal(await count("payment_grants"), 0);
        }
      },
    );
    await t.test(
      "an invoice for another subscription cannot grant access",
      async () => {
        const f = await fixture();
        f.gateway.invoice.subscription_id = "sub_elsewhere";
        await f.service.webhook(
          event("badinvoice"),
          sign(event("badinvoice")),
          "evt_badinvoice",
        );
        assert.equal(await count("payment_grants"), 0);
      },
    );
    await t.test(
      "raw body tampering and missing event IDs are rejected before ledger writes",
      async () => {
        const f = await fixture();
        const raw = event("tampered");
        await assert.rejects(
          () =>
            f.service.webhook(
              Buffer.concat([raw, Buffer.from(" ")]),
              sign(raw),
              "evt_tampered",
            ),
          PaymentError,
        );
        await assert.rejects(
          () => f.service.webhook(raw, sign(raw), null),
          PaymentError,
        );
        assert.equal(await count("webhook_events"), 0);
      },
    );
    await t.test(
      "simultaneous duplicates and distinct events for the same payment create one grant",
      async () => {
        const f = await fixture();
        const raw = event("duplicate");
        await Promise.all(
          Array.from({ length: 8 }, () =>
            f.service.webhook(raw, sign(raw), "evt_duplicate"),
          ),
        );
        await f.service.webhook(raw, sign(raw), "evt_second");
        assert.equal(await count("payment_grants"), 1);
        assert.equal(await count("webhook_events"), 2);
        const outbox = await engine.query<{ count: string }>(
          "SELECT count(*) FROM membership_outbox WHERE kind='payment_verified'",
        );
        assert.equal(Number(outbox.rows[0].count), 1);
      },
    );
    await t.test(
      "reusing an event ID with another signed payload is rejected",
      async () => {
        const f = await fixture();
        const raw = event("first");
        await f.service.webhook(raw, sign(raw), "evt_collision");
        const other = Buffer.from(
          raw
            .toString()
            .replace("subscription.charged", "subscription.activated"),
        );
        await assert.rejects(
          () => f.service.webhook(other, sign(other), "evt_collision"),
          PaymentError,
        );
      },
    );
    await t.test(
      "a storage failure rolls back the event marker, grant and fulfilment, then retry succeeds",
      async () => {
        const f = await fixture();
        const raw = event("rollback");
        failOutbox = true;
        await assert.rejects(() =>
          f.service.webhook(raw, sign(raw), "evt_rollback"),
        );
        failOutbox = false;
        assert.equal(await count("webhook_events"), 0);
        assert.equal(await count("payment_grants"), 0);
        assert.equal(await count("membership_outbox"), 0);
        await f.service.webhook(raw, sign(raw), "evt_rollback");
        assert.equal((await f.store.status(f.attempt)).status, "active");
      },
    );
    await t.test(
      "a refund received before a late payment event prevents reactivation",
      async () => {
        const f = await fixture();
        f.gateway.payment.amount_refunded = 49900;
        const refund = event("refund", "payment.refunded");
        await f.service.webhook(refund, sign(refund), "evt_refund_first");
        f.gateway.payment.amount_refunded = 0;
        const charge = event("late");
        await f.service.webhook(charge, sign(charge), "evt_late_charge");
        assert.equal((await f.store.status(f.attempt)).status, "not_active");
        const rows = await engine.query<{ count: string }>(
          "SELECT count(*) FROM membership_outbox WHERE kind='payment_verified'",
        );
        assert.equal(Number(rows.rows[0].count), 0);
      },
    );
    await t.test(
      "a refund revokes only its paid period and is replay-safe",
      async () => {
        const f = await fixture();
        const raw = event("charge");
        await f.service.webhook(raw, sign(raw), "evt_original");
        f.gateway.payment.amount_refunded = 49900;
        const refund = event("refund", "payment.refunded");
        await f.service.webhook(refund, sign(refund), "evt_refund");
        await f.service.webhook(refund, sign(refund), "evt_refund");
        assert.equal((await f.store.status(f.attempt)).status, "not_active");
        assert.equal(await count("payment_reversals"), 1);
      },
    );
    await t.test(
      "verification reconciles a known refund even before its webhook arrives",
      async () => {
        const f = await fixture();
        const input = {
          requestId: f.input.requestId,
          razorpay_payment_id: "pay_member",
          razorpay_subscription_id: "sub_member",
          razorpay_signature: sign("pay_member|sub_member", keySecret),
        };
        assert.equal(
          (await f.service.verify(input, sessionHash)).status,
          "active",
        );
        f.gateway.payment.amount_refunded = 49900;
        assert.equal(
          (await f.service.verify(input, sessionHash)).status,
          "not_active",
        );
        assert.equal(await count("payment_reversals"), 1);
      },
    );
    await t.test(
      "old activated events cannot overwrite cancellation or create a paid period",
      async () => {
        const f = await fixture();
        f.gateway.remote.status = "cancelled";
        const cancelled = event("cancel", "subscription.cancelled");
        await f.service.webhook(cancelled, sign(cancelled), "evt_cancel");
        f.gateway.remote.status = "active";
        const old = Buffer.from(
          JSON.stringify({
            event: "subscription.activated",
            created_at: 1,
            payload: { subscription: { entity: { id: "sub_member" } } },
          }),
        );
        await f.service.webhook(old, sign(old), "evt_old_active");
        assert.equal(
          (
            await engine.query<{ provider_status: string }>(
              "SELECT provider_status FROM subscription_states",
            )
          ).rows[0].provider_status,
          "cancelled",
        );
        assert.equal((await f.store.status(f.attempt)).status, "pending");
      },
    );
    await t.test(
      "late charges use their invoice period, not the latest subscription end",
      async () => {
        const f = await fixture();
        f.gateway.remote.current_end =
          Math.floor(Date.now() / 1000) + 200 * 86400;
        f.gateway.invoice.billing_end = Math.floor(Date.now() / 1000) - 86400;
        const raw = event("oldcharge");
        await f.service.webhook(raw, sign(raw), "evt_old_paid");
        assert.equal((await f.store.status(f.attempt)).status, "not_active");
      },
    );
    await t.test(
      "a webhook can recover an attempt whose provider response arrived before its DB association",
      async () => {
        const f = await fixture();
        await engine.query(
          "UPDATE checkout_attempts SET subscription_id=NULL,state='uncertain' WHERE id=$1",
          [f.input.requestId],
        );
        const raw = event("recover");
        await f.service.webhook(raw, sign(raw), "evt_recover");
        assert.equal(
          (await f.store.findAttempt(f.input.requestId))?.subscription_id,
          "sub_member",
        );
        assert.equal((await f.store.status(f.attempt)).status, "active");
      },
    );
    await t.test(
      "a rate limit is durable, and Test Mode records cannot become Live Mode access",
      async () => {
        const f = await fixture();
        for (let i = 0; i < 3; i++) await f.store.rateLimit("test-bucket", 3);
        await assert.rejects(
          () => f.store.rateLimit("test-bucket", 3),
          PaymentError,
        );
        const live = new PaymentStore(database, "live");
        assert.equal(await live.findAttempt(f.input.requestId), null);
      },
    );
  } finally {
    failOutbox = false;
    await engine.close();
  }
});
