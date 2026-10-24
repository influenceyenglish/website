import { after, NextRequest } from "next/server";
import { services, readBody, json, errorResponse } from "@/lib/payments/http";
import {
  billingEmailConfig,
  sendPendingBillingEmails,
} from "@/lib/payments/billing-email";
import { sendPendingWelcomeEmails } from "@/lib/payments/welcome-email";
import { postgresDatabase } from "@/lib/payments/database";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  try {
    const raw = await readBody(request, 1_048_576);
    const { service, config } = services();
    const result = await service.webhook(
      raw,
      request.headers.get("x-razorpay-signature"),
      request.headers.get("x-razorpay-event-id"),
    );
    // Accepted webhook effects are committed before optional email delivery starts.
    after(async () => {
      const db = postgresDatabase(config.databaseUrl);
      const emailConfig = billingEmailConfig();
      const jobs = [
        [
          "welcome",
          () =>
            sendPendingWelcomeEmails(db, {
              ...emailConfig,
              communityUrl: process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL,
            }),
        ],
        ["billing", () => sendPendingBillingEmails(db, emailConfig)],
      ] as const;
      for (const [label, send] of jobs) {
        try {
          const outcome = await send();
          if (!["processed", "disabled_for_test"].includes(outcome.state))
            console.info(label + "_email_status", outcome.state);
        } catch {
          console.error(label + "_email_dispatch_failed");
        }
      }
    });
    return json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
