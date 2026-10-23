# Payment operations

The app uses only members, subscriptions and webhook_events through pg and DATABASE_URL. Resend sends internal failure follow-ups only. No outbox, admin dashboard or authentication is installed.

## Test setup

Use Test Mode credentials and matching INR plans: monthly 49900 paise, yearly 499900 paise, interval 1. Run npm run payments:check for read-only preflight. Use the connected Supabase project's transaction pooler URL for serverless, with TLS. The approved baseline is already applied. The legacy db:migrate command is disabled.

## Verification and access

Save the pending member/subscription before calling Razorpay. Browser verification checks signatures and provider data, then waits for a signed webhook. Only full captured, invoice-backed payment webhooks set paid access. The status endpoint calculates access using paid_until, so expiry is enforced even if the member summary awaits reconciliation.

Duplicate provider event IDs and hashes are checked transactionally. Captured facts and refund tombstones stay in webhook_events: do not delete them as temporary logs. Different events for the same payment do not add time; paid access is the maximum unrefunded period. A cancellation preserves prepaid time. Any partial refund conservatively excludes that payment period. Older lifecycle events cannot overwrite terminal state.

## Failure follow-up

Verified failed payments with an invoice/subscription association set failure_email_state=pending once. Verified subscription.pending/subscription.halted events also queue one follow-up. After an accepted webhook, Next.js after() dispatches up to ten pending Test Mode emails through Resend. Missing RESEND_API_KEY defers email without affecting the webhook response. Run npm run emails:check after adding the key to dispatch existing pending/failed emails. Failed initial payments without an invoice association require manual provider reconciliation; the app does not guess ownership from a browser event. Test Mode emails are explicitly labelled TEST and addressed only to billing@influenceyenglish.com. Configure RESEND_FROM with a sender on a domain verified in Resend. The sent timestamp means API acceptance, not inbox delivery. Check delivery in Resend.

## Limits and live readiness

The demo throttle is bounded and per process; it is not shared across instances. Live browser payment requests fail closed until shared rate limiting is integrated. Payment records and webhook idempotency always persist in Postgres. Before live launch, implement shared throttling, fulfilment and a protected operations workflow.

## Manual reconciliation

Review ambiguous creation timeouts in Razorpay using checkout_attempt_id notes; do not blindly create another subscription. Configure the public HTTPS /api/razorpay/webhook URL and matching secret in Razorpay Test Mode. Include subscription lifecycle, subscription.charged, payment.captured, payment.failed, payment.refunded and refund.processed events. Invalid signatures never write records. Provider/database failures return non-2xx for retry; a transaction failure rolls back all local event effects.

## Email retry boundaries

Each subscription has one failure follow-up state. A committed sending claim and a stable Resend idempotency key prevent concurrent sends. Definite provider rejections become failed and can be retried. A timeout, unknown provider outcome or crash leaves sending for manual reconciliation in Resend; do not blindly reset it. Resend retains idempotency keys for 24 hours. No customer emails are sent and live email dispatch remains disabled.
