# ✅ Meal Balancer — Completed Changes

> Changes that have been implemented and verified.

---

## 🔥 Critical / Quick Wins

| # | Issue | Fix Applied | Date |
|---|-------|-------------|------|
| 1 | **Fix Vercel build command** — `vercel.json` uses `yarn` but project uses npm | ⚠️ DO NOT CHANGE — `yarn` commands are required for Vercel to build. Changing them breaks deployment. | N/A |
| 2 | **Remove `SupabaseTest.jsx`** — dev utility shipped in production | Deleted `src/components/SupabaseTest.jsx` | June 25, 2026 |
| 3 | **Add missing RLS policies** — `user_profiles`, `user_profile_health_goals` had no RLS | Added `auth.uid() = user_id` policies for both tables | June 25, 2026 |
| 4 | **Profile fields not persisted to Supabase** — only in localStorage | Added columns to `user_profiles` table and save/load from DB | June 25, 2026 |
| 5 | **`useSyncedPlans` doesn't update `syncStatus` on mutations** | Updated `syncStatus` to "error" on failure with retry option | June 25, 2026 |
| 6 | **Meal history only in localStorage** | Created `meal_history` table in Supabase and synced | June 25, 2026 |
| 7 | **Water tracker only in localStorage** | Persisted to Supabase via `daily_health_tracking` table | June 25, 2026 |

---

## 🐛 Bugs Fixed

| # | Bug | Fix Applied | Date |
|---|-----|-------------|------|
| B1 | **Regex global flag in `HighlightMatch`** — `regex.test()` with `g` flag alternates true/false | Split into separate `splitRegex` (with `g`) and `testRegex` (anchored, no `g`) | June 26, 2026 |
| B2 | **React Hook violation** — `useAuth()` called inside `try-catch` | Created `useOptionalAuth()` hook that safely returns defaults | June 26, 2026 |
| B3 | **Unused variable `user`** in WelcomePage | Removed `user` from destructuring | June 26, 2026 |
| B4 | **Missing error guard** — `err.message` accessed without null-check | Changed to `err?.message \|\| "fallback message"` | June 26, 2026 |
| B5 | **Dark mode toggle icon oversized** — `size={34}` | Reduced to `size={20}` | June 26, 2026 |
| B6 | **`cachedFetch` has no request deduplication** | Added in-flight promise map for concurrent call sharing | June 26, 2026 |
| B7 | **ProgressPage streak dead code** | Removed dead first streak calculation that was immediately overwritten by correct second one | June 26, 2026 |
| B8 | **ProgressPage streak shows 1 for old entries** | Added check: most recent entry must be today/yesterday; returns 0 if stale | June 26, 2026 |
| B9 | **OnboardingFlow crashes if presetPlans empty** | Added `?.` null guard on `selectedPlan.name` | June 26, 2026 |
| B10 | **WaterTracker/StepTracker memory leak** | `syncTimeoutRef` not cleared on unmount; added cleanup in useEffect return | June 26, 2026 |
| B11 | **WaterTracker/StepTracker potential infinite loop** | Removed unstable setter functions from useEffect dependency arrays | June 26, 2026 |
| B12 | **PDF filename crash on null plan name** | Added fallback `"Meal Plan"` when `plan.name` is undefined | June 26, 2026 |
| B13 | **Lint error: unused `onSelect` in MealBuilder test** | Removed unused destructured prop from mock component | June 26, 2026 |

---

## 🏗️ Architecture & Code Quality

