import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as create } from "../src/app/api/razorpay/create-subscription/route";
import {
  GET as status,
  POST as verify,
} from "../src/app/api/razorpay/verify/route";
import { POST as webhook } from "../src/app/api/razorpay/webhook/route";
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
          request("/api/razorpay/create-subscription", {
            requestId: crypto.randomUUID(),
            plan: "monthly",
            name: "Test member",
            email: "member@example.test",
            consent: true,
          }),
        )
      ).status,
      503,
    );
    assert.equal(
      (
        await create(
          request("/api/razorpay/create-subscription", { plan: "attacker" }),
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await create(
          request(
            "/api/razorpay/create-subscription",
            {},
            "https://foreign.example",
          ),
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await create(
          request("/api/razorpay/create-subscription", {
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
