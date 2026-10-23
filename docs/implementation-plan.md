# Master specification and delivery phases

## Audit

The existing App Router project has reusable section components, CSS Modules, local fonts, motion primitives and strict TypeScript. Preserve this base and palette. Replace Kindred copy, fabricated proof, foreign founder video, USD price, and dead booking space. Add missing legal routes and secure subscription infrastructure.

## Phase 1 — Funnel and service transparency

- [x] Preserve existing design/motion; responsive, semantic, accessible funnel.
- [x] Twelve ordered sections: hero; clearly labelled student proof placeholders; speaking problem; CFL; membership benefits; audience; Hashim/about; outcomes; testimonials; INR monthly/yearly pricing; FAQ; compliance footer.
- [x] ₹499/month, ₹4,999/year, ₹989 annual saving/about 16.5% off. Early-career audience, mainly men; effective, emotionally intelligent, influential communication.
- [x] Seven benefits: public speaking, weekly masterminds, resources, speaker identity, live opportunities, corrective feedback, community support.
- [x] Typed central content and business/policy configuration; no invented student results or founder biography.
- [x] Routes: /, /privacy-policy, /terms, /refund-policy, /subscription-policy, /contact, /payment-success, /payment-cancelled.
- [x] Business/legal name placeholders; supplied address, phone and email; delivery, refund/cancellation timelines and renewal disclosure; footer policy links; SEO metadata.
- [x] Verify build, route rendering, responsive layout, pricing, keyboard FAQ, policy links and content integrity before Phase 2.

## Phase 2 — Test-first subscriptions and handover

- [x] Route Handlers: create-subscription, verify, webhook.
- [x] Server-only secrets; .env.example; monthly/yearly plan IDs; Test Mode default; live launch gate.
- [x] Checkout signature uses server-stored subscription ID; constant-time comparison.
- [x] Raw webhook body signature, durable transactional idempotency, retry-safe writes and out-of-order handling.
- [x] No membership activation from redirects, authorisation-only payments, wrong plan/amount/currency or failed/refunded payments.
- [x] Session-bound verification; loading/errors; mobile-first checkout; explicit recurring-payment consent.
- [x] Durable storage and fulfilment handoff; schema/migration and setup instructions.
- [x] Security tests for tampered signatures, replay/concurrency, rollback/retries, refunds, old events and redirect spoofing; browser checkout mocks; build/type/format checks.
- [x] README: setup, Test Mode plans/webhooks, environment, database, policies/business placeholders, delivery, cancellation/refund operations, safe go-live steps.

## Pending owner inputs

Legal/business name, delivery platform/session schedule, refund/cancellation operational approval, founder biography, consented student proof, Razorpay credentials and plan IDs, production database. Provisional policy values are explicit and editable; payment readiness is not an approval guarantee. No real credentials or external account changes are required for implementation.

Phase 1 verified: production build; 390/768/1440px browser checks; all eight requested routes; visible policy/contact links; INR price and CFL content; no Kindred/result claims; keyboard FAQ.

Phase 2 verified: 23 isolated security/SQL/Route Handler tests; production build and strict types; production browser checks for 390/768/1440px, all public routes, monthly/yearly checkout mocks, dismissal/load/verification errors and spoofed result URLs. Real Razorpay account Test Mode exercise, database provisioning and live fulfilment configuration remain operator setup steps; no real payment, account provisioning or deployment was performed.
