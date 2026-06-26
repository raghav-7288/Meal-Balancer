# Supabase Database Audit

> **Generated**: June 25, 2026  
> **Database**: Diet Specifix (Supabase)  
> Run the diagnostic queries in `supabase/diagnostic-queries.sql` to regenerate this data.

---

## Quick Stats

| Metric | Value |
|--------|-------|
| Tables | 11 |
| Views | 1 (`food_search_view`) |
| Custom RPCs | 4 |
| Triggers | 2 |
| Extensions | 6 (pg_trgm, pgcrypto, uuid-ossp, etc.) |
| Food items | 528 |
| Nutrient types | 38 |
| Nutrient records | 20,064 (100% coverage) |
| Preset plans | 5 (all active) |
| User profiles | 4 |
| User plans | 1 |

---

## Audit Results

### ✅ Correct (No Issues)

| Area | Status |
|------|--------|
| All table column names match code queries | ✅ |
| `food_search_view` includes `nutrient_id` | ✅ |
| RLS enabled on all user tables | ✅ |
| RLS policies use `auth.uid() = user_id` correctly | ✅ |
| `user_plans` has index on `user_id` | ✅ |
| `food_nutrient_values` has composite unique on `(food_id, nutrient_id)` | ✅ |
| Trigram indexes on `food_name`, `food_code`, `group_name` | ✅ |
| `updated_at` triggers on `user_plans` and `preset_plans` | ✅ |
| Foreign keys with proper cascade rules | ✅ |
| All 528 foods have complete nutrient data | ✅ |
| Preset plans seeded correctly (7 days × items per meal) | ✅ |

---

### 🚨 Critical Issues

#### 1. Missing Indexes on FK Columns

| Table | Column | Impact |
|-------|--------|--------|
| `food_items` | `major_group_id` | Slow JOINs in `food_search_view` and `getFoodsByGroup()` |
| `nutrient_definitions` | `nutrient_group_id` | Slow JOINs in nutrient lookups |

**Fix**: Add B-tree indexes on both columns.

#### 2. Overly Permissive GRANTs

All tables grant ALL privileges (DELETE, INSERT, UPDATE, TRUNCATE) to `anon` and `authenticated` roles. While RLS provides protection, this violates defense-in-depth:

- **Read-only reference tables** (`food_items`, `major_groups`, `nutrient_definitions`, `nutrient_groups`, `food_nutrient_values`, `health_goals`, `preset_plans`) should only grant SELECT.
- **`food_nutrient_values_staging`** grants ALL to everyone with NO RLS — anyone with the anon key can write to it.

**Fix**: Revoke unnecessary privileges and restrict to SELECT-only for reference data.

#### 3. `food_nutrient_values_staging` — No RLS

This ETL staging table has:
- RLS **disabled**
- ALL privileges granted to `anon` and `authenticated`

An attacker with the anon key could INSERT/DELETE rows in this table.

**Fix**: Either enable RLS with no public policies (blocking all access), or revoke all non-service-role grants.

#### 4. Nullable `display_order` in `nutrient_groups`

The column `nutrient_groups.display_order` is `NULLABLE`. Code uses `.order("display_order")` which may produce unpredictable ordering when NULL values exist.

**Fix**: Set NOT NULL with a default, or ensure existing data has no NULLs.

#### 5. Nullable `nutrient_code` in `nutrient_definitions`

The column `nutrient_definitions.nutrient_code` is `NULLABLE`. The `food_search_view` exposes it and the frontend displays it. NULL values show as empty strings.

**Fix**: Set NOT NULL constraint (after verifying all 38 rows have values).

---

### ⚠️ Warnings (Non-Critical)

