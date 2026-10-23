import { loadEnvConfig } from "@next/env";
import { Pool } from "pg";
import { PaymentError } from "../src/lib/payments/types";

class ConfigurationCheckError extends Error {}

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

async function main() {
  const required = [
    "APP_URL",
    "NEXT_PUBLIC_SITE_URL",
    "RAZORPAY_KEY_ID",
    "NEXT_PUBLIC_RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
    "DATABASE_URL",
  ];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (
    !(
      process.env.RAZORPAY_PLAN_MONTHLY || process.env.RAZORPAY_MONTHLY_PLAN_ID
    )?.trim()
  )
    missing.push("RAZORPAY_PLAN_MONTHLY");
  if (
    !(
      process.env.RAZORPAY_PLAN_YEARLY || process.env.RAZORPAY_YEARLY_PLAN_ID
    )?.trim()
  )
    missing.push("RAZORPAY_PLAN_YEARLY");
  if (missing.length)
    throw new ConfigurationCheckError(
      `Missing settings: ${missing.join(", ")}.`,
    );

  const { paymentConfig } = await import("../src/lib/payments/config");
  const { RazorpayGateway } = await import("../src/lib/payments/gateway");
  const { paymentPlans } = await import("../src/lib/payments/plans");
  const config = paymentConfig();
  if (process.argv.includes("--live") && config.mode !== "live")
    throw new ConfigurationCheckError(
      "Set RAZORPAY_MODE=live before running the live check.",
    );
  let origin: URL;
  try {
    origin = new URL(process.env.APP_URL!);
    const site = new URL(process.env.NEXT_PUBLIC_SITE_URL!);
    if (
      origin.origin !== site.origin ||
      origin.pathname !== "/" ||
      origin.search ||
      origin.hash ||
      origin.username ||
      origin.password
    )
      throw new Error();
    if (!["http:", "https:"].includes(origin.protocol)) throw new Error();
    if (
      config.mode === "live" &&
      !["localhost", "127.0.0.1"].includes(origin.hostname) &&
      origin.protocol !== "https:"
    )
      throw new Error();
  } catch {
    throw new ConfigurationCheckError(
      "APP_URL and NEXT_PUBLIC_SITE_URL must use the same website origin, with HTTPS for a hosted live site.",
    );
  }
  const gateway = new RazorpayGateway(config);
  for (const cycle of ["monthly", "yearly"] as const) {
    const plan = await gateway.getPlan(
      cycle === "monthly" ? config.monthlyPlanId : config.yearlyPlanId,
    );
    const expected = paymentPlans[cycle];
    if (
      plan.period !== expected.period ||
      plan.interval !== 1 ||
      plan.item.currency !== "INR" ||
      plan.item.amount !== expected.amount
    )
      throw new ConfigurationCheckError(
        `The ${cycle} plan does not match the website price or billing frequency.`,
      );
    console.log(`PASS: ${cycle} ${config.mode} plan and INR price.`);
  }
  const pool = new Pool({
    connectionString: config.databaseUrl,
    max: 1,
    connectionTimeoutMillis: 5000,
    query_timeout: 5000,
  });
  try {
    for (const table of ["members", "subscriptions", "webhook_events"]) {
      const result = await pool.query<{ present: string | null }>(
        "SELECT to_regclass($1) AS present",
        [table],
      );
      if (!result.rows[0]?.present)
        throw new ConfigurationCheckError(
          "Database schema is incomplete. Review the approved Supabase minimal membership migration.",
        );
    }
    console.log("PASS: database connection and subscription tables.");
  } catch (error) {
    if (error instanceof ConfigurationCheckError) throw error;
    throw new ConfigurationCheckError(
      "Cannot verify the database. Check DATABASE_URL, access rules and TLS settings.",
    );
  } finally {
    await pool.end();
  }
  console.log(
    `Configuration checks passed (${config.mode}). No payment or subscription was created.`,
  );
  console.log(
    `Configure the matching Razorpay webhook at ${origin.origin}/api/razorpay/webhook and verify delivery in the dashboard.`,
  );
  console.log(
    "This check does not confirm webhook delivery, bank/mandate authorisation or onboarding fulfilment.",
  );
}

main().catch((error: unknown) => {
  // Only our controlled messages reach output; never log SDK/database errors.
  console.error(
    error instanceof ConfigurationCheckError || error instanceof PaymentError
      ? error.message
      : "Payment configuration could not be verified.",
  );
  process.exitCode = 1;
});
