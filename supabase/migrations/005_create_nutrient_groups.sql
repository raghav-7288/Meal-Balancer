-- ============================================================================
-- Migration: Create nutrient_groups table (nutrient category groupings)
-- Reference data — publicly readable, admin-writable only.
-- Run in: Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- 1. Create the nutrient_groups table
CREATE TABLE IF NOT EXISTS public.nutrient_groups (
    nutrient_group_id BIGINT PRIMARY KEY,
    group_name VARCHAR NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE public.nutrient_groups ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policy: Everyone can read nutrient groups
CREATE POLICY "Anyone can read nutrient groups"
    ON public.nutrient_groups
    FOR SELECT
    USING (true);

-- 4. Grant read access to all roles
GRANT SELECT ON public.nutrient_groups TO authenticated;
GRANT SELECT ON public.nutrient_groups TO anon;

