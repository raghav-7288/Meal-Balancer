-- =============================================================================
-- Diet Specifix — PHASE 3 Supabase Diagnostics (READ-ONLY)
-- =============================================================================
-- Run in Supabase Dashboard → SQL Editor. Every query here is READ-ONLY
-- (SELECT / EXPLAIN only) — nothing is created, altered, or deleted.
--
-- Run each section and paste the results back. The comments explain what each
-- query checks and what a "healthy" vs "problem" result looks like.
--
-- Context: the previous snapshot (supabase/testQueryResult) predates the
-- meal_history (011) and daily_health_tracking (012) migrations, so it is STALE.
-- These queries re-capture the CURRENT state so we can compare against the
-- migrations and the application code before changing anything.
-- =============================================================================


-- ══════════════════════════════════════════════════════════════════════════
-- SECTION A — SCHEMA INVENTORY
-- ══════════════════════════════════════════════════════════════════════════

-- A1. All tables + columns + type + nullability + default
-- CHECK: which tables/columns actually exist, their types, NULLability, defaults.
-- WATCH: is meal_history & daily_health_tracking present? Does user_profiles have
--        activity/goal/diet_type/sex/bmi_target/avatar_url? Is username NOT NULL?
SELECT c.table_name, c.column_name, c.data_type, c.is_nullable, c.column_default
FROM information_schema.columns c
JOIN information_schema.tables t
  ON t.table_schema = c.table_schema AND t.table_name = c.table_name
WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
ORDER BY c.table_name, c.ordinal_position;

table_name,column_name,data_type,is_nullable,column_default
daily_health_tracking,id,uuid,NO,gen_random_uuid()
daily_health_tracking,user_id,uuid,NO,null
daily_health_tracking,date,date,NO,null
daily_health_tracking,water_glasses,integer,NO,0
daily_health_tracking,water_target,integer,NO,8
daily_health_tracking,steps,integer,NO,0
daily_health_tracking,steps_target,integer,NO,10000
daily_health_tracking,created_at,timestamp with time zone,YES,now()
daily_health_tracking,updated_at,timestamp with time zone,YES,now()
food_items,food_id,bigint,NO,nextval('food_items_food_id_seq'::regclass)
food_items,major_group_id,bigint,NO,null
food_items,food_code,character varying,NO,null
food_items,food_name,character varying,NO,null
food_nutrient_values,food_nutrient_value_id,bigint,NO,nextval('food_nutrient_values_food_nutrient_value_id_seq'::regclass)
food_nutrient_values,food_id,bigint,NO,null
food_nutrient_values,nutrient_id,bigint,NO,null
food_nutrient_values,value,numeric,NO,null
food_nutrient_values_staging,food_id,bigint,NO,null
food_nutrient_values_staging,n1,numeric,YES,null
food_nutrient_values_staging,n2,numeric,YES,null
food_nutrient_values_staging,n3,numeric,YES,null
food_nutrient_values_staging,n4,numeric,YES,null
food_nutrient_values_staging,n5,numeric,YES,null
food_nutrient_values_staging,n6,numeric,YES,null
food_nutrient_values_staging,n7,numeric,YES,null
food_nutrient_values_staging,n8,numeric,YES,null
food_nutrient_values_staging,n9,numeric,YES,null
food_nutrient_values_staging,n10,numeric,YES,null
food_nutrient_values_staging,n11,numeric,YES,null
food_nutrient_values_staging,n12,numeric,YES,null
food_nutrient_values_staging,n13,numeric,YES,null
food_nutrient_values_staging,n14,numeric,YES,null
food_nutrient_values_staging,n15,numeric,YES,null
food_nutrient_values_staging,n16,numeric,YES,null
food_nutrient_values_staging,n17,numeric,YES,null
food_nutrient_values_staging,n18,numeric,YES,null
food_nutrient_values_staging,n19,numeric,YES,null
food_nutrient_values_staging,n20,numeric,YES,null
food_nutrient_values_staging,n21,numeric,YES,null
food_nutrient_values_staging,n22,numeric,YES,null
food_nutrient_values_staging,n23,numeric,YES,null
food_nutrient_values_staging,n24,numeric,YES,null
food_nutrient_values_staging,n25,numeric,YES,null
food_nutrient_values_staging,n26,numeric,YES,null
food_nutrient_values_staging,n27,numeric,YES,null
food_nutrient_values_staging,n28,numeric,YES,null
food_nutrient_values_staging,n29,numeric,YES,null
food_nutrient_values_staging,n30,numeric,YES,null
food_nutrient_values_staging,n31,numeric,YES,null
food_nutrient_values_staging,n32,numeric,YES,null
food_nutrient_values_staging,n33,numeric,YES,null
food_nutrient_values_staging,n34,numeric,YES,null
food_nutrient_values_staging,n35,numeric,YES,null
food_nutrient_values_staging,n36,numeric,YES,null
food_nutrient_values_staging,n37,numeric,YES,null
food_nutrient_values_staging,n38,numeric,YES,null
health_goals,health_goal_id,bigint,NO,nextval('health_goals_health_goal_id_seq'::regclass)
health_goals,goal_code,character varying,NO,null
health_goals,goal_name,character varying,NO,null
health_goals,description,text,YES,null
health_goals,is_active,boolean,NO,true
health_goals,display_order,integer,NO,null
major_groups,major_group_id,bigint,NO,nextval('major_groups_major_group_id_seq'::regclass)
major_groups,group_code,character varying,NO,null
major_groups,group_name,character varying,NO,null
meal_history,id,uuid,NO,gen_random_uuid()
meal_history,user_id,uuid,NO,null
meal_history,date,date,NO,null
meal_history,timestamp,bigint,NO,null
meal_history,plan_name,text,YES,null
meal_history,score,integer,YES,0
meal_history,band,text,YES,''::text
meal_history,kcal,integer,YES,0
meal_history,protein,integer,YES,0
meal_history,carbs,integer,YES,0
meal_history,fat,integer,YES,0
meal_history,fibre,integer,YES,0
meal_history,vegetables_g,integer,YES,0
meal_history,visible_fat,integer,YES,0
meal_history,created_at,timestamp with time zone,YES,now()
meal_history,updated_at,timestamp with time zone,YES,now()
nutrient_definitions,nutrient_id,bigint,NO,nextval('nutrient_definitions_nutrient_id_seq'::regclass)
nutrient_definitions,nutrient_group_id,bigint,NO,null
nutrient_definitions,nutrient_name,character varying,NO,null
nutrient_definitions,nutrient_code,character varying,NO,null
nutrient_definitions,unit,character varying,NO,null
nutrient_groups,nutrient_group_id,bigint,NO,nextval('nutrient_groups_nutrient_group_id_seq'::regclass)
nutrient_groups,group_name,character varying,NO,null
nutrient_groups,description,text,YES,null
nutrient_groups,display_order,integer,NO,0
preset_plans,id,uuid,NO,gen_random_uuid()
preset_plans,name,text,NO,null
preset_plans,meals,jsonb,NO,'{}'::jsonb
preset_plans,guidelines,text,YES,''::text
preset_plans,display_order,integer,NO,0
preset_plans,is_active,boolean,NO,true
preset_plans,created_at,timestamp with time zone,NO,now()
preset_plans,updated_at,timestamp with time zone,NO,now()
user_plans,id,uuid,NO,gen_random_uuid()
user_plans,user_id,uuid,NO,null
user_plans,name,text,NO,null
user_plans,meals,jsonb,NO,'{}'::jsonb
user_plans,guidelines,text,YES,''::text
user_plans,created_at,timestamp with time zone,NO,now()
user_plans,updated_at,timestamp with time zone,NO,now()
user_profile_health_goals,user_id,uuid,NO,null
user_profile_health_goals,health_goal_id,bigint,NO,null
user_profile_health_goals,created_at,timestamp with time zone,YES,now()
user_profiles,user_id,uuid,NO,null
user_profiles,username,text,NO,null
user_profiles,full_name,text,YES,null
user_profiles,created_at,timestamp with time zone,YES,now()
user_profiles,height_cm,numeric,YES,null
user_profiles,weight_kg,numeric,YES,null
user_profiles,current_bmi,numeric,YES,null
user_profiles,age,integer,YES,null
user_profiles,contact_number,character varying,YES,null
user_profiles,activity,text,YES,'moderate'::text
user_profiles,goal,text,YES,'maintenance'::text
user_profiles,diet_type,text,YES,'vegetarian'::text
user_profiles,sex,text,YES,'female'::text
user_profiles,bmi_target,text,YES,'22'::text
user_profiles,avatar_url,text,YES,null

