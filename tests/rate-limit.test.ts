import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentRateLimiter } from "../src/lib/payments/rate-limit";
import { PaymentError } from "../src/lib/payments/types";

const configured = {
  NODE_ENV: "production",
  VERCEL: "1",
  VERCEL_ENV: "production",
  KV_REST_API_URL: "https://redis.example.test",
  KV_REST_API_TOKEN: "private-test-token",
};
const status = (code: number) => (error: unknown) =>
  error instanceof PaymentError && error.status === code;

test("independent limiter clients use the same shared namespace and counters", async () => {
  const counters = new Map<string, number>();
  const factory = (
    _url: string,
    _token: string,
    prefix: string,
    limit: number,
  ) => ({
    async limit(key: string) {
      const id = `${prefix}:${key}`;
      const count = (counters.get(id) || 0) + 1;
      counters.set(id, count);
      return { success: count <= limit };
    },
  });
  const first = createPaymentRateLimiter(configured, factory);
  const second = createPaymentRateLimiter(configured, factory);
  await first("live", "create-customer:hash", 2);
  await second("live", "create-customer:hash", 2);
  await assert.rejects(
    () => first("live", "create-customer:hash", 2),
    status(429),
  );
  await first("live", "create-customer:different-hash", 2);
  await first("test", "create-customer:hash", 2);
  const preview = createPaymentRateLimiter(
    { ...configured, VERCEL_ENV: "preview" },
    factory,
  );
  await preview("test", "create-customer:hash", 2);
});

test("live and deployed test mode fail closed without complete HTTPS Redis configuration", async () => {
  for (const env of [
    {},
    { NODE_ENV: "production" },
    { VERCEL: "1" },
    {
      NODE_ENV: "production",
      KV_REST_API_URL: configured.KV_REST_API_URL,
      KV_REST_API_READ_ONLY_TOKEN: "must-not-be-used",
    },
    { ...configured, KV_REST_API_URL: "" },
    { ...configured, KV_REST_API_TOKEN: "" },
    { ...configured, KV_REST_API_URL: "http://redis.example.test" },
    { ...configured, KV_REST_API_URL: "invalid" },
  ]) {
    const limit = createPaymentRateLimiter(env);
    await assert.rejects(() => limit("live", "key"), status(503));
    if (env.NODE_ENV === "production" || env.VERCEL)
      await assert.rejects(() => limit("test", "key"), status(503));
  }
});

test("uses the integration's writable KV token and ignores read-only credentials", async () => {
  let calls = 0;
  const check = createPaymentRateLimiter(
    { ...configured, KV_REST_API_READ_ONLY_TOKEN: "never-use-this-token" },
    (url, token) => {
      assert.equal(url, configured.KV_REST_API_URL);
      assert.equal(token, configured.KV_REST_API_TOKEN);
      return {
        async limit() {
          calls++;
          return { success: true };
        },
      };
    },
  );
  await check("live", "create-ip:hash");
  assert.equal(calls, 1);
});

test("Redis failures and SDK fail-open timeouts never permit payments or expose secrets", async () => {
  for (const limit of [
    async () => {
      throw new Error("private-test-token transport error");
    },
    async () => ({ success: true, reason: "timeout" }),
  ]) {
    const check = createPaymentRateLimiter(configured, () => ({ limit }));
    await assert.rejects(
      () => check("live", "key"),
      (error: unknown) => {
        assert(status(503)(error));
        assert(!String(error).includes("private-test-token"));
        return true;
      },
    );
    await assert.rejects(() => check("test", "key"), status(503));
  }
});

test("local test mode works without Redis and enforces a bounded window", async (t) => {
  let now = 1000;
  t.mock.method(Date, "now", () => now);
  const check = createPaymentRateLimiter({ NODE_ENV: "development" });
  await check("test", "local-key", 1, 10);
  await assert.rejects(() => check("test", "local-key", 1, 10), status(429));
  now += 10001;
  await check("test", "local-key", 1, 10);
});

test("SDK adapter uses Redis REST and sanitizes actual transport failures", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    throw new Error("Redis network failure");
  });
  const check = createPaymentRateLimiter(configured);
  await assert.rejects(() => check("live", "key"), status(503));
  assert(calls > 0);
});
