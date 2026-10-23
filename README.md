# Influencey English

A Next.js App Router funnel for an English-speaking practice community. The existing cream, forest-green and yellow design, local fonts, CSS Modules and word/ticker animations are retained. Content and policies are managed separately from components.

## Offer and routes

- ₹499/month or ₹4,999/year, in INR. The yearly plan saves ₹989 versus twelve monthly payments: about 16.5% off.
- Corrective Feedback Loop (CFL): speak, receive feedback, correct and repeat.
- Audience: early-career adults, mainly men.
- `/`: hero, labelled student-proof placeholders, speaking problem, CFL, benefits, audience, Hashim/about, outcomes, testimonials, pricing, FAQ, compliance footer.
- `/privacy-policy`, `/terms`, `/refund-policy`, `/subscription-policy`, `/contact`.
- `/payment-success` and `/payment-cancelled`: noindex result/help pages. A URL never activates membership.
- `/api/razorpay/subscription` (legacy alias: `/api/razorpay/create-subscription`), `/api/razorpay/verify` (POST verification / GET status), `/api/razorpay/webhook`.

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

Tailwind CSS v4 utilities are available in any component alongside CSS Modules:

```tsx
<div className="flex gap-4 rounded-xl bg-white p-4 text-sm md:p-6">Content</div>
```

Preflight is intentionally disabled to preserve the existing global styles and
CSS Modules. Existing unlayered CSS takes precedence over normal Tailwind
utilities when they set the same property. For an intentional override, use the
v4 trailing `!` modifier, for example
`className={`${styles.card} p-4! md:p-6!`}`. Keep class names complete and literal
so Tailwind can detect them; avoid constructing names such as `p-${size}`.

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

