import { after, NextRequest } from "next/server";
import { services, readBody, json, errorResponse } from "@/lib/payments/http";
import {
  billingEmailConfig,
  sendPendingBillingEmails,
} from "@/lib/payments/billing-email";
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
      try {
        const outcome = await sendPendingBillingEmails(
          postgresDatabase(config.databaseUrl),
          billingEmailConfig(),
        );
        if (outcome.state !== "processed")
          console.info("billing_email_status", outcome.state);
      } catch {
        console.error("billing_email_dispatch_failed");
      }
    });
    return json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
