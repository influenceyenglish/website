import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome" });
const base = process.env.BASE_URL || "http://127.0.0.1:3000";
const createPath = "**/api/razorpay/subscription";
const verifyPath = "**/api/razorpay/verify*";
try {
  for (const scenario of [
    "monthly",
    "yearly",
    "pending",
    "delayed",
    "failed-retry",
    "awaiting",
    "retry-details",
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
    let statusChecks = 0;
    const submitted = [];
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
      submitted.push(data);
      if (scenario === "retry-details" && creates === 1)
        return route.fulfill({
          status: 503,
          json: { error: "Please try again." },
        });
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
      if (route.request().method() === "GET") statusChecks++;
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
          status:
            scenario === "failed-retry" && statusChecks < 3
              ? "failed"
              : scenario === "pending" ||
                  (scenario === "delayed" && statusChecks < 3)
                ? "pending"
                : scenario === "awaiting"
                  ? "awaiting_full_payment"
                  : "active",
          mode: "test",
          studentName: "Browser test",
          paidUntil: new Date(Date.now() + 28 * 86400000).toISOString(),
        },
      });
    });
    await page.goto(base, { waitUntil: "networkidle" });
    if (scenario === "yearly")
      await page.locator('input[name="plan"][value="yearly"]').check();
    await page
      .getByText(scenario === "yearly" ? "₹399" : "₹499", { exact: true })
      .waitFor();
    if (scenario === "yearly")
      assert((await page.locator("#join").innerText()).includes("₹4,788"));
    await page.getByLabel("Full name").fill("Browser test");
    await page.locator('input[name="phone"]').fill("+919876543210");
    await page
      .getByLabel("Email for membership access")
      .fill("browser@example.test");
    await page.locator('input[name="consent"]').check();
    await page.getByRole("button", { name: /Continue to payment/ }).click();
    if (scenario === "retry-details") {
      await page.locator('#join [role="alert"]').waitFor();
      await page.getByLabel("Full name").fill("Corrected name");
      await page.locator('input[name="phone"]').fill("+919876543211");
      await page.getByRole("button", { name: /Continue to payment/ }).click();
    }
    if (scenario === "dismiss") {
      await page.waitForURL("**/payment-cancelled");
      assert(
        (await page.locator("main").innerText()).includes(
          "does not cancel an existing subscription",
        ),
      );
      assert.equal(verification, 0);
    } else if (scenario === "verify-error") {
      await page.waitForURL("**/payment-success");
      await page
        .getByText(
          "We couldn't confirm this checkout. Contact us if you paid.",
          { exact: true },
        )
        .waitFor();
      assert.equal(
        await page
          .getByRole("heading", {
            name: "Your payment has been received",
            exact: true,
          })
          .count(),
        0,
      );
    } else if (scenario === "load-error") {
      await page.locator('#join [role="alert"]').waitFor();
      assert.equal(creates, 0);
      assert.equal(
        await page
          .getByRole("button", { name: /Continue to payment/ })
          .isEnabled(),
        true,
      );
    } else if (scenario === "pending" || scenario === "awaiting") {
      await page.waitForURL("**/payment-success");
      await page
        .getByText("This page will update automatically.", {
          exact: false,
        })
        .waitFor();
      assert.equal(
        await page
          .getByRole("heading", {
            name: "Your payment has been received",
            exact: true,
          })
          .count(),
        0,
      );
      assert.equal(creates, 1);
    } else {
      await page.waitForURL("**/payment-success");
      await page
        .getByRole("heading", {
          name: "Your payment has been received",
          exact: true,
        })
        .waitFor();
      assert(
        (await page.locator("main").innerText()).includes(
          "No real payment was taken",
        ),
      );
      await page
        .getByText("Welcome to Influency English!", { exact: true })
        .waitFor();
      const video = page.getByLabel("Community joining video");
      assert.equal(await video.getAttribute("src"), "/videos/founder.mp4");
      assert.equal(await video.getAttribute("controls"), "");
      assert.equal(await video.getAttribute("autoplay"), null);
      assert(
        !(await page.locator("main").innerText()).includes("Browser test,"),
      );
      const community = page.getByRole("link", {
        name: "Join WhatsApp Community",
      });
      assert(
        await video.evaluate((element) => {
          const button = document.querySelector(
            'a[href^="https://chat.whatsapp.com/"]',
          );
          return (
            !!button &&
            !!(
              element.compareDocumentPosition(button) &
              Node.DOCUMENT_POSITION_FOLLOWING
            )
          );
        }),
      );
      assert.equal(await community.getAttribute("target"), "_blank");
      assert(
        (await community.getAttribute("href")).startsWith(
          "https://chat.whatsapp.com/",
        ),
      );
      assert.equal(chosen, scenario === "yearly" ? "yearly" : "monthly");
      assert.equal(creates, scenario === "retry-details" ? 2 : 1);
      if (scenario === "delayed" || scenario === "failed-retry")
        assert(statusChecks >= 3);
      if (scenario === "retry-details") {
        assert.notEqual(submitted[0].requestId, submitted[1].requestId);
        assert.equal(submitted[1].name, "Corrected name");
      }
      assert(verification >= 2);
    }
    await page.close();
  }
  const spoof = await browser.newPage();
  await spoof.goto(base + "/payment-success?success=true&payment_id=pay_fake");
  await spoof
    .getByText("We couldn't find this checkout. Contact us if you paid.", {
      exact: false,
    })
    .waitFor();
  assert.equal(
    await spoof
      .getByRole("heading", {
        name: "Your payment has been received",
        exact: true,
      })
      .count(),
    0,
  );
  await spoof.close();
  console.log(
    "Checkout UX mocks passed: monthly/yearly, edited-contact retries, automatic delayed confirmation, failed-to-paid retry, mandate-only pending, dismissal, script/verification errors and spoofed results. No real Razorpay payment was made.",
  );
} finally {
  await browser.close();
}