| Issue | Description |
|-------|-------------|
| `user_profiles.username` is NOT NULL | If a user signs up without providing a username, the INSERT will fail. Code passes `username` from signup form — should be safe, but add a default fallback. |
| No FK from `user_plans.user_id` → `auth.users.id` visible | Likely exists as a cross-schema FK — verify it's CASCADE on delete. |
| `search_foods_all_fields` returns up to 500 rows | Large payload for autocomplete. Consider reducing or paginating. |
| No `updated_at` on `user_profiles` | If you ever need "last modified" tracking for profiles, you'll need to add it. |
| `food_search_view` uses LEFT JOINs | A food without nutrients would appear with NULL nutrient columns — currently not an issue since all 528 foods have nutrients. |

---

## Schema ↔ Code Verification Matrix

| Code Query | Table/Column | DB Confirmed |
|------------|-------------|--------------|
| `authService.fetchUserProfile()` → `user_id, username, full_name, created_at, height_cm, weight_kg, current_bmi, age, contact_number` | `user_profiles` | ✅ All columns exist |
| `databaseService.getHealthGoals()` → `health_goal_id, goal_code, goal_name, description, is_active, display_order` | `health_goals` | ✅ All columns exist |
| `databaseService.getUserHealthGoals()` → `user_id, health_goal_id, created_at` | `user_profile_health_goals` | ✅ All columns exist |
| `databaseService.getMajorGroups()` → `major_group_id, group_code, group_name` | `major_groups` | ✅ All columns exist |
| `databaseService.getFoodsByGroup()` → `food_id, major_group_id, food_code, food_name` | `food_items` | ✅ All columns exist |
| `databaseService.getAllNutrientGroups()` → `nutrient_group_id, group_name, description, display_order` | `nutrient_groups` | ✅ All columns exist |
| `databaseService.getNutrientDefinitions()` → `nutrient_id, nutrient_group_id, nutrient_name, nutrient_code, unit` | `nutrient_definitions` | ✅ All columns exist |
| `databaseService.getFoodNutrients()` → `food_nutrient_value_id, food_id, nutrient_id, value` + nested `nutrient_definitions` | `food_nutrient_values` | ✅ All columns exist |
| `planSyncService.fetchUserPlans()` → `id, user_id, name, meals, guidelines, created_at, updated_at` | `user_plans` | ✅ All columns exist |
| `presetPlanService.fetchPresetPlans()` → `id, name, meals, guidelines, display_order, created_at` | `preset_plans` | ✅ All columns exist |
| `foodSearchService.searchFoodItems()` → `food_id, food_code, food_name, major_group_id` | `food_items` | ✅ All columns exist |
| `FoodSearchPage.jsx` → `food_search_view.nutrient_id` | View | ✅ Confirmed in view definition |
| RPC `search_foods_all_fields(search_text)` | Function | ✅ Exists, returns correct types |
| RPC `get_food_details(p_food_id)` | Function | ✅ Exists, returns correct types |

---

## Data Integrity Check

| Check | Result |
|-------|--------|
| All foods have nutrient data | ✅ 528/528 |
| Nutrient records = foods × nutrient types | ✅ 528 × 38 = 20,064 |
| All preset plans active | ✅ 5/5 |
| Preset plans have items for all 7 days | ✅ (14 = 2 items × 7 days, 21 = 3 items × 7 days) |
| No empty user plans | ✅ 0 empty |
| User profiles exist for plan owners | ✅ |

---

## Recommended Improvements (Priority Order)

1. **🔴 HIGH** — Add missing indexes (`food_items.major_group_id`, `nutrient_definitions.nutrient_group_id`)
2. **🔴 HIGH** — Restrict GRANTs on read-only tables to SELECT only
3. **🔴 HIGH** — Secure `food_nutrient_values_staging` (enable RLS or revoke access)
4. **🟡 MED** — Fix nullable `display_order` in `nutrient_groups`
5. **🟡 MED** — Fix nullable `nutrient_code` in `nutrient_definitions`
6. **🟢 LOW** — Add `updated_at` column + trigger to `user_profiles`
7. **🟢 LOW** — Add FK from `user_plans.user_id` → `auth.users.id` if not already present

See `supabase/migrations/012_audit_improvements.sql` for the fix migration.

