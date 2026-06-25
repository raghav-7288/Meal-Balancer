-- ============================================================================
-- Migration: Create user_plans table for persisting meal plans to Supabase
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- 1. Create the user_plans table
CREATE TABLE IF NOT EXISTS public.user_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    meals JSONB NOT NULL DEFAULT '{}'::jsonb,
    guidelines TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add an index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON public.user_plans(user_id);

-- 3. Enable Row Level Security
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Users can only access their own plans

-- SELECT: Users can read their own plans
CREATE POLICY "Users can view their own plans"
    ON public.user_plans
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: Users can create their own plans
CREATE POLICY "Users can create their own plans"
    ON public.user_plans
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own plans
CREATE POLICY "Users can update their own plans"
    ON public.user_plans
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own plans
CREATE POLICY "Users can delete their own plans"
    ON public.user_plans
    FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Auto-update the updated_at timestamp on row changes
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_plans_updated_at
    BEFORE UPDATE ON public.user_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Grant access to authenticated users
GRANT ALL ON public.user_plans TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

