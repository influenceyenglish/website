import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd(), true);
async function main() {
  const { billingEmailConfig, sendPendingBillingEmails } =
    await import("../src/lib/payments/billing-email");
  const { postgresDatabase } = await import("../src/lib/payments/database");
  const config = billingEmailConfig();
  if (config.mode !== "test") throw new Error("TEST mode is required.");
  if (!config.apiKey?.trim())
    throw new Error("Set RESEND_API_KEY in .env.local.");
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL.");
  console.log(
    JSON.stringify(
      await sendPendingBillingEmails(
        postgresDatabase(process.env.DATABASE_URL),
        config,
      ),
    ),
  );
}
main().catch(() => {
  console.error(
    "Billing email check failed. Confirm TEST mode, RESEND_API_KEY, verified RESEND_FROM, and database connectivity.",
  );
  process.exitCode = 1;
});
