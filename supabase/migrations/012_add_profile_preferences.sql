-- Migration: Add preference columns to user_profiles
-- These fields were previously only stored in localStorage (ProfileContext)

ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS activity TEXT DEFAULT 'moderate',
    ADD COLUMN IF NOT EXISTS goal TEXT DEFAULT 'maintenance',
    ADD COLUMN IF NOT EXISTS diet_type TEXT DEFAULT 'vegetarian',
    ADD COLUMN IF NOT EXISTS sex TEXT DEFAULT 'female',
    ADD COLUMN IF NOT EXISTS bmi_target TEXT DEFAULT '22';

-- Add CHECK constraints for valid values
ALTER TABLE public.user_profiles
    ADD CONSTRAINT chk_activity CHECK (activity IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    ADD CONSTRAINT chk_goal CHECK (goal IN ('weight_loss', 'maintenance', 'muscle_gain', 'athletic_performance')),
    ADD CONSTRAINT chk_diet_type CHECK (diet_type IN ('vegetarian', 'non_vegetarian', 'vegan', 'eggetarian')),
    ADD CONSTRAINT chk_sex CHECK (sex IN ('male', 'female', 'other'));

COMMENT ON COLUMN public.user_profiles.activity IS 'Activity level: sedentary, light, moderate, active, very_active';
COMMENT ON COLUMN public.user_profiles.goal IS 'Nutrition goal: weight_loss, maintenance, muscle_gain, athletic_performance';
COMMENT ON COLUMN public.user_profiles.diet_type IS 'Diet type: vegetarian, non_vegetarian, vegan, eggetarian';
COMMENT ON COLUMN public.user_profiles.sex IS 'Biological sex: male, female, other';
COMMENT ON COLUMN public.user_profiles.bmi_target IS 'Target BMI value as text';

