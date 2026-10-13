# Influencey English

A Next.js App Router funnel for an English-speaking practice community. The existing cream, forest-green and yellow design, local fonts, CSS Modules and word/ticker animations are retained. Content and policies are managed separately from components.

## Offer and routes

- ₹500/month or ₹5,000/year, in INR. The yearly plan saves ₹1,000 versus twelve monthly payments: two months free.
- Corrective Feedback Loop (CFL): speak, receive feedback, correct and repeat.
- Audience: early-career adults, mainly men.
- `/`: hero, labelled student-proof placeholders, speaking problem, CFL, benefits, audience, Hashim/about, outcomes, testimonials, pricing, FAQ, compliance footer.
- `/privacy-policy`, `/terms`, `/refund-policy`, `/subscription-policy`, `/contact`.
- `/payment-success` and `/payment-cancelled`: noindex result/help pages. A URL never activates membership.
- `/api/razorpay/create-subscription`, `/api/razorpay/verify` (POST verification / GET status), `/api/razorpay/webhook`.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:3000. On Windows PowerShell use `npm.cmd` if execution policy blocks `npm`.

```sh
npm run build
npm start
```

The funnel and policies render without credentials. Checkout fails closed with a helpful message until payment configuration and the database are ready.

## Content and design

| Edit                                                                      | Location                                                           |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Offer, copy, benefits, testimonials and FAQs                              | `src/content/site.ts`                                              |
| Business identity, address, contact details, policy version and timelines | `src/content/business.ts`                                          |
| Policy wording                                                            | `src/content/policies.ts`                                          |
| Colors, fonts, spacing tokens                                             | `src/styles/tokens.css`                                            |
| Section layout                                                            | `src/components/sections/<Section>.tsx` and matching `.module.css` |
| Checkout UI and client loading/error states                               | `src/components/checkout/`                                         |
| Server payment logic                                                      | `src/lib/payments/`                                                |
| Shared animation settings                                                 | `src/lib/motion.ts`                                                |

TypeScript strict mode is enabled. Most sections are server components. Motion, FAQ state and checkout are isolated client components. No payment secret is imported into client code.

Student proof, Hashim’s portrait and his detailed personal story are honest placeholders. Publish only consented student accounts with context/date; do not turn the prompts into fictitious testimonials. The speaking-scene images are labelled illustrations, not student photographs.

## Policy/business details to confirm

`business.ts` deliberately has `detailsConfirmed: false`, a legal/business name placeholder and a delivery platform/schedule placeholder. Policies are marked draft. The supplied operator name, address, phone and support email are included.

Provisional terms requiring owner confirmation:

- First-payment refund requests within 7 calendar days; review/acknowledgement within 2 business days; approved refunds initiated within 5–7 business days. The customer’s bank may take additional time.
- Cancellation requests actioned within 2 business days; request at least 2 business days before renewal. Paid access continues to the paid period end unless refunded.
- Onboarding and access details delivered by email within 2 business days of verified full payment.
- Final community platform, live session timings and course/resource catalogue must be published before live enrolment.

Visible policy links, business contact information and transparent service/renewal details support Razorpay’s website review. They do not guarantee approval; the legal/business identity must match your KYC and actual operations.

## Razorpay Test Mode setup

### 1. Environment

Copy `.env.example` to `.env.local` and fill it locally. Never commit `.env.local`.

