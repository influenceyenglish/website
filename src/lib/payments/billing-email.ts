import "server-only";
import { Resend } from "resend";
import type { Database } from "./store";

export type BillingEmail = {
  from: string;
  to: string;
  subject: string;
  text: string;
};
export type BillingSend = (
  message: BillingEmail,
  key: string,
) => Promise<{ accepted: boolean; definiteFailure?: boolean }>;
export const billingRecipient = "billing@influenceyenglish.com";

/** At most one internal follow-up per subscription. No customer email is sent. */
export async function sendPendingBillingEmails(
  db: Database,
  config: { mode: "test" | "live"; apiKey?: string; from: string },
  send?: BillingSend,
) {
  if (config.mode !== "test") return { state: "disabled_for_live", sent: 0 };
  if (!config.apiKey?.trim() && !send)
    return { state: "missing_api_key", sent: 0 };
  const resend = send ? null : new Resend(config.apiKey);
  const deliver: BillingSend =
    send ||
    (async (message, key) => {
      const result = await resend!.emails.send(message, {
        idempotencyKey: key,
      });
      if (result.error) {
        // Unknown transport/server outcomes remain 'sending' for manual reconciliation.
        const definiteFailure = [
          "validation_error",
          "missing_required_field",
          "invalid_parameter",
          "invalid_access",
          "invalid_api_key",
          "restricted_api_key",
          "missing_api_key",
          "not_found",
          "rate_limit_exceeded",
        ].includes(result.error.name);
        return { accepted: false, definiteFailure };
      }
      return { accepted: !!result.data?.id };
    });
  let sent = 0;
  for (let i = 0; i < 10; i++) {
    // Commit the durable claim before contacting Resend; no network calls inside a transaction.
    const claimed =
      await db.query(`UPDATE public.subscriptions s SET failure_email_state='sending',updated_at=now()
      WHERE s.id=(SELECT q.id FROM public.subscriptions q WHERE q.mode='test' AND q.failure_email_state IN ('pending','failed')
      ORDER BY q.created_at LIMIT 1 FOR UPDATE SKIP LOCKED)
      RETURNING s.id,s.plan,s.razorpay_subscription_id,s.member_id`);
    const row = claimed.rows[0];
    if (!row) break;
    const member = await db.query(
      "SELECT full_name,email,phone FROM public.members WHERE id=$1 AND mode=$2",
      [row.member_id, "test"],
    );
    const contact = member.rows[0];
    const message: BillingEmail = {
      from: config.from,
      to: billingRecipient,
      subject: "[TEST] Influency English payment failure - internal follow-up",
      text: [
        "TEST MODE: no real payment or community access.",
        "A verified Razorpay payment failure requires one internal follow-up.",
        `Name: ${contact?.full_name || "Unavailable"}`,
        `Email: ${contact?.email || "Unavailable"}`,
        `Phone: ${contact?.phone || "Unavailable"}`,
        `Plan: ${row.plan}`,
        `Local reference: ${row.id}`,
        `Razorpay subscription: ${row.razorpay_subscription_id}`,
        "Check current payment status before contacting the member. This message does not grant access.",
      ].join("\n"),
    };
    let result: Awaited<ReturnType<BillingSend>>;
    try {
      result = await deliver(message, `billing-failure/test/${row.id}`);
    } catch {
      return { state: "delivery_uncertain", sent };
    }
    if (!result.accepted) {
      if (result.definiteFailure)
        await db.query(
          `UPDATE public.subscriptions SET failure_email_state='failed',updated_at=now() WHERE id=$1 AND mode='test' AND failure_email_state='sending'`,
          [row.id],
        );
      return {
        state: result.definiteFailure ? "send_failed" : "delivery_uncertain",
        sent,
      };
    }
    await db.query(
      `UPDATE public.subscriptions SET failure_email_state='sent',failure_email_sent_at=now(),updated_at=now() WHERE id=$1 AND mode='test' AND failure_email_state='sending'`,
      [row.id],
    );
    sent++;
  }
  return { state: "processed", sent };
}

export function billingEmailConfig() {
  return {
    mode:
      process.env.RAZORPAY_MODE === "test" || !process.env.RAZORPAY_MODE
        ? ("test" as const)
        : ("live" as const),
    apiKey: process.env.RESEND_API_KEY,
    from:
      process.env.RESEND_FROM?.trim() ||
      "Influency English Billing <billing@influenceyenglish.com>",
  };
}
