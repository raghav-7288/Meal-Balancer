# Diet Specifix — Complete Supabase Database Schema

> Auto-generated from live Supabase introspection + codebase analysis (June 25, 2026)

---

## Extensions

| Extension | Purpose |
|-----------|---------|
| `pg_trgm` | Trigram-based fuzzy text search (ILIKE, similarity scoring) |

---

## Tables

### 1. `food_items`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `food_id` | `bigint` | NO | `nextval('food_items_food_id_seq')` (auto-increment PK) |
| `food_code` | `varchar` | NO | — |
| `food_name` | `varchar` | NO | — |
| `major_group_id` | `bigint` | NO | — (FK → `major_groups.major_group_id`) |

**RLS:** Disabled (public read)

---

### 2. `food_nutrient_values`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `food_nutrient_value_id` | `bigint` | NO | `nextval('food_nutrient_values_food_nutrient_value_id_seq')` (auto-increment PK) |
| `food_id` | `bigint` | NO | — (FK → `food_items.food_id`) |
| `nutrient_id` | `bigint` | NO | — (FK → `nutrient_definitions.nutrient_id`) |
| `value` | `numeric` | NO | — |

**RLS:** Disabled (public read)

---

### 3. `food_nutrient_values_staging`
ETL/import staging table — wide-format nutrient data before unpivot.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `food_id` | `bigint` | NO | — |
| `n1` … `n38` | `numeric` | YES | — |

(38 nutrient columns, one per nutrient_id)

**RLS:** Disabled

---

### 4. `major_groups`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `major_group_id` | `bigint` | NO | PK |
| `group_code` | `varchar` | NO | — |
| `group_name` | `varchar` | NO | — |

**RLS:** Disabled (public read)

---

### 5. `nutrient_groups`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `nutrient_group_id` | `bigint` | NO | PK |
| `group_name` | `varchar` | NO | — |
| `description` | `text` | YES | — |
| `display_order` | `integer` | NO | — |

**RLS:** Disabled (public read)

---

### 6. `nutrient_definitions`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `nutrient_id` | `bigint` | NO | PK |
| `nutrient_group_id` | `bigint` | NO | — (FK → `nutrient_groups.nutrient_group_id`) |
| `nutrient_name` | `varchar` | NO | — |
| `nutrient_code` | `varchar` | NO | — |
| `unit` | `varchar` | NO | — |

**RLS:** Disabled (public read)

---

### 7. `health_goals`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `health_goal_id` | `bigint` | NO | `nextval(...)` (auto-increment PK) |
| `goal_code` | `varchar` | NO | — |
| `goal_name` | `varchar` | NO | — |
| `description` | `text` | YES | — |
| `is_active` | `boolean` | NO | `true` |
| `display_order` | `integer` | NO | — |

**RLS:** ✅ Enabled  
**Policy:** SELECT where `is_active = true` (public role)

---

### 8. `user_profiles`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `user_id` | `uuid` | NO | PK (FK → `auth.users.id`) |
| `username` | `text` | NO | — |
| `full_name` | `text` | YES | — |
| `height_cm` | `numeric` | YES | — |
| `weight_kg` | `numeric` | YES | — |
| `current_bmi` | `numeric` | YES | — |
| `age` | `integer` | YES | — |
| `contact_number` | `varchar` | YES | — |
| `activity` | `text` | YES | `'moderate'` |
| `goal` | `text` | YES | `'maintenance'` |
| `diet_type` | `text` | YES | `'vegetarian'` |
| `sex` | `text` | YES | `'female'` |
| `bmi_target` | `text` | YES | `'22'` |
| `created_at` | `timestamptz` | YES | `now()` |

**CHECK constraints:**
- `chk_activity`: `activity IN ('sedentary', 'moderate', 'heavy')`
- `chk_goal`: `goal IN ('maintenance', 'weight loss', 'weight gain', 'metabolic improvement')`
- `chk_diet_type`: `diet_type IN ('vegetarian', 'eggetarian', 'non-vegetarian', 'Jain-compatible')`
- `chk_sex`: `sex IN ('male', 'female')`

**RLS:** ✅ Enabled (user-scoped: `auth.uid() = user_id`)

---

### 9. `user_profile_health_goals`
Junction table linking users to their selected health goals.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `user_id` | `uuid` | NO | FK → `user_profiles.user_id` (CASCADE) |
| `health_goal_id` | `bigint` | NO | FK → `health_goals.health_goal_id` (CASCADE) |
| `created_at` | `timestamptz` | YES | `now()` |

**PK:** Composite (`user_id`, `health_goal_id`)  
**RLS:** ✅ Enabled (user-scoped: `auth.uid() = user_id`)

