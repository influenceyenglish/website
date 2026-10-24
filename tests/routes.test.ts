import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as create } from "../src/app/api/razorpay/subscription/route";
import {
  GET as status,
  POST as verify,
} from "../src/app/api/razorpay/verify/route";
import { POST as webhook } from "../src/app/api/razorpay/webhook/route";
import { POST as legacyCreate } from "../src/app/api/razorpay/create-subscription/route";
import { PaymentStore } from "../src/lib/payments/store";
import { PaymentService } from "../src/lib/payments/service";
import { PaymentError } from "../src/lib/payments/types";
import { hash } from "../src/lib/payments/signatures";
import { cookieName } from "../src/lib/payments/http";
const url = "http://localhost:3000";
function request(path: string, body?: unknown, origin = url) {
  return new NextRequest(url + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { origin, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
test("HTTP payment endpoints fail closed before external calls without configuration", async () => {
  const prior = { ...process.env };
  process.env.APP_URL = url;
  delete process.env.RAZORPAY_KEY_ID;
  delete process.env.RAZORPAY_KEY_SECRET;
  delete process.env.DATABASE_URL;
  try {
    assert.equal(
      (
        await create(
          request("/api/razorpay/subscription", {
            requestId: crypto.randomUUID(),
            plan: "monthly",
            name: "Test member",
            email: "member@example.test",
            phone: "+919876543210",
            consent: true,
          }),
        )
      ).status,
      503,
    );
    assert.equal(
      (
        await create(
          request("/api/razorpay/subscription", { plan: "attacker" }),
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await create(
          request("/api/razorpay/subscription", {}, "https://foreign.example"),
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await create(
          request("/api/razorpay/subscription", {
            padding: "x".repeat(20000),
          }),
        )
      ).status,
      413,
    );
    assert.equal(
      (await verify(request("/api/razorpay/verify", {}))).status,
      401,
    );
    assert.equal(
      (
        await status(
          request("/api/razorpay/verify?requestId=" + crypto.randomUUID()),
        )
      ).status,
      401,
    );
    assert.equal(
      (await webhook(request("/api/razorpay/webhook", {}))).status,
      503,
    );
  } finally {
    for (const key of Object.keys(process.env))
      if (!(key in prior)) delete process.env[key];
    Object.assign(process.env, prior);
  }
});

test("both creation URLs enforce IP, session and normalized customer limits before creating subscriptions", async (t) => {
  const prior = { ...process.env };
  Object.assign(process.env, {
    APP_URL: url,
    RAZORPAY_MODE: "test",
    RAZORPAY_KEY_ID: "rzp_test_key",
    NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_key",
    RAZORPAY_KEY_SECRET: "private-secret",
    RAZORPAY_WEBHOOK_SECRET: "separate-webhook-secret",
    RAZORPAY_PLAN_MONTHLY: "plan_monthly",
    RAZORPAY_PLAN_YEARLY: "plan_yearly",
    DATABASE_URL: "postgresql://localhost/unused",
  });
  const seen: { key: string; limit: number }[] = [];
  let blocked: string | null = null;
  let failureStatus = 429;
  let created = 0;
  t.mock.method(
    PaymentStore.prototype,
    "rateLimit",
    async (key: string, limit: number) => {
      seen.push({ key, limit });
      if (blocked && key.startsWith(blocked))
        throw new PaymentError(
          failureStatus,
          "Payment protection rejected request.",
        );
    },
  );
  t.mock.method(PaymentService.prototype, "create", async () => {
    created++;
    return {
      id: "local-reference",
      subscription_id: "sub_test",
      plan: "monthly",
    };
  });
  const input = {
    requestId: crypto.randomUUID(),
    plan: "monthly",
    name: "Test member",
    email: "Member@Example.test",
    phone: "+919876543210",
    consent: true,
  };
  try {
    for (const handler of [create, legacyCreate]) {
      seen.length = 0;
      blocked = null;
      const req = request("/api/razorpay/subscription", input);
      req.headers.set("x-forwarded-for", "203.0.113.1");
      assert.equal((await handler(req)).status, 200);
      assert.equal(seen[0].key, `create-ip:${hash("203.0.113.1")}`);
      assert.equal(seen[0].limit, 20);
      assert(seen[1].key.startsWith("create-session:"));
      assert.equal(seen[1].limit, 10);
      assert.deepEqual(seen[2], {
        key: `create-customer:${hash("member@example.test")}`,
        limit: 5,
      });
      assert.deepEqual(seen[3], {
        key: `create-phone:${hash("+919876543210")}`,
        limit: 5,
      });
      for (const prefix of [
        "create-ip:",
        "create-session:",
        "create-customer:",
        "create-phone:",
      ]) {
        blocked = prefix;
        const before = created;
        const response = await handler(
          request("/api/razorpay/subscription", input),
        );
        assert.equal(response.status, 429);
        assert.equal(created, before);
      }
      failureStatus = 503;
      blocked = "create-ip:";
      const before = created;
      assert.equal(
        (await handler(request("/api/razorpay/subscription", input))).status,
        503,
      );
      assert.equal(created, before);
      failureStatus = 429;
    }
    // Redis unavailability must not interrupt verification of an existing payment.
    t.mock.method(PaymentStore.prototype, "rateLimit", async () => {
      throw new PaymentError(503, "Redis unavailable");
    });
    t.mock.method(PaymentService.prototype, "boundAttempt", async () => ({
      created_at: new Date(),
      customer_name: "Test member",
    }));
    t.mock.method(PaymentService.prototype, "verify", async () => ({
      status: "pending",
    }));
    t.mock.method(PaymentStore.prototype, "status", async () => ({
      status: "pending",
      paidUntil: null,
    }));
    const verification = request("/api/razorpay/verify", {
      requestId: input.requestId,
      razorpay_payment_id: "pay_test",
      razorpay_subscription_id: "sub_test",
      razorpay_signature: "0".repeat(64),
    });
    verification.cookies.set(cookieName, "a".repeat(64));
    assert.equal((await verify(verification)).status, 200);
    const statusRequest = request(
      `/api/razorpay/verify?requestId=${input.requestId}`,
    );
    statusRequest.cookies.set(cookieName, "a".repeat(64));
    assert.equal((await status(statusRequest)).status, 200);
  } finally {
    for (const key of Object.keys(process.env))
      if (!(key in prior)) delete process.env[key];
    Object.assign(process.env, prior);
  }
});