-- A2. All views + columns
SELECT v.table_name AS view_name, c.column_name, c.data_type, c.ordinal_position
FROM information_schema.views v
JOIN information_schema.columns c
  ON c.table_schema = v.table_schema AND c.table_name = v.table_name
WHERE v.table_schema = 'public'
ORDER BY v.table_name, c.ordinal_position;

view_name,column_name,data_type,ordinal_position
food_search_view,food_id,bigint,1
food_search_view,food_code,character varying,2
food_search_view,food_name,character varying,3
food_search_view,major_group_id,bigint,4
food_search_view,group_code,character varying,5
food_search_view,food_group,character varying,6
food_search_view,nutrient_id,bigint,7
food_search_view,nutrient_name,character varying,8
food_search_view,nutrient_code,character varying,9
food_search_view,unit,character varying,10
food_search_view,nutrient_group_id,bigint,11
food_search_view,nutrient_group,character varying,12
food_search_view,value,numeric,13

-- A3. View definitions (raw SQL) — confirm food_search_view exists & its JOINs
SELECT table_name AS view_name, view_definition
FROM information_schema.views
WHERE table_schema = 'public';

view_name,view_definition
food_search_view," SELECT fi.food_id,
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
   FROM ((((food_items fi
     JOIN major_groups mg ON ((mg.major_group_id = fi.major_group_id)))
     LEFT JOIN food_nutrient_values fnv ON ((fnv.food_id = fi.food_id)))
     LEFT JOIN nutrient_definitions nd ON ((nd.nutrient_id = fnv.nutrient_id)))
     LEFT JOIN nutrient_groups ng ON ((ng.nutrient_group_id = nd.nutrient_group_id)));"

-- A4. Materialized views (if any)
SELECT schemaname, matviewname FROM pg_matviews WHERE schemaname = 'public';

Success. No rows returned



-- ══════════════════════════════════════════════════════════════════════════
-- SECTION B — KEYS, CONSTRAINTS & INDEXES
-- ══════════════════════════════════════════════════════════════════════════

-- B1. Primary keys
SELECT tc.table_name, kcu.column_name, kcu.ordinal_position, tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.ordinal_position;

table_name,column_name,ordinal_position,constraint_name
daily_health_tracking,id,1,daily_health_tracking_pkey
food_items,food_id,1,food_items_pkey
food_nutrient_values,food_nutrient_value_id,1,food_nutrient_values_pkey
health_goals,health_goal_id,1,health_goals_pkey
major_groups,major_group_id,1,major_groups_pkey
meal_history,id,1,meal_history_pkey
nutrient_definitions,nutrient_id,1,nutrient_definitions_pkey
nutrient_groups,nutrient_group_id,1,nutrient_groups_pkey
preset_plans,id,1,preset_plans_pkey
user_plans,id,1,user_plans_pkey
user_profile_health_goals,user_id,1,user_profile_health_goals_pkey
user_profile_health_goals,health_goal_id,2,user_profile_health_goals_pkey
user_profiles,user_id,1,user_profiles_pkey

-- B2. Foreign keys — INCLUDING cross-schema FKs to auth.users (pg_catalog based).
-- CHECK: does user_plans/meal_history/daily_health_tracking/user_profiles/
--        user_profile_health_goals reference auth.users(id) ON DELETE CASCADE?
--        Does user_profile_health_goals.user_id point at auth.users or user_profiles?
SELECT
  cl.relname       AS table_name,
  att.attname      AS column_name,
  fns.nspname      AS foreign_schema,
  fcl.relname      AS foreign_table,
  fatt.attname     AS foreign_column,
  CASE con.confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
       WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END AS on_delete,
  CASE con.confupdtype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
       WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END AS on_update,
  con.conname
FROM pg_constraint con
JOIN pg_class cl       ON cl.oid = con.conrelid
JOIN pg_namespace ns   ON ns.oid = cl.relnamespace
JOIN pg_class fcl      ON fcl.oid = con.confrelid
JOIN pg_namespace fns  ON fns.oid = fcl.relnamespace
JOIN unnest(con.conkey)  WITH ORDINALITY AS ck(attnum, ord) ON true
JOIN unnest(con.confkey) WITH ORDINALITY AS fk(attnum, ord) ON fk.ord = ck.ord
JOIN pg_attribute att  ON att.attrelid = con.conrelid  AND att.attnum  = ck.attnum
JOIN pg_attribute fatt ON fatt.attrelid = con.confrelid AND fatt.attnum = fk.attnum
WHERE con.contype = 'FOREIGN KEY' AND ns.nspname = 'public'
ORDER BY table_name, column_name;

Success. No rows returned



-- B3. Unique constraints & unique indexes
SELECT t.relname AS table_name, i.relname AS index_name, idx.indisunique AS is_unique,
       pg_get_indexdef(i.oid) AS definition
FROM pg_index idx
JOIN pg_class i ON i.oid = idx.indexrelid
JOIN pg_class t ON t.oid = idx.indrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public' AND idx.indisunique
ORDER BY t.relname, i.relname;

table_name,index_name,is_unique,definition
daily_health_tracking,daily_health_tracking_pkey,true,CREATE UNIQUE INDEX daily_health_tracking_pkey ON public.daily_health_tracking USING btree (id)
    daily_health_tracking,uq_daily_health_user_date,true,"CREATE UNIQUE INDEX uq_daily_health_user_date ON public.daily_health_tracking USING btree (user_id, date)"
