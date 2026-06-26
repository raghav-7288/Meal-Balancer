-- =============================================================================
-- Diet Specifix — Supabase Diagnostic Queries
-- =============================================================================
-- Run these in the Supabase SQL Editor (Dashboard → SQL Editor) to audit
-- the database state. Results can be compared against SUPABASE_AUDIT.md.
--
-- Last updated: June 25, 2026
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ALL TABLES & COLUMNS
-- Lists every table in the public schema with column details.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.tables t
JOIN information_schema.columns c
    ON c.table_schema = t.table_schema AND c.table_name = t.table_name
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ALL VIEWS & THEIR COLUMNS
-- Shows every view in the public schema and its columns.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
    v.table_name AS view_name,
    c.column_name,
    c.data_type
FROM information_schema.views v
JOIN information_schema.columns c
    ON c.table_schema = v.table_schema AND c.table_name = v.table_name
WHERE v.table_schema = 'public'
ORDER BY v.table_name, c.ordinal_position;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. VIEW DEFINITIONS (actual SQL)
-- The raw SQL that defines each view.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT table_name AS view_name, view_definition
FROM information_schema.views
WHERE table_schema = 'public';


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ALL INDEXES
-- Lists every index in the public schema.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ALL FOREIGN KEYS
-- Shows FK relationships with cascade/restrict rules.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. ALL RLS POLICIES
-- Shows every Row Level Security policy.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. RLS STATUS PER TABLE
-- Shows whether RLS is enabled/forced for each table.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
    relname AS table_name,
    relrowsecurity AS rls_enabled,
    relforcerowsecurity AS rls_forced
FROM pg_class
WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND relkind = 'r'
ORDER BY relname;


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. ALL FUNCTIONS / RPCs
-- Lists all custom functions in the public schema.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    pg_get_function_result(p.oid) AS return_type,
    p.prosrc AS source_code,
    l.lanname AS language
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;


-- ─────────────────────────────────────────────────────────────────────────────
-- 9. ALL TRIGGERS
-- Lists triggers on public tables.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;


-- ─────────────────────────────────────────────────────────────────────────────
-- 10. TABLE ROW COUNTS
-- Approximate row counts for quick data presence check.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
    relname AS table_name,
    n_live_tup AS approx_row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;


-- ─────────────────────────────────────────────────────────────────────────────
-- 11. ALL GRANTS / PERMISSIONS
-- Shows who has what access to each table.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
ORDER BY table_name, grantee, privilege_type;


-- ─────────────────────────────────────────────────────────────────────────────
-- 12. EXTENSIONS INSTALLED
-- Shows all PostgreSQL extensions.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT extname, extversion
FROM pg_extension
ORDER BY extname;


-- ─────────────────────────────────────────────────────────────────────────────
-- 13. MISSING INDEXES ON FK COLUMNS
-- Identifies FK columns that lack an index (performance issue).
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
    tc.table_name,
    kcu.column_name AS fk_column,
    CASE WHEN i.indexname IS NOT NULL THEN '✅ Indexed' ELSE '❌ NO INDEX' END AS index_status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN pg_indexes i
    ON i.tablename = tc.table_name
    AND i.indexdef LIKE '%' || kcu.column_name || '%'
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;


-- ─────────────────────────────────────────────────────────────────────────────
-- 14. PRESET PLANS VERIFICATION
-- Checks preset plan structure and item counts.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT id, name, display_order, is_active,
       jsonb_array_length(meals->'Breakfast') AS breakfast_items,
       jsonb_array_length(meals->'Lunch') AS lunch_items,
       jsonb_array_length(meals->'Dinner') AS dinner_items,
       created_at
FROM preset_plans
ORDER BY display_order;


-- ─────────────────────────────────────────────────────────────────────────────
-- 15. FOOD DATA COVERAGE
-- Verifies all foods have nutrient data.
-- ─────────────────────────────────────────────────────────────────────────────
-- Foods per group
SELECT mg.group_name, COUNT(fi.food_id) AS food_count
FROM food_items fi
JOIN major_groups mg ON mg.major_group_id = fi.major_group_id
GROUP BY mg.group_name
ORDER BY food_count DESC;

-- Overall nutrient coverage
SELECT
    (SELECT COUNT(*) FROM food_items) AS total_foods,
    (SELECT COUNT(DISTINCT food_id) FROM food_nutrient_values) AS foods_with_nutrients,
    (SELECT COUNT(*) FROM nutrient_definitions) AS total_nutrient_types,
    (SELECT COUNT(*) FROM food_nutrient_values) AS total_nutrient_records;


-- ─────────────────────────────────────────────────────────────────────────────
-- 16. USER DATA HEALTH CHECK
-- Checks for data integrity issues with user data.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
    (SELECT COUNT(*) FROM user_plans) AS total_user_plans,
    (SELECT COUNT(*) FROM user_plans WHERE meals = '{}'::jsonb OR meals IS NULL) AS empty_plans,
    (SELECT COUNT(DISTINCT user_id) FROM user_plans) AS unique_users_with_plans,
    (SELECT COUNT(*) FROM user_profiles) AS total_profiles;


-- ─────────────────────────────────────────────────────────────────────────────
-- 17. ORPHAN CHECK
-- Finds user_plans where the user_id doesn't exist in user_profiles.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT up.id, up.user_id, up.name
FROM user_plans up
LEFT JOIN user_profiles prof ON prof.user_id = up.user_id
WHERE prof.user_id IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- 18. NULLABLE FIELDS CHECK
-- Finds potential data quality issues in nutrient_groups and nutrient_definitions.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT 'nutrient_groups with NULL display_order' AS check_name,
       COUNT(*) AS count
FROM nutrient_groups WHERE display_order IS NULL
UNION ALL
SELECT 'nutrient_definitions with NULL nutrient_code',
       COUNT(*)
FROM nutrient_definitions WHERE nutrient_code IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- 19. SEARCH PERFORMANCE TEST
-- Quick benchmark for the main food search RPC.
-- ─────────────────────────────────────────────────────────────────────────────
EXPLAIN ANALYZE
SELECT * FROM search_foods_all_fields('rice');


-- ─────────────────────────────────────────────────────────────────────────────
-- 20. VIEW PERFORMANCE CHECK
-- Checks how the food_search_view performs on a full scan.
-- ─────────────────────────────────────────────────────────────────────────────
EXPLAIN ANALYZE
SELECT COUNT(*) FROM food_search_view;