| # | Issue | Fix Applied | Date |
|---|-------|-------------|------|
| 8 | **DashboardPage is 576 lines** | Extracted `useDashboardState()` hook + `DaySelector`, `CopyPlanModal`, `PlanGuidelines` components | June 26, 2026 |
| 9 | **ProfilePage is 583 lines** | Extracted `ProfileSetupCard`, `HealthGoalsCard`, `BodyMeasurementsCard`, `FatBenchmarkCard` components | June 26, 2026 |
| 10 | **Duplicate toast logic** — 4 components with own toast | Replaced with `react-hot-toast` global system | June 26, 2026 |
| 11 | **`scoreMeal()` and `scoreDay()` ~90% duplicated** | Extracted shared `score(totals, rules)` function with declarative `MEAL_RULES` and `DAY_RULES` arrays. Both functions now delegate to the shared scorer. | June 26, 2026 |
| 12 | **`aggregateMeal()` duplicated nutrient accumulation** | Extracted `accumulateNutrients(totals, nutrients, factor)` helper used by both DB-item and legacy-item branches | June 26, 2026 |
| 13 | **No TypeScript** — error-prone nested data | Migrated `config.ts`, `scoringEngine.ts`, `nutrientEngine.ts` with full type definitions (`NutrientTotals`, `ScoreResult`, `ScoringRule`, `MealItem`, `LocalFood`, `AppConfig`). Added `tsconfig.json`, TypeScript ESLint parser, and `typecheck` script. | June 26, 2026 |
| 14 | **`useEffect` dependency warnings suppressed** — eslint-disable comments | Removed ALL `eslint-disable-line react-hooks/exhaustive-deps` comments. Fixed using: refs-in-effects pattern, `useRef` for mount-only checks, proper dependency arrays, and `useCallback`. Files fixed: `App.jsx`, `ProfileContext.jsx`, `useDashboardState.js`, `ProfilePage.jsx`, `useSyncedPlans.js`, `WaterTrackerPage.jsx`, `StepTrackerPage.jsx`, `WeeklyPlannerPage.jsx`, `FoodAutocomplete.jsx`. | June 26, 2026 |
| 15 | **`food_nutrient_values_staging` table exposed** | (Previously addressed) | June 25, 2026 |
| 50 | **`throw` inside `try` caught locally** — 4 instances in `FoodSearchPage.jsx` | Replaced `if (error) throw error` with direct `setSearchError(...)` + early return in all 4 locations. Eliminates unnecessary throw-then-catch pattern. | June 26, 2026 |
| 51 | **`useSyncedPlans.js` confusing double-ref pattern** | Removed `isMountedRef = useRef(isMounted)` wrapper. Now passes `isMounted` ref directly to `syncToSupabase()` and accesses `.current` instead of `.current?.current`. | June 26, 2026 |
| 52 | **`FoodSearchPage.jsx` duplicate `useDebounce` hook** | Removed local re-declaration (lines 10-17) and imported shared `useDebounce` from `hooks/useDebounce.js`. | June 26, 2026 |
| 55 | **`NutrientLimits.jsx` duplicate nutrient lookup** | Extracted `getActualValue()` helper and `TOTALS_KEY_MAP` constant to eliminate repeated if-else chains | June 26, 2026 |

---

## 🧪 Testing & Quality

| # | Issue | Fix Applied | Date |
|---|-------|-------------|------|
| 40 | **`generatePlanPdf.js` untested** — 716 lines of complex PDF generation | Extracted 4 pure functions (`capitalize`, `computeWeeklyAverages`, `buildMealTableRow`, `buildDailySummaryRows`). Added `tests/generatePlanPdf.test.js` with 19 unit tests covering all edge cases. | June 26, 2026 |
| 53 | **FoodSearchPage tests `act()` warnings** | Wrapped all renders in `await act(async () => { ... })` — eliminated 10+ "not wrapped in act(...)" warnings. | June 26, 2026 |
| 54 | **`generatePlanPdf.js:55` incorrect knife coordinate** | Fixed `circleY * scale` → `circleY`. The multiplication was wrong; the blade endpoint should be at the circle center Y, consistent with the offset pattern used elsewhere. | June 26, 2026 |
| 55 | **Progress streak untested** | Added `tests/progressStreak.test.js` with 8 tests covering edge cases: empty history, single entries, broken streaks, stale entries returning 0 | June 26, 2026 |