food_items,food_items_food_code_key,true,CREATE UNIQUE INDEX food_items_food_code_key ON public.food_items USING btree (food_code)
    food_items,food_items_pkey,true,CREATE UNIQUE INDEX food_items_pkey ON public.food_items USING btree (food_id)
    food_nutrient_values,food_nutrient_values_pkey,true,CREATE UNIQUE INDEX food_nutrient_values_pkey ON public.food_nutrient_values USING btree (food_nutrient_value_id)
    food_nutrient_values,uq_food_nutrient,true,"CREATE UNIQUE INDEX uq_food_nutrient ON public.food_nutrient_values USING btree (food_id, nutrient_id)"
health_goals,health_goals_goal_code_key,true,CREATE UNIQUE INDEX health_goals_goal_code_key ON public.health_goals USING btree (goal_code)
    health_goals,health_goals_goal_name_key,true,CREATE UNIQUE INDEX health_goals_goal_name_key ON public.health_goals USING btree (goal_name)
    health_goals,health_goals_pkey,true,CREATE UNIQUE INDEX health_goals_pkey ON public.health_goals USING btree (health_goal_id)
    major_groups,major_groups_group_code_key,true,CREATE UNIQUE INDEX major_groups_group_code_key ON public.major_groups USING btree (group_code)
    major_groups,major_groups_pkey,true,CREATE UNIQUE INDEX major_groups_pkey ON public.major_groups USING btree (major_group_id)
    meal_history,meal_history_pkey,true,CREATE UNIQUE INDEX meal_history_pkey ON public.meal_history USING btree (id)
    meal_history,uq_meal_history_user_date,true,"CREATE UNIQUE INDEX uq_meal_history_user_date ON public.meal_history USING btree (user_id, date)"
nutrient_definitions,nutrient_definitions_nutrient_name_key,true,CREATE UNIQUE INDEX nutrient_definitions_nutrient_name_key ON public.nutrient_definitions USING btree (nutrient_name)
    nutrient_definitions,nutrient_definitions_pkey,true,CREATE UNIQUE INDEX nutrient_definitions_pkey ON public.nutrient_definitions USING btree (nutrient_id)
    nutrient_groups,nutrient_groups_group_name_key,true,CREATE UNIQUE INDEX nutrient_groups_group_name_key ON public.nutrient_groups USING btree (group_name)
    nutrient_groups,nutrient_groups_pkey,true,CREATE UNIQUE INDEX nutrient_groups_pkey ON public.nutrient_groups USING btree (nutrient_group_id)
    preset_plans,preset_plans_pkey,true,CREATE UNIQUE INDEX preset_plans_pkey ON public.preset_plans USING btree (id)
    user_plans,user_plans_pkey,true,CREATE UNIQUE INDEX user_plans_pkey ON public.user_plans USING btree (id)
    user_profile_health_goals,user_profile_health_goals_pkey,true,"CREATE UNIQUE INDEX user_profile_health_goals_pkey ON public.user_profile_health_goals USING btree (user_id, health_goal_id)"
user_profiles,user_profiles_pkey,true,CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (user_id)
    user_profiles,user_profiles_username_key,true,CREATE UNIQUE INDEX user_profiles_username_key ON public.user_profiles USING btree (username)

-- B4. CHECK constraints — confirm user_profiles enum guards (activity/goal/diet_type/sex)
SELECT cl.relname AS table_name, con.conname, pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class cl ON cl.oid = con.conrelid
JOIN pg_namespace ns ON ns.oid = cl.relnamespace
WHERE con.contype = 'c' AND ns.nspname = 'public'
ORDER BY table_name, con.conname;

table_name,conname,definition
user_profiles,chk_activity,"CHECK ((activity = ANY (ARRAY['sedentary'::text, 'moderate'::text, 'heavy'::text])))"
user_profiles,chk_diet_type,"CHECK ((diet_type = ANY (ARRAY['vegetarian'::text, 'eggetarian'::text, 'non-vegetarian'::text, 'Jain-compatible'::text])))"
user_profiles,chk_goal,"CHECK ((goal = ANY (ARRAY['maintenance'::text, 'weight loss'::text, 'weight gain'::text, 'metabolic improvement'::text])))"
user_profiles,chk_sex,"CHECK ((sex = ANY (ARRAY['male'::text, 'female'::text])))"

-- B5. All indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes WHERE schemaname = 'public'
ORDER BY tablename, indexname;

tablename,indexname,indexdef
daily_health_tracking,daily_health_tracking_pkey,CREATE UNIQUE INDEX daily_health_tracking_pkey ON public.daily_health_tracking USING btree (id)
    daily_health_tracking,idx_daily_health_user_date,"CREATE INDEX idx_daily_health_user_date ON public.daily_health_tracking USING btree (user_id, date DESC)"
daily_health_tracking,idx_daily_health_user_id,CREATE INDEX idx_daily_health_user_id ON public.daily_health_tracking USING btree (user_id)
    daily_health_tracking,uq_daily_health_user_date,"CREATE UNIQUE INDEX uq_daily_health_user_date ON public.daily_health_tracking USING btree (user_id, date)"
food_items,food_items_food_code_key,CREATE UNIQUE INDEX food_items_food_code_key ON public.food_items USING btree (food_code)
    food_items,food_items_pkey,CREATE UNIQUE INDEX food_items_pkey ON public.food_items USING btree (food_id)
    food_items,idx_food_items_food_code_trgm,CREATE INDEX idx_food_items_food_code_trgm ON public.food_items USING gin (food_code gin_trgm_ops)
    food_items,idx_food_items_food_name_trgm,CREATE INDEX idx_food_items_food_name_trgm ON public.food_items USING gin (food_name gin_trgm_ops)
    food_items,idx_food_items_major_group_id,CREATE INDEX idx_food_items_major_group_id ON public.food_items USING btree (major_group_id)
    food_nutrient_values,food_nutrient_values_pkey,CREATE UNIQUE INDEX food_nutrient_values_pkey ON public.food_nutrient_values USING btree (food_nutrient_value_id)
    food_nutrient_values,uq_food_nutrient,"CREATE UNIQUE INDEX uq_food_nutrient ON public.food_nutrient_values USING btree (food_id, nutrient_id)"
health_goals,health_goals_goal_code_key,CREATE UNIQUE INDEX health_goals_goal_code_key ON public.health_goals USING btree (goal_code)
    health_goals,health_goals_goal_name_key,CREATE UNIQUE INDEX health_goals_goal_name_key ON public.health_goals USING btree (goal_name)
    health_goals,health_goals_pkey,CREATE UNIQUE INDEX health_goals_pkey ON public.health_goals USING btree (health_goal_id)
    major_groups,idx_major_groups_group_name_trgm,CREATE INDEX idx_major_groups_group_name_trgm ON public.major_groups USING gin (group_name gin_trgm_ops)
    major_groups,major_groups_group_code_key,CREATE UNIQUE INDEX major_groups_group_code_key ON public.major_groups USING btree (group_code)
    major_groups,major_groups_pkey,CREATE UNIQUE INDEX major_groups_pkey ON public.major_groups USING btree (major_group_id)
    meal_history,idx_meal_history_user_date,"CREATE INDEX idx_meal_history_user_date ON public.meal_history USING btree (user_id, date DESC)"
