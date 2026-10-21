-- =============================================================================
-- Migration: 20261021130000_session_bookings
-- Description: One row per Cal.com booking, written by the Cal.com webhook
--              (apps/web/app/api/webhooks/calcom) on BOOKING_CREATED,
--              BOOKING_RESCHEDULED and BOOKING_CANCELLED. The member portal
--              page /portal/appointments reads a member's own rows to list
--              upcoming and past appointments and to work out how many paid
--              sessions are still to book. The Cal.com image on the review box
--              has no REST API, so the webhook is the only source.
--
--              Rows are never deleted or replaced, so retried and
--              out-of-order deliveries cannot undo each other. A reschedule
--              adds the new Cal.com uid with rescheduled_from_uid = the old
--              one; the old row stays as the record that it moved, and the
--              portal hides every row another row points at, so a moved
--              session counts once (apps/web/lib/portal/appointments.ts
--              liveBookings).
-- Created: 2026-10-21
-- Apply on: the self-hosted Supabase on aimate-db1 (Johan), BEFORE the web
--           deploy that writes it (the webhook logs an error without it and
--           still answers Cal.com 200).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- UP
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.session_bookings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Cal.com booking uid: the key every webhook event carries.
  booking_uid           TEXT NOT NULL CHECK (booking_uid <> ''),
  -- The uid this booking replaced when it came from a reschedule.
  rescheduled_from_uid  TEXT,
  -- Stored lower-case so the member lookup and the RLS check are one index probe.
  attendee_email        TEXT NOT NULL CHECK (attendee_email <> '' AND attendee_email = lower(attendee_email)),
  attendee_name         TEXT,
  -- Cal.com event type slug: session-30/45/60/90 for paid sessions,
  -- discovery-call etc. for the rest. Only session-* slugs use a credit.
  event_slug            TEXT,
  title                 TEXT,
  duration_minutes      INTEGER CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  start_time            TIMESTAMPTZ NOT NULL,
  end_time              TIMESTAMPTZ NOT NULL,
  status                TEXT NOT NULL DEFAULT 'booked'
                        CHECK (status IN ('booked', 'rescheduled', 'cancelled')),
  cal_booking_id        BIGINT,
  -- Video link or address from Cal.com, shown on the page when present.
  location              TEXT,
  -- The last webhook payload for this booking, for support. Server side only.
  raw_payload           JSONB NOT NULL DEFAULT '{}'::jsonb,
  cancelled_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT session_bookings_booking_uid_key UNIQUE (booking_uid),
  CONSTRAINT session_bookings_times_check CHECK (end_time >= start_time)
);

-- The portal reads one member's bookings by start time.
CREATE INDEX IF NOT EXISTS session_bookings_email_start_idx
  ON public.session_bookings (attendee_email, start_time DESC);
-- The webhook checks whether a uid was rescheduled away before it writes.
CREATE INDEX IF NOT EXISTS session_bookings_rescheduled_from_idx
  ON public.session_bookings (rescheduled_from_uid)
  WHERE rescheduled_from_uid IS NOT NULL;
-- A reschedule that names only the old Cal.com id finds the old uid by it.
CREATE INDEX IF NOT EXISTS session_bookings_cal_booking_id_idx
  ON public.session_bookings (cal_booking_id)
  WHERE cal_booking_id IS NOT NULL;

COMMENT ON TABLE public.session_bookings IS
  'Cal.com bookings, one row per Cal.com uid (a reschedule adds a row pointing at the old uid), written only by the Cal.com webhook with the service role. Members read their own rows (confirmed email = attendee_email) for /portal/appointments.';

ALTER TABLE public.session_bookings ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS session_bookings_updated_at ON public.session_bookings;
CREATE TRIGGER session_bookings_updated_at
  BEFORE UPDATE ON public.session_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- The signed-in member's CONFIRMED email, lower-case; NULL when not signed in
-- or not confirmed. The JWT email claim alone is not proof: an unconfirmed
-- signup could carry somebody else's address. Lives in a non-exposed schema,
-- reads only the caller's own auth.users row.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.confirmed_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT lower(u.email)
  FROM auth.users u
  WHERE u.id = (SELECT auth.uid())
    AND u.email_confirmed_at IS NOT NULL
$$;

REVOKE EXECUTE ON FUNCTION private.confirmed_email() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.confirmed_email() TO authenticated;

-- Members read their own bookings. No insert/update/delete policy for anon or
-- authenticated: deny by default; the webhook writes with the service role.
DROP POLICY IF EXISTS session_bookings_select_own ON public.session_bookings;
CREATE POLICY session_bookings_select_own
  ON public.session_bookings
  FOR SELECT
  TO authenticated
  USING (attendee_email = (SELECT private.confirmed_email()));

-- raw_payload stays server side: members get every column but that one.
REVOKE ALL ON public.session_bookings FROM anon, authenticated;
GRANT SELECT (
  id, booking_uid, rescheduled_from_uid, attendee_email, attendee_name,
  event_slug, title, duration_minutes, start_time, end_time, status,
  cal_booking_id, location, cancelled_at, created_at, updated_at
) ON public.session_bookings TO authenticated;

-- PostgREST on the self-hosted stack does not reload on DDL: without this
-- reads work (they go straight to SQL) but every insert answers 404 {}
-- because the table is not in the schema cache (found 21 Oct on the I-13 walk).
NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- DOWN
-- ---------------------------------------------------------------------------
-- DROP POLICY IF EXISTS session_bookings_select_own ON public.session_bookings;
-- DROP FUNCTION IF EXISTS private.confirmed_email();
-- DROP TRIGGER IF EXISTS session_bookings_updated_at ON public.session_bookings;
-- DROP INDEX IF EXISTS session_bookings_cal_booking_id_idx;
-- DROP INDEX IF EXISTS session_bookings_rescheduled_from_idx;
-- DROP INDEX IF EXISTS session_bookings_email_start_idx;
-- DROP TABLE IF EXISTS public.session_bookings;
-- (The private schema is left in place; drop it only if nothing else uses it.)
