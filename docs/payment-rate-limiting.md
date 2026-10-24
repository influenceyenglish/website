# Payment rate limiting

`src/lib/payments/rate-limit.ts` uses `@upstash/redis` and `@upstash/ratelimit` sliding windows. The payment flow, database schema, subscription idempotency, and webhook processing are unchanged.

## Deployment setup

Create or select an Upstash Redis database and add these **server-only** variables to the intended Vercel project/environment:

```dotenv
KV_REST_API_URL=https://YOUR_REDIS_REST_ENDPOINT
KV_REST_API_TOKEN=YOUR_REDIS_REST_TOKEN
```

Use KV_REST_API_TOKEN with write access. KV_REST_API_READ_ONLY_TOKEN is never read or used as a fallback; read-only-only configuration fails closed. Never use a `NEXT_PUBLIC_` prefix. Redeploy after configuring them. Production and Preview both require Redis, even with Razorpay Test Mode. Separate databases/credentials are recommended for Production and Preview; keys also isolate Vercel environment and Razorpay mode. Do not change Razorpay mode merely to configure this limiter.

## Limits

Both `POST /api/razorpay/subscription` and the legacy `POST /api/razorpay/create-subscription` share the same handler and limits:

| Identifier                | Requests per 10 minutes |
| ------------------------- | ----------------------: |
| IP address                |                      20 |
| Checkout browser session  |                      10 |
| Normalized customer email |                       5 |
| Normalized customer phone |                       5 |

Each is an independent limit: changing browser sessions or email does not reset the IP budget, and changing IP/session does not reset the customer budget. Emails are normalized by the existing input schema. IPs, emails and normalized phone numbers are SHA-256 hashed before becoming Redis keys. The existing session hash is reused. IP detection retains the existing `x-forwarded-for` behavior; self-hosted deployments must use a trusted reverse proxy that overwrites this header. Missing IPs share the conservative `unknown` bucket.

Limits run after origin/body validation and before any subscription creation. Rejected requests create no subscription or member. A permitted request consumes each applicable budget, including retries; earlier budgets can be consumed when a later limit rejects the request.

Rate limiting is scoped to creation only. Verification POST and status GET retain origin/session/ownership validation where applicable and do not invoke Redis, so Redis outages cannot interrupt verification of an existing payment. `/api/razorpay/webhook` never invokes the limiter and continues processing independently of Redis availability.

## Failure behavior

- Exhausted budget: HTTP **429** using the existing payment JSON error response.
- Missing/partial credentials, malformed/non-HTTPS URL, Redis errors, or timeout: HTTP **503** with a generic message and no credential/provider error exposure.
- Upstash timeout defaults to allowing requests. The wrapper explicitly rejects `reason: timeout`, even when `success` is true.
- No Redis failure falls back to memory on Vercel, in `NODE_ENV=production`, or in Razorpay Live Mode.
- Local Razorpay Test Mode (`next dev`) may omit both Redis variables and use bounded in-memory counters. Partial credentials fail closed instead of silently falling back.

The SDK's ephemeral cache and analytics are disabled. Limiter clients are reused within a process, but deployed counters are maintained by Redis across instances and deployments in the same namespace.

## Verification

Run `npm run typecheck`, `npm test`, and `npm run build`. Tests cover namespace sharing through an injected shared backend, local window expiry, missing configuration, Redis transport failures, SDK timeout handling, and creation-route 429/503 responses before subscription creation. Tests do not provision or contact a real Redis database.

After adding credentials, verify against the deployed site in **Razorpay Test Mode**: make a normal checkout, then exceed one of the budgets and confirm HTTP 429. Check Redis keys without displaying credentials. In a separate test environment, remove/misconfigure Redis and verify creation returns HTTP 503 while valid signed webhooks still process. Restore Redis configuration and redeploy before further payment testing.

Sources: [Upstash features and timeout behavior](https://upstash.com/docs/redis/sdks/ratelimit-ts/features), [Upstash limit responses](https://upstash.com/docs/redis/sdks/ratelimit-ts/methods).
