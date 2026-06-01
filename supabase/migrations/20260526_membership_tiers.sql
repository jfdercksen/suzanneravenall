-- Migration: 20260526_membership_tiers
-- Adds real membership tier fields to member_subscriptions.
-- Supports the 29-tier Wild Apricot structure (Akashic + Energy Clearing tracks).
--
-- UP

ALTER TABLE member_subscriptions
  ADD COLUMN IF NOT EXISTS track          text          DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS sku            text,
  ADD COLUMN IF NOT EXISTS access_level   integer       DEFAULT 1,
  ADD COLUMN IF NOT EXISTS annual_renewal_date timestamptz;

-- Ensure access_level is bounded 1–10
ALTER TABLE member_subscriptions
  ADD CONSTRAINT member_subscriptions_access_level_range
    CHECK (access_level BETWEEN 1 AND 10);

-- Ensure track is one of the known values
ALTER TABLE member_subscriptions
  ADD CONSTRAINT member_subscriptions_track_values
    CHECK (track IN ('akashic', 'energy-clearing', 'both', 'general'));

-- Index for fast portal access checks
CREATE INDEX IF NOT EXISTS member_subscriptions_access_level_idx
  ON member_subscriptions (user_id, access_level, status);

-- Index for SKU lookups (e.g. "what tier does this member have?")
CREATE INDEX IF NOT EXISTS member_subscriptions_sku_idx
  ON member_subscriptions (sku);

-- ─── DOWN ─────────────────────────────────────────────────────────────────────

-- ALTER TABLE member_subscriptions
--   DROP CONSTRAINT IF EXISTS member_subscriptions_access_level_range,
--   DROP CONSTRAINT IF EXISTS member_subscriptions_track_values,
--   DROP COLUMN IF EXISTS track,
--   DROP COLUMN IF EXISTS sku,
--   DROP COLUMN IF EXISTS access_level,
--   DROP COLUMN IF EXISTS annual_renewal_date;
-- DROP INDEX IF EXISTS member_subscriptions_access_level_idx;
-- DROP INDEX IF EXISTS member_subscriptions_sku_idx;
