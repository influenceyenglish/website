import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome" });
const base = process.env.BASE_URL || "http://127.0.0.1:3000";
const createPath = "**/api/razorpay/create-subscription";
const verifyPath = "**/api/razorpay/verify*";
try {
  for (const scenario of [
    "monthly",
    "yearly",
    "dismiss",
    "verify-error",
    "load-error",
  ]) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 900 },
      reducedMotion: "reduce",
    });
    let creates = 0,
      verification = 0,
      chosen;
    await page.route(
      "https://checkout.razorpay.com/v1/checkout.js",
      async (route) => {
        if (scenario === "load-error") return route.abort();
        return route.fulfill({
          contentType: "text/javascript",
          body: `window.Razorpay=class { constructor(options){this.options=options;window.checkoutOptions=options;} on(){} open(){setTimeout(()=>${scenario === "dismiss" ? "this.options.modal.ondismiss()" : "this.options.handler({razorpay_payment_id:'pay_browser',razorpay_subscription_id:'sub_browser',razorpay_signature:'0'.repeat(64)})"},10);} };`,
        });
      },
    );
    await page.route(createPath, async (route) => {
      creates++;
      const data = route.request().postDataJSON();
      chosen = data.plan;
      assert.equal(data.consent, true);
      assert.equal(data.amount, undefined);
      assert.equal(data.plan_id, undefined);
      return route.fulfill({
        json: {
          requestId: data.requestId,
          subscriptionId: "sub_browser",
          keyId: "rzp_test_browser_mock",
          mode: "test",
          plan: data.plan,
        },
      });
    });
    await page.route(verifyPath, (route) => {
      verification++;
      if (scenario === "verify-error")
        return route.fulfill({
          status: 400,
          json: {
            error:
              "Payment signature verification failed. Please contact support if money was debited.",
          },
        });
      return route.fulfill({
        json: {
          status: "active",
          mode: "test",
          paidUntil: new Date(Date.now() + 28 * 86400000).toISOString(),
        },
      });
    });
    await page.goto(base, { waitUntil: "networkidle" });
    if (scenario === "yearly")
      await page.locator('input[name="plan"][value="yearly"]').check();
    await page.getByLabel("Full name").fill("Browser test");
    await page
      .getByLabel("Email for membership access")
      .fill("browser@example.test");
    await page.locator('input[name="consent"]').check();
    await page.getByRole("button", { name: /Try test checkout/ }).click();
    if (scenario === "dismiss") {
      await page.waitForURL("**/payment-cancelled");
      assert(
        (await page.locator("main").innerText()).includes(
          "does not cancel an existing subscription",
        ),
      );
      assert.equal(verification, 0);
    } else if (scenario === "verify-error") {
      await page.locator('#join [role="alert"]').waitFor();
      assert(!page.url().includes("/payment-success"));
      const text = await page.locator('#join [role="alert"]').innerText();
      assert(text.includes("signature verification failed"), text);
    } else if (scenario === "load-error") {
      await page.locator('#join [role="alert"]').waitFor();
      assert.equal(creates, 0);
      assert.equal(
        await page
          .getByRole("button", { name: /Try test checkout/ })
          .isEnabled(),
        true,
      );
    } else {
      await page.waitForURL("**/payment-success");
      await page
        .getByRole("heading", { name: "Test payment verified", exact: true })
        .waitFor();
      assert(
        (await page.locator("main").innerText()).includes(
          "No real payment was taken",
        ),
      );
      assert.equal(chosen, scenario);
      assert.equal(creates, 1);
      assert(verification >= 2);
    }
    await page.close();
  }
  const spoof = await browser.newPage();
  await spoof.goto(base + "/payment-success?success=true&payment_id=pay_fake");
  await spoof
    .getByText("No checkout reference was found in this browser.", {
      exact: false,
    })
    .waitFor();
  assert.equal(
    await spoof
      .getByRole("heading", { name: "Payment verified", exact: true })
      .count(),
    0,
  );
  await spoof.close();
  console.log(
    "Checkout UX mocks passed: monthly/yearly, dismissal, script failure, verification failure, test-mode messaging and redirect spoofing. No real Razorpay payment was made.",
  );
} finally {
  await browser.close();
}
