import test from "node:test";
import assert from "node:assert/strict";
import {
  paymentConfig,
  PaymentConfigurationError,
} from "../src/lib/payments/config";
import { PaymentError } from "../src/lib/payments/types";
import { errorResponse } from "../src/lib/payments/http";

test("configuration mismatches identify the exact setting without leaking credentials", async (t) => {
  const prior = { ...process.env };
  const baseline = {
    RAZORPAY_MODE: "test",
    RAZORPAY_KEY_ID: "rzp_test_privatefixture",
    NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_privatefixture",
    RAZORPAY_KEY_SECRET: "secret-api-fixture",
    RAZORPAY_WEBHOOK_SECRET: "secret-webhook-fixture",
    RAZORPAY_PLAN_MONTHLY: "plan_monthly",
    RAZORPAY_PLAN_YEARLY: "plan_yearly",
    DATABASE_URL: "postgresql://private:password@example.invalid/isolated",
  };
  const cases = [
    [
      { RAZORPAY_KEY_ID: "rzp_live_privatefixture" },
      "PAYMENT_KEY_MODE_MISMATCH",
      "RAZORPAY_MODE",
    ],
    [
      { NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_other" },
      "PAYMENT_PUBLIC_KEY_MISMATCH",
      "NEXT_PUBLIC_RAZORPAY_KEY_ID",
    ],
    [
      { RAZORPAY_PLAN_MONTHLY: "499" },
      "PAYMENT_MONTHLY_PLAN_INVALID",
      "RAZORPAY_PLAN_MONTHLY",
    ],
    [
      { RAZORPAY_PLAN_YEARLY: "sub_wrong" },
      "PAYMENT_YEARLY_PLAN_INVALID",
      "RAZORPAY_PLAN_YEARLY",
    ],
    [
      { RAZORPAY_PLAN_YEARLY: "plan_monthly" },
      "PAYMENT_PLAN_IDS_DUPLICATED",
      "RAZORPAY_PLAN_YEARLY",
    ],
    [
      { RAZORPAY_KEY_SECRET: baseline.RAZORPAY_KEY_ID },
      "PAYMENT_API_SECRET_INVALID",
      "RAZORPAY_KEY_SECRET",
    ],
    [
      { RAZORPAY_WEBHOOK_SECRET: baseline.RAZORPAY_KEY_SECRET },
      "PAYMENT_WEBHOOK_SECRET_REUSED",
      "RAZORPAY_WEBHOOK_SECRET",
    ],
  ] as const;
  const logs: unknown[][] = [];
  t.mock.method(console, "error", (...args: unknown[]) => logs.push(args));
  try {
    for (const [changes, code, variable] of cases) {
      Object.assign(process.env, baseline, changes);
      let failure: PaymentConfigurationError | undefined;
      try {
        paymentConfig();
      } catch (error) {
        assert(error instanceof PaymentConfigurationError);
        failure = error;
      }
      assert(failure);
      assert.equal(failure.code, code);
      assert(failure.operatorMessage.includes(variable));
      const response = errorResponse(failure);
      assert.equal(response.status, 503);
      const body = await response.json();
      assert.equal(body.code, code);
      const diagnostics = JSON.stringify({ body, logs });
      for (const secret of [
        baseline.RAZORPAY_KEY_SECRET,
        baseline.RAZORPAY_WEBHOOK_SECRET,
        baseline.DATABASE_URL,
        baseline.RAZORPAY_KEY_ID,
      ])
        assert(!diagnostics.includes(secret));
    }
  } finally {
    for (const key of Object.keys(process.env))
      if (!(key in prior)) delete process.env[key];
    Object.assign(process.env, prior);
  }
});
test("Test Mode is the default, mode/key mismatches fail and unfinished identity blocks live checkout", () => {
  const prior = { ...process.env };
  Object.assign(process.env, {
    RAZORPAY_KEY_ID: "rzp_test_unitfixture",
    NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_unitfixture",
    RAZORPAY_KEY_SECRET: "unit-fixture-not-a-real-key",
    RAZORPAY_WEBHOOK_SECRET: "unit-fixture-webhook",
    RAZORPAY_PLAN_MONTHLY: "plan_monthly",
    RAZORPAY_PLAN_YEARLY: "plan_yearly",
    DATABASE_URL: "postgresql://example.invalid/isolated",
    BUSINESS_DETAILS_CONFIRMED: "false",
  });
  delete process.env.RAZORPAY_MODE;
  try {
    assert.equal(paymentConfig().mode, "test");
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_test_otherfixture";
    assert.throws(() => paymentConfig(), PaymentError);
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    process.env.RAZORPAY_KEY_ID = "rzp_live_unitfixture";
    assert.throws(() => paymentConfig(), PaymentError);
    process.env.RAZORPAY_MODE = "live";
    process.env.RAZORPAY_ENABLE_LIVE = "true";
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    assert.throws(() => paymentConfig(), PaymentError);
  } finally {
    for (const key of Object.keys(process.env))
      if (!(key in prior)) delete process.env[key];
    Object.assign(process.env, prior);
  }
});

test("live configuration requires explicit enablement and confirmed business details, and rejects mixed secrets and preview deployments", () => {
  const prior = { ...process.env };
  Object.assign(process.env, {
    RAZORPAY_MODE: "live",
    RAZORPAY_ENABLE_LIVE: "true",
    RAZORPAY_KEY_ID: "rzp_live_unitfixture",
    NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_live_unitfixture",
    RAZORPAY_KEY_SECRET: "fixture-api-secret",
    RAZORPAY_WEBHOOK_SECRET: "fixture-webhook-secret",
    RAZORPAY_PLAN_MONTHLY: "plan_fixtureMonthly",
    RAZORPAY_PLAN_YEARLY: "plan_fixtureYearly",
    DATABASE_URL: "postgresql://example.invalid/isolated",
    BUSINESS_LEGAL_NAME: "Approved test business fixture",
    BUSINESS_DELIVERY_PLATFORM: "Fixture platform, weekly sessions",
    BUSINESS_DETAILS_CONFIRMED: "true",
  });
  delete process.env.VERCEL_ENV;
  try {
    assert.equal(paymentConfig().mode, "live");
    process.env.RAZORPAY_ENABLE_LIVE = "false";
    assert.throws(() => paymentConfig(), PaymentError);
    process.env.RAZORPAY_ENABLE_LIVE = "true";
    process.env.BUSINESS_DETAILS_CONFIRMED = "false";
    assert.throws(() => paymentConfig(), PaymentError);
    process.env.BUSINESS_DETAILS_CONFIRMED = "true";
    process.env.BUSINESS_LEGAL_NAME = "[pending]";
    assert.throws(() => paymentConfig(), PaymentError);
    process.env.BUSINESS_LEGAL_NAME = "Approved test business fixture";
    process.env.BUSINESS_DELIVERY_PLATFORM = "[pending]";
    assert.throws(() => paymentConfig(), PaymentError);
    process.env.BUSINESS_DELIVERY_PLATFORM =
      "Fixture platform, weekly sessions";
    process.env.VERCEL_ENV = "preview";
    assert.throws(() => paymentConfig(), PaymentError);
    process.env.VERCEL_ENV = "production";
    assert.equal(paymentConfig().mode, "live");
    process.env.RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_KEY_SECRET;
    assert.throws(() => paymentConfig(), PaymentError);
    process.env.RAZORPAY_WEBHOOK_SECRET = "fixture-webhook-secret";
    process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_ID;
    assert.throws(() => paymentConfig(), PaymentError);
    process.env.RAZORPAY_KEY_SECRET = "fixture-api-secret";
    delete process.env.BUSINESS_LEGAL_NAME;
    delete process.env.BUSINESS_DELIVERY_PLATFORM;
    delete process.env.BUSINESS_DETAILS_CONFIRMED;
    assert.equal(paymentConfig().mode, "live");
    process.env.RAZORPAY_KEY_ID = "rzp_test_unitfixture";
    assert.throws(() => paymentConfig(), PaymentError);
  } finally {
    for (const key of Object.keys(process.env))
      if (!(key in prior)) delete process.env[key];
    Object.assign(process.env, prior);
  }
});
