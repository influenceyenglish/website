import { chromium } from "playwright";

// Browser-only preview: no production route, payment bypass or database writes.
const base = new URL(process.env.BASE_URL || "http://localhost:3000");
if (!["localhost", "127.0.0.1"].includes(base.hostname))
  throw new Error("Use a localhost URL for this preview.");
try {
  const response = await fetch(base);
  if (!response.ok) throw new Error();
} catch {
  console.error(
    "Start the website with npm run dev, then run this command again.",
  );
  process.exit(1);
}

const browser = await chromium.launch({ channel: "chrome", headless: false });
try {
  const page = await browser.newPage({
    viewport: { width: 1100, height: 900 },
  });
  await page.addInitScript(() =>
    sessionStorage.setItem(
      "ie_latest_attempt",
      "00000000-0000-4000-8000-000000000001",
    ),
  );
  await page.route("**/api/razorpay/**", (route) => {
    const request = route.request();
    if (
      request.method() === "GET" &&
      new URL(request.url()).pathname === "/api/razorpay/verify"
    )
      return route.fulfill({
        json: {
          status: "active",
          mode: "live",
          paidUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
        },
      });
    return route.fulfill({
      status: 503,
      json: { error: "Payments are disabled in this preview browser." },
    });
  });
  await page.goto(new URL("/payment-success", base).href, {
    waitUntil: "domcontentloaded",
  });
  await page
    .getByRole("heading", { name: "Your payment has been received" })
    .waitFor();
  await page.evaluate(() => {
    const note = document.createElement("div");
    note.textContent =
      "LOCAL PREVIEW · No payment or email is sent. Close this window when finished.";
    Object.assign(note.style, {
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
      zIndex: "99999",
      padding: "10px 16px",
      background: "#01408f",
      color: "white",
      font: "14px/1.5 Arial,sans-serif",
      textAlign: "center",
    });
    document.body.appendChild(note);
  });
  console.log(
    "Joining-page preview is open. Play the video and test the WhatsApp button. No payment or email is sent.",
  );
  await new Promise((resolve) => browser.on("disconnected", resolve));
} finally {
  await browser.close();
}
