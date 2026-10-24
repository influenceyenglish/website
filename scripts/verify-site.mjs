import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
const browser = await chromium.launch({ channel: "chrome" });
const base = process.env.BASE_URL || "http://127.0.0.1:3000";
fs.mkdirSync("verification", { recursive: true });
try {
  for (const width of [390, 768, 1440]) {
    const p = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(base, { waitUntil: "networkidle" });
    await p.waitForTimeout(1600);
    const body = await p.locator("body").innerText();
    assert(body.includes("Influency English"));
    assert(body.includes("₹499"));
    await p.locator('input[name="plan"][value="yearly"]').check();
    await p.getByText("₹399", { exact: true }).waitFor();
    assert((await p.locator("#join").innerText()).includes("₹4,788"));
    await p.locator('input[name="plan"][value="monthly"]').check();
    assert(body.includes("Corrective Feedback Loop"));
    assert(!/Kindred|Alex Monroe|1,400\+ members|47%|54\.5%/.test(body));
    assert.equal(await p.getByRole("heading", { level: 1 }).count(), 1);
    const height = await p.evaluate(
      () => document.documentElement.scrollHeight,
    );
    for (let y = 0; y < height; y += 650) {
      await p.evaluate((y) => scrollTo(0, y), y);
      await p.waitForTimeout(90);
    }
    await p.waitForTimeout(900);
    const faq = p.getByRole("button", {
      name: "Do I need to speak fluent English already?",
    });
    await faq.click();
    assert.equal(await faq.getAttribute("aria-expanded"), "true");
    await faq.press("Enter");
    assert.equal(await faq.getAttribute("aria-expanded"), "false");
    assert.equal(
      await p.evaluate(
        () => innerWidth === document.documentElement.scrollWidth,
      ),
      true,
    );
    for (const path of [
      "/privacy-policy",
      "/terms",
      "/refund-policy",
      "/subscription-policy",
      "/contact",
    ])
      assert(await p.locator(`footer a[href="${path}"]`).count());
    assert.deepEqual(errors, []);
    await p.evaluate(() => scrollTo(0, 0));
    await p.screenshot({
      path: `verification/influencey-${width}.png`,
      fullPage: true,
    });
    await p.close();
  }
  const p = await browser.newPage();
  for (const route of [
    "/privacy-policy",
    "/terms",
    "/refund-policy",
    "/subscription-policy",
    "/contact",
    "/payment-success",
    "/payment-cancelled",
  ]) {
    const response = await p.goto(base + route);
    assert.equal(response.status(), 200, route);
    assert.equal(await p.getByRole("heading", { level: 1 }).count(), 1);
    assert(
      (await p.locator("footer").innerText()).includes(
        "hello@influenceyenglish.com",
      ),
    );
  }
  console.log(
    "Phase 1: 3 responsive widths, 8 routes, INR pricing, CFL, honest proof, footer policies and keyboard FAQ passed.",
  );
} finally {
  await browser.close();
}
