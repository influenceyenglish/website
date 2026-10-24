# Payment operations

The app uses only members, subscriptions and webhook_events through pg and DATABASE_URL. Resend sends internal failure follow-ups and verified live customer welcome emails. No outbox, admin dashboard or authentication is installed.

## Test setup

Use Test Mode credentials and matching INR plans: monthly 49900 paise, yearly 478800 paise, interval 1. Run npm run payments:check for read-only preflight. Use the connected Supabase project's transaction pooler URL for serverless, with TLS. The approved baseline is already applied. The legacy db:migrate command is disabled.

## Verification and access

Save the pending member/subscription before calling Razorpay. Browser verification checks signatures and provider data, then waits for a signed webhook. Only full captured, invoice-backed payment webhooks set paid access. The status endpoint calculates access using paid_until, so expiry is enforced even if the member summary awaits reconciliation.

Duplicate provider event IDs and hashes are checked transactionally. Captured facts and refund tombstones stay in webhook_events: do not delete them as temporary logs. Different events for the same payment do not add time; paid access is the maximum unrefunded period. A cancellation preserves prepaid time. Any partial refund conservatively excludes that payment period. Older lifecycle events cannot overwrite terminal state.

## Failure follow-up

Verified failed payments with an invoice/subscription association set failure_email_state=pending once. Verified subscription.pending/subscription.halted events also queue one follow-up. After an accepted webhook, Next.js after() dispatches up to ten pending emails for the configured Razorpay mode through Resend. Missing RESEND_API_KEY defers email without affecting the webhook response. Run npm run emails:check after adding the key to dispatch existing pending/failed Test Mode emails. For Live Mode, use the deployed production configuration with npm run emails:check -- --live; the command requires explicit --live when RAZORPAY_MODE=live. This command sends real internal alerts and is not a read-only check. Failed initial payments without an invoice association require manual provider reconciliation; the app does not guess ownership from a browser event. Both modes send only to the existing internal recipient billing@influenceyenglish.com. Test Mode emails are explicitly labelled TEST; live emails identify LIVE MODE in the body. Claims, member lookups, sent/failed updates and Resend idempotency keys are isolated by mode. Configure RESEND_FROM with a sender on a domain verified in Resend. The sent timestamp means API acceptance, not inbox delivery. Check delivery in Resend.

## Limits and live readiness

Payment throttling uses Upstash Redis on all Vercel deployments and in Live Mode; only local Test Mode without Redis credentials uses bounded per-process counters. Creation limits are 20 per IP, 10 per browser session and 5 per normalized customer email and 5 per normalized phone per 10 minutes. Only creation invokes the limiter; verification/status and webhooks do not depend on Redis. Exceeded limits return HTTP 429; missing configuration, Redis errors and timeouts return HTTP 503 before payment creation. Webhooks never call the limiter. Payment records and webhook idempotency remain in Postgres. See [payment rate limiting](payment-rate-limiting.md). Before live launch, complete fulfilment and a protected operations workflow.

## Manual reconciliation

Review ambiguous creation timeouts in Razorpay using checkout_attempt_id notes; do not blindly create another subscription. Configure the public HTTPS /api/razorpay/webhook URL and matching secret in Razorpay Test Mode. Include subscription lifecycle, subscription.charged, payment.captured, payment.failed, payment.refunded and refund.processed events. Invalid signatures never write records. Provider/database failures return non-2xx for retry; a transaction failure rolls back all local event effects.

## Email retry boundaries

Each subscription has one failure follow-up state. A committed sending claim and a stable Resend idempotency key prevent concurrent sends. Definite provider rejections become failed and can be retried. A timeout, unknown provider outcome or crash leaves sending for manual reconciliation in Resend; do not blindly reset it. Resend retains idempotency keys for 24 hours. Live internal email dispatch is enabled. Live customer welcome emails are enabled for new checkouts after verified full payment; see the welcome email section below. Email delivery never grants or removes membership and never determines payment success: Razorpay verification and committed database payment facts remain authoritative. Email delivery runs after accepted webhook effects commit, and delivery errors are caught without changing the webhook response.

