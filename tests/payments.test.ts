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
      item: { amount: id === "plan_monthly" ? 49900 : 499900, currency: "INR" },
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
    phone: "+919876543210",
    consent: true,
  };
  assert(createCheckoutSchema.safeParse(base).success);
  assert(!createCheckoutSchema.safeParse({ ...base, amount: 1 }).success);
  assert(
    !createCheckoutSchema.safeParse({ ...base, plan: "plan_attacker" }).success,
  );
  assert(!createCheckoutSchema.safeParse({ ...base, consent: false }).success);
  assert(
    !createCheckoutSchema.safeParse({ ...base, phone: undefined }).success,
  );
  assert(
    !createCheckoutSchema.safeParse({ ...base, phone: "invalid" }).success,
  );
  assert(!createCheckoutSchema.safeParse({ ...base, plan: "weekly" }).success);
});

// All mutations below use an isolated in-memory Postgres instance, never Supabase.
test("three-table persistence and signed payment webhooks", async (t) => {
  const engine = new PGlite();
  await engine.exec("CREATE ROLE anon; CREATE ROLE authenticated;");
  await engine.exec(
    await readFile(
      new URL(
        "../supabase/migrations/20261023061138_minimal_membership.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  let failMemberUpdate = false;
  const adapt = (sql: {
    query: <T>(query: string, params?: unknown[]) => Promise<{ rows: T[] }>;
  }): SQL => ({
    query: async (text, values) => {
      if (failMemberUpdate && text.includes("UPDATE public.members"))
        throw new Error("simulated storage failure");
      return sql.query<Record<string, unknown>>(text, values);
    },
  });
  const db: Database = {
    ...adapt(engine),
    transaction: (work) => engine.transaction((tx) => work(adapt(tx))),
  };
  const count = async (table: string, where = "") =>
    Number(
      (
        await engine.query<{ count: string }>(
          `SELECT count(*) FROM ${table} ${where}`,
        )
      ).rows[0].count,
    );
  async function fixture(plan: "monthly" | "yearly" = "monthly") {
    await engine.exec("TRUNCATE webhook_events,subscriptions,members CASCADE");
    const store = new PaymentStore(db, "test"),
      gateway = new Gateway(),
      service = new PaymentService(config, store, gateway);
    const input = {
      requestId: randomUUID(),
      plan,
      name: "Test member",
      email: "member@example.test",
      phone: "+919876543210",
      consent: true as const,
    };
    if (plan === "yearly") {
      gateway.remote.plan_id = "plan_yearly";
      gateway.payment.amount = 499900;
      gateway.invoice.amount_paid = 499900;
      gateway.end = Math.floor(Date.now() / 1000) + 365 * 86400;
      gateway.remote.current_end = gateway.end;
      gateway.invoice.billing_end = gateway.end;
    }
    const attempt = await service.create(input, sessionHash);
    const deliver = async (id: string, type = "subscription.charged") => {
      const raw = event(id, type);
      return service.webhook(raw, sign(raw), id);
    };
    return { store, gateway, service, input, attempt, deliver };
  }
  const verify = (f: Awaited<ReturnType<typeof fixture>>) =>
    f.service.verify(
      {
        requestId: f.input.requestId,
        razorpay_payment_id: "pay_member",
        razorpay_subscription_id: "sub_member",
        razorpay_signature: sign("pay_member|sub_member", keySecret),
      },
      sessionHash,
    );
  try {
    await t.test("only the three approved tables exist with RLS", async () => {
      const tables = await engine.query<{
        relname: string;
        relrowsecurity: boolean;
      }>(
        `SELECT relname,relrowsecurity FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='r' ORDER BY relname`,
      );
      assert.deepEqual(
        tables.rows.map((r) => r.relname),
        ["members", "subscriptions", "webhook_events"],
      );
      assert(tables.rows.every((r) => r.relrowsecurity));
    });
    await t.test(
      "pending contact and subscription are saved before provider creation; retries preserve consent",
      async () => {
        const f = await fixture();
        assert.equal(await count("members"), 1);
        assert.equal(await count("subscriptions"), 1);
        assert.equal(
          (await engine.query<{ status: string }>("SELECT status FROM members"))
            .rows[0].status,
          "pending",
        );
        const again = await f.service.create(f.input, sessionHash);
        assert.equal(again.subscription_id, "sub_member");
        assert.equal(f.gateway.calls, 1);
        assert.equal(await count("subscriptions"), 1);
      },
    );
    await t.test(
      "same email reuses the member without replacing contact details from an unauthenticated retry",
      async () => {
        const f = await fixture();
        f.gateway.remote.id = "sub_second";
        await f.service.create(
          { ...f.input, requestId: randomUUID(), name: "Another name" },
          sessionHash,
        );
        assert.equal(await count("members"), 1);
        assert.equal(await count("subscriptions"), 2);
        assert.equal(
          (
            await engine.query<{ full_name: string }>(
              "SELECT full_name FROM members",
            )
          ).rows[0].full_name,
          "Test member",
        );
      },
    );
    await t.test(
      "monthly/yearly browser verification waits for webhook; webhook activates full payment",
      async () => {
        for (const plan of ["monthly", "yearly"] as const) {
          const f = await fixture(plan);
          assert.equal((await verify(f)).status, "awaiting_full_payment");
          assert.equal(await count("webhook_events"), 0);
          await f.deliver("evt_paid");
          assert.equal((await f.store.status(f.attempt)).status, "active");
          assert.equal(
            (
              await engine.query<{ status: string }>(
                "SELECT status FROM members",
              )
            ).rows[0].status,
            "active",
          );
        }
      },
    );
    await t.test(
      "wrong amount/currency, authorization, refund and foreign invoice cannot activate",
      async () => {
        for (const mutation of [
          { amount: 100 },
          { currency: "USD" },
          { status: "authorized" },
          { amount_refunded: 100 },
        ]) {
          const f = await fixture();
          Object.assign(f.gateway.payment, mutation);
          await f.deliver("evt_invalid");
          assert.equal((await f.store.status(f.attempt)).status, "pending");
        }
        const f = await fixture();
        f.gateway.invoice.subscription_id = "sub_foreign";
        await f.deliver("evt_foreign");
        assert.equal((await f.store.status(f.attempt)).status, "pending");
      },
    );
    await t.test(
      "tampered signatures and substituted subscriptions cannot change state",
      async () => {
        const f = await fixture();
        const raw = event("tamper");
        await assert.rejects(
          () =>
            f.service.webhook(
              Buffer.concat([raw, Buffer.from(" ")]),
              sign(raw),
              "evt_tamper",
            ),
          PaymentError,
        );
        await assert.rejects(
          () =>
            f.service.verify(
              {
                requestId: f.input.requestId,
                razorpay_payment_id: "pay_member",
                razorpay_subscription_id: "sub_other",
                razorpay_signature: sign("pay_member|sub_other", keySecret),
              },
              sessionHash,
            ),
          PaymentError,
        );
        await assert.rejects(
          () => f.service.boundAttempt(f.input.requestId, hash("foreign")),
          PaymentError,
        );
        assert.equal(await count("webhook_events"), 0);
      },
    );
    await t.test(
      "concurrent duplicates and distinct events for one payment do not multiply access",
      async () => {
        const f = await fixture();
        await Promise.all(
          Array.from({ length: 5 }, () => f.deliver("evt_duplicate")),
        );
        await f.deliver("evt_second");
        assert.equal(await count("webhook_events"), 2);
        assert.equal(
          await count("webhook_events", "WHERE payment_status='captured'"),
          2,
        );
        assert.equal(
          (await f.store.status(f.attempt)).paidUntil,
          new Date(f.gateway.end * 1000).toISOString(),
        );
      },
    );
    await t.test(
      "same event ID with different signed body is rejected",
      async () => {
        const f = await fixture();
        await f.deliver("evt_collision");
        await assert.rejects(
          () => f.deliver("evt_collision", "subscription.activated"),
          PaymentError,
        );
      },
    );
    await t.test(
      "storage failure rolls back event and membership; retry succeeds",
      async () => {
        const f = await fixture();
        failMemberUpdate = true;
        await assert.rejects(() => f.deliver("evt_retry"));
        failMemberUpdate = false;
        assert.equal(await count("webhook_events"), 0);
        assert.equal((await f.store.status(f.attempt)).status, "pending");
        await f.deliver("evt_retry");
        assert.equal((await f.store.status(f.attempt)).status, "active");
      },
    );
    await t.test(
      "refund before late capture remains a tombstone; duplicate refund is safe",
      async () => {
        const f = await fixture();
        f.gateway.payment.amount_refunded = 49900;
        await f.deliver("evt_refund", "payment.refunded");
        await f.deliver("evt_refund", "payment.refunded");
        f.gateway.payment.amount_refunded = 0;
        await f.deliver("evt_late");
        assert.equal((await f.store.status(f.attempt)).status, "not_active");
        assert.equal(await count("webhook_events"), 2);
      },
    );
    await t.test(
      "refund of new payment preserves an older unrefunded paid period",
      async () => {
        const f = await fixture();
        await f.deliver("evt_first");
        const firstEnd = f.gateway.end;
        f.gateway.payment.id = "pay_second";
        f.gateway.invoice.payment_id = "pay_second";
        f.gateway.invoice.billing_end = firstEnd + 86400;
        const raw = Buffer.from(
          event("second").toString().replace("pay_member", "pay_second"),
        );
        await f.service.webhook(raw, sign(raw), "evt_new");
        f.gateway.payment.amount_refunded = 49900;
        const refund = Buffer.from(
          event("refund", "payment.refunded")
            .toString()
            .replace("pay_member", "pay_second"),
        );
        await f.service.webhook(refund, sign(refund), "evt_new_refund");
        assert.equal(
          (await f.store.status(f.attempt)).paidUntil,
          new Date(firstEnd * 1000).toISOString(),
        );
      },
    );
    await t.test(
      "failed payment records one pending internal follow-up and does not remove paid access",
      async () => {
        const f = await fixture();
        await f.deliver("evt_paid");
        f.gateway.payment.status = "failed";
        await f.deliver("evt_failed", "payment.failed");
        await f.deliver("evt_failed", "payment.failed");
        assert.equal((await f.store.status(f.attempt)).status, "active");
        assert.equal(
          (
            await engine.query<{ failure_email_state: string }>(
              "SELECT failure_email_state FROM subscriptions",
            )
          ).rows[0].failure_email_state,
          "pending",
        );
      },
    );
    await t.test(
      "old lifecycle cannot overwrite cancellation and cancellation preserves payment",
      async () => {
        const f = await fixture();
        await f.deliver("evt_charge");
        f.gateway.remote.status = "cancelled";
        await f.deliver("evt_cancel", "subscription.cancelled");
        f.gateway.remote.status = "active";
        const raw = Buffer.from(
          JSON.stringify({
            event: "subscription.activated",
            created_at: 1,
            payload: { subscription: { entity: { id: "sub_member" } } },
          }),
        );
        await f.service.webhook(raw, sign(raw), "evt_old");
        assert.equal(
          (
            await engine.query<{ provider_status: string }>(
              "SELECT provider_status FROM subscriptions",
            )
          ).rows[0].provider_status,
          "cancelled",
        );
        assert.equal((await f.store.status(f.attempt)).status, "active");
      },
    );
    await t.test(
      "uncertain creation recovers via owned provider notes",
      async () => {
        const f = await fixture();
        await engine.query(
          `UPDATE subscriptions SET razorpay_subscription_id=NULL,checkout_state='uncertain' WHERE id=$1`,
          [f.input.requestId],
        );
        await f.deliver("evt_recover");
        assert.equal(
          (await f.store.findAttempt(f.input.requestId))?.subscription_id,
          "sub_member",
        );
      },
    );
    await t.test(
      "subscription failure without payment/invoice queues the internal follow-up once",
      async () => {
        const f = await fixture();
        f.gateway.remote.status = "pending";
        const raw = Buffer.from(
          JSON.stringify({
            event: "subscription.pending",
            created_at: Math.floor(Date.now() / 1000),
            payload: { subscription: { entity: { id: "sub_member" } } },
          }),
        );
        await f.service.webhook(raw, sign(raw), "evt_pending_failure");
        await f.service.webhook(raw, sign(raw), "evt_pending_failure");
        assert.equal(
          (
            await engine.query<{ failure_email_state: string }>(
              "SELECT failure_email_state FROM subscriptions",
            )
          ).rows[0].failure_email_state,
          "pending",
        );
        assert.equal(await count("webhook_events"), 1);
        assert.equal((await f.store.status(f.attempt)).status, "pending");
      },
    );
    await t.test(
      "mode isolation, foreign keys, normalized phone and demo limiter",
      async () => {
        const f = await fixture();
        const live = new PaymentStore(db, "live");
        assert.equal(await live.findAttempt(f.input.requestId), null);
        await assert.rejects(
          () => live.claim(f.input, sessionHash, "v1", "plan_monthly", 49900),
          PaymentError,
        );
        await assert.rejects(() =>
          engine.query(`UPDATE subscriptions SET mode='live' WHERE id=$1`, [
            f.input.requestId,
          ]),
        );
        const parsed = createCheckoutSchema.parse({
          ...f.input,
          phone: "9876543210",
        });
        assert.equal(parsed.phone, "+919876543210");
        const key = randomUUID();
        await f.store.rateLimit(key, 1);
        await assert.rejects(() => f.store.rateLimit(key, 1), PaymentError);
        await assert.rejects(() => live.rateLimit(key), PaymentError);
      },
    );
  } finally {
    failMemberUpdate = false;
    await engine.close();
  }
});
