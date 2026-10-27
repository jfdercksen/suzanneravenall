-- =============================================================================
-- Migration: 20261026090000_session_rules
-- Description: Suzanne's session rules (her mail 24 Oct, DECISIONS.md D024).
--
--              1. No-show: staff mark the client as a no-show in Cal.com
--                 (Bookings, past booking, attendee, Mark as no-show). The
--                 webhook (BOOKING_NO_SHOW_UPDATED) sets no_show_at. The
--                 booking keeps its credit (it already held one); the portal
--                 shows "No-show". Unmarking in Cal.com clears it.
--              2. Late change: a client who cancels or moves a session with
--                 less than 48 working hours to go loses it. The webhook sets
--                 late_change_at and late_change_kind on the booking that was
--                 cancelled or moved away; that row keeps using a credit
--                 (lib/portal/session-credits.ts usesCredit). Staff get an
--                 alert with a link to /staff/booking/<staff_token>, where one
--                 click gives the session back (credit_restored_at).
--              The rule runs only with AUTOMATION_SESSION_NOTICE=code (web env).
--              staff_token is a secret (the link in the staff alert): members
--              never get it, it is not in the member column grant below.
-- Created: 2026-10-26
-- Apply on: the self-hosted Supabase on aimate-db1 (Johan), BEFORE the web
--           deploy: the portal and the webhook read the new columns, and
--           without them /portal/appointments says the bookings could not be
--           loaded.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- UP
-- ---------------------------------------------------------------------------

ALTER TABLE public.session_bookings ADD COLUMN IF NOT EXISTS no_show_at TIMESTAMPTZ;
ALTER TABLE public.session_bookings ADD COLUMN IF NOT EXISTS late_change_at TIMESTAMPTZ;
ALTER TABLE public.session_bookings ADD COLUMN IF NOT EXISTS late_change_kind TEXT;
-- Cal.com named a staff address as the changer. The client can type that
-- address in the link, so such a change is given back at once and staff
-- confirm it (credit_restored_at set with late_change_at).
ALTER TABLE public.session_bookings ADD COLUMN IF NOT EXISTS late_change_by_staff BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.session_bookings ADD COLUMN IF NOT EXISTS credit_restored_at TIMESTAMPTZ;
ALTER TABLE public.session_bookings ADD COLUMN IF NOT EXISTS staff_token TEXT;

ALTER TABLE public.session_bookings DROP CONSTRAINT IF EXISTS session_bookings_late_change_kind_check;
ALTER TABLE public.session_bookings
  ADD CONSTRAINT session_bookings_late_change_kind_check
  CHECK (late_change_kind IS NULL OR late_change_kind IN ('cancelled', 'rescheduled'));

ALTER TABLE public.session_bookings DROP CONSTRAINT IF EXISTS session_bookings_staff_token_check;
ALTER TABLE public.session_bookings
  ADD CONSTRAINT session_bookings_staff_token_check
  CHECK (staff_token IS NULL OR char_length(staff_token) >= 32);

-- The staff page finds the booking by its token.
CREATE UNIQUE INDEX IF NOT EXISTS session_bookings_staff_token_key
  ON public.session_bookings (staff_token)
  WHERE staff_token IS NOT NULL;

-- Members see what happened to their booking; staff_token stays server side.
GRANT SELECT (no_show_at, late_change_at, late_change_kind, late_change_by_staff, credit_restored_at)
  ON public.session_bookings TO authenticated;

-- PostgREST on the self-hosted stack does not reload on DDL (see
-- 20261021130000_session_bookings.sql).
NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- DOWN
-- ---------------------------------------------------------------------------
-- (Late-change and no-show history is lost: those sessions give their credit back.)
-- REVOKE SELECT (no_show_at, late_change_at, late_change_kind, late_change_by_staff, credit_restored_at)
--   ON public.session_bookings FROM authenticated;
-- DROP INDEX IF EXISTS session_bookings_staff_token_key;
-- ALTER TABLE public.session_bookings DROP CONSTRAINT IF EXISTS session_bookings_staff_token_check;
-- ALTER TABLE public.session_bookings DROP CONSTRAINT IF EXISTS session_bookings_late_change_kind_check;
-- ALTER TABLE public.session_bookings DROP COLUMN IF EXISTS staff_token;
-- ALTER TABLE public.session_bookings DROP COLUMN IF EXISTS credit_restored_at;
-- ALTER TABLE public.session_bookings DROP COLUMN IF EXISTS late_change_by_staff;
-- ALTER TABLE public.session_bookings DROP COLUMN IF EXISTS late_change_kind;
-- ALTER TABLE public.session_bookings DROP COLUMN IF EXISTS late_change_at;
-- ALTER TABLE public.session_bookings DROP COLUMN IF EXISTS no_show_at;
-- NOTIFY pgrst, 'reload schema';
