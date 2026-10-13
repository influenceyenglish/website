# Payment operations

This is a preparation/runbook, not a record of a real Razorpay transaction. Use restricted operator access. Never put API keys, webhook secrets or raw payment payloads in support tickets or browser code.

## Before accepting members

Confirm the legal/business name, final community platform, live schedule, refund terms, data retention and the published two-business-day onboarding process. Enable the live gates only after Razorpay approval and a successful real Test Mode exercise. No automatic email/community account provisioning is connected yet.

## Onboarding queue

The outbox is durable. Delivery must be based on the current paid ledger, not the event name alone. The following read-only query finds undelivered verified Live payments with a currently valid, unrefunded paid period:

```sql
SELECT o.id, o.event_key, a.customer_name, a.customer_email,
       a.subscription_id, a.plan, MAX(g.paid_until) AS paid_until
FROM membership_outbox o
JOIN checkout_attempts a
  ON a.mode=o.mode AND a.subscription_id=o.subscription_id
JOIN payment_grants g
  ON g.mode=a.mode AND g.subscription_id=a.subscription_id
LEFT JOIN payment_reversals r
  ON r.mode=g.mode AND r.payment_id=g.payment_id
WHERE o.mode='live' AND o.kind='payment_verified'
  AND o.delivered_at IS NULL AND r.payment_id IS NULL
GROUP BY o.id, o.event_key, a.id
HAVING MAX(g.paid_until)>now()
ORDER BY o.id;
```

Confirm the member identity/contact, grant the appropriate platform access, and send onboarding instructions. Only after successful delivery mark that outbox row delivered. When building an automated adapter, use the outbox event key as its idempotency key, verify current paid status again, and connect an authenticated member ID. Never provision real access from Test Mode rows.

Process `payment_reversed` and `subscription_updated` entries as well: update the platform's access end date using the current ledger. A cancellation normally preserves the paid period. A refund excludes the refunded payment period; if another unrefunded period still covers today, it remains valid. Partial refunds conservatively revoke the affected period pending manual review. Do not delete grant/reversal history to change access.

There is no timer that logs a member out of a third-party community. Enforce the ledger's paid expiry in your final member portal/community integration, or schedule a daily operator expiry check until that integration exists.

## Cancellation and refund requests

1. Verify that the requester controls the checkout email and can provide their subscription reference. Never ask for card details, UPI PINs, passwords or OTPs.
2. Review the published policy and receipt. Action cancellations in Razorpay Dashboard, normally at cycle end, within the confirmed response timeline. Confirm the effective date to the member.
3. For approved refunds, use the payment provider's refund workflow and the original payment method. Do not invent a refund from a client redirect.
4. Check the resulting signed webhook, reversal record and outbox. Update delivery access against the current paid period and tell the member the refund reference/status.

Neither `/payment-cancelled` nor leaving the community cancels a mandate. The current API routes do not implement customer-initiated cancellation/refunds; support handles these in the Dashboard as disclosed in the policies.

## Webhook reliability

- Configure separate Test and Live URLs/secrets and all documented events.
- Monitor non-2xx responses and response latency. Remote API/database failures return non-2xx so Razorpay can retry; transactions ensure partial writes do not mark an event complete.
- Duplicate delivery is normal. The unique `(mode,event_id)` marker and hash prevent repeated effects. A reused ID with another payload is rejected and requires investigation.
- Keep a previous webhook secret during a rotation while old events are being retried; remove it after the retry window and operator review.
- Signature-invalid requests are never parsed or accepted. Do not manually reserialize a stored body and expect the same signature.
- The normal provider calls should finish within Razorpay's acknowledgement window. Monitor latency on your deployment and add a durable authenticated inbox/worker if provider/network latency becomes material at scale; do not acknowledge before durable recording.

## Uncertain checkout creation

If Razorpay's create request times out or its response cannot be associated locally, the attempt is marked `uncertain`. Reusing the same attempt does not issue another provider POST. Check Razorpay Dashboard for the `checkout_attempt_id` note and reconcile the exact plan/subscription before inviting a retry. Do not blindly retry a provider create call after an ambiguous timeout. A signed owned-subscription webhook can recover the association from this note.

## Missing invoice/period information

A paid invoice must match the subscription and payment. `billing_end` is used for the grant; a signed `subscription.charged` snapshot can provide the period when necessary. An authorisation amount, missing invoice association or unknown period stays pending. Investigate/replay the correct provider event rather than granting access from a screenshot or editing a success URL.

## Retention and database care

Keep consent, transaction and webhook audit records according to the final retention policy. Expired rate-limit buckets may be removed periodically. Monitor connection count and use the provider's pooler. Back up the database and restrict operator permissions. Never use a temporary filesystem or per-instance Map for live deduplication/entitlements.
