-- =============================================================================
-- Migration: 20261020120000_cart_reminder_sends
-- Description: Sent-log for the abandoned-cart reminder mails. One row per
--              (cart, template) that /api/email/cart-abandonment has sent (or
--              is sending). The unique key is claimed BEFORE the mail goes to
--              Brevo, so the old n8n chains and the new Medusa job (n8n
--              migration step 4) can never both send the same reminder, and a
--              retried request never sends twice. A failed send removes its
--              claim so a retry can send.
-- Created: 2026-10-20
-- Apply on: the self-hosted Supabase on aimate-db1 (Johan), BEFORE the web
--           deploy that reads it (the route answers 503 without the table).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- UP
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cart_reminder_sends (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id     TEXT NOT NULL CHECK (cart_id <> ''),
  template    SMALLINT NOT NULL CHECK (template BETWEEN 1 AND 3),
  -- Brevo message id once the send succeeded; NULL while the claim is open.
  email_id    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT cart_reminder_sends_cart_template_key UNIQUE (cart_id, template)
);

COMMENT ON TABLE public.cart_reminder_sends IS
  'Abandoned-cart reminder sent-log: one row per (cart_id, template), claimed by /api/email/cart-abandonment before it sends (apps/web/lib/email/cart-reminder-log.ts). Holds no email address. Service-role only. Never add policies for anon/authenticated.';

ALTER TABLE public.cart_reminder_sends ENABLE ROW LEVEL SECURITY;

-- Deliberately NO policies for anon/authenticated: deny by default. All access
-- is via the service-role client from the server route.

DROP TRIGGER IF EXISTS cart_reminder_sends_updated_at ON public.cart_reminder_sends;
CREATE TRIGGER cart_reminder_sends_updated_at
  BEFORE UPDATE ON public.cart_reminder_sends
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- DOWN
-- ---------------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS cart_reminder_sends_updated_at ON public.cart_reminder_sends;
-- DROP TABLE IF EXISTS public.cart_reminder_sends;
