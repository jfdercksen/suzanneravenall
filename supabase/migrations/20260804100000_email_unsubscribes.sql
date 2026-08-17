-- =============================================================================
-- Migration: 20260804100000_email_unsubscribes
-- Description: Marketing-email suppression list (POPIA opt-out). One row per
--              email address that has unsubscribed via the signed link in a
--              marketing email footer (or RFC 8058 one-click header). Checked
--              before every marketing send: cart abandonment 1-3, membership
--              renewal reminder, membership expired. Transactional emails
--              (order confirmation, membership welcome, quiz invite) are not
--              suppressed.
-- Created: 2026-08-04
-- =============================================================================

-- ---------------------------------------------------------------------------
-- UP
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.email_unsubscribes (
  email       TEXT PRIMARY KEY CHECK (email = lower(email) AND email <> ''),
  source      TEXT NOT NULL DEFAULT 'link',
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.email_unsubscribes IS
  'Marketing-email suppression list (POPIA opt-out). Rows are written by /api/email/unsubscribe after verifying an HMAC-signed token (see apps/web/lib/email/unsubscribe.ts) and read by the marketing send routes via apps/web/lib/email/suppression.ts. Emails are stored lowercased; the primary key doubles as the lookup index. Access is intentionally service-role only. Never add INSERT/UPDATE/DELETE/SELECT policies for anon/authenticated roles, and never delete rows except on a verified re-opt-in.';

ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;

-- Deliberately NO policies for anon/authenticated — deny by default. All
-- access is via the service-role client from server routes, same pattern as
-- quiz_subscribers.

-- ---------------------------------------------------------------------------
-- DOWN
-- ---------------------------------------------------------------------------
-- DROP TABLE IF EXISTS public.email_unsubscribes;
