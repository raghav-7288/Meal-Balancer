-- ============================================================================
-- Migration: Create preset_plans table for storing system-wide preset meal plans
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- 1. Create the preset_plans table
CREATE TABLE IF NOT EXISTS public.preset_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    meals JSONB NOT NULL DEFAULT '{}'::jsonb,
    guidelines TEXT DEFAULT '',
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.preset_plans ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policy: Everyone (including anonymous) can read active preset plans
CREATE POLICY "Anyone can read preset plans"
    ON public.preset_plans
    FOR SELECT
    USING (is_active = true);

-- 4. Auto-update the updated_at timestamp on row changes
CREATE TRIGGER set_preset_plans_updated_at
    BEFORE UPDATE ON public.preset_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Grant read access to all roles
GRANT SELECT ON public.preset_plans TO authenticated;
GRANT SELECT ON public.preset_plans TO anon;

