-- ============================================================================
-- Migration: Create major_groups table (food group categories)
-- Reference data — publicly readable, admin-writable only.
-- Run in: Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- 1. Create the major_groups table
CREATE TABLE IF NOT EXISTS public.major_groups (
    major_group_id BIGINT PRIMARY KEY,
    group_code VARCHAR NOT NULL,
    group_name VARCHAR NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE public.major_groups ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policy: Everyone can read food groups
CREATE POLICY "Anyone can read major groups"
    ON public.major_groups
    FOR SELECT
    USING (true);

-- 4. Grant read access to all roles
GRANT SELECT ON public.major_groups TO authenticated;
GRANT SELECT ON public.major_groups TO anon;