`business.ts` contains the operator-confirmed individual merchant identity and community delivery details. Speaking/practice sessions are online, with timings shared after joining. Legal disclosures use the approved merchant name; public branding uses Influency English. Optional environment overrides are documented in the live payments guide.

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
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`      | Same public key ID as `RAZORPAY_KEY_ID`; mismatches are rejected           |
| `RAZORPAY_KEY_SECRET`              | Server-only API/checkout verification secret                               |
| `RAZORPAY_WEBHOOK_SECRET`          | Separate server-only webhook signing secret                                |
| `RAZORPAY_PREVIOUS_WEBHOOK_SECRET` | Optional previous secret during webhook rotation/retries                   |
| `RAZORPAY_PLAN_MONTHLY`            | Test Mode monthly plan ID                                                  |
| `RAZORPAY_PLAN_YEARLY`             | Test Mode yearly plan ID                                                   |
| `DATABASE_URL`                     | Durable Postgres connection string                                         |
| `RAZORPAY_ENABLE_LIVE`             | `false` until all go-live requirements are satisfied                       |

Do not prefix secrets with `NEXT_PUBLIC_`. API and webhook secrets are different. Do not log raw payment requests, secrets or full provider payloads.

The server uses the official `razorpay` SDK. Charge amounts and mandate limits live in `src/lib/payments/plans.ts`, which is server-only; public display text stays in `src/content/site.ts`. The canonical subscription endpoint and its legacy alias share validation and durable duplicate protection. The older `RAZORPAY_MONTHLY_PLAN_ID` and `RAZORPAY_YEARLY_PLAN_ID` names remain supported as fallbacks during migration.

### 2. Database

Use a durable Postgres database (for example, a Vercel Marketplace Postgres integration) with a pooled, TLS-enabled connection URL appropriate to your provider. Use separate databases/credentials for Test and Live. Configure a small pool and a region close to the app.

```sh
npm run payments:check
```

This loads `.env.local` and applies `db/001_subscriptions.sql`. If the environment already supplies `DATABASE_URL` without a local file, run `node scripts/migrate.mjs` instead. The database migration is intentionally not run during the build.

Only members, subscriptions and webhook_events are used. The approved baseline in supabase/migrations is already applied to the connected project. The legacy db migration is retired. Webhook facts retain captured periods and refund tombstones. There is no in-memory or local-file entitlement fallback. Restrict database access and back up records according to your confirmed retention policy.

### 3. Test Mode plans

In Razorpay Dashboard **Test Mode**, enable Subscriptions and create:

- Monthly plan: `period=monthly`, `interval=1`, `currency=INR`, `amount=49900` paise.
- Yearly plan: `period=yearly`, `interval=1`, `currency=INR`, `amount=499900` paise.

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

Confirm that the signed callback reaches `/verify`, the signed webhook is acknowledged, one event per provider event ID exists and paid status is correct, and `/payment-success` reports **Test payment verified**. Test Mode must never deliver real paid community access.

No real credentials are included in this repository. Automated tests use synthetic fixtures and a mocked browser checkout; they are not evidence of a completed transaction with your Razorpay account.

## Security and fulfilment model

- The checkout record pins its provider plan ID and expected amount so existing renewals survive future plan configuration changes.
- The server maps `monthly`/`yearly` to fixed environment plan IDs; the browser cannot supply a price, plan ID, cycle count or upfront fee.
- Checkout requires explicit policy/age/recurring-payment consent. A secure HTTP-only SameSite cookie binds verification to the initiating browser. Checkout request UUIDs prevent repeated creation within that session. Same-origin checks, input/body limits and a bounded per-instance Test Mode limiter protect public POST handlers.
- Checkout HMAC is `payment_id|server_stored_subscription_id`, compared in constant time. The browser’s subscription ID must also match the stored record.
- Full payment is independently fetched and checked for captured status, INR amount, refund state and a paid invoice tied to the stored subscription. Authorisation-only charges do not grant access.
- Invoice `billing_end` defines the paid period. A signed `subscription.charged` snapshot can supply its period if the invoice omits it. A current subscription’s later period is never used to extend an old payment.
- Webhooks are authenticated against the exact raw bytes before JSON parsing. `x-razorpay-event-id` and a payload hash provide durable deduplication. Event facts, subscription state and member summary writes commit atomically; errors roll back and return non-2xx for retry.
- Refund tombstones prevent a delayed charge from restoring refunded access. Older lifecycle events cannot overwrite later/terminal state. Cancellation does not erase an already paid period.
- Test/Live records are scoped separately. Redirect/query parameters never activate access. Status responses are bound to the browser session and expose no customer email or secret.

### Delivery is a real operational step

No onboarding outbox or sender is installed. WhatsApp, email, admin and authentication remain deferred. Live browser payment requests are blocked until shared rate limiting is configured. Test Mode never delivers real access.

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

See [the live payments setup guide](docs/live-payments.md) for the exact environment template, database migration, read-only preflight command and webhook instructions.

1. The operator-confirmed merchant identity and online delivery details are configured in `business.ts`. Optional business environment overrides are documented in the live setup guide; session timings can be shared after joining.
2. Obtain Razorpay account/Subscriptions approval. Complete the real Test Mode checklist with your own keys and plans.
3. Provision the production database, apply the schema, configure production secrets, create matching **Live** plan IDs and a **Live** webhook. Use your HTTPS production origin for `APP_URL` and `NEXT_PUBLIC_SITE_URL`.
4. Set `RAZORPAY_MODE=live` and `RAZORPAY_ENABLE_LIVE=true`. The server refuses live checkout if the business/delivery placeholders or confirmation gate remain.
5. Import the repo into Vercel using the Next.js preset and default output settings. No deployment has been performed by this task. Test the approved production integration with a controlled payment and verify fulfilment/refund handling before promoting the funnel.

Official references: [Subscriptions integration](https://razorpay.com/docs/payments/subscriptions/integration-guide/), [webhook validation/idempotency/order](https://razorpay.com/docs/webhooks/validate-test/), [subscription creation](https://razorpay.com/docs/api/payments/subscriptions/create-subscription/), [subscription webhook events](https://razorpay.com/docs/webhooks/subscriptions/), [invoice entity](https://razorpay.com/docs/api/payments/invoices/entity/).
