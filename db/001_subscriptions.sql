-- Apply once with: npm run db:migrate (DATABASE_URL must be set).
CREATE TABLE IF NOT EXISTS checkout_attempts (
 id uuid PRIMARY KEY,
 mode text NOT NULL CHECK (mode IN ('test','live')),
 session_hash text NOT NULL,
 plan text NOT NULL CHECK (plan IN ('monthly','yearly')),
 provider_plan_id text NOT NULL,
 expected_amount integer NOT NULL CHECK(expected_amount>0),
 customer_name text NOT NULL,
 customer_email text NOT NULL,
 customer_phone text,
 policy_version text NOT NULL,
 consent_at timestamptz NOT NULL DEFAULT now(),
 state text NOT NULL DEFAULT 'creating' CHECK (state IN ('creating','ready','uncertain')),
 subscription_id text,
 verified_payment_id text,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(mode,subscription_id)
);
CREATE INDEX IF NOT EXISTS checkout_session_idx ON checkout_attempts(session_hash,created_at);
CREATE TABLE IF NOT EXISTS subscription_states (
 mode text NOT NULL,
 subscription_id text NOT NULL,
 provider_status text NOT NULL,
 event_at bigint NOT NULL DEFAULT 0,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(mode,subscription_id),
 FOREIGN KEY(mode,subscription_id) REFERENCES checkout_attempts(mode,subscription_id)
);
CREATE TABLE IF NOT EXISTS payment_grants (
 mode text NOT NULL,
 payment_id text NOT NULL,
 subscription_id text NOT NULL,
 amount integer NOT NULL CHECK(amount>0),
 paid_until timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(mode,payment_id),
 FOREIGN KEY(mode,subscription_id) REFERENCES checkout_attempts(mode,subscription_id)
);
-- A tombstone survives late/out-of-order payment.captured or subscription.charged events.
CREATE TABLE IF NOT EXISTS payment_reversals (
 mode text NOT NULL,
 payment_id text NOT NULL,
 reason text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(mode,payment_id)
);
CREATE TABLE IF NOT EXISTS webhook_events (
 mode text NOT NULL,
 event_id text NOT NULL,
 body_hash text NOT NULL,
 event_type text NOT NULL,
 processed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(mode,event_id)
);
-- Manual fulfilment queue until an authenticated community adapter is connected.
CREATE TABLE IF NOT EXISTS membership_outbox (
 id bigserial PRIMARY KEY,
 mode text NOT NULL,
 subscription_id text NOT NULL,
 event_key text NOT NULL,
 kind text NOT NULL CHECK(kind IN ('payment_verified','payment_reversed','subscription_updated')),
 created_at timestamptz NOT NULL DEFAULT now(),
 delivered_at timestamptz,
 UNIQUE(mode,event_key)
);
CREATE TABLE IF NOT EXISTS payment_rate_limits (
 bucket text PRIMARY KEY,
 count integer NOT NULL,
 expires_at timestamptz NOT NULL
);
