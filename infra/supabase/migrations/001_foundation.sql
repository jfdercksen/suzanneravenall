-- =============================================================================
-- Migration: 001_foundation
-- Description: Core tables for profiles, membership tiers, subscriptions,
--              resources, and video content with RLS policies.
-- Created: 2026-03-25
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Shared trigger function: update updated_at on every row change
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- profiles
-- Extends auth.users with application-level profile data.
-- A row is created automatically via the handle_new_user trigger on signup.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'practitioner')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile but cannot change their own role
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND role = (SELECT role FROM public.profiles WHERE user_id = auth.uid())
  );

-- Users can create their own profile row on signup
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- Helper function: check if the current user is an admin
-- SECURITY DEFINER runs as the function owner (superuser), bypassing RLS.
-- This prevents infinite recursion when admin policies query the profiles table.
-- Defined after profiles table so the relation exists at creation time.
-- All admin policies are added after this function.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Admins can read all profiles (uses SECURITY DEFINER function to avoid recursion)
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- Auto-create profile row on new user signup
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---------------------------------------------------------------------------
-- membership_tiers
-- Defines the available membership levels (free, silver, gold, practitioner).
-- Publicly readable so the pricing page can display tier details without auth.
-- Write access is service-role only — manage tiers via Supabase dashboard or
-- server-side admin API, never from client code.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.membership_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly NUMERIC(10,2),
  price_annual NUMERIC(10,2),
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;

-- Tiers are publicly readable — needed to display pricing on the public site
CREATE POLICY "Tiers are publicly readable"
  ON public.membership_tiers FOR SELECT
  USING (true);

-- ---------------------------------------------------------------------------
-- member_subscriptions
-- Links a user to a membership tier.
--
-- IMPORTANT: Write access (INSERT/UPDATE/DELETE) is intentionally restricted
-- to service role only. Subscriptions are created and updated exclusively via
-- Medusa payment webhooks using SUPABASE_SERVICE_ROLE_KEY.
-- Never add INSERT/UPDATE/DELETE policies for authenticated or anon roles —
-- doing so would allow users to self-assign paid tiers without paying.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.member_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tier_id UUID REFERENCES public.membership_tiers(id) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  medusa_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.member_subscriptions IS
  'Write access is intentionally restricted to service role only.
   Subscriptions are created and updated exclusively via Medusa payment webhooks
   using SUPABASE_SERVICE_ROLE_KEY. Never add INSERT/UPDATE/DELETE policies for
   authenticated or anon roles.';

ALTER TABLE public.member_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscriptions
CREATE POLICY "Users can read their own subscriptions"
  ON public.member_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all subscriptions
CREATE POLICY "Admins can read all subscriptions"
  ON public.member_subscriptions FOR SELECT
  USING (is_admin());

CREATE TRIGGER member_subscriptions_updated_at
  BEFORE UPDATE ON public.member_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- resources
-- Gated documents, PDFs, templates, and links.
-- Access is controlled by allowed_tier_ids — RLS enforces this, never app code.
-- end_date is checked in RLS so expired subscriptions lose access immediately,
-- regardless of whether the Medusa webhook has updated status yet.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  resource_type TEXT CHECK (resource_type IN ('pdf', 'video', 'audio', 'link', 'template')),
  allowed_tier_ids UUID[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Members can read resources their active subscription tier allows
CREATE POLICY "Members can read resources their tier allows"
  ON public.resources FOR SELECT
  USING (
    is_published = true
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.member_subscriptions ms
      WHERE ms.user_id = auth.uid()
        AND ms.status = 'active'
        AND (ms.end_date IS NULL OR ms.end_date > NOW())
        AND ms.tier_id = ANY(allowed_tier_ids)
    )
  );

-- Admins can read all resources
CREATE POLICY "Admins can read all resources"
  ON public.resources FOR SELECT
  USING (is_admin());

CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- video_content
-- Bunny Stream video metadata. Bunny delivers the stream; Supabase controls
-- who can request the embed URL via RLS on this table.
-- end_date is checked so access expires even if the webhook is delayed.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.video_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  bunny_video_id TEXT NOT NULL,
  bunny_library_id TEXT NOT NULL,
  thumbnail_url TEXT,
  allowed_tier_ids UUID[] DEFAULT '{}',
  duration_seconds INTEGER,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.video_content ENABLE ROW LEVEL SECURITY;

-- Members can watch videos their active subscription tier allows
CREATE POLICY "Members can watch videos their tier allows"
  ON public.video_content FOR SELECT
  USING (
    is_published = true
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.member_subscriptions ms
      WHERE ms.user_id = auth.uid()
        AND ms.status = 'active'
        AND (ms.end_date IS NULL OR ms.end_date > NOW())
        AND ms.tier_id = ANY(allowed_tier_ids)
    )
  );

-- Admins can read all video content
CREATE POLICY "Admins can read all video content"
  ON public.video_content FOR SELECT
  USING (is_admin());

CREATE TRIGGER video_content_updated_at
  BEFORE UPDATE ON public.video_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
