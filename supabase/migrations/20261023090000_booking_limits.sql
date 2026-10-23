-- =============================================================================
-- Migration: 20261023090000_booking_limits
-- Description: Booking limits per session package (J-07) and the portal
--              invite in the order mail (H-13). DECISIONS.md D022.
--
--              1. public.booking_tokens: one row per (order, session service).
--                 The order mail and the confirmation page link to
--                 /book/<token> instead of the reusable Cal.com page. The
--                 gate there counts the buyer's sessions left (Medusa orders
--                 minus session_bookings, the same sums as /portal/appointments)
--                 and only then sends them on to the Cal.com event, with the
--                 token as booking metadata. Service role only: RLS on, no
--                 policies, like intake_submissions.
--              2. session_bookings.status gains 'over_limit': a booking that
--                 reached Cal.com past the gate (the public event page) with
--                 no session left. It uses no credit; the client is mailed and
--                 staff are asked to cancel it in Cal.com (the Cal.com image
--                 has no API to cancel it from code).
--              3. public.auth_email_exists(email): the order mail links to
--                 /portal/login when the buyer already has a portal account,
--                 else to /portal/signup. Service role only.
-- Created: 2026-10-23
-- Apply on: the self-hosted Supabase on aimate-db1 (Johan), BEFORE the web
--           deploy. Without it the order mail falls back to the direct
--           Cal.com link and the signup invite (logged), so nothing breaks.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- UP
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.booking_tokens (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 32 random bytes, base64url: the secret in /book/<token>.
  token             TEXT NOT NULL CHECK (char_length(token) >= 32),
  -- Medusa order id (order_...). Null when the confirmation page issued the
  -- row before the order mail did; the mail fills it in.
  order_id          TEXT,
  -- Medusa display id ("Order #431"); both issuers know it, so it is the key.
  order_display_id  INTEGER NOT NULL CHECK (order_display_id > 0),
  customer_email    TEXT NOT NULL CHECK (customer_email <> '' AND customer_email = lower(customer_email)),
  customer_name     TEXT,
  -- "<product title>|<minutes>": one pool of the credit sums.
  service_key       TEXT NOT NULL CHECK (service_key <> ''),
  service_name      TEXT NOT NULL,
  product_handle    TEXT,
  variant_title     TEXT,
  duration_minutes  INTEGER NOT NULL CHECK (duration_minutes IN (30, 45, 60, 90)),
  -- Sessions this order line bought ("Package of 04" x1 = 4). The gate uses
  -- the live Medusa sums; this is the fallback when Medusa cannot be read.
  credits           INTEGER NOT NULL CHECK (credits > 0),
  last_used_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT booking_tokens_token_key UNIQUE (token),
  CONSTRAINT booking_tokens_order_service_key UNIQUE (order_display_id, service_key)
);

-- The portal finds a member's links by email.
CREATE INDEX IF NOT EXISTS booking_tokens_email_idx ON public.booking_tokens (customer_email);

COMMENT ON TABLE public.booking_tokens IS
  'Per-order booking links (/book/<token>) for private-session purchases. Service role only (no RLS policies).';

ALTER TABLE public.booking_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.booking_tokens FROM anon, authenticated;

DROP TRIGGER IF EXISTS booking_tokens_updated_at ON public.booking_tokens;
CREATE TRIGGER booking_tokens_updated_at
  BEFORE UPDATE ON public.booking_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- over_limit: past the client's paid sessions; uses no credit.
ALTER TABLE public.session_bookings DROP CONSTRAINT IF EXISTS session_bookings_status_check;
ALTER TABLE public.session_bookings
  ADD CONSTRAINT session_bookings_status_check
  CHECK (status IN ('booked', 'rescheduled', 'cancelled', 'over_limit'));
ALTER TABLE public.session_bookings ADD COLUMN IF NOT EXISTS over_limit_at TIMESTAMPTZ;
GRANT SELECT (over_limit_at) ON public.session_bookings TO authenticated;

-- True when a portal (auth) account exists for this address. Exact match,
-- case-insensitive. Service role only: anon must not probe for accounts.
CREATE OR REPLACE FUNCTION public.auth_email_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE lower(u.email) = lower(trim(p_email))
      AND u.deleted_at IS NULL
  )
$$;

REVOKE EXECUTE ON FUNCTION public.auth_email_exists(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_email_exists(TEXT) TO service_role;

-- PostgREST on the self-hosted stack does not reload on DDL (see
-- 20261021130000_session_bookings.sql).
NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- DOWN
-- ---------------------------------------------------------------------------
-- DROP FUNCTION IF EXISTS public.auth_email_exists(TEXT);
-- (over_limit rows become cancelled: the over-limit history is lost.)
-- UPDATE public.session_bookings SET status = 'cancelled' WHERE status = 'over_limit';
-- ALTER TABLE public.session_bookings DROP CONSTRAINT IF EXISTS session_bookings_status_check;
-- ALTER TABLE public.session_bookings ADD CONSTRAINT session_bookings_status_check
--   CHECK (status IN ('booked', 'rescheduled', 'cancelled'));
-- ALTER TABLE public.session_bookings DROP COLUMN IF EXISTS over_limit_at;
-- DROP TRIGGER IF EXISTS booking_tokens_updated_at ON public.booking_tokens;
-- DROP TABLE IF EXISTS public.booking_tokens;
-- NOTIFY pgrst, 'reload schema';
