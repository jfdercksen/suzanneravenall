-- =============================================================================
-- Seed data: initial membership tiers
-- Run after 001_foundation.sql
-- =============================================================================

INSERT INTO public.membership_tiers (name, slug, description, price_monthly, price_annual, features, is_active)
VALUES
  (
    'Free Member',
    'free',
    'Free access to selected resources and community content.',
    0.00,
    0.00,
    '["Access to free resources", "Community forum access", "Monthly newsletter"]',
    true
  ),
  (
    'Silver Member',
    'silver',
    'Mid-tier membership with access to core programs and resources.',
    NULL,
    NULL,
    '["Everything in Free", "Access to Silver resources", "Group coaching calls", "Program discounts"]',
    true
  ),
  (
    'Gold Member',
    'gold',
    'Full membership with access to all programs, resources and video content.',
    NULL,
    NULL,
    '["Everything in Silver", "Access to all resources and videos", "Priority booking", "1-on-1 session discount"]',
    true
  ),
  (
    'Practitioner License',
    'practitioner',
    'Professional license for practitioners to use Suzanne''s methodology with their own clients.',
    NULL,
    NULL,
    '["Everything in Gold", "Practitioner certification", "Methodology licensing", "Practitioner community access", "Co-branding rights"]',
    true
  )
ON CONFLICT (slug) DO NOTHING;
