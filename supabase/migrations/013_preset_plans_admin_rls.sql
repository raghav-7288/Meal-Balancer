-- ============================================================================
-- Migration: Add INSERT/UPDATE/DELETE RLS policies on preset_plans for admin
-- Allows authenticated users to manage preset plans from the frontend.
-- Run in: Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- 1. Allow authenticated users to insert preset plans
CREATE POLICY "Authenticated users can insert preset plans"
    ON public.preset_plans
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 2. Allow authenticated users to update preset plans
CREATE POLICY "Authenticated users can update preset plans"
    ON public.preset_plans
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. Allow authenticated users to delete preset plans
CREATE POLICY "Authenticated users can delete preset plans"
    ON public.preset_plans
    FOR DELETE
    TO authenticated
    USING (true);

-- 4. Grant full access to authenticated role
GRANT ALL ON public.preset_plans TO authenticated;

-- 5. Update SELECT policy to allow admin to see inactive plans too
DROP POLICY IF EXISTS "Anyone can read preset plans" ON public.preset_plans;

CREATE POLICY "Anyone can read active preset plans"
    ON public.preset_plans
    FOR SELECT
    TO anon
    USING (is_active = true);

CREATE POLICY "Authenticated can read all preset plans"
    ON public.preset_plans
    FOR SELECT
    TO authenticated
    USING (true);

