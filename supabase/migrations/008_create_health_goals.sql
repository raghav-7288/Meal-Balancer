-- ============================================================================
-- Migration: Create health_goals table (system-wide goal definitions)
-- Reference data — publicly readable, admin-writable only.
-- Run in: Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- 1. Create the health_goals table
CREATE TABLE IF NOT EXISTS public.health_goals (
    health_goal_id BIGINT PRIMARY KEY,
    goal_code TEXT NOT NULL,
    goal_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE public.health_goals ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policy: Everyone can read active health goals
CREATE POLICY "Anyone can read active health goals"
    ON public.health_goals
    FOR SELECT
    USING (is_active = true);

-- 4. Grant read access to all roles
GRANT SELECT ON public.health_goals TO authenticated;
GRANT SELECT ON public.health_goals TO anon;

