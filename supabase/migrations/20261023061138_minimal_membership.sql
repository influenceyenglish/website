-- REVIEW ONLY: not applied. Target Supabase project: wfjqlubdrnqdhfnifgwd.
-- Fresh-schema baseline; do NOT run db/001_subscriptions.sql before this file.
-- Existing payment code still requires refactoring before using these tables.
-- updated_at and derived statuses are maintained by application transactions.
BEGIN;

CREATE TABLE public.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL CHECK (mode IN ('test', 'live')),
  full_name text NOT NULL CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 80),
  email text NOT NULL CHECK (email = lower(btrim(email)) AND char_length(email) BETWEEN 3 AND 254),
  phone text NOT NULL CHECK (phone ~ '^\+[1-9][0-9]{9,14}$'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT members_mode_email_key UNIQUE (mode, email),
  CONSTRAINT members_mode_id_key UNIQUE (mode, id)
);

CREATE INDEX members_status_created_idx ON public.members (mode, status, created_at DESC);

CREATE TABLE public.subscriptions (
  -- Supplied by the application: the existing checkout requestId.
  id uuid PRIMARY KEY,
  mode text NOT NULL CHECK (mode IN ('test', 'live')),
  member_id uuid NOT NULL,
  session_hash text NOT NULL CHECK (session_hash ~ '^[a-f0-9]{64}$'),
  plan text NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  expected_amount integer NOT NULL CHECK (expected_amount > 0),
  currency text NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  razorpay_plan_id text NOT NULL CHECK (razorpay_plan_id ~ '^plan_[A-Za-z0-9]+$'),
  razorpay_subscription_id text CHECK (razorpay_subscription_id ~ '^sub_[A-Za-z0-9]+$'),
  checkout_state text NOT NULL DEFAULT 'creating' CHECK (checkout_state IN ('creating', 'ready', 'uncertain')),
  provider_status text CHECK (provider_status IN ('created', 'authenticated', 'active', 'pending', 'halted', 'cancelled', 'completed', 'expired', 'paused', 'resumed')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'partially_refunded', 'refunded')),
  last_payment_id text CHECK (last_payment_id ~ '^pay_[A-Za-z0-9]+$'),
  paid_until timestamptz,
  last_provider_event_at timestamptz,
  policy_version text NOT NULL CHECK (btrim(policy_version) <> ''),
  consent_at timestamptz NOT NULL DEFAULT now(),
  failure_email_state text NOT NULL DEFAULT 'not_required' CHECK (failure_email_state IN ('not_required', 'pending', 'sending', 'sent', 'failed')),
  failure_email_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_mode_id_key UNIQUE (mode, id),
  CONSTRAINT subscriptions_provider_key UNIQUE (mode, razorpay_subscription_id),
  CONSTRAINT subscriptions_member_fkey FOREIGN KEY (mode, member_id)
    REFERENCES public.members (mode, id) ON DELETE RESTRICT,
  CONSTRAINT subscriptions_ready_provider_check CHECK (checkout_state <> 'ready' OR razorpay_subscription_id IS NOT NULL),
  CONSTRAINT subscriptions_email_sent_check CHECK ((failure_email_state = 'sent') = (failure_email_sent_at IS NOT NULL))
);

CREATE INDEX subscriptions_member_created_idx ON public.subscriptions (mode, member_id, created_at DESC);
CREATE INDEX subscriptions_session_created_idx ON public.subscriptions (mode, session_hash, created_at DESC);
CREATE INDEX subscriptions_pending_followup_idx ON public.subscriptions (mode, created_at)
  WHERE failure_email_state = 'pending';

CREATE TABLE public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL CHECK (mode IN ('test', 'live')),
  event_id text NOT NULL CHECK (event_id ~ '^[-A-Za-z0-9_:.]{1,200}$'),
  event_type text NOT NULL CHECK (char_length(event_type) BETWEEN 1 AND 100),
  body_hash text NOT NULL CHECK (body_hash ~ '^[a-f0-9]{64}$'),
  subscription_id uuid,
  razorpay_subscription_id text CHECK (razorpay_subscription_id ~ '^sub_[A-Za-z0-9]+$'),
  payment_id text CHECK (payment_id ~ '^pay_[A-Za-z0-9]+$'),
  invoice_id text CHECK (invoice_id ~ '^inv_[A-Za-z0-9]+$'),
  payment_status text CHECK (payment_status IN ('authorized', 'captured', 'failed', 'partially_refunded', 'refunded')),
  amount integer CHECK (amount >= 0),
  amount_refunded integer CHECK (amount_refunded >= 0),
  currency text CHECK (currency = 'INR'),
  paid_until timestamptz,
  provider_status text CHECK (provider_status IN ('created', 'authenticated', 'active', 'pending', 'halted', 'cancelled', 'completed', 'expired', 'paused', 'resumed')),
  event_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processing_status text NOT NULL DEFAULT 'received' CHECK (processing_status IN ('received', 'processed', 'ignored', 'failed')),
  processing_attempts integer NOT NULL DEFAULT 0 CHECK (processing_attempts >= 0),
  processed_at timestamptz,
  last_error_code text CHECK (char_length(last_error_code) <= 100),
  CONSTRAINT webhook_events_mode_event_key UNIQUE (mode, event_id),
  CONSTRAINT webhook_events_subscription_fkey FOREIGN KEY (mode, subscription_id)
    REFERENCES public.subscriptions (mode, id) ON DELETE RESTRICT,
  CONSTRAINT webhook_events_refund_check CHECK (amount_refunded IS NULL OR amount IS NULL OR amount_refunded <= amount),
  CONSTRAINT webhook_events_processed_check CHECK ((processing_status IN ('processed', 'ignored')) = (processed_at IS NOT NULL))
);

CREATE INDEX webhook_events_subscription_time_idx ON public.webhook_events (mode, subscription_id, event_at);
CREATE INDEX webhook_events_payment_idx ON public.webhook_events (mode, payment_id);
CREATE INDEX webhook_events_retry_idx ON public.webhook_events (received_at)
  WHERE processing_status IN ('received', 'failed');

-- Server-only payment data. No browser policies or auth changes are introduced.
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.members, public.subscriptions, public.webhook_events FROM PUBLIC, anon, authenticated;
-- The server-side postgres connection owns these tables; RLS does not block it.
-- No roles, grants to browser clients, functions, triggers or extra tables.

COMMIT;