meal_history,idx_meal_history_user_id,CREATE INDEX idx_meal_history_user_id ON public.meal_history USING btree (user_id)
    meal_history,meal_history_pkey,CREATE UNIQUE INDEX meal_history_pkey ON public.meal_history USING btree (id)
    meal_history,uq_meal_history_user_date,"CREATE UNIQUE INDEX uq_meal_history_user_date ON public.meal_history USING btree (user_id, date)"
nutrient_definitions,idx_nutrient_definitions_nutrient_group_id,CREATE INDEX idx_nutrient_definitions_nutrient_group_id ON public.nutrient_definitions USING btree (nutrient_group_id)
    nutrient_definitions,nutrient_definitions_nutrient_name_key,CREATE UNIQUE INDEX nutrient_definitions_nutrient_name_key ON public.nutrient_definitions USING btree (nutrient_name)
    nutrient_definitions,nutrient_definitions_pkey,CREATE UNIQUE INDEX nutrient_definitions_pkey ON public.nutrient_definitions USING btree (nutrient_id)
    nutrient_groups,nutrient_groups_group_name_key,CREATE UNIQUE INDEX nutrient_groups_group_name_key ON public.nutrient_groups USING btree (group_name)
    nutrient_groups,nutrient_groups_pkey,CREATE UNIQUE INDEX nutrient_groups_pkey ON public.nutrient_groups USING btree (nutrient_group_id)
    preset_plans,preset_plans_pkey,CREATE UNIQUE INDEX preset_plans_pkey ON public.preset_plans USING btree (id)
    user_plans,idx_user_plans_user_id,CREATE INDEX idx_user_plans_user_id ON public.user_plans USING btree (user_id)
    user_plans,user_plans_pkey,CREATE UNIQUE INDEX user_plans_pkey ON public.user_plans USING btree (id)
    user_profile_health_goals,user_profile_health_goals_pkey,"CREATE UNIQUE INDEX user_profile_health_goals_pkey ON public.user_profile_health_goals USING btree (user_id, health_goal_id)"
user_profiles,user_profiles_pkey,CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (user_id)
    user_profiles,user_profiles_username_key,CREATE UNIQUE INDEX user_profiles_username_key ON public.user_profiles USING btree (username)

-- B6. FK columns MISSING an index (perf)
SELECT tc.table_name, kcu.column_name AS fk_column,
       CASE WHEN i.indexname IS NOT NULL THEN 'indexed' ELSE 'NO INDEX' END AS status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name
LEFT JOIN pg_indexes i ON i.tablename = tc.table_name AND i.indexdef LIKE '%(' || kcu.column_name || '%'
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name;


table_name,fk_column,status
daily_health_tracking,user_id,indexed
daily_health_tracking,user_id,indexed
daily_health_tracking,user_id,indexed
food_items,major_group_id,indexed
food_nutrient_values,nutrient_id,NO INDEX
food_nutrient_values,food_id,indexed
meal_history,user_id,indexed
meal_history,user_id,indexed
meal_history,user_id,indexed
nutrient_definitions,nutrient_group_id,indexed
user_plans,user_id,indexed
user_profile_health_goals,health_goal_id,NO INDEX
user_profile_health_goals,user_id,indexed
user_profiles,user_id,indexed

-- ══════════════════════════════════════════════════════════════════════════
-- SECTION C — SECURITY: RLS, POLICIES, GRANTS, FUNCTIONS, TRIGGERS
-- ══════════════════════════════════════════════════════════════════════════

-- C1. RLS enabled/forced per table.
-- WATCH: any user-data or staging table with rls_enabled = false is a hole.
SELECT relname AS table_name, relrowsecurity AS rls_enabled, relforcerowsecurity AS rls_forced
FROM pg_class
WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND relkind = 'r'
ORDER BY relname;


table_name,rls_enabled,rls_forced
daily_health_tracking,true,false
food_items,true,false
food_nutrient_values,true,false
food_nutrient_values_staging,true,false
health_goals,true,false
major_groups,true,false
meal_history,true,false
nutrient_definitions,true,false
nutrient_groups,true,false
preset_plans,true,false
user_plans,true,false
user_profile_health_goals,true,false
user_profiles,true,false


-- C2. RLS policies (per table / command / roles / using / with_check)
-- WATCH: preset_plans INSERT/UPDATE/DELETE policies granted to `authenticated`
--        WITH CHECK (true) → ANY logged-in user can edit global preset plans.
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

tablename,policyname,permissive,roles,cmd,qual,with_check
daily_health_tracking,Users can delete their own daily health tracking,PERMISSIVE,{public},DELETE,(auth.uid() = user_id),null
    daily_health_tracking,Users can insert their own daily health tracking,PERMISSIVE,{public},INSERT,null,(auth.uid() = user_id)
    daily_health_tracking,Users can view their own daily health tracking,PERMISSIVE,{public},SELECT,(auth.uid() = user_id),null
daily_health_tracking,Users can update their own daily health tracking,PERMISSIVE,{public},UPDATE,(auth.uid() = user_id),(auth.uid() = user_id)
    food_items,Anyone can read food items,PERMISSIVE,{public},SELECT,true,null
food_nutrient_values,Anyone can read food nutrient values,PERMISSIVE,{public},SELECT,true,null
health_goals,Anyone can read active health goals,PERMISSIVE,{public},SELECT,(is_active = true),null
major_groups,Anyone can read major groups,PERMISSIVE,{public},SELECT,true,null
meal_history,Users can delete their own meal history,PERMISSIVE,{public},DELETE,(auth.uid() = user_id),null
    meal_history,Users can insert their own meal history,PERMISSIVE,{public},INSERT,null,(auth.uid() = user_id)
    meal_history,Users can view their own meal history,PERMISSIVE,{public},SELECT,(auth.uid() = user_id),null
meal_history,Users can update their own meal history,PERMISSIVE,{public},UPDATE,(auth.uid() = user_id),(auth.uid() = user_id)
    nutrient_definitions,Anyone can read nutrient definitions,PERMISSIVE,{public},SELECT,true,null
nutrient_groups,Anyone can read nutrient groups,PERMISSIVE,{public},SELECT,true,null
preset_plans,Authenticated users can delete preset plans,PERMISSIVE,{authenticated},DELETE,true,null
    preset_plans,Authenticated users can insert preset plans,PERMISSIVE,{authenticated},INSERT,null,true
    preset_plans,Anyone can read active preset plans,PERMISSIVE,{anon},SELECT,(is_active = true),null
preset_plans,Authenticated can read all preset plans,PERMISSIVE,{authenticated},SELECT,true,null
preset_plans,Authenticated users can update preset plans,PERMISSIVE,{authenticated},UPDATE,true,true
    user_plans,Users can delete their own plans,PERMISSIVE,{public},DELETE,(auth.uid() = user_id),null
    user_plans,Users can create their own plans,PERMISSIVE,{public},INSERT,null,(auth.uid() = user_id)
user_plans,Users can view their own plans,PERMISSIVE,{public},SELECT,(auth.uid() = user_id),null
user_plans,Users can update their own plans,PERMISSIVE,{public},UPDATE,(auth.uid() = user_id),(auth.uid() = user_id)
    user_profile_health_goals,Users can remove their own health goals,PERMISSIVE,{public},DELETE,(auth.uid() = user_id),null
                                                                                              user_profile_health_goals,Users can add their own health goals,PERMISSIVE,{public},INSERT,null,(auth.uid() = user_id)
                                                                                                                                                                                     user_profile_health_goals,Users can view their own health goals,PERMISSIVE,{public},SELECT,(auth.uid() = user_id),null
