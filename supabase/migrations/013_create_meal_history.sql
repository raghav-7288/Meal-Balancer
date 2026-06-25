-- Migration: Create meal_history table for persisting daily meal scores
-- Previously only stored in localStorage via useMealHistory hook

CREATE TABLE IF NOT EXISTS public.meal_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    timestamp BIGINT NOT NULL,
    plan_name TEXT,
    score INTEGER DEFAULT 0,
    band TEXT DEFAULT '',
    kcal INTEGER DEFAULT 0,
    protein INTEGER DEFAULT 0,
    carbs INTEGER DEFAULT 0,
    fat INTEGER DEFAULT 0,
    fibre INTEGER DEFAULT 0,
    vegetables_g INTEGER DEFAULT 0,
    visible_fat INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: one entry per user per date
ALTER TABLE public.meal_history
    ADD CONSTRAINT uq_meal_history_user_date UNIQUE (user_id, date);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_meal_history_user_id ON public.meal_history(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_history_user_date ON public.meal_history(user_id, date DESC);

-- Auto-update updated_at trigger
CREATE TRIGGER set_meal_history_updated_at
    BEFORE UPDATE ON public.meal_history
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE public.meal_history ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own data
CREATE POLICY "Users can view their own meal history"
    ON public.meal_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal history"
    ON public.meal_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal history"
    ON public.meal_history FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal history"
    ON public.meal_history FOR DELETE
    USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT ALL ON public.meal_history TO authenticated;

