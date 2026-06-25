-- ============================================================================
-- Migration: Create nutrient_definitions table (individual nutrient metadata)
-- Reference data — publicly readable, admin-writable only.
-- Run in: Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- 1. Create the nutrient_definitions table
CREATE TABLE IF NOT EXISTS public.nutrient_definitions (
    nutrient_id BIGINT PRIMARY KEY,
    nutrient_group_id BIGINT NOT NULL REFERENCES public.nutrient_groups(nutrient_group_id),
    nutrient_name VARCHAR NOT NULL,
    nutrient_code VARCHAR NOT NULL,
    unit VARCHAR NOT NULL
);

-- 2. Index on nutrient_group_id for joins
CREATE INDEX IF NOT EXISTS idx_nutrient_definitions_group_id
    ON public.nutrient_definitions(nutrient_group_id);

-- 3. Enable Row Level Security
ALTER TABLE public.nutrient_definitions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: Everyone can read nutrient definitions
CREATE POLICY "Anyone can read nutrient definitions"
    ON public.nutrient_definitions
    FOR SELECT
    USING (true);

-- 5. Grant read access to all roles
GRANT SELECT ON public.nutrient_definitions TO authenticated;
GRANT SELECT ON public.nutrient_definitions TO anon;

