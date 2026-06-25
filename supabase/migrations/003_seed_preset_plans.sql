-- ============================================================================
-- Seed preset plans into the preset_plans table.
--
-- Uses a temporary helper function to expand a compact day-template into
-- the full 7-day weekly meals JSONB structure (matching the app's format).
-- ============================================================================

-- 1. Helper function: expands a day-template into full weekly meals JSONB
CREATE OR REPLACE FUNCTION _build_weekly_meals(template jsonb)
RETURNS jsonb AS $$
DECLARE
  meals   jsonb := '{}'::jsonb;
  slot    text;
  day     text;
  item    jsonb;
  arr     jsonb;
  slots   text[] := ARRAY[
    'Early morning', 'Breakfast', 'Post breakfast snack',
    'Lunch', 'Post lunch snack', 'Dinner', 'Bed time'
  ];
  days    text[] := ARRAY[
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];
BEGIN
  FOREACH slot IN ARRAY slots LOOP
    arr := '[]'::jsonb;
    FOREACH day IN ARRAY days LOOP
      IF template ? slot THEN
        FOR item IN SELECT * FROM jsonb_array_elements(template -> slot) LOOP
          arr := arr || jsonb_build_array(
            jsonb_build_object(
              'id',     gen_random_uuid(),
              'foodId', item ->> 'foodId',
              'grams',  (item ->> 'grams')::int,
              'day',    day
            )
          );
        END LOOP;
      END IF;
    END LOOP;
    meals := meals || jsonb_build_object(slot, arr);
  END LOOP;
  RETURN meals;
END;
$$ LANGUAGE plpgsql;


-- 2. Clear any existing preset plans to avoid duplicates
DELETE FROM public.preset_plans WHERE is_active = true;


-- 3. Insert the 5 preset plans
-- ─── Plan 1: Balanced office day ───────────────────────────────────────────
INSERT INTO public.preset_plans (name, meals, guidelines, display_order, is_active)
VALUES (
  'Balanced office day',
  _build_weekly_meals('{
    "Early morning":          [{"foodId": "banana",   "grams": 100}],
    "Breakfast":              [{"foodId": "curd",     "grams": 150},
                               {"foodId": "roti",     "grams": 60}],
    "Post breakfast snack":   [],
    "Lunch":                  [{"foodId": "dal",      "grams": 150},
                               {"foodId": "mixedveg", "grams": 150},
                               {"foodId": "roti",     "grams": 60}],
    "Post lunch snack":       [{"foodId": "banana",   "grams": 100}],
    "Dinner":                 [{"foodId": "rice",     "grams": 150},
                               {"foodId": "egg",      "grams": 50},
                               {"foodId": "mixedveg", "grams": 100}],
    "Bed time":               []
  }'::jsonb),
  '',
  1,
  true
);

-- ─── Plan 2: Cereal-heavy pattern ──────────────────────────────────────────
INSERT INTO public.preset_plans (name, meals, guidelines, display_order, is_active)
VALUES (
  'Cereal-heavy pattern',
  _build_weekly_meals('{
    "Early morning":          [],
    "Breakfast":              [{"foodId": "rice",   "grams": 250}],
    "Post breakfast snack":   [],
    "Lunch":                  [{"foodId": "rice",   "grams": 300},
                               {"foodId": "roti",   "grams": 60}],
    "Post lunch snack":       [{"foodId": "banana", "grams": 100}],
    "Dinner":                 [{"foodId": "rice",   "grams": 200},
                               {"foodId": "roti",   "grams": 60}],
    "Bed time":               []
  }'::jsonb),
  '',
  2,
  true
);

-- ─── Plan 3: High-protein day ──────────────────────────────────────────────
INSERT INTO public.preset_plans (name, meals, guidelines, display_order, is_active)
VALUES (
  'High-protein day',
  _build_weekly_meals('{
    "Early morning":          [{"foodId": "banana", "grams": 100}],
    "Breakfast":              [{"foodId": "egg",    "grams": 100},
                               {"foodId": "curd",   "grams": 200}],
    "Post breakfast snack":   [],
    "Lunch":                  [{"foodId": "dal",      "grams": 200},
                               {"foodId": "roti",     "grams": 60},
                               {"foodId": "mixedveg", "grams": 100}],
    "Post lunch snack":       [{"foodId": "curd",   "grams": 150}],
    "Dinner":                 [{"foodId": "egg",    "grams": 100},
                               {"foodId": "dal",    "grams": 150},
                               {"foodId": "rice",   "grams": 100}],
    "Bed time":               []
  }'::jsonb),
  '',
  3,
  true
);

-- ─── Plan 4: Light veggie day ──────────────────────────────────────────────
INSERT INTO public.preset_plans (name, meals, guidelines, display_order, is_active)
VALUES (
  'Light veggie day',
  _build_weekly_meals('{
    "Early morning":          [],
    "Breakfast":              [{"foodId": "banana",   "grams": 100},
                               {"foodId": "curd",     "grams": 100}],
    "Post breakfast snack":   [],
    "Lunch":                  [{"foodId": "mixedveg", "grams": 200},
                               {"foodId": "roti",     "grams": 30},
                               {"foodId": "dal",      "grams": 100}],
    "Post lunch snack":       [{"foodId": "banana",   "grams": 100}],
    "Dinner":                 [{"foodId": "mixedveg", "grams": 200},
                               {"foodId": "roti",     "grams": 30}],
    "Bed time":               []
  }'::jsonb),
  '',
  4,
  true
);

-- ─── Plan 5: Dal & roti comfort ────────────────────────────────────────────
INSERT INTO public.preset_plans (name, meals, guidelines, display_order, is_active)
VALUES (
  'Dal & roti comfort',
  _build_weekly_meals('{
    "Early morning":          [],
    "Breakfast":              [{"foodId": "roti",     "grams": 90},
                               {"foodId": "curd",     "grams": 150}],
    "Post breakfast snack":   [],
    "Lunch":                  [{"foodId": "dal",      "grams": 200},
                               {"foodId": "roti",     "grams": 90},
                               {"foodId": "mixedveg", "grams": 100}],
    "Post lunch snack":       [],
    "Dinner":                 [{"foodId": "dal",      "grams": 150},
                               {"foodId": "roti",     "grams": 60},
                               {"foodId": "mixedveg", "grams": 100}],
    "Bed time":               [{"foodId": "banana",   "grams": 100},
                               {"foodId": "curd",     "grams": 100}]
  }'::jsonb),
  '',
  5,
  true
);


-- 4. Clean up the helper function
DROP FUNCTION IF EXISTS _build_weekly_meals(jsonb);


-- 5. Verify
-- SELECT id, name, display_order FROM public.preset_plans ORDER BY display_order;