user_profile_health_goals,Users can update their own health goals,PERMISSIVE,{public},UPDATE,(auth.uid() = user_id),(auth.uid() = user_id)
    user_profiles,Users can delete their own profile,PERMISSIVE,{public},DELETE,(auth.uid() = user_id),null
    user_profiles,Users can create their own profile,PERMISSIVE,{public},INSERT,null,(auth.uid() = user_id)
user_profiles,Users can view their own profile,PERMISSIVE,{public},SELECT,(auth.uid() = user_id),null
user_profiles,Users can update their own profile,PERMISSIVE,{public},UPDATE,(auth.uid() = user_id),(auth.uid() = user_id)



-- C3. Table grants (role × privilege).
-- WATCH: anon / authenticated holding INSERT/UPDATE/DELETE/TRUNCATE on read-only
--        reference tables or on food_nutrient_values_staging.
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee IN ('anon','authenticated')
ORDER BY table_name, grantee, privilege_type;


grantee,table_name,privilege_type
anon,daily_health_tracking,DELETE
                               anon,daily_health_tracking,INSERT
                                                              anon,daily_health_tracking,REFERENCES
                                                              anon,daily_health_tracking,SELECT
                                                                                             anon,daily_health_tracking,TRIGGER
        anon,daily_health_tracking,TRUNCATE
        anon,daily_health_tracking,UPDATE
        authenticated,daily_health_tracking,DELETE
        authenticated,daily_health_tracking,INSERT
        authenticated,daily_health_tracking,REFERENCES
                                                                                             authenticated,daily_health_tracking,SELECT
                                                                                                                                     authenticated,daily_health_tracking,TRIGGER
        authenticated,daily_health_tracking,TRUNCATE
        authenticated,daily_health_tracking,UPDATE
        anon,food_items,REFERENCES
                                                                                                                                     anon,food_items,SELECT
                                                                                                                                                         anon,food_items,TRIGGER
        authenticated,food_items,REFERENCES
                                                                                                                                                         authenticated,food_items,SELECT
                                                                                                                                                                                      authenticated,food_items,TRIGGER
        anon,food_nutrient_values,REFERENCES
                                                                                                                                                                                      anon,food_nutrient_values,SELECT
                                                                                                                                                                                                                    anon,food_nutrient_values,TRIGGER
        authenticated,food_nutrient_values,REFERENCES
                                                                                                                                                                                                                    authenticated,food_nutrient_values,SELECT
                                                                                                                                                                                                                                                           authenticated,food_nutrient_values,TRIGGER
        anon,food_search_view,REFERENCES
                                                                                                                                                                                                                                                           anon,food_search_view,SELECT
                                                                                                                                                                                                                                                                                     anon,food_search_view,TRIGGER
        authenticated,food_search_view,REFERENCES
                                                                                                                                                                                                                                                                                     authenticated,food_search_view,SELECT
                                                                                                                                                                                                                                                                                                                        authenticated,food_search_view,TRIGGER
        anon,health_goals,REFERENCES
                                                                                                                                                                                                                                                                                                                        anon,health_goals,SELECT
                                                                                                                                                                                                                                                                                                                                              anon,health_goals,TRIGGER
        authenticated,health_goals,REFERENCES
                                                                                                                                                                                                                                                                                                                                              authenticated,health_goals,SELECT
                                                                                                                                                                                                                                                                                                                                                                             authenticated,health_goals,TRIGGER
        anon,major_groups,REFERENCES
                                                                                                                                                                                                                                                                                                                                                                             anon,major_groups,SELECT
                                                                                                                                                                                                                                                                                                                                                                                                   anon,major_groups,TRIGGER
        authenticated,major_groups,REFERENCES
                                                                                                                                                                                                                                                                                                                                                                                                   authenticated,major_groups,SELECT
                                                                                                                                                                                                                                                                                                                                                                                                                                  authenticated,major_groups,TRIGGER
        anon,meal_history,DELETE
        anon,meal_history,INSERT
        anon,meal_history,REFERENCES
                                                                                                                                                                                                                                                                                                                                                                                                                                  anon,meal_history,SELECT
                                                                                                                                                                                                                                                                                                                                                                                                                                                        anon,meal_history,TRIGGER
        anon,meal_history,TRUNCATE
        anon,meal_history,UPDATE
        authenticated,meal_history,DELETE
        authenticated,meal_history,INSERT
        authenticated,meal_history,REFERENCES
                                                                                                                                                                                                                                                                                                                                                                                                                                                        authenticated,meal_history,SELECT
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       authenticated,meal_history,TRIGGER
        authenticated,meal_history,TRUNCATE
        authenticated,meal_history,UPDATE
        anon,nutrient_definitions,REFERENCES
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       anon,nutrient_definitions,SELECT
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     anon,nutrient_definitions,TRIGGER
        authenticated,nutrient_definitions,REFERENCES
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     authenticated,nutrient_definitions,SELECT
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            authenticated,nutrient_definitions,TRIGGER
        anon,nutrient_groups,REFERENCES
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            anon,nutrient_groups,SELECT
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     anon,nutrient_groups,TRIGGER
        authenticated,nutrient_groups,REFERENCES
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     authenticated,nutrient_groups,SELECT
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       authenticated,nutrient_groups,TRIGGER
        anon,preset_plans,REFERENCES
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       anon,preset_plans,SELECT
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             anon,preset_plans,TRIGGER
        authenticated,preset_plans,DELETE
        authenticated,preset_plans,INSERT
        authenticated,preset_plans,REFERENCES
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             authenticated,preset_plans,SELECT
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            authenticated,preset_plans,TRIGGER
        authenticated,preset_plans,TRUNCATE
        authenticated,preset_plans,UPDATE
        anon,user_plans,DELETE
        anon,user_plans,INSERT
        anon,user_plans,REFERENCES
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            anon,user_plans,SELECT
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                anon,user_plans,TRIGGER
        anon,user_plans,TRUNCATE
        anon,user_plans,UPDATE
        authenticated,user_plans,DELETE
        authenticated,user_plans,INSERT
        authenticated,user_plans,REFERENCES
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                authenticated,user_plans,SELECT
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             authenticated,user_plans,TRIGGER
        authenticated,user_plans,TRUNCATE
        authenticated,user_plans,UPDATE
        anon,user_profile_health_goals,DELETE
        anon,user_profile_health_goals,INSERT
        anon,user_profile_health_goals,REFERENCES
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             anon,user_profile_health_goals,SELECT
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                anon,user_profile_health_goals,TRIGGER
        anon,user_profile_health_goals,TRUNCATE
        anon,user_profile_health_goals,UPDATE
        authenticated,user_profile_health_goals,DELETE
        authenticated,user_profile_health_goals,INSERT
        authenticated,user_profile_health_goals,REFERENCES
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                authenticated,user_profile_health_goals,SELECT
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            authenticated,user_profile_health_goals,TRIGGER
        authenticated,user_profile_health_goals,TRUNCATE
        authenticated,user_profile_health_goals,UPDATE
        anon,user_profiles,DELETE
        anon,user_profiles,INSERT
        anon,user_profiles,REFERENCES
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            anon,user_profiles,SELECT
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   anon,user_profiles,TRIGGER
        anon,user_profiles,TRUNCATE
        anon,user_profiles,UPDATE
        authenticated,user_profiles,DELETE
        authenticated,user_profiles,INSERT
        authenticated,user_profiles,REFERENCES
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   authenticated,user_profiles,SELECT
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   authenticated,user_profiles,TRIGGER
        authenticated,user_profiles,TRUNCATE
        authenticated,user_profiles,UPDATE