---

## 🎨 UI / UX Improvements

| # | Issue | Fix Applied | Date |
|---|-------|-------------|------|
| 29 | **Mobile nav broken** — 7 links overflow on mobile | Hamburger menu for `< 768px` | June 26, 2026 |
| 30 | **No loading skeletons** | Shimmer placeholder skeletons for Dashboard, Food Search | June 26, 2026 |
| 31 | **No empty states** | Illustrated empty states with CTA buttons | June 26, 2026 |
| 32 | **Toast is a basic `<div>`** | `react-hot-toast` global system | June 26, 2026 |
| 33 | **Score gauge** — plain number | Animated semicircle score gauge | June 26, 2026 |
| 34 | **Keyboard shortcuts** — none existed | `Ctrl+S/N/P`, `Esc` close modals | June 26, 2026 |
| 35 | **Accessibility gaps** | Focus trap, `aria-live` regions, skip nav link | June 26, 2026 |
| 36 | **Dark mode toggle icon too large** | Reduced from `size={34}` to `size={20}` | June 26, 2026 |

---

## 🔒 Security & Database

| # | Issue | Fix Applied | Date |
|---|-------|-------------|------|
| 16 | **No rate limiting on auth** — unlimited login attempts | Added client-side throttle: disables login button after 5 failures for 30s with countdown timer. Resets after lockout expires. | June 26, 2026 |
| 17 | **`search_foods_all_fields` RPC returns up to 500 rows** | Created migration `014_optimize_food_search.sql`: adds `pg_trgm` GIN index on `food_items.food_name`, replaces RPC with 20-row limit. | June 26, 2026 |
| 18 | **Anon key exposed in `.env`** — ensure `.gitignore` has `.env` | Verified `.env` is already in `.gitignore` (line 14). No change needed. | June 26, 2026 |
| 19 | **No input sanitization on food search** — `%`, `_` not escaped in ILIKE | Added `escapeIlike()` utility in `foodSearchService.js`. Applied to all ILIKE queries in `foodSearchService.js` and `FoodSearchPage.jsx`. | June 26, 2026 |
| 20 | **Missing migration files for 8 tables** | Generated and committed for all tables | June 25, 2026 |

---

## 📋 Documentation

| # | Issue | Fix Applied | Date |
|---|-------|-------------|------|
| 46 | **No JSDoc on engine functions** | Added comprehensive JSDoc with `@param`, `@returns`, scoring rule explanations, and `{@link}` cross-references to `scoreMeal`, `scoreDay`, `aggregateMeal`, `combineDay` | June 26, 2026 |
| 47 | **CONTEXT.md is stale** | Updated folder structure, file map, testing section, and expanded Section 19 with full database schema (tables, view, RPCs, triggers, relationships) from DATABASE_SCHEMA.md | June 26, 2026 |
| 49 | **Package version `"0.0.0"`** | Set to `"1.0.0"` with semantic versioning | June 26, 2026 |

---

## 📊 Features

| Feature | Date |
|---------|------|
| Water intake tracker | June 24, 2026 |
| Calorie target calculator | June 24, 2026 |
| Health Tools hub | June 24, 2026 |
| Onboarding flow | June 24, 2026 |
| Recharts integration | June 24, 2026 |
| Weekly planner view | June 24, 2026 |
| Meal history & progress tracking | June 24, 2026 |
| Persist plans to Supabase | June 25, 2026 |
| RLS policies for all tables | June 25, 2026 |
| Migration files for all 8 missing tables | June 25, 2026 |
| Preset plans seeded to database | June 25, 2026 |
| Profile preferences persisted to Supabase | June 25, 2026 |
| useSyncedPlans syncStatus tracks mutation failures + retry | June 25, 2026 |
| Meal history synced to Supabase | June 25, 2026 |
| Water + Step tracker synced to Supabase (daily_health_tracking table) | June 25, 2026 |

