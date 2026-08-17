-- ============================================================================
-- Migration: Harden handle_new_user() against username collisions
-- Run in: Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--
-- WHY:
--   public.user_profiles.username is NOT NULL + UNIQUE in production. The OAuth
--   auto-provision trigger (migration 015) inserted
--       username = split_part(NEW.email, '@', 1)
--   with `ON CONFLICT (user_id) DO NOTHING`. That ON CONFLICT only handles a
--   user_id (PK) collision — NOT a username UNIQUE collision. So if two users
--   share an email local-part (e.g. john@gmail.com and john@outlook.com, or an
--   email/password user already owns username "john"), the INSERT raised
--   unique_violation. Because the trigger fires AFTER INSERT ON auth.users, that
--   exception rolled back the whole auth insert → Google sign-in failed with
--   "Database error saving new user".
--
-- FIX:
--   1. Try the clean username first (keeps nice usernames when free).
--   2. On a username collision, retry with a short unique suffix from the UUID.
--   3. Wrap everything so a profile-creation failure can NEVER abort the auth
--      signup — a missing profile row degrades gracefully (the app tolerates a
--      null profile and can recreate it later).
--
-- This replaces the function body in-place (CREATE OR REPLACE); the existing
-- on_auth_user_created trigger keeps pointing at it, so no trigger change needed.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_base_username TEXT := split_part(NEW.email, '@', 1);
    v_full_name TEXT := COALESCE(
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'name',
        ''
    );
    v_avatar_url TEXT := COALESCE(
        NEW.raw_user_meta_data ->> 'avatar_url',
        NEW.raw_user_meta_data ->> 'picture'
    );
BEGIN
    -- Email/password sign-ups create their profile in the app (with the typed
    -- username / full name / contact number), so skip them here to avoid
    -- overwriting that data. Only auto-create for OAuth providers (e.g. google).
    IF COALESCE(NEW.raw_app_meta_data ->> 'provider', 'email') = 'email' THEN
        RETURN NEW;
    END IF;

    BEGIN
        -- 1. Preferred: clean username from the email local-part.
        INSERT INTO public.user_profiles (user_id, username, full_name, avatar_url)
        VALUES (NEW.id, v_base_username, v_full_name, v_avatar_url)
        ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION
        WHEN unique_violation THEN
            -- 2. Username already taken → append a short, unique UUID suffix.
            BEGIN
                INSERT INTO public.user_profiles (user_id, username, full_name, avatar_url)
                VALUES (
                    NEW.id,
                    v_base_username || '_' || substr(replace(NEW.id::text, '-', ''), 1, 8),
                    v_full_name,
                    v_avatar_url
                )
                ON CONFLICT (user_id) DO NOTHING;
            EXCEPTION WHEN OTHERS THEN
                -- 3. Never let profile creation abort the auth signup.
                RAISE WARNING 'handle_new_user: profile create skipped for %: %', NEW.id, SQLERRM;
            END;
        WHEN OTHERS THEN
            RAISE WARNING 'handle_new_user: unexpected error for %: %', NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$;

