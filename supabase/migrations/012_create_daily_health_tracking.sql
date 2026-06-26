-- Migration: Create daily_health_tracking table
-- Combines water intake, step tracking, and future daily health metrics into one table.
-- One row per user per day — extensible for sleep, exercise minutes, etc.

CREATE TABLE IF NOT EXISTS public.daily_health_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Water tracking
    water_glasses INTEGER NOT NULL DEFAULT 0,
    water_target INTEGER NOT NULL DEFAULT 8,

    -- Step tracking
    steps INTEGER NOT NULL DEFAULT 0,
    steps_target INTEGER NOT NULL DEFAULT 10000,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: one entry per user per date
ALTER TABLE public.daily_health_tracking
    ADD CONSTRAINT uq_daily_health_user_date UNIQUE (user_id, date);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_health_user_id ON public.daily_health_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_health_user_date ON public.daily_health_tracking(user_id, date DESC);

-- Auto-update updated_at trigger
CREATE TRIGGER set_daily_health_tracking_updated_at
    BEFORE UPDATE ON public.daily_health_tracking
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE public.daily_health_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own data
CREATE POLICY "Users can view their own daily health tracking"
    ON public.daily_health_tracking FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily health tracking"
    ON public.daily_health_tracking FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily health tracking"
    ON public.daily_health_tracking FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily health tracking"
    ON public.daily_health_tracking FOR DELETE
    USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT ALL ON public.daily_health_tracking TO authenticated;