---

### 10. `user_plans`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NO | `gen_random_uuid()` (PK) |
| `user_id` | `uuid` | NO | FK → `auth.users.id` ON DELETE CASCADE |
| `name` | `text` | NO | — |
| `meals` | `jsonb` | NO | `'{}'::jsonb` |
| `guidelines` | `text` | YES | `''` |
| `created_at` | `timestamptz` | NO | `now()` |
| `updated_at` | `timestamptz` | NO | `now()` (auto-updated via trigger) |

**Index:** `idx_user_plans_user_id` on `user_id`  
**RLS:** ✅ Enabled  
**Grant:** ALL to `authenticated`

---

### 11. `preset_plans`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NO | `gen_random_uuid()` (PK) |
| `name` | `text` | NO | — |
| `meals` | `jsonb` | NO | `'{}'::jsonb` |
| `guidelines` | `text` | YES | `''` |
| `display_order` | `integer` | NO | `0` |
| `is_active` | `boolean` | NO | `true` |
| `created_at` | `timestamptz` | NO | `now()` |
| `updated_at` | `timestamptz` | NO | `now()` (auto-updated via trigger) |

**RLS:** ✅ Enabled  
**Grant:** SELECT to `authenticated` and `anon`

---

## Views

### `food_search_view`
Denormalized view joining foods → groups → nutrients for fast search.

| Column | Type |
|--------|------|
| `food_id` | `bigint` |
| `food_code` | `varchar` |
| `food_name` | `varchar` |
| `major_group_id` | `bigint` |
| `group_code` | `varchar` |
| `food_group` | `varchar` |
| `nutrient_id` | `bigint` |
| `nutrient_group_id` | `bigint` |
| `nutrient_group` | `varchar` |
| `nutrient_name` | `varchar` |
| `nutrient_code` | `varchar` |
| `unit` | `varchar` |
| `value` | `numeric` |

**Confirmed definition (from live DB):**
```sql
SELECT fi.food_id, fi.food_code, fi.food_name,
       mg.major_group_id, mg.group_code, mg.group_name AS food_group,
       fnv.nutrient_id,
       nd.nutrient_name, nd.nutrient_code, nd.unit,
       ng.nutrient_group_id, ng.group_name AS nutrient_group,
       fnv.value
FROM food_items fi
JOIN major_groups mg ON mg.major_group_id = fi.major_group_id
LEFT JOIN food_nutrient_values fnv ON fnv.food_id = fi.food_id
LEFT JOIN nutrient_definitions nd ON nd.nutrient_id = fnv.nutrient_id
LEFT JOIN nutrient_groups ng ON ng.nutrient_group_id = nd.nutrient_group_id;
```

---

## RLS Policies (confirmed from live DB)

### `user_plans` (4 policies)
| Policy | Command | Condition |
|--------|---------|-----------|
| Users can view their own plans | SELECT | `auth.uid() = user_id` |
| Users can create their own plans | INSERT | `WITH CHECK (auth.uid() = user_id)` |
| Users can update their own plans | UPDATE | `USING + WITH CHECK (auth.uid() = user_id)` |
| Users can delete their own plans | DELETE | `auth.uid() = user_id` |

### `preset_plans` (1 policy)
| Policy | Command | Condition |
|--------|---------|-----------|
| Anyone can read preset plans | SELECT | `is_active = true` |

---

## Functions / RPCs

### 1. `search_foods(search_text text)`
```sql
RETURNS TABLE(food_id bigint, food_code varchar, food_name varchar, food_group varchar)
LANGUAGE sql STABLE

SELECT DISTINCT fsv.food_id, fsv.food_code, fsv.food_name, fsv.food_group
FROM public.food_search_view fsv
WHERE fsv.food_name   ILIKE '%' || search_text || '%'
   OR fsv.food_code   ILIKE '%' || search_text || '%'
   OR fsv.food_group  ILIKE '%' || search_text || '%'
   OR fsv.nutrient_name  ILIKE '%' || search_text || '%'
   OR fsv.nutrient_group ILIKE '%' || search_text || '%'
ORDER BY fsv.food_name
LIMIT 20;
```

### 2. `get_food_details(p_food_id bigint)`
```sql
RETURNS TABLE(food_id bigint, food_code varchar, food_name varchar, food_group varchar,
              nutrient_id bigint, nutrient_name varchar, nutrient_code varchar,
              nutrient_group varchar, unit varchar, value numeric)
LANGUAGE sql STABLE

SELECT fsv.food_id, fsv.food_code, fsv.food_name, fsv.food_group,
       fsv.nutrient_id, fsv.nutrient_name, fsv.nutrient_code,
       fsv.nutrient_group, fsv.unit, fsv.value
FROM public.food_search_view fsv
WHERE fsv.food_id = p_food_id
ORDER BY fsv.nutrient_group, fsv.nutrient_name;
```

