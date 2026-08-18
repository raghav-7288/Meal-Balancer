-- ============================================================================
-- Migration 015: Document columns added to live DB without migration files
--
-- These columns already exist in the production database. This migration
-- records them in the migration history so the codebase stays in sync.
-- All statements use IF NOT EXISTS / safe patterns for idempotency.
--
-- Columns documented:
--   1. user_plans.meal_times      (JSONB, used by planSyncService)
--   2. preset_plans.meal_times    (JSONB, used by presetPlanService)
--   3. user_profiles.avatar_url   (TEXT, selected by authService)
-- ============================================================================

-- 1. meal_times on user_plans (per-slot clock times, e.g. {"Breakfast":"08:00"})
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'user_plans'
          AND column_name = 'meal_times'
    ) THEN
        ALTER TABLE public.user_plans
            ADD COLUMN meal_times JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. meal_times on preset_plans
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'preset_plans'
          AND column_name = 'meal_times'
    ) THEN
        ALTER TABLE public.preset_plans
            ADD COLUMN meal_times JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 3. avatar_url on user_profiles (for Google OAuth profile pictures)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'user_profiles'
          AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.user_profiles
            ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

