-- ============================================================================
-- Migration: Auto-create a user_profiles row for Google / OAuth sign-ups
-- Run in: Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--
-- Google/OAuth users are created in auth.users with NO user_profiles row (the
-- email/password flow creates that row in application code via
-- authService.createUserProfile). This trigger fills the gap for OAuth users so
-- every account has a profile with their name + avatar from Google metadata.
--
-- NOTE: This project already has public.user_profiles (migration 009) keyed on
-- `user_id`. We reuse that table instead of creating a separate `profiles`
-- table, and only auto-create for OAuth providers so we never clobber the
-- username/contact the user typed during email sign-up.
-- ============================================================================

-- 1. Add an avatar_url column to store the Google profile picture (idempotent).
ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Insert-only helper: create a profile row for a newly created auth user.
--    For Google, full_name / avatar come from raw_user_meta_data
--    ('full_name', 'name', 'avatar_url', 'picture').
--    SECURITY DEFINER lets the trigger bypass RLS to insert the row.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Email/password sign-ups create their profile in the app (with the typed
    -- username / full name / contact number), so skip them here to avoid
    -- overwriting that data. Only auto-create for OAuth providers (e.g. google).
    IF COALESCE(NEW.raw_app_meta_data ->> 'provider', 'email') = 'email' THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.user_profiles (user_id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        split_part(NEW.email, '@', 1),
        COALESCE(
            NEW.raw_user_meta_data ->> 'full_name',
            NEW.raw_user_meta_data ->> 'name',
            ''
        ),
        COALESCE(
            NEW.raw_user_meta_data ->> 'avatar_url',
            NEW.raw_user_meta_data ->> 'picture'
        )
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- 3. Fire the trigger after every new auth user is created.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

