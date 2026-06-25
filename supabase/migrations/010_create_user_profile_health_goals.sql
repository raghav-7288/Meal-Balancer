-- ============================================================================
-- Migration: Create user_profile_health_goals junction table
-- User-scoped — each user can only access their own goal selections.
-- Run in: Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- 1. Create the junction table
CREATE TABLE IF NOT EXISTS public.user_profile_health_goals (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    health_goal_id BIGINT NOT NULL REFERENCES public.health_goals(health_goal_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, health_goal_id)
);

-- 2. Index on health_goal_id for reverse lookups
CREATE INDEX IF NOT EXISTS idx_user_profile_health_goals_goal_id
    ON public.user_profile_health_goals(health_goal_id);

-- 3. Enable Row Level Security
ALTER TABLE public.user_profile_health_goals ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Users can only access their own goal selections

-- SELECT: Users can read their own goals
CREATE POLICY "Users can view their own health goals"
    ON public.user_profile_health_goals
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: Users can add their own goals
CREATE POLICY "Users can add their own health goals"
    ON public.user_profile_health_goals
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own goals
CREATE POLICY "Users can update their own health goals"
    ON public.user_profile_health_goals
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can remove their own goals
CREATE POLICY "Users can remove their own health goals"
    ON public.user_profile_health_goals
    FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Grant access to authenticated users
GRANT ALL ON public.user_profile_health_goals TO authenticated;

