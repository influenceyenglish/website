# Current status: live rate limiting implemented; deployment verification required

Payment creation requests now require functioning Upstash Redis on Vercel and in Live Mode. Missing credentials, Redis failures and timeouts block requests with HTTP 503. Passing the limiter alone does not establish overall live readiness. See [payment rate limiting](payment-rate-limiting.md) for setup and verification.

# Live Razorpay setup

The existing checkout supports Test and Live Mode with the same code. Set the following in `.env.local` for local use and in **Vercel → Project → Settings → Environment Variables → Production** for the live website. Never commit `.env.local` or paste secrets into chat.

```dotenv
RAZORPAY_MODE=live
RAZORPAY_ENABLE_LIVE=true
RAZORPAY_KEY_ID=rzp_live_REPLACE_WITH_YOUR_KEY_ID
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_REPLACE_WITH_THE_SAME_KEY_ID
RAZORPAY_KEY_SECRET=REPLACE_WITH_YOUR_LIVE_API_SECRET
RAZORPAY_PLAN_MONTHLY=plan_REPLACE_WITH_LIVE_MONTHLY_PLAN_ID
RAZORPAY_PLAN_YEARLY=plan_REPLACE_WITH_LIVE_YEARLY_PLAN_ID
RAZORPAY_WEBHOOK_SECRET=REPLACE_WITH_A_SEPARATE_RANDOM_WEBHOOK_SECRET
RESEND_API_KEY=re_REPLACE_WITH_YOUR_RESEND_KEY
RESEND_FROM="Influency English Billing <billing@influenceyenglish.com>"
KV_REST_API_URL=https://YOUR_REDIS_REST_ENDPOINT
KV_REST_API_TOKEN=REPLACE_WITH_YOUR_REDIS_REST_TOKEN
DATABASE_URL=REPLACE_WITH_YOUR_PRODUCTION_POSTGRES_CONNECTION_URL
APP_URL=https://YOUR_PRODUCTION_DOMAIN
NEXT_PUBLIC_SITE_URL=https://YOUR_PRODUCTION_DOMAIN
```

For localhost, use `http://localhost:3000` for **both** website URLs and open that exact hostname in the browser. A Live Mode checkout takes real money, including on localhost. Use a separate test database and test credentials for normal development. Hosted Live Mode requires HTTPS. The app blocks Live Mode in Vercel Preview/Development deployments; keep those environments on Test Mode.

The operator has confirmed the legal name **VALIYAKKATHODI MOHAMMED KOYA MOHAMED HASHIM THANGAL**, business type **Individual**, Razorpay brand **MOHAMED HASHIM**, and public brand **Influency English**. These are already configured in `src/content/business.ts`. Access is through the Influency English community, with live practice online and timings shared with members after joining. A fixed timetable is not required to open checkout.

Optional environment overrides are `BUSINESS_LEGAL_NAME`, `BUSINESS_DELIVERY_PLATFORM`, and `BUSINESS_DETAILS_CONFIRMED`. Leave them unset to use the confirmed defaults. Set `BUSINESS_DETAILS_CONFIRMED=false` only if the business details need review. Changes to public business details require rebuilding/redeploying. Razorpay may display its approved merchant brand independently of the website's Checkout name.

## Plans

Use plans created in **Live Mode**, with INR currency and interval `1`:

| Setting                 | Billing frequency | Total charge            |
| ----------------------- | ----------------- | ----------------------- |
| `RAZORPAY_PLAN_MONTHLY` | Monthly           | ₹499 (`49900` paise)    |
| `RAZORPAY_PLAN_YEARLY`  | Yearly            | ₹4,788 (`478800` paise) |

The website displays the yearly equivalent as ₹399/month. Supply `plan_…` IDs, not `sub_…` IDs or prices. The server fetches plans and rejects mismatched prices, currencies or billing intervals. The previously supplied plan IDs can be used if they belong to your Live account and pass this check.

## Database and preflight

Use a durable Postgres database. Supply its provider-issued connection URL, including the provider's TLS settings. For local setup:

```sh
npm run payments:check
npm run payments:check -- --live
npm run dev
```

The check only reads Razorpay plan data and checks database tables; it never creates subscriptions or charges money. The legacy migration command is disabled; review future SQL through the Supabase migration workflow. Migrate the production database before accepting payments; migrations are not automatically run by Vercel builds. A blank database URL blocks checkout.

## Webhook

In Razorpay **Live Mode**, configure the public HTTPS endpoint:

```text
https://YOUR_PRODUCTION_DOMAIN/api/razorpay/webhook
```

Set the same dedicated signing secret in Razorpay and `RAZORPAY_WEBHOOK_SECRET`. This is separate from your API key secret. Keep `RAZORPAY_PREVIOUS_WEBHOOK_SECRET` empty unless rotating a webhook secret.

Subscribe to the available events:

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

Razorpay cannot send webhooks directly to localhost. Use the deployed public endpoint for live delivery. Raw request signatures are verified before processing, and duplicate event/payment records are protected transactionally. A browser success callback is not final payment confirmation.

## Vercel and launch verification

1. Add the values above to **Production**. Keep API secrets, webhook secrets and database credentials private. Only the public key ID belongs in a `NEXT_PUBLIC_` payment variable.
2. Use the canonical domain users actually visit for both website URLs, including `www` if applicable. Redirect alternate domains to it.
3. Redeploy after changing environment variables. New environment values do not update existing deployments.
4. Check that checkout opens with the expected Live Mode plan and that a controlled real payment is independently verified on `/payment-success`.
5. Confirm successful webhook deliveries and the correct paid billing period in your database. Check pending/failure, cancellation, and refund handling before opening enrolment broadly.

The app records payment and lifecycle state in members, subscriptions and webhook_events. Live internal failure alerts go to billing@influenceyenglish.com through Resend after verified webhook processing, independently of membership/payment success. Verify the sender domain and configure RESEND_API_KEY and RESEND_FROM in Production. New verified live checkouts receive a welcome email with the WhatsApp community link, using RESEND_API_KEY, RESEND_FROM and NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL. Community admission remains subject to admin approval; the operator must review join requests and share session details. Cancellation/refunds also require operator action through Razorpay/support; closing Checkout does not cancel an existing subscription.

Sources: [Razorpay Subscriptions integration](https://razorpay.com/docs/payments/subscriptions/integration-guide/), [Razorpay webhook verification](https://razorpay.com/docs/webhooks/validate-test/), [Vercel environment variables](https://vercel.com/docs/environment-variables).
