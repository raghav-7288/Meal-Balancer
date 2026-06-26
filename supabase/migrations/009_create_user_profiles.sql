-- ============================================================================
-- Migration: Create user_profiles table (per-user profile data)
-- User-scoped — each user can only access their own profile.
-- Run in: Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- 1. Create the user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    full_name TEXT,
    height_cm NUMERIC,
    weight_kg NUMERIC,
    current_bmi NUMERIC,
    age INTEGER,
    contact_number TEXT,
    activity TEXT DEFAULT 'moderate',
    goal TEXT DEFAULT 'maintenance',
    diet_type TEXT DEFAULT 'vegetarian',
    sex TEXT DEFAULT 'female',
    bmi_target TEXT DEFAULT '22',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- CHECK constraints (values must match app UI option values)
    CONSTRAINT chk_activity CHECK (activity IN ('sedentary', 'moderate', 'heavy')),
    CONSTRAINT chk_goal CHECK (goal IN ('maintenance', 'weight loss', 'weight gain', 'metabolic improvement')),
    CONSTRAINT chk_diet_type CHECK (diet_type IN ('vegetarian', 'eggetarian', 'non-vegetarian', 'Jain-compatible')),
    CONSTRAINT chk_sex CHECK (sex IN ('male', 'female'))
);

COMMENT ON COLUMN public.user_profiles.activity IS 'Activity level: sedentary, moderate, heavy';
COMMENT ON COLUMN public.user_profiles.goal IS 'Nutrition goal: maintenance, weight loss, weight gain, metabolic improvement';
COMMENT ON COLUMN public.user_profiles.diet_type IS 'Diet type: vegetarian, eggetarian, non-vegetarian, Jain-compatible';
COMMENT ON COLUMN public.user_profiles.sex IS 'Biological sex: male, female';
COMMENT ON COLUMN public.user_profiles.bmi_target IS 'Target BMI value as text';

-- 2. Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies: Users can only access their own profile

-- SELECT: Users can read their own profile
CREATE POLICY "Users can view their own profile"
    ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: Users can create their own profile
CREATE POLICY "Users can create their own profile"
    ON public.user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own profile
CREATE POLICY "Users can update their own profile"
    ON public.user_profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own profile
CREATE POLICY "Users can delete their own profile"
    ON public.user_profiles
    FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Grant access to authenticated users
GRANT ALL ON public.user_profiles TO authenticated;

