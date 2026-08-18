-- ============================================================================
-- Migration: Add meal_times column to user_plans and preset_plans
-- Stores a per-plan map of meal-slot -> clock time (e.g. {"Breakfast":"08:00"}).
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- user_plans: per-user meal schedules
ALTER TABLE public.user_plans
    ADD COLUMN IF NOT EXISTS meal_times JSONB NOT NULL DEFAULT '{}'::jsonb;

-- preset_plans: system-wide preset meal schedules
ALTER TABLE public.preset_plans
    ADD COLUMN IF NOT EXISTS meal_times JSONB NOT NULL DEFAULT '{}'::jsonb;