-- C4. Functions / RPCs with full signature, return type, volatility, security.
-- WATCH: search_foods_all_fields arg list (must be text, integer, integer),
--        presence of get_food_details / search_nutrient_foods / search_foods,
--        and SECURITY DEFINER functions (handle_new_user).
SELECT p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS arguments,
       pg_get_function_result(p.oid) AS returns,
       CASE p.provolatile WHEN 'i' THEN 'IMMUTABLE' WHEN 's' THEN 'STABLE' ELSE 'VOLATILE' END AS volatility,
       p.prosecdef AS security_definer
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('search_foods_all_fields','get_food_details','search_nutrient_foods',
                    'search_foods','handle_updated_at','handle_new_user')
ORDER BY p.proname;


function_name,arguments,returns,volatility,security_definer
get_food_details,p_food_id bigint,"TABLE(food_id bigint, food_code character varying, food_name character varying, food_group character varying, nutrient_id bigint, nutrient_name character varying, nutrient_code character varying, nutrient_group character varying, unit character varying, value numeric)",STABLE,false
handle_new_user,,trigger,VOLATILE,true
handle_updated_at,,trigger,VOLATILE,false
search_foods,search_text text,"TABLE(food_id bigint, food_code character varying, food_name character varying, food_group character varying)",STABLE,false
search_foods_all_fields,"search_text text, p_limit integer, p_offset integer","TABLE(food_id integer, food_code text, food_name text, food_group text, nutrient_name text, value numeric, unit text)",STABLE,false
search_nutrient_foods,nutrient_search text,"TABLE(food_id bigint, food_code character varying, food_name character varying, food_group character varying, nutrient_name character varying, nutrient_value numeric, unit character varying)",STABLE,false



-- C5. Full source of the search/detail RPCs (verify JOINs, LIMITs, return columns)
SELECT p.proname, pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('search_foods_all_fields','get_food_details','search_nutrient_foods','search_foods');


proname,definition
get_food_details,"CREATE OR REPLACE FUNCTION public.get_food_details(p_food_id bigint)
 RETURNS TABLE(food_id bigint, food_code character varying, food_name character varying, food_group character varying, nutrient_id bigint, nutrient_name character varying, nutrient_code character varying, nutrient_group character varying, unit character varying, value numeric)
 LANGUAGE sql
 STABLE
AS $function$
    select
        fsv.food_id,
        fsv.food_code,
        fsv.food_name,
        fsv.food_group,
        fsv.nutrient_id,
        fsv.nutrient_name,
        fsv.nutrient_code,
        fsv.nutrient_group,
        fsv.unit,
        fsv.value
    from public.food_search_view fsv
    where fsv.food_id = p_food_id
    order by fsv.nutrient_group, fsv.nutrient_name;
$function$
"
search_foods,"CREATE OR REPLACE FUNCTION public.search_foods(search_text text)
 RETURNS TABLE(food_id bigint, food_code character varying, food_name character varying, food_group character varying)
 LANGUAGE sql
 STABLE
AS $function$
    select distinct
        fsv.food_id,
        fsv.food_code,
        fsv.food_name,
        fsv.food_group
    from public.food_search_view fsv
    where
        fsv.food_name ilike '%' || search_text || '%'
        or fsv.food_code ilike '%' || search_text || '%'
        or fsv.food_group ilike '%' || search_text || '%'
        or fsv.nutrient_name ilike '%' || search_text || '%'
        or fsv.nutrient_group ilike '%' || search_text || '%'
    order by fsv.food_name
    limit 20;
$function$
"
search_foods_all_fields,"CREATE OR REPLACE FUNCTION public.search_foods_all_fields(search_text text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(food_id integer, food_code text, food_name text, food_group text, nutrient_name text, value numeric, unit text)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (fi.food_id)
        fi.food_id::INTEGER,
        fi.food_code::TEXT,
        fi.food_name::TEXT,
        mg.group_name::TEXT AS food_group,
        nd.nutrient_name::TEXT,
        fnv.value,
        nd.unit::TEXT
    FROM food_items fi
    LEFT JOIN major_groups mg ON mg.major_group_id = fi.major_group_id
    LEFT JOIN food_nutrient_values fnv ON fnv.food_id = fi.food_id
    LEFT JOIN nutrient_definitions nd ON nd.nutrient_id = fnv.nutrient_id
    WHERE
        fi.food_name ILIKE '%' || search_text || '%'
        OR fi.food_code ILIKE '%' || search_text || '%'
        OR mg.group_name ILIKE '%' || search_text || '%'
        OR nd.nutrient_name ILIKE '%' || search_text || '%'
    ORDER BY fi.food_id, fi.food_name
    LIMIT p_limit
    OFFSET p_offset;
END;
$function$
"
search_nutrient_foods,"CREATE OR REPLACE FUNCTION public.search_nutrient_foods(nutrient_search text)
 RETURNS TABLE(food_id bigint, food_code character varying, food_name character varying, food_group character varying, nutrient_name character varying, nutrient_value numeric, unit character varying)
 LANGUAGE sql
 STABLE
AS $function$
select
    fi.food_id,
    fi.food_code,
    fi.food_name,
    mg.group_name,
    nd.nutrient_name,
    fnv.value,
    nd.unit
from food_nutrient_values fnv
join food_items fi
    on fi.food_id = fnv.food_id
join major_groups mg
    on mg.major_group_id = fi.major_group_id
join nutrient_definitions nd
    on nd.nutrient_id = fnv.nutrient_id
where
    nd.nutrient_name ilike '%' || nutrient_search || '%'
order by fnv.value desc
limit 100;
$function$
"


-- C6. Triggers on public tables (+ the auth.users signup trigger)
SELECT event_object_table AS table_name, trigger_name, action_timing,
       event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;


table_name,trigger_name,action_timing,event_manipulation,action_statement
daily_health_tracking,set_daily_health_tracking_updated_at,BEFORE,UPDATE,EXECUTE FUNCTION handle_updated_at()
                                                                      meal_history,set_meal_history_updated_at,BEFORE,UPDATE,EXECUTE FUNCTION handle_updated_at()
                                                                                                                          preset_plans,set_preset_plans_updated_at,BEFORE,UPDATE,EXECUTE FUNCTION handle_updated_at()
                                                                                                                                                                              user_plans,set_user_plans_updated_at,BEFORE,UPDATE,EXECUTE FUNCTION handle_updated_at()