## Email environment and audit checks

Set server-only RESEND_API_KEY and RESEND_FROM in Vercel Production, then redeploy. RESEND_FROM defaults to Influency English Billing <billing@influenceyenglish.com> when omitted; its sender domain must be verified in Resend. DATABASE_URL is also required by the existing payment flow. No new recipient environment variable is needed. A missing Resend key leaves the alert pending and logs billing_email_status=missing_api_key; payment processing continues.

The dispatcher retains one internal failure follow-up per subscription. It is triggered by verified payment.failed (when associated with an invoice/subscription), subscription.pending, or subscription.halted events. Initial checkout failures that cannot be associated with an owned subscription still need manual reconciliation. There is no scheduled retry worker: subsequent accepted webhooks or the explicit dispatcher command retry pending/definitively failed records. Unknown outcomes remain sending for manual review to avoid duplicate emails. Monitor Resend delivery/bounce events separately; API acceptance is not inbox delivery.

## Diagnosing checkout configuration mismatches

Configuration checks run before Redis, database queries and Razorpay API calls. The browser now receives a safe explanation and reference code. Vercel runtime logs record `payment_configuration_invalid` with the code and an action naming the setting to fix; credential values are never logged.

| Reference                     | Check in Vercel Production                                          |
| ----------------------------- | ------------------------------------------------------------------- |
| PAYMENT_KEY_MODE_MISMATCH     | RAZORPAY_KEY_ID prefix matches RAZORPAY_MODE                        |
| PAYMENT_PUBLIC_KEY_MISMATCH   | NEXT_PUBLIC_RAZORPAY_KEY_ID exactly equals RAZORPAY_KEY_ID          |
| PAYMENT_MONTHLY_PLAN_INVALID  | RAZORPAY_PLAN_MONTHLY contains a plan_ ID                           |
| PAYMENT_YEARLY_PLAN_INVALID   | RAZORPAY_PLAN_YEARLY contains a plan_ ID                            |
| PAYMENT_PLAN_IDS_DUPLICATED   | Monthly and yearly use different plan IDs                           |
| PAYMENT_API_SECRET_INVALID    | RAZORPAY_KEY_SECRET is the API secret, not the key ID               |
| PAYMENT_WEBHOOK_SECRET_REUSED | The webhook uses its dedicated secret, distinct from the API secret |

After changing environment values, redeploy and reproduce once. Open Vercel project Logs and filter for payment_configuration_invalid. The read-only `npm run payments:check` script also prints the detailed action when run with the affected environment. Do not paste secrets into support messages; share the reference code only.

## Checkout details and welcome emails

The additive checkout_contact_and_welcome migration adds per-checkout name/email/phone snapshots and welcome delivery state to subscriptions. It preserves historical payment data and does not backfill contacts or queue old welcome messages. The saved member identity is not overwritten by anonymous form edits. Corrected form details use a new browser checkout reference; exact retries reuse their own reference.

The result page uses a neutral welcome and automatically checks the session-bound database status for up to one minute. Pending or mandate-only status never shows payment received. The page keeps checking through earlier failure states so a successful retry can be confirmed. Closing the page does not stop server-side webhook processing or welcome delivery.

Only verified captured payments with current, unrefunded paid access queue a welcome, once per subscription. The welcome uses the checkout email snapshot, includes the charged plan amount and WhatsApp link, and uses RESEND_API_KEY, RESEND_FROM and NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL. Test Mode never sends customer welcome emails. Missing settings leave the welcome pending without changing access. Sent means accepted by Resend, not inbox delivery; check Resend delivery logs.

Welcome dispatch runs after the webhook response, separately from internal failure alerts. npm run emails:check -- --live also retries pending/definitively failed welcome and billing emails using the configured live environment. Unknown delivery outcomes remain sending for manual review, avoiding blind duplicate sends after the provider idempotency window. There is no scheduled retry worker. No customer failure email is sent.
