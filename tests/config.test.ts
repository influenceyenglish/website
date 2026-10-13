import test from "node:test";
import assert from "node:assert/strict";
import { paymentConfig } from "../src/lib/payments/config";
import { PaymentError } from "../src/lib/payments/types";
test("Test Mode is the default, mode/key mismatches fail and unfinished identity blocks live checkout", () => {
  const prior = { ...process.env };
  Object.assign(process.env, {
    RAZORPAY_KEY_ID: "rzp_test_unitfixture",
    RAZORPAY_KEY_SECRET: "unit-fixture-not-a-real-key",
    RAZORPAY_WEBHOOK_SECRET: "unit-fixture-webhook",
    RAZORPAY_MONTHLY_PLAN_ID: "plan_monthly",
    RAZORPAY_YEARLY_PLAN_ID: "plan_yearly",
    DATABASE_URL: "postgresql://example.invalid/isolated",
  });
  delete process.env.RAZORPAY_MODE;
  try {
    assert.equal(paymentConfig().mode, "test");
    process.env.RAZORPAY_KEY_ID = "rzp_live_unitfixture";
    assert.throws(() => paymentConfig(), PaymentError);
    process.env.RAZORPAY_MODE = "live";
    process.env.RAZORPAY_ENABLE_LIVE = "true";
    assert.throws(() => paymentConfig(), PaymentError);
  } finally {
    for (const key of Object.keys(process.env))
      if (!(key in prior)) delete process.env[key];
    Object.assign(process.env, prior);
  }
});