-- C6b. Trigger on auth.users (OAuth profile auto-create from migration 015)
SELECT tgname AS trigger_name, tgenabled AS enabled,
       pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'auth' AND c.relname = 'users' AND NOT t.tgisinternal;

trigger_name,enabled,definition
on_auth_user_created,O,CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user()



-- C7. Extensions installed (expect at least pg_trgm, pgcrypto)
SELECT extname, extversion FROM pg_extension ORDER BY extname;

extname,extversion
pg_stat_statements,1.11
pg_trgm,1.6
pgcrypto,1.3
plpgsql,1.0
supabase_vault,0.3.1
uuid-ossp,1.1


-- ══════════════════════════════════════════════════════════════════════════
-- SECTION D — APP-EXPECTATION TARGETED CHECKS
-- (these verify the DB matches exactly what the code queries)
-- ══════════════════════════════════════════════════════════════════════════

-- D1. Does user_profiles expose EVERY column authService.fetchUserProfile selects?
-- App selects: user_id, username, full_name, created_at, height_cm, weight_kg,
--   current_bmi, age, contact_number, activity, goal, diet_type, sex, bmi_target
-- Missing rows here = a hard error on every profile fetch.
SELECT expected.col AS expected_column,
       CASE WHEN c.column_name IS NULL THEN 'MISSING' ELSE 'present' END AS status,
       c.data_type, c.is_nullable
FROM (VALUES
  ('user_id'),('username'),('full_name'),('created_at'),('height_cm'),('weight_kg'),
  ('current_bmi'),('age'),('contact_number'),('activity'),('goal'),('diet_type'),
  ('sex'),('bmi_target'),('avatar_url')
) AS expected(col)
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public' AND c.table_name = 'user_profiles' AND c.column_name = expected.col
ORDER BY expected.col;


expected_column,status,data_type,is_nullable
activity,present,text,YES
age,present,integer,YES
avatar_url,present,text,YES
bmi_target,present,text,YES
contact_number,present,character varying,YES
created_at,present,timestamp with time zone,YES
current_bmi,present,numeric,YES
diet_type,present,text,YES
full_name,present,text,YES
goal,present,text,YES
height_cm,present,numeric,YES
sex,present,text,YES
user_id,present,uuid,NO
username,present,text,NO
weight_kg,present,numeric,YES


-- D2. username nullability + uniqueness (prod snapshot had NOT NULL + UNIQUE;
--     migration 009 has plain nullable TEXT — confirm which is real)
SELECT is_nullable FROM information_schema.columns
WHERE table_schema='public' AND table_name='user_profiles' AND column_name='username';

is_nullable
NO

SELECT conname, pg_get_constraintdef(con.oid) AS def
FROM pg_constraint con JOIN pg_class cl ON cl.oid=con.conrelid
WHERE cl.relname='user_profiles' AND con.contype IN ('u','p');

conname,def
user_profiles_pkey,PRIMARY KEY (user_id)
user_profiles_username_key,UNIQUE (username)

-- D3. Do the meal-tracking tables exist with the expected columns?
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name IN ('meal_history','daily_health_tracking')
ORDER BY table_name, ordinal_position;

table_name,column_name,data_type,is_nullable,column_default
daily_health_tracking,id,uuid,NO,gen_random_uuid()
daily_health_tracking,user_id,uuid,NO,null
daily_health_tracking,date,date,NO,null
daily_health_tracking,water_glasses,integer,NO,0
daily_health_tracking,water_target,integer,NO,8
daily_health_tracking,steps,integer,NO,0
daily_health_tracking,steps_target,integer,NO,10000
daily_health_tracking,created_at,timestamp with time zone,YES,now()
daily_health_tracking,updated_at,timestamp with time zone,YES,now()
meal_history,id,uuid,NO,gen_random_uuid()
meal_history,user_id,uuid,NO,null
meal_history,date,date,NO,null
meal_history,timestamp,bigint,NO,null
meal_history,plan_name,text,YES,null
meal_history,score,integer,YES,0
meal_history,band,text,YES,''::text
meal_history,kcal,integer,YES,0
meal_history,protein,integer,YES,0
meal_history,carbs,integer,YES,0
meal_history,fat,integer,YES,0
meal_history,fibre,integer,YES,0
meal_history,vegetables_g,integer,YES,0
meal_history,visible_fat,integer,YES,0
meal_history,created_at,timestamp with time zone,YES,now()
meal_history,updated_at,timestamp with time zone,YES,now()

-- D3b. meal_history.timestamp should be BIGINT (client writes Date.now()).
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='meal_history' AND column_name='timestamp';

column_name,data_type
timestamp,bigint

-- D4. Unique (user_id, date) constraints present on the daily tables (upsert onConflict)
SELECT cl.relname AS table_name, con.conname, pg_get_constraintdef(con.oid) AS def
FROM pg_constraint con JOIN pg_class cl ON cl.oid=con.conrelid
JOIN pg_namespace n ON n.oid=cl.relnamespace
WHERE n.nspname='public' AND cl.relname IN ('meal_history','daily_health_tracking')
  AND con.contype='u';

table_name,conname,def
daily_health_tracking,uq_daily_health_user_date,"UNIQUE (user_id, date)"
meal_history,uq_meal_history_user_date,"UNIQUE (user_id, date)"



-- D5. Does the staging table exist, and is it secured?
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname='food_nutrient_values_staging';

table_name,rls_enabled
food_nutrient_values_staging,true


-- ══════════════════════════════════════════════════════════════════════════
-- SECTION E — DATA INTEGRITY / CONSISTENCY
-- ══════════════════════════════════════════════════════════════════════════

-- E1. Orphaned rows: user_id not present in auth.users (existing tables).
SELECT 'user_plans' AS table_name, COUNT(*) AS orphaned_rows
FROM public.user_plans t LEFT JOIN auth.users u ON u.id = t.user_id WHERE u.id IS NULL
UNION ALL
SELECT 'user_profiles', COUNT(*)
FROM public.user_profiles t LEFT JOIN auth.users u ON u.id = t.user_id WHERE u.id IS NULL
UNION ALL
SELECT 'user_profile_health_goals', COUNT(*)
FROM public.user_profile_health_goals t LEFT JOIN auth.users u ON u.id = t.user_id WHERE u.id IS NULL;


table_name,orphaned_rows
user_plans,0
user_profiles,0
user_profile_health_goals,0


-- E1b. Orphan check for the newer tables (run only if they exist per D3).
SELECT 'meal_history' AS table_name, COUNT(*) AS orphaned_rows
FROM public.meal_history t LEFT JOIN auth.users u ON u.id = t.user_id WHERE u.id IS NULL
UNION ALL
SELECT 'daily_health_tracking', COUNT(*)
FROM public.daily_health_tracking t LEFT JOIN auth.users u ON u.id = t.user_id WHERE u.id IS NULL;

table_name,orphaned_rows
meal_history,0
daily_health_tracking,0



-- E2. Duplicate (user_id, date) — should be impossible if the UNIQUE constraint exists.
SELECT 'meal_history' AS table_name, user_id, date, COUNT(*) AS dupes
FROM public.meal_history GROUP BY user_id, date HAVING COUNT(*) > 1
UNION ALL
SELECT 'daily_health_tracking', user_id, date, COUNT(*)
FROM public.daily_health_tracking GROUP BY user_id, date HAVING COUNT(*) > 1;

