import test from "node:test";
import assert from "node:assert/strict";
import { paymentConfig } from "../src/lib/payments/config";
import { PaymentError } from "../src/lib/payments/types";
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
