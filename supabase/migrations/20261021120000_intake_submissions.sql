-- =============================================================================
-- Migration: 20261021120000_intake_submissions
-- Description: Client intake forms (H-12). One row per (order, service) for a
--              private-session purchase: the personal link token, the form it
--              was sent, the reminder state and, once the client sends it,
--              the answers. Written and read only by the web app's server
--              routes (apps/web/lib/intake/store.ts) with the service role.
-- Created: 2026-10-21
-- Apply on: the self-hosted Supabase on aimate-db1 (Johan), BEFORE the web
--           deploy that reads it (the routes answer 503 without the table).
-- POPIA: answers hold personal and health information. Service-role only,
--        never add policies for anon or authenticated.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- UP
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.intake_submissions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The secret in the client's link /intake/<token> (32 random bytes, base64url).
  token              TEXT NOT NULL CHECK (length(token) >= 32),
  order_id           TEXT NOT NULL CHECK (order_id <> ''),
  order_display_id   TEXT,
  customer_email     TEXT NOT NULL CHECK (customer_email <> ''),
  first_name         TEXT,
  last_name          TEXT,
  -- The product handle the form was chosen for; packages share their service's.
  service_key        TEXT NOT NULL CHECK (service_key <> ''),
  service_name       TEXT NOT NULL,
  -- Payload intake-forms document id and formKey at the time of the purchase.
  form_id            TEXT NOT NULL,
  form_key           TEXT,
  -- When the order was placed: the reminder schedule counts from here.
  purchased_at       TIMESTAMPTZ NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  -- The first mail with the link; NULL until Brevo accepted it (a retry resends).
  intake_sent_at     TIMESTAMPTZ,
  reminders_sent     SMALLINT NOT NULL DEFAULT 0 CHECK (reminders_sent BETWEEN 0 AND 6),
  next_reminder_at   TIMESTAMPTZ,
  last_reminder_at   TIMESTAMPTZ,
  expires_at         TIMESTAMPTZ NOT NULL,
  -- Set when the order was cancelled: no more reminders, the link closes.
  cancelled_at       TIMESTAMPTZ,
  answers            JSONB,
  completed_at       TIMESTAMPTZ,
  -- The completed form mailed to the team; NULL = still to send (the hourly
  -- reminder run retries it).
  team_notified_at   TIMESTAMPTZ,
  -- Failed mail sends for this row; at 5 the row is left alone and staff are alerted.
  send_failures      SMALLINT NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at         TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT intake_submissions_token_key UNIQUE (token),
  CONSTRAINT intake_submissions_order_service_key UNIQUE (order_id, service_key)
);

-- The hourly reminder run: pending rows that are due.
CREATE INDEX IF NOT EXISTS intake_submissions_due_idx
  ON public.intake_submissions (next_reminder_at)
  WHERE status = 'pending';

-- Cancelling an order closes its forms.
CREATE INDEX IF NOT EXISTS intake_submissions_order_idx
  ON public.intake_submissions (order_id);

-- Completed forms whose team mail has not gone yet.
CREATE INDEX IF NOT EXISTS intake_submissions_team_pending_idx
  ON public.intake_submissions (completed_at)
  WHERE status = 'completed' AND team_notified_at IS NULL;

COMMENT ON TABLE public.intake_submissions IS
  'Client intake forms (H-12): one row per (order_id, service_key), the /intake/<token> link, reminder state and the answers. Personal and health data. Service-role only. Never add policies for anon/authenticated.';

ALTER TABLE public.intake_submissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.intake_submissions FROM anon, authenticated;

-- Deliberately NO policies for anon/authenticated: deny by default. All access
-- is via the service-role client from the server routes.

DROP TRIGGER IF EXISTS intake_submissions_updated_at ON public.intake_submissions;
CREATE TRIGGER intake_submissions_updated_at
  BEFORE UPDATE ON public.intake_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- DOWN
-- ---------------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS intake_submissions_updated_at ON public.intake_submissions;
-- DROP TABLE IF EXISTS public.intake_submissions;