| Variable                           | Purpose                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`             | Public canonical site URL; no credentials                                  |
| `APP_URL`                          | Exact website origin allowed to initiate/verify checkout; no trailing path |
| `RAZORPAY_MODE`                    | `test` by default; must agree with the key prefix                          |
| `RAZORPAY_KEY_ID`                  | Your Test Mode key ID; returned to Checkout as a public key                |
| `RAZORPAY_KEY_SECRET`              | Server-only API/checkout verification secret                               |
| `RAZORPAY_WEBHOOK_SECRET`          | Separate server-only webhook signing secret                                |
| `RAZORPAY_PREVIOUS_WEBHOOK_SECRET` | Optional previous secret during webhook rotation/retries                   |
| `RAZORPAY_MONTHLY_PLAN_ID`         | Test Mode monthly plan ID                                                  |
| `RAZORPAY_YEARLY_PLAN_ID`          | Test Mode yearly plan ID                                                   |
| `DATABASE_URL`                     | Durable Postgres connection string                                         |
| `RAZORPAY_ENABLE_LIVE`             | `false` until all go-live requirements are satisfied                       |

Do not prefix secrets with `NEXT_PUBLIC_`. API and webhook secrets are different. Do not log raw payment requests, secrets or full provider payloads.

### 2. Database

Use a durable Postgres database (for example, a Vercel Marketplace Postgres integration) with a pooled, TLS-enabled connection URL appropriate to your provider. Use separate databases/credentials for Test and Live. Configure a small pool and a region close to the app.

```sh
npm run db:migrate
```

This loads `.env.local` and applies `db/001_subscriptions.sql`. If the environment already supplies `DATABASE_URL` without a local file, run `node scripts/migrate.mjs` instead. The database migration is intentionally not run during the build.

Tables store checkout consent/session associations, provider lifecycle state, verified payment periods, reversal tombstones, processed webhook IDs, a fulfilment outbox and rate limits. There is no in-memory or local-file entitlement fallback. Restrict database access and back up records according to your confirmed retention policy.

### 3. Test Mode plans

In Razorpay Dashboard **Test Mode**, enable Subscriptions and create:

- Monthly plan: `period=monthly`, `interval=1`, `currency=INR`, `amount=50000` paise.
- Yearly plan: `period=yearly`, `interval=1`, `currency=INR`, `amount=500000` paise.

Set the corresponding IDs in the environment. No trial or extra upfront amount is configured. The API fetches each plan before creating a subscription and rejects incorrect amounts, currencies or intervals. Prepared mandates allow 120 monthly or 10 yearly cycles (at most ten years), as disclosed in the subscription policy.

### 4. Test Mode webhook

Deploy an HTTPS test/preview environment, configure its `APP_URL`, and set the Razorpay Test Mode webhook URL to:

```text
https://your-preview-domain/api/razorpay/webhook
```

Set the same dedicated webhook secret in Razorpay and your environment. Subscribe to:

```text
subscription.authenticated
subscription.activated
subscription.charged
subscription.pending
subscription.halted
subscription.paused
subscription.resumed
subscription.cancelled
subscription.completed
payment.captured
payment.refunded
refund.processed
```

Choose the available events in your Razorpay dashboard; status-only events update lifecycle records, never paid access. A refund revokes the refunded payment period; partial refunds conservatively revoke that period pending manual review. Failed/pending payments do not extend access.

A publicly reachable HTTPS endpoint is required. Do not point Razorpay at localhost. Consult the current Razorpay testing documentation for supported test payment methods and webhook forwarding restrictions.

### 5. Complete a real Test Mode transaction

Use Razorpay’s current official test-payment instructions. Check the monthly and yearly flows, a successful full payment, authorisation-only/pending payment, failure/dismissal, renewal, cancellation, duplicate webhook delivery and refund.

Confirm that the signed callback reaches `/verify`, the signed webhook is acknowledged, exactly one grant/outbox payment entry exists, and `/payment-success` reports **Test payment verified**. Test Mode must never deliver real paid community access.

No real credentials are included in this repository. Automated tests use synthetic fixtures and a mocked browser checkout; they are not evidence of a completed transaction with your Razorpay account.

## Security and fulfilment model

- The checkout record pins its provider plan ID and expected amount so existing renewals survive future plan configuration changes.
- The server maps `monthly`/`yearly` to fixed environment plan IDs; the browser cannot supply a price, plan ID, cycle count or upfront fee.
- Checkout requires explicit policy/age/recurring-payment consent. A secure HTTP-only SameSite cookie binds verification to the initiating browser. Checkout request UUIDs prevent repeated creation within that session. Same-origin checks, input/body limits and durable rate limits protect public POST handlers.
- Checkout HMAC is `payment_id|server_stored_subscription_id`, compared in constant time. The browser’s subscription ID must also match the stored record.
- Full payment is independently fetched and checked for captured status, INR amount, refund state and a paid invoice tied to the stored subscription. Authorisation-only charges do not grant access.
- Invoice `billing_end` defines the paid period. A signed `subscription.charged` snapshot can supply its period if the invoice omits it. A current subscription’s later period is never used to extend an old payment.
- Webhooks are authenticated against the exact raw bytes before JSON parsing. `x-razorpay-event-id` and a payload hash provide durable deduplication. Event marker, grant/reversal, lifecycle and outbox writes commit atomically; errors roll back and return non-2xx for retry.
- Refund tombstones prevent a delayed charge from restoring refunded access. Older lifecycle events cannot overwrite later/terminal state. Cancellation does not erase an already paid period.
- Test/Live records are scoped separately. Redirect/query parameters never activate access. Status responses are bound to the browser session and expose no customer email or secret.

### Delivery is a real operational step

The code prepares a durable **manual fulfilment outbox**, not a fictitious community connector or email sender. Until your delivery platform is confirmed, an authorised operator must process verified **Live** entries, send onboarding/access instructions within the published timeline, and mark them delivered. Test entries must be ignored for real access. An eventual authenticated delivery adapter can consume this outbox idempotently.

A session status page is not an authenticated member portal. Before using the ledger to protect private courses, connect your actual authentication system and community account identifiers.

See `docs/payment-operations.md` for safe delivery, reconciliation, cancellation and refund handling.

## Verify

```sh
npm test
npm run typecheck
npm run format:check
npm run build
```

`npm test` uses an isolated PGlite/Postgres engine with the actual SQL schema; no external database or real key is needed. It covers signature tampering, ownership, wrong prices/currencies, authorisation-only payments, concurrent duplicate delivery, rollback/retry, refunds and old events. It also tests HTTP failure paths before external calls.

With a running server and Chrome installed:

```sh
npm run verify
```

Browser checks cover responsive layout, all requested routes, INR pricing, policy links, keyboard FAQ, monthly/yearly checkout selection, loading/error handling, provider dismissal and redirect spoofing. The checkout is mocked; no payment is charged. Screenshots are saved to ignored `verification/`.

Set `BASE_URL` to test another running server. In PowerShell: `$env:BASE_URL='http://localhost:3001'`.

## Go live on Vercel

1. Confirm the legal/business name against KYC, the service platform/schedule, policies, delivery and support process. Replace placeholders in `business.ts`; set `detailsConfirmed: true` only after this work is complete.
2. Obtain Razorpay account/Subscriptions approval. Complete the real Test Mode checklist with your own keys and plans.
3. Provision the production database, apply the schema, configure production secrets, create matching **Live** plan IDs and a **Live** webhook. Use your HTTPS production origin for `APP_URL` and `NEXT_PUBLIC_SITE_URL`.
4. Set `RAZORPAY_MODE=live` and `RAZORPAY_ENABLE_LIVE=true`. The server refuses live checkout if the business/delivery placeholders or confirmation gate remain.
5. Import the repo into Vercel using the Next.js preset and default output settings. No deployment has been performed by this task. Test the approved production integration with a controlled payment and verify fulfilment/refund handling before promoting the funnel.

Official references: [Subscriptions integration](https://razorpay.com/docs/payments/subscriptions/integration-guide/), [webhook validation/idempotency/order](https://razorpay.com/docs/webhooks/validate-test/), [subscription creation](https://razorpay.com/docs/api/payments/subscriptions/create-subscription/), [subscription webhook events](https://razorpay.com/docs/webhooks/subscriptions/), [invoice entity](https://razorpay.com/docs/api/payments/invoices/entity/).