### 3. `search_nutrient_foods(nutrient_search text)`
```sql
RETURNS TABLE(food_id bigint, food_code varchar, food_name varchar,
              food_group varchar, nutrient_name varchar, nutrient_value numeric, unit varchar)
LANGUAGE sql STABLE

SELECT fi.food_id, fi.food_code, fi.food_name, mg.group_name,
       nd.nutrient_name, fnv.value, nd.unit
FROM food_nutrient_values fnv
JOIN food_items fi ON fi.food_id = fnv.food_id
JOIN major_groups mg ON mg.major_group_id = fi.major_group_id
JOIN nutrient_definitions nd ON nd.nutrient_id = fnv.nutrient_id
WHERE nd.nutrient_name ILIKE '%' || nutrient_search || '%'
ORDER BY fnv.value DESC
LIMIT 100;
```

### 4. `search_foods_all_fields(search_text text)`
```sql
RETURNS TABLE(food_id bigint, food_code text, food_name text, food_group text)
LANGUAGE sql STABLE

SELECT DISTINCT fi.food_id, fi.food_code, fi.food_name, mg.group_name AS food_group
FROM food_items fi
JOIN major_groups mg ON mg.major_group_id = fi.major_group_id
LEFT JOIN food_nutrient_values fnv ON fnv.food_id = fi.food_id
LEFT JOIN nutrient_definitions nd ON nd.nutrient_id = fnv.nutrient_id
LEFT JOIN nutrient_groups ng ON ng.nutrient_group_id = nd.nutrient_group_id
WHERE fi.food_name  ILIKE '%' || search_text || '%'
   OR fi.food_code  ILIKE '%' || search_text || '%'
   OR mg.group_name ILIKE '%' || search_text || '%'
   OR mg.group_code ILIKE '%' || search_text || '%'
   OR nd.nutrient_name ILIKE '%' || search_text || '%'
   OR nd.nutrient_code ILIKE '%' || search_text || '%'
   OR ng.group_name    ILIKE '%' || search_text || '%'
ORDER BY fi.food_name
LIMIT 500;
```

### 5. `handle_updated_at()` — Trigger Function
```sql
RETURNS trigger LANGUAGE plpgsql
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
```

---

## Triggers

| Trigger | Table | Event | Action |
|---------|-------|-------|--------|
| `set_user_plans_updated_at` | `user_plans` | BEFORE UPDATE | `EXECUTE FUNCTION handle_updated_at()` |
| `set_preset_plans_updated_at` | `preset_plans` | BEFORE UPDATE | `EXECUTE FUNCTION handle_updated_at()` |

---

## Entity Relationship Diagram (text)

```
auth.users (Supabase managed)
  ├── 1:1  user_profiles (user_id FK)
  ├── 1:N  user_plans (user_id FK, CASCADE delete)
  └── N:M  health_goals (via user_profile_health_goals junction)

major_groups
  └── 1:N  food_items (major_group_id FK)
              └── 1:N  food_nutrient_values (food_id FK)
                          └── N:1  nutrient_definitions (nutrient_id FK)
                                      └── N:1  nutrient_groups (nutrient_group_id FK)

preset_plans (standalone, no user FK)

food_nutrient_values_staging (ETL import table, wide-format)

food_search_view (denormalized VIEW joining food_items + major_groups + food_nutrient_values + nutrient_definitions + nutrient_groups)
```

---

## pg_trgm Extension Functions (system)

These are internal to the `pg_trgm` extension and not custom RPCs:
`gtrgm_in`, `gtrgm_out`, `gtrgm_consistent`, `gtrgm_distance`, `gtrgm_compress`, `gtrgm_decompress`, `gtrgm_union`, `gtrgm_picksplit`, `gtrgm_penalty`, `gtrgm_same`, `gtrgm_options`, `gin_extract_value_trgm`, `gin_extract_query_trgm`, `gin_trgm_consistent`, `gin_trgm_triconsistent`, `similarity`, `similarity_op`, `similarity_dist`, `word_similarity`, `word_similarity_op`, `word_similarity_commutator_op`, `word_similarity_dist_op`, `word_similarity_dist_commutator_op`, `strict_word_similarity`, `strict_word_similarity_op`, `strict_word_similarity_commutator_op`, `strict_word_similarity_dist_op`, `strict_word_similarity_dist_commutator_op`, `set_limit`, `show_limit`, `show_trgm`

