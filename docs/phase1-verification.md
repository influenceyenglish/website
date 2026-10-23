# Phase 1 Test Mode verification

Verified on 23 October 2026 against the connected Supabase project wfjqlubdrnqdhfnifgwd and the configured Razorpay Test account. No live checkout was enabled.

- Actual Postgres connection and both configured INR plans passed preflight.
- Real browser checkout created pending member/subscription records before payment.
- Monthly INR 499 and yearly INR 4999 test payments completed through Razorpay's official demo bank page.
- Authentic provider subscription.activated/subscription.charged webhooks reached the local app through the explicitly approved temporary Cloudflare tunnel. The handler independently fetched payment/invoice details and committed paid subscription and active member status to Supabase.
- A real yearly test-bank failure delivered payment.failed and marked the attempt failed. The member remained active through their valid monthly payment.
- The failure webhook automatically sent one TEST-labelled Resend follow-up to billing@influenceyenglish.com. Resend reported delivered; the subscription stores failure_email_state=sent and a sent timestamp. Re-running emails:check sent zero additional messages.
- A separate authorized internal email configuration probe was also delivered.
- The yearly retry succeeded and its webhook updated the yearly subscription to paid without resetting or resending the failure follow-up.
- 29 isolated tests, TypeScript checks and the production build passed. The installed Next.js version emitted an existing security-upgrade advisory.
- Original Razorpay Test webhook URL/event configuration restored without changing its secret. Temporary tunnel stopped after verification. Local/test configuration remains active; RAZORPAY_ENABLE_LIVE=false.

## Remaining setup

The restored public endpoint https://influenceyenglish.com/api/razorpay/webhook returned HTTP 503 (checkout configuration incomplete). Local Phase 1 is verified, but unattended delivery without the temporary tunnel requires deploying/configuring this updated app at a stable HTTPS Test webhook endpoint.

Evidence snapshots and screenshots are in the ignored verification directory. Two real provider Test subscriptions and their related Test rows remain available for inspection. No new database tables or migrations were created.
