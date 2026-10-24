import test from "node:test";
import assert from "node:assert/strict";
import { checkoutAttemptId } from "../src/components/checkout/attempt";

test("same checkout details reuse a reference; corrected name, email or phone get a new reference", async (t) => {
  const values = new Map<string, string>();
  const prior = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) || null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  t.after(() => {
    if (prior) Object.defineProperty(globalThis, "sessionStorage", prior);
    else Reflect.deleteProperty(globalThis, "sessionStorage");
  });
  const contact = {
    name: "Bismillah",
    email: "member@example.test",
    phone: "9876543210",
  };
  const first = await checkoutAttemptId("monthly", contact);
  assert.equal(
    await checkoutAttemptId("monthly", {
      ...contact,
      email: "MEMBER@example.test",
      phone: "+91 98765 43210",
    }),
    first,
  );
  for (const change of [
    { name: "Shafi" },
    { email: "new@example.test" },
    { phone: "9876543211" },
  ])
    assert.notEqual(
      await checkoutAttemptId("monthly", { ...contact, ...change }),
      first,
    );
  assert.notEqual(await checkoutAttemptId("yearly", contact), first);
  assert.notEqual(await checkoutAttemptId("monthly", contact, "live"), first);
  assert(
    !Array.from(values.keys()).some(
      (key) => key.includes("Bismillah") || key.includes("member@"),
    ),
  );
});
