-- ============================================================================
-- Migration 016: Document views and RPC functions present in live DB
--
-- These database objects already exist in production. They were created
-- manually in the Supabase SQL Editor but had no corresponding migration
-- file. This migration records them for codebase consistency.
--
-- Objects documented:
--   1. food_search_view              (denormalised view for food search)
--   2. search_foods()                (RPC: full-text food search)
--   3. get_food_details()            (RPC: nutrient details for a food)
--   4. search_nutrient_foods()       (RPC: foods ranked by a nutrient)
-- ============================================================================

-- 1. food_search_view
-- Denormalised view joining foods → groups → nutrients for fast search.
CREATE OR REPLACE VIEW public.food_search_view AS
SELECT
    fi.food_id,
    fi.food_code,
    fi.food_name,
    mg.major_group_id,
    mg.group_code,
    mg.group_name AS food_group,
    fnv.nutrient_id,
    nd.nutrient_name,
    nd.nutrient_code,
    nd.unit,
    ng.nutrient_group_id,
    ng.group_name AS nutrient_group,
    fnv.value
FROM food_items fi
JOIN major_groups mg ON mg.major_group_id = fi.major_group_id
LEFT JOIN food_nutrient_values fnv ON fnv.food_id = fi.food_id
LEFT JOIN nutrient_definitions nd ON nd.nutrient_id = fnv.nutrient_id
LEFT JOIN nutrient_groups ng ON ng.nutrient_group_id = nd.nutrient_group_id;

-- Grant read access to the view
GRANT SELECT ON public.food_search_view TO anon, authenticated;

-- 2. search_foods(search_text)
-- Full-text search across food_search_view. Used by DATABASE_SCHEMA.md reference.
CREATE OR REPLACE FUNCTION public.search_foods(search_text text)
RETURNS TABLE(
    food_id bigint,
    food_code character varying,
    food_name character varying,
    food_group character varying
)
LANGUAGE sql STABLE
AS $$
    SELECT DISTINCT fsv.food_id, fsv.food_code, fsv.food_name, fsv.food_group
    FROM public.food_search_view fsv
    WHERE fsv.food_name   ILIKE '%' || search_text || '%'
       OR fsv.food_code   ILIKE '%' || search_text || '%'
       OR fsv.food_group  ILIKE '%' || search_text || '%'
       OR fsv.nutrient_name  ILIKE '%' || search_text || '%'
       OR fsv.nutrient_group ILIKE '%' || search_text || '%'
    ORDER BY fsv.food_name
    LIMIT 20;
$$;

-- 3. get_food_details(p_food_id)
-- Returns all nutrient details for a specific food item.
-- Used by FoodSearchPage.jsx when a user clicks a food result.
CREATE OR REPLACE FUNCTION public.get_food_details(p_food_id bigint)
RETURNS TABLE(
    food_id bigint,
    food_code character varying,
    food_name character varying,
    food_group character varying,
    nutrient_id bigint,
    nutrient_name character varying,
    nutrient_code character varying,
    nutrient_group character varying,
    unit character varying,
    value numeric
)
LANGUAGE sql STABLE
AS $$
    SELECT fsv.food_id, fsv.food_code, fsv.food_name, fsv.food_group,
           fsv.nutrient_id, fsv.nutrient_name, fsv.nutrient_code,
           fsv.nutrient_group, fsv.unit, fsv.value
    FROM public.food_search_view fsv
    WHERE fsv.food_id = p_food_id
    ORDER BY fsv.nutrient_group, fsv.nutrient_name;
$$;

-- 4. search_nutrient_foods(nutrient_search)
-- Returns foods ranked by a specific nutrient's value (descending).
-- Used by FoodSearchPage.jsx for nutrient-aware search.
CREATE OR REPLACE FUNCTION public.search_nutrient_foods(nutrient_search text)
RETURNS TABLE(
    food_id bigint,
    food_code character varying,
    food_name character varying,
    food_group character varying,
    nutrient_name character varying,
    nutrient_value numeric,
    unit character varying
)
LANGUAGE sql STABLE
AS $$
    SELECT fi.food_id, fi.food_code, fi.food_name, mg.group_name,
           nd.nutrient_name, fnv.value, nd.unit
    FROM food_nutrient_values fnv
    JOIN food_items fi ON fi.food_id = fnv.food_id
    JOIN major_groups mg ON mg.major_group_id = fi.major_group_id
    JOIN nutrient_definitions nd ON nd.nutrient_id = fnv.nutrient_id
    WHERE nd.nutrient_name ILIKE '%' || nutrient_search || '%'
    ORDER BY fnv.value DESC
    LIMIT 100;
$$;

