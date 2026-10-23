import test from "node:test";
import assert from "node:assert/strict";
import { RazorpayGateway } from "../src/lib/payments/gateway";
import { PaymentError } from "../src/lib/payments/types";

test("official SDK adapter forwards subscription parameters and validates responses", async (t) => {
  const gateway = new RazorpayGateway({
    keyId: "rzp_test_fixture",
    keySecret: "test-fixture-only",
  });
  const input = {
    plan_id: "plan_monthly",
    total_count: 120,
    quantity: 1,
    customer_notify: true,
    notes: { checkout_attempt_id: "fixture" },
  };
  const remote = {
    id: "sub_fixture",
    plan_id: input.plan_id,
    status: "created",
    current_end: null,
  };
  const create = t.mock.method(
    gateway["client"].subscriptions,
    "create",
    async () => remote,
  );
  assert.deepEqual(await gateway.createSubscription(input), remote);
  assert.deepEqual(create.mock.calls[0].arguments, [input]);
  t.mock.method(gateway["client"].plans, "fetch", async () => ({
    id: "plan_monthly",
    period: "monthly",
    interval: 1,
    item: { amount: 49900, currency: "INR" },
  }));
  assert.equal((await gateway.getPlan("plan_monthly")).item.amount, 49900);
  // Deliberately simulate a malformed provider response despite its SDK type.
  create.mock.mockImplementation(async () => ({
    ...remote,
    id: null as unknown as string,
  }));
  await assert.rejects(
    () => gateway.createSubscription(input),
    (error: unknown) => error instanceof PaymentError && error.status === 502,
  );
});

test("SDK errors never expose provider response bodies or credentials", async (t) => {
  const gateway = new RazorpayGateway({
    keyId: "rzp_test_fixture",
    keySecret: "test-fixture-only",
  });
  t.mock.method(gateway["client"].subscriptions, "fetch", async () => {
    throw new Error("sensitive provider details");
  });
  await assert.rejects(
    () => gateway.getSubscription("sub_fixture"),
    (error: unknown) =>
      error instanceof PaymentError &&
      error.status === 503 &&
      !error.message.includes("sensitive"),
  );
});
