-- Migration 014: Optimize food search performance
-- 1. Add pg_trgm GIN index on food_items.food_name for fast ILIKE queries
-- 2. Replace search_foods_all_fields RPC to limit results to 20 rows (was 500)

-- Enable pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN index for trigram similarity on food_name
CREATE INDEX IF NOT EXISTS idx_food_items_food_name_trgm
ON food_items USING GIN (food_name gin_trgm_ops);

-- Drop existing function (return type may differ)
DROP FUNCTION IF EXISTS search_foods_all_fields(text);

-- Recreate search_foods_all_fields with a 20-row limit
CREATE OR REPLACE FUNCTION search_foods_all_fields(search_text TEXT)
RETURNS TABLE (
    food_id INTEGER,
    food_code TEXT,
    food_name TEXT,
    food_group TEXT,
    nutrient_name TEXT,
    value NUMERIC,
    unit TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (fi.food_id)
        fi.food_id,
        fi.food_code,
        fi.food_name,
        mg.group_name AS food_group,
        nd.nutrient_name,
        fnv.value,
        nd.unit
    FROM food_items fi
    LEFT JOIN major_groups mg ON mg.group_id = fi.major_group_id
    LEFT JOIN food_nutrient_values fnv ON fnv.food_id = fi.food_id
    LEFT JOIN nutrient_definitions nd ON nd.nutrient_id = fnv.nutrient_id
    WHERE
        fi.food_name ILIKE '%' || search_text || '%'
        OR fi.food_code ILIKE '%' || search_text || '%'
        OR mg.group_name ILIKE '%' || search_text || '%'
        OR nd.nutrient_name ILIKE '%' || search_text || '%'
    ORDER BY fi.food_id, fi.food_name
    LIMIT 20;
END;
$$ LANGUAGE plpgsql STABLE;

