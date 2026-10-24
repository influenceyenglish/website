import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
async function main() {
  const { billingEmailConfig, sendPendingBillingEmails } =
    await import("../src/lib/payments/billing-email");
  const { postgresDatabase } = await import("../src/lib/payments/database");
  const { sendPendingWelcomeEmails } =
    await import("../src/lib/payments/welcome-email");
  const config = billingEmailConfig();
  if (config.mode === "live" && !process.argv.includes("--live"))
    throw new Error("Live dispatch requires --live.");
  if (!config.apiKey?.trim())
    throw new Error("Set RESEND_API_KEY in .env.local.");
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL.");
  console.log(
    JSON.stringify({
      billing: await sendPendingBillingEmails(
        postgresDatabase(process.env.DATABASE_URL),
        config,
      ),
      welcome: await sendPendingWelcomeEmails(
        postgresDatabase(process.env.DATABASE_URL),
        {
          ...config,
          communityUrl: process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL,
        },
      ),
    }),
  );
}
main().catch(() => {
  console.error(
    "Billing email check failed. Confirm RESEND_API_KEY, verified RESEND_FROM, database connectivity, and --live for live dispatch.",
  );
  process.exitCode = 1;
});
