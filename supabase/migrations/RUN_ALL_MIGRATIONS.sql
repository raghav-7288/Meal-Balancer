-- ═══════════════════════════════════════════════════════════════════════════════
-- MEAL BALANCER — Combined Migration Script
-- Run this in your Supabase SQL Editor to apply all changes at once.
-- ═══════════════════════════════════════════════════════════════════════════════
-- Migrations included:
--   012: Add profile preference columns to user_profiles
--   013: Create meal_history table
--   014: Create daily_health_tracking table (water + steps + future metrics)
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 012: Add preference columns to user_profiles
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS activity TEXT DEFAULT 'moderate',
    ADD COLUMN IF NOT EXISTS goal TEXT DEFAULT 'maintenance',
    ADD COLUMN IF NOT EXISTS diet_type TEXT DEFAULT 'vegetarian',
    ADD COLUMN IF NOT EXISTS sex TEXT DEFAULT 'female',
    ADD COLUMN IF NOT EXISTS bmi_target TEXT DEFAULT '22';

-- Add CHECK constraints for valid values (use DO block to handle "already exists")
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_activity') THEN
        ALTER TABLE public.user_profiles
            ADD CONSTRAINT chk_activity CHECK (activity IN ('sedentary', 'light', 'moderate', 'active', 'very_active'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_goal') THEN
        ALTER TABLE public.user_profiles
            ADD CONSTRAINT chk_goal CHECK (goal IN ('weight_loss', 'maintenance', 'muscle_gain', 'athletic_performance'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_diet_type') THEN
        ALTER TABLE public.user_profiles
            ADD CONSTRAINT chk_diet_type CHECK (diet_type IN ('vegetarian', 'non_vegetarian', 'vegan', 'eggetarian'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_sex') THEN
        ALTER TABLE public.user_profiles
            ADD CONSTRAINT chk_sex CHECK (sex IN ('male', 'female', 'other'));
    END IF;
END $$;

COMMENT ON COLUMN public.user_profiles.activity IS 'Activity level: sedentary, light, moderate, active, very_active';
COMMENT ON COLUMN public.user_profiles.goal IS 'Nutrition goal: weight_loss, maintenance, muscle_gain, athletic_performance';
COMMENT ON COLUMN public.user_profiles.diet_type IS 'Diet type: vegetarian, non_vegetarian, vegan, eggetarian';
COMMENT ON COLUMN public.user_profiles.sex IS 'Biological sex: male, female, other';
COMMENT ON COLUMN public.user_profiles.bmi_target IS 'Target BMI value as text';


-- ─────────────────────────────────────────────────────────────────────────────
-- 013: Create meal_history table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.meal_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    timestamp BIGINT NOT NULL,
    plan_name TEXT,
    score INTEGER DEFAULT 0,
    band TEXT DEFAULT '',
    kcal INTEGER DEFAULT 0,
    protein INTEGER DEFAULT 0,
    carbs INTEGER DEFAULT 0,
    fat INTEGER DEFAULT 0,
    fibre INTEGER DEFAULT 0,
    vegetables_g INTEGER DEFAULT 0,
    visible_fat INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: one entry per user per date
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_meal_history_user_date') THEN
        ALTER TABLE public.meal_history
            ADD CONSTRAINT uq_meal_history_user_date UNIQUE (user_id, date);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_meal_history_user_id ON public.meal_history(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_history_user_date ON public.meal_history(user_id, date DESC);

-- Auto-update updated_at trigger
DROP TRIGGER IF EXISTS set_meal_history_updated_at ON public.meal_history;
CREATE TRIGGER set_meal_history_updated_at
    BEFORE UPDATE ON public.meal_history
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE public.meal_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Users can view their own meal history" ON public.meal_history;
CREATE POLICY "Users can view their own meal history"
    ON public.meal_history FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own meal history" ON public.meal_history;
CREATE POLICY "Users can insert their own meal history"
    ON public.meal_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own meal history" ON public.meal_history;
CREATE POLICY "Users can update their own meal history"
    ON public.meal_history FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own meal history" ON public.meal_history;
CREATE POLICY "Users can delete their own meal history"
    ON public.meal_history FOR DELETE
    USING (auth.uid() = user_id);

GRANT ALL ON public.meal_history TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 014: Create daily_health_tracking table (water + steps + future metrics)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.daily_health_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Water tracking
    water_glasses INTEGER NOT NULL DEFAULT 0,
    water_target INTEGER NOT NULL DEFAULT 8,

    -- Step tracking
    steps INTEGER NOT NULL DEFAULT 0,
    steps_target INTEGER NOT NULL DEFAULT 10000,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: one entry per user per date
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_daily_health_user_date') THEN
        ALTER TABLE public.daily_health_tracking
            ADD CONSTRAINT uq_daily_health_user_date UNIQUE (user_id, date);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_daily_health_user_id ON public.daily_health_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_health_user_date ON public.daily_health_tracking(user_id, date DESC);

-- Auto-update updated_at trigger
DROP TRIGGER IF EXISTS set_daily_health_tracking_updated_at ON public.daily_health_tracking;
CREATE TRIGGER set_daily_health_tracking_updated_at
    BEFORE UPDATE ON public.daily_health_tracking
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE public.daily_health_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Users can view their own daily health tracking" ON public.daily_health_tracking;
CREATE POLICY "Users can view their own daily health tracking"
    ON public.daily_health_tracking FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own daily health tracking" ON public.daily_health_tracking;
CREATE POLICY "Users can insert their own daily health tracking"
    ON public.daily_health_tracking FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own daily health tracking" ON public.daily_health_tracking;
CREATE POLICY "Users can update their own daily health tracking"
    ON public.daily_health_tracking FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own daily health tracking" ON public.daily_health_tracking;
CREATE POLICY "Users can delete their own daily health tracking"
    ON public.daily_health_tracking FOR DELETE
    USING (auth.uid() = user_id);

GRANT ALL ON public.daily_health_tracking TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- Done!
-- ─────────────────────────────────────────────────────────────────────────────

COMMIT;
