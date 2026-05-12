-- =============================================================================
-- UP: video_content table
-- Stores metadata for Bunny Stream videos available in the member portal.
-- Status transitions: pending → encoding → ready (driven by Bunny webhook).
-- =============================================================================

CREATE TABLE video_content (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  bunny_video_id    TEXT        NOT NULL UNIQUE,
  title             TEXT        NOT NULL,
  description       TEXT,
  duration_seconds  INTEGER,
  category          TEXT        NOT NULL DEFAULT 'General',
  -- resource_key matches ResourceKey in lib/access/tiers.ts
  resource_key      TEXT        NOT NULL DEFAULT 'group_sessions_recorded',
  status            TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'encoding', 'ready')),
  thumbnail_url     TEXT,
  -- tier_slugs: which membership tiers can play this video
  -- Matches TierSlug type: 'free' | 'silver' | 'gold' | 'practitioner'
  tier_slugs        TEXT[]      NOT NULL DEFAULT ARRAY['silver', 'gold', 'practitioner'],
  sort_order        INTEGER     NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE video_content ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_video_content_status       ON video_content(status);
CREATE INDEX idx_video_content_category     ON video_content(category);
CREATE INDEX idx_video_content_sort_order   ON video_content(sort_order);
CREATE INDEX idx_video_content_resource_key ON video_content(resource_key);

CREATE TRIGGER video_content_updated_at
  BEFORE UPDATE ON video_content
  FOR EACH ROW
  EXECUTE PROCEDURE moddatetime(updated_at);

-- All authenticated members can view the full video catalogue.
-- Showing locked cards encourages tier upgrades; access to the actual
-- signed embed URL is enforced server-side in api/video/[videoId]/route.ts.
CREATE POLICY "Authenticated members can view video catalogue"
  ON video_content
  FOR SELECT
  TO authenticated
  USING (true);

-- Only the service role (webhook handler) may insert / update / delete.
-- No explicit policy = deny by default for non-service-role callers.

-- =============================================================================
-- Seed data — 3 placeholder videos (status='pending')
-- TODO for Suzanne: replace each placeholder bunny_video_id with the real
-- video GUID from your Bunny Stream library:
--   Bunny dashboard → Stream → Library → Videos → click video → copy GUID
-- Then update status to 'ready' (or let the encoding webhook do it automatically
-- once you have BUNNY_WEBHOOK_SECRET configured in infra/.env).
-- =============================================================================

INSERT INTO video_content
  (bunny_video_id,                     title,                                        description,                                                                                        category,         resource_key,              status,    sort_order, tier_slugs)
VALUES
  ('placeholder-guid-hpr-intro-001',   'Introduction to HPR — Welcome Session',      'Dr. Suzanne Ravenall introduces the Human Performance Replicator methodology. A foundational session for all new members.',                'Getting Started', 'resources_basic',          'pending',  10,         ARRAY['free', 'silver', 'gold', 'practitioner']),
  ('placeholder-guid-group-rr1-002',   'Rapid Repatterning — Group Session 1',       'Introduction to the RR process with live group practice. Learn the foundational patterns of Rapid Repatterning.',                          'Group Sessions',  'group_sessions_recorded',  'pending',  20,         ARRAY['silver', 'gold', 'practitioner']),
  ('placeholder-guid-live-gold-003',   'Gold Cohort — Intensive Coaching Session',   'Full 3-hour live coaching intensive with Gold members. Advanced patterns work and individual breakthroughs.',                                'Live Sessions',   'live_session_recordings',  'pending',  30,         ARRAY['gold', 'practitioner']);

-- =============================================================================
-- DOWN
-- =============================================================================

-- DROP TABLE IF EXISTS video_content;
