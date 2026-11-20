-- =============================================================================
-- Migration: 20261120090000_membership_levels
-- Description: Memberships go on the 29-level model (KI128, Johan 20 Nov 2026).
--   1. membership_tiers gets one row per paid level, slug = the SKU in lower
--      case (s0212 ... s0239), so a member_subscriptions row points at the
--      level the member bought and the portal shows its real name. The old
--      free / silver / gold / practitioner rows stay (the free row is every
--      member's base row; silver/gold/practitioner still gate resources until
--      Johan decides what each level unlocks).
--   2. novice_applications: a paid Novice order waits here until the team
--      approves the member's documents (Suzanne, 19 Nov). Files live in the
--      private Storage bucket "novice-applications" (created by the web app on
--      first upload), path <application id>/<file>.
--   3. novice_application_events: append-only record of every upload, send,
--      staff view and decision (POPIA: who looked at whose documents).
-- Created: 2026-11-20
-- Apply on: the self-hosted Supabase on aimate-db1 (Johan), BEFORE the medusa
--           and web deploy that use it. NOTIFY pgrst runs at the end.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- UP
-- ---------------------------------------------------------------------------

INSERT INTO public.membership_tiers (name, slug, description, price_monthly, price_annual, features, is_active)
SELECT v.name, v.slug, v.description, NULL, v.price_annual, '[]'::jsonb, true
FROM (VALUES
  ('Lifestyle Membership', 's0212', 'general / lifestyle / standard, access level 2', 350.00),
  ('Akashic Student Membership', 's0213', 'akashic / student / standard, access level 3', 525.00),
  ('Akashic Novice Practitioner - Basic Membership', 's0214', 'akashic / novice / basic, access level 4', 875.00),
  ('Akashic Novice Practitioner - Premier Membership', 's0215', 'akashic / novice / premier, access level 4', 1225.00),
  ('Akashic Practitioner (Prdip) - Basic Membership', 's0216', 'akashic / practitioner / basic, access level 5', 1400.00),
  ('Akashic Practitioner (Prdip) - Premier Membership', 's0217', 'akashic / practitioner / premier, access level 5', 1750.00),
  ('Akashic Certified Practitioner (CertPrdip) - Basic Membership', 's0218', 'akashic / certified / basic, access level 6', 1750.00),
  ('Akashic Certified Practitioner (CertPrdip) - Premier Membership', 's0219', 'akashic / certified / premier, access level 6', 2100.00),
  ('Akashic Certified Advanced Practitioner (CertAdvPrdip) - Basic Membership', 's0220', 'akashic / advanced / basic, access level 7', 1750.00),
  ('Akashic Certified Advanced Practitioner (CertAdvPrdip) - Premier Membership', 's0221', 'akashic / advanced / premier, access level 7', 2100.00),
  ('Akashic Mentor (MentorPrdip) - Premier Membership', 's0222', 'akashic / mentor / premier, access level 8', 1750.00),
  ('Akashic Master Practitioner (MasterPrdip) - Premier Membership', 's0223', 'akashic / master / premier, access level 9', 2625.00),
  ('Akashic Instructor (Inst) - Premier Membership', 's0224', 'akashic / instructor / premier, access level 9', 2625.00),
  ('Akashic Certified Master Instructor (CertMasterInst) - Premier Membership', 's0225', 'akashic / master-instructor / premier, access level 10', 2625.00),
  ('Energy Alignment & Optimisation Student Membership', 's0226', 'energy-clearing / student / standard, access level 3', 525.00),
  ('Energy Alignment & Optimisation Novice Practitioner - Basic Membership', 's0227', 'energy-clearing / novice / basic, access level 4', 875.00),
  ('Energy Alignment & Optimisation Novice Practitioner - Premier Membership', 's0228', 'energy-clearing / novice / premier, access level 4', 1225.00),
  ('Energy Alignment & Optimisation Practitioner (Prdip) - Basic Membership', 's0229', 'energy-clearing / practitioner / basic, access level 5', 1400.00),
  ('Energy Alignment & Optimisation Practitioner (Prdip) - Premier Membership', 's0230', 'energy-clearing / practitioner / premier, access level 5', 1750.00),
  ('Energy Alignment & Optimisation Certified Practitioner (CertPrdip) - Basic Membership', 's0231', 'energy-clearing / certified / basic, access level 6', 1750.00),
  ('Energy Alignment & Optimisation Certified Practitioner (CertPrdip) - Premier Membership', 's0232', 'energy-clearing / certified / premier, access level 6', 2100.00),
  ('Energy Alignment & Optimisation Certified Advanced Practitioner (CertAdvPrdip) - Basic Membership', 's0233', 'energy-clearing / advanced / basic, access level 7', 1750.00),
  ('Energy Alignment & Optimisation Certified Advanced Practitioner (CertAdvPrdip) - Premier Membership', 's0234', 'energy-clearing / advanced / premier, access level 7', 2100.00),
  ('Energy Alignment & Optimisation Mentor (MentorPrdip) - Premier Membership', 's0235', 'energy-clearing / mentor / premier, access level 8', 1750.00),
  ('Energy Alignment & Optimisation Master Practitioner (MasterPrdip) - Premier Membership', 's0236', 'energy-clearing / master / premier, access level 9', 2625.00),
  ('Energy Alignment & Optimisation Certified Master Practitioner (CertMasterPrdip) - Premier Membership', 's0237', 'energy-clearing / master / premier, access level 9', 2625.00),
  ('Energy Alignment & Optimisation Instructor (Inst) - Premier Membership', 's0238', 'energy-clearing / instructor / premier, access level 9', 2625.00),
  ('Energy Alignment & Optimisation Certified Master Instructor (CertMasterInst) - Premier Membership', 's0239', 'energy-clearing / master-instructor / premier, access level 10', 2625.00)
) AS v(name, slug, description, price_annual)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.novice_applications (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Null when the buyer had no account at checkout; claimed on first portal visit by confirmed email.
  user_id            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email              TEXT NOT NULL CHECK (email <> ''),
  first_name         TEXT,
  sku                TEXT NOT NULL CHECK (sku IN ('S0214', 'S0215', 'S0227', 'S0228')),
  medusa_order_id    TEXT NOT NULL UNIQUE CHECK (medusa_order_id <> ''),
  status             TEXT NOT NULL DEFAULT 'awaiting_documents'
                     CHECK (status IN ('awaiting_documents', 'submitted', 'changes_requested', 'approved')),
  -- [{ "path": "<id>/<name>", "name": "...", "size": 123, "type": "application/pdf", "uploaded_at": "..." }]
  files              JSONB NOT NULL DEFAULT '[]'::jsonb,
  submitted_at       TIMESTAMPTZ,
  reviewed_at        TIMESTAMPTZ,
  reviewer_email     TEXT,
  reviewer_note      TEXT,
  approved_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at         TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS novice_applications_user_idx ON public.novice_applications (user_id);
CREATE INDEX IF NOT EXISTS novice_applications_email_idx ON public.novice_applications (lower(email));
CREATE INDEX IF NOT EXISTS novice_applications_status_idx ON public.novice_applications (status, submitted_at);

DROP TRIGGER IF EXISTS novice_applications_updated_at ON public.novice_applications;
CREATE TRIGGER novice_applications_updated_at
  BEFORE UPDATE ON public.novice_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.novice_applications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.novice_applications FROM anon;

-- A member may read their own applications. Every write goes through the web
-- app's server with the service role (upload, send, staff decision).
DROP POLICY IF EXISTS "Members read their own Novice applications" ON public.novice_applications;
CREATE POLICY "Members read their own Novice applications"
  ON public.novice_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.novice_application_events (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id   UUID NOT NULL REFERENCES public.novice_applications(id) ON DELETE RESTRICT,
  -- member: the applicant (Supabase user id); staff: the Payload CMS account.
  actor_type       TEXT NOT NULL CHECK (actor_type IN ('member', 'staff', 'system')),
  actor_id         TEXT NOT NULL CHECK (actor_id <> ''),
  actor_email      TEXT,
  action           TEXT NOT NULL CHECK (action IN ('created', 'uploaded', 'submitted', 'viewed', 'approved', 'changes_requested')),
  detail           TEXT,
  created_at       TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS novice_application_events_app_idx
  ON public.novice_application_events (application_id, created_at DESC);

ALTER TABLE public.novice_application_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.novice_application_events FROM anon, authenticated;
-- Deliberately NO policies: service role only.

CREATE OR REPLACE FUNCTION public.novice_application_events_append_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'novice_application_events is append-only';
END;
$$;

DROP TRIGGER IF EXISTS novice_application_events_append_only ON public.novice_application_events;
CREATE TRIGGER novice_application_events_append_only
  BEFORE UPDATE OR DELETE ON public.novice_application_events
  FOR EACH ROW EXECUTE FUNCTION public.novice_application_events_append_only();

DROP TRIGGER IF EXISTS novice_application_events_no_truncate ON public.novice_application_events;
CREATE TRIGGER novice_application_events_no_truncate
  BEFORE TRUNCATE ON public.novice_application_events
  FOR EACH STATEMENT EXECUTE FUNCTION public.novice_application_events_append_only();

NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- DOWN
-- ---------------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS novice_application_events_no_truncate ON public.novice_application_events;
-- DROP TRIGGER IF EXISTS novice_application_events_append_only ON public.novice_application_events;
-- DROP FUNCTION IF EXISTS public.novice_application_events_append_only();
-- DROP TABLE IF EXISTS public.novice_application_events;
-- DROP TABLE IF EXISTS public.novice_applications;
-- DELETE FROM public.membership_tiers WHERE slug ~ '^s02(1[2-9]|2[0-9]|3[0-9])$'
--   AND NOT EXISTS (SELECT 1 FROM public.member_subscriptions s WHERE s.tier_id = membership_tiers.id);
-- NOTIFY pgrst, 'reload schema';
