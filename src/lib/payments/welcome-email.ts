import "server-only";
import type { Database } from "./store";
import {
  resendSender,
  type BillingEmail,
  type BillingSend,
} from "./billing-email";
import { communityInvite } from "../community";

type Config = {
  mode: "test" | "live";
  apiKey?: string;
  from: string;
  communityUrl?: string;
};
const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );

export function welcomeMessage(
  from: string,
  to: string,
  plan: string,
  amount: number,
  invite: string,
): BillingEmail {
  const price = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount / 100);
  const summary = `${plan === "yearly" ? "Yearly" : "Monthly"} membership · ${price}`;
  const text = [
    "Welcome to Influency English!",
    "Your payment has been received.",
    summary,
    "Join our WhatsApp community:",
    invite,
    "Please use the WhatsApp number entered at checkout. An admin will approve your request shortly.",
    "Our team will share your session details in the community.",
    "Need help? Email hello@influenceyenglish.com.",
  ].join("\n\n");
  return {
    from,
    to,
    subject: "Welcome to Influency English",
    text,
    html: `<!doctype html><html><body style="margin:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#12305a"><table role="presentation" style="width:100%;padding:32px 16px"><tr><td align="center"><table role="presentation" style="width:100%;max-width:560px;background:#fff;border-radius:16px;overflow:hidden"><tr><td style="padding:28px 32px;background:#01408f;color:#fff;font-size:22px;font-weight:bold">Influency English<span style="color:#e50110">.</span></td></tr><tr><td style="padding:32px"><h1 style="font-size:28px;line-height:1.2;margin:0 0 20px">Welcome to the community</h1><p style="line-height:1.7">Your payment has been received. We’re glad you’re here.</p><p style="padding:16px;background:#f0f4fa;border-radius:8px;font-weight:bold">${escapeHtml(summary)}</p><p style="line-height:1.7">Join our WhatsApp community to get started.</p><p style="margin:28px 0"><a href="${escapeHtml(invite)}" style="display:inline-block;background:#01408f;color:#fff;padding:16px 22px;text-decoration:none;border-radius:8px;font-weight:bold">Join WhatsApp Community</a></p><p style="line-height:1.7">Please use the WhatsApp number entered at checkout. An admin will approve your request shortly.</p><p style="line-height:1.7">Our team will share your session details in the community.</p><hr style="border:0;border-top:1px solid #dce4ef;margin:28px 0"><p style="font-size:14px;line-height:1.7">Need help? <a href="mailto:hello@influenceyenglish.com" style="color:#01408f">Contact our team</a>.</p></td></tr></table></td></tr></table></body></html>`,
  };
}

/** One live welcome per subscription, queued only by verified full-payment webhooks. */
export async function sendPendingWelcomeEmails(
  db: Database,
  config: Config,
  send?: BillingSend,
) {
  if (config.mode !== "live") return { state: "disabled_for_test", sent: 0 };
  if (!config.apiKey?.trim() && !send)
    return { state: "missing_api_key", sent: 0 };
  const invite = communityInvite(config.communityUrl);
  if (!invite) return { state: "missing_community_url", sent: 0 };
  const deliver = send || resendSender(config.apiKey!);
  let sent = 0;
  for (let i = 0; i < 10; i++) {
    const claimed = await db.query(
      `UPDATE public.subscriptions s SET welcome_email_state='sending',updated_at=now()
      WHERE s.id=(SELECT q.id FROM public.subscriptions q WHERE q.mode=$1
      AND q.welcome_email_state IN ('pending','failed') AND q.payment_status='paid'
      AND q.paid_until>now() AND q.checkout_email IS NOT NULL
      ORDER BY q.created_at LIMIT 1 FOR UPDATE SKIP LOCKED)
      RETURNING s.id,s.checkout_email,s.plan,s.expected_amount`,
      [config.mode],
    );
    const row = claimed.rows[0];
    if (!row) break;
    const message = welcomeMessage(
      config.from,
      String(row.checkout_email),
      String(row.plan),
      Number(row.expected_amount),
      invite,
    );
    let result: Awaited<ReturnType<BillingSend>>;
    try {
      result = await deliver(message, `welcome/${config.mode}/${row.id}`);
    } catch {
      return { state: "delivery_uncertain", sent };
    }
    if (!result.accepted) {
      if (result.definiteFailure)
        await db.query(
          `UPDATE public.subscriptions SET welcome_email_state='failed',updated_at=now()
        WHERE id=$1 AND mode=$2 AND welcome_email_state='sending'`,
          [row.id, config.mode],
        );
      return {
        state: result.definiteFailure ? "send_failed" : "delivery_uncertain",
        sent,
      };
    }
    await db.query(
      `UPDATE public.subscriptions SET welcome_email_state='sent',welcome_email_sent_at=now(),updated_at=now()
      WHERE id=$1 AND mode=$2 AND welcome_email_state='sending'`,
      [row.id, config.mode],
    );
    sent++;
  }
  return { state: "processed", sent };
}