Success. No rows returned



-- E3. Duplicate usernames (matters if username is/should be UNIQUE)
SELECT username, COUNT(*) AS cnt
FROM public.user_profiles WHERE username IS NOT NULL
GROUP BY username HAVING COUNT(*) > 1;

Success. No rows returned



-- E4. user_profiles rows that violate the intended enum values
--     (if these columns are missing this query errors — that itself confirms D1).
SELECT user_id, activity, goal, diet_type, sex
FROM public.user_profiles
WHERE (activity  IS NOT NULL AND activity  NOT IN ('sedentary','moderate','heavy'))
   OR (goal      IS NOT NULL AND goal      NOT IN ('maintenance','weight loss','weight gain','metabolic improvement'))
   OR (diet_type IS NOT NULL AND diet_type NOT IN ('vegetarian','eggetarian','non-vegetarian','Jain-compatible'))
   OR (sex       IS NOT NULL AND sex       NOT IN ('male','female'));

Success. No rows returned



-- E5. Food data coverage: foods with no nutrient rows, and nutrient rows pointing
--     at non-existent foods/nutrients (referential sanity beyond the FK).
SELECT
  (SELECT COUNT(*) FROM public.food_items) AS total_foods,
  (SELECT COUNT(DISTINCT food_id) FROM public.food_nutrient_values) AS foods_with_nutrients,
  (SELECT COUNT(*) FROM public.food_items fi
     WHERE NOT EXISTS (SELECT 1 FROM public.food_nutrient_values v WHERE v.food_id = fi.food_id)) AS foods_without_nutrients,
  (SELECT COUNT(*) FROM public.food_nutrient_values v
     WHERE NOT EXISTS (SELECT 1 FROM public.food_items fi WHERE fi.food_id = v.food_id)) AS values_orphan_food,
  (SELECT COUNT(*) FROM public.food_nutrient_values v
     WHERE NOT EXISTS (SELECT 1 FROM public.nutrient_definitions nd WHERE nd.nutrient_id = v.nutrient_id)) AS values_orphan_nutrient;


total_foods,foods_with_nutrients,foods_without_nutrients,values_orphan_food,values_orphan_nutrient
528,528,0,0,0

-- E6. Unexpected NULLs in reference data used by ORDER BY / display
SELECT 'nutrient_groups.display_order NULL' AS check_name, COUNT(*) AS cnt
FROM public.nutrient_groups WHERE display_order IS NULL
UNION ALL
SELECT 'nutrient_definitions.nutrient_code NULL', COUNT(*)
FROM public.nutrient_definitions WHERE nutrient_code IS NULL
UNION ALL
SELECT 'health_goals.display_order NULL', COUNT(*)
FROM public.health_goals WHERE display_order IS NULL;


check_name,cnt
nutrient_groups.display_order NULL,0
nutrient_definitions.nutrient_code NULL,0
health_goals.display_order NULL,0

-- E7. Duplicate business keys in reference tables (should be unique)
SELECT 'food_items.food_code' AS key, food_code AS value, COUNT(*) c
FROM public.food_items GROUP BY food_code HAVING COUNT(*) > 1
UNION ALL
SELECT 'major_groups.group_code', group_code, COUNT(*)
FROM public.major_groups GROUP BY group_code HAVING COUNT(*) > 1
UNION ALL
SELECT 'nutrient_definitions.nutrient_code', nutrient_code, COUNT(*)
FROM public.nutrient_definitions WHERE nutrient_code IS NOT NULL
GROUP BY nutrient_code HAVING COUNT(*) > 1;


Success. No rows returned


-- E8. Preset plan structure sanity (meals is a JSONB object with array slots)
SELECT id, name, display_order, is_active,
       jsonb_typeof(meals) AS meals_type,
       COALESCE(jsonb_array_length(meals->'Breakfast'),0) AS breakfast_items,
       COALESCE(jsonb_array_length(meals->'Lunch'),0)     AS lunch_items,
       COALESCE(jsonb_array_length(meals->'Dinner'),0)    AS dinner_items
FROM public.preset_plans ORDER BY display_order;


id,name,display_order,is_active,meals_type,breakfast_items,lunch_items,dinner_items
dd291fef-a33c-4386-991b-881c4c07ea75,Masti PLAN,1,true,object,12,21,21
a607573a-dea7-4e32-bab2-a7ea768a97a7,Raghav,2,true,object,0,0,0
a5ac3395-68a0-49bd-a4ef-675a3087963e,Thyroid+PMOS weightloss plan,3,true,object,3,1,1


-- E9. Empty / null user plans (meals object empty)
SELECT COUNT(*) AS total_plans,
       COUNT(*) FILTER (WHERE meals IS NULL OR meals = '{}'::jsonb) AS empty_plans
FROM public.user_plans;


total_plans,empty_plans
4,0


-- E10. Live row counts (quick presence/scale check)
SELECT relname AS table_name, n_live_tup AS approx_rows
FROM pg_stat_user_tables WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;


table_name,approx_rows
user_profile_health_goals,6
user_plans,2
preset_plans,1
user_profiles,1
food_nutrient_values,0
health_goals,0
food_nutrient_values_staging,0
meal_history,0
major_groups,0
daily_health_tracking,0
nutrient_groups,0
food_items,0
nutrient_definitions,0

-- ══════════════════════════════════════════════════════════════════════════
-- SECTION F — PERFORMANCE SPOT CHECKS (read-only EXPLAIN)
-- ══════════════════════════════════════════════════════════════════════════

-- F1. Food search RPC (verify it exists with the 3-arg signature the app calls)
EXPLAIN ANALYZE
SELECT * FROM public.search_foods_all_fields('rice', 20, 0);

QUERY PLAN
Function Scan on search_foods_all_fields  (cost=0.25..10.25 rows=1000 width=196) (actual time=100.028..100.030 rows=6 loops=1)
Planning Time: 0.054 ms
Execution Time: 100.177 ms

-- F2. Food-name ILIKE path (foodSearchService.searchFoodItems) uses the trigram index?
EXPLAIN ANALYZE
SELECT food_id, food_code, food_name, major_group_id
FROM public.food_items WHERE food_name ILIKE '%rice%' LIMIT 15;


QUERY PLAN
Limit  (cost=4.35..9.48 rows=11 width=36) (actual time=0.046..0.054 rows=6 loops=1)
"  ->  Bitmap Heap Scan on food_items  (cost=4.35..9.48 rows=11 width=36) (actual time=0.045..0.053 rows=6 loops=1)"
"        Recheck Cond: ((food_name)::text ~~* '%rice%'::text)"
"        Heap Blocks: exact=1"
"        ->  Bitmap Index Scan on idx_food_items_food_name_trgm  (cost=0.00..4.34 rows=11 width=0) (actual time=0.024..0.025 rows=6 loops=1)"
"              Index Cond: ((food_name)::text ~~* '%rice%'::text)"
Planning Time: 2.259 ms
Execution Time: 0.186 ms
