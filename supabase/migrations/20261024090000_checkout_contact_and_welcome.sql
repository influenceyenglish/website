-- Additive upgrade. Existing subscriptions and payment facts are preserved.
-- Historical records keep NULL snapshots; no old welcome emails are queued.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public.subscriptions
  ADD COLUMN checkout_name text CHECK (char_length(btrim(checkout_name)) BETWEEN 2 AND 80),
  ADD COLUMN checkout_email text CHECK (checkout_email = lower(btrim(checkout_email)) AND char_length(checkout_email) BETWEEN 3 AND 254),
  ADD COLUMN checkout_phone text CHECK (checkout_phone ~ '^\+[1-9][0-9]{9,14}$'),
  ADD COLUMN welcome_email_state text NOT NULL DEFAULT 'not_required'
    CHECK (welcome_email_state IN ('not_required','pending','sending','sent','failed')),
  ADD COLUMN welcome_email_sent_at timestamptz,
  ADD CONSTRAINT subscriptions_checkout_contact_complete CHECK (
    (checkout_name IS NULL AND checkout_email IS NULL AND checkout_phone IS NULL)
    OR (checkout_name IS NOT NULL AND checkout_email IS NOT NULL AND checkout_phone IS NOT NULL)
  ),
  ADD CONSTRAINT subscriptions_welcome_sent_check CHECK (
    (welcome_email_state = 'sent') = (welcome_email_sent_at IS NOT NULL)
  );

CREATE INDEX subscriptions_welcome_queue_idx ON public.subscriptions (mode, created_at)
  WHERE welcome_email_state IN ('pending','failed');

COMMIT;
