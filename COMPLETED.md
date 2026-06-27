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
| 71 | **No runtime data validation** — API responses trusted blindly | Created `src/utils/schemas.js` with Zod schemas (`FoodItemSchema`, `UserPlanSchema`, `DailyHealthRowSchema`, `MealHistoryRowSchema`) + `validateResponse()` helper with graceful degradation. Integrated into all 4 service files. | June 26, 2026 |
| 72 | **Error Boundary per route** — single global ErrorBoundary | Created `src/components/ui/RouteErrorBoundary.jsx` with route-specific UI (name, retry, go-home). Wrapped each `<Route>` in `App.jsx` with its own boundary. | June 26, 2026 |
| 73 | **No state management for complex flows** — prop drilling | Created `src/stores/planStore.js` with Zustand `usePlanStore` — centralizes plan UI state (activePlanId, viewDay, nutrientLimits, modals). Available for components to import directly. | June 26, 2026 |
| 74 | **Service layer lacks retry logic** — fails silently on network blip | Created `src/utils/withRetry.js` with exponential backoff (1s/2s/4s). Only retries network failures (TypeError, AbortError, 5xx). Integrated into `planSyncService`, `dailyHealthService`, `mealHistoryService`. Added 8 unit tests. | June 26, 2026 |
| 75 | **No API response caching layer** — repeated food searches hit DB | Enhanced `src/utils/queryCache.js` with `staleWhileRevalidate()` (5min fresh, 15min stale window). Integrated into `foodSearchService` for both search and nutrient fetch. Added 3 unit tests. | June 26, 2026 |

---

## 🧪 Testing & Quality

| # | Issue | Fix Applied | Date |
|---|-------|-------------|------|
| 37 | **Component integration tests** | Added tests for: `DashboardPage` (renders KPIs), `MealBuilder` (add/remove food), `AuthPage` (login flow), `FoodAutocomplete` (search + select). 4 test files, 40 tests. | June 26, 2026 |
| 38 | **E2E tests with Playwright** | Installed Playwright, created `playwright.config.js`, added `e2e/meal-balancer-flow.spec.js` covering Login → Create Plan → Add Food → View Score → Export PDF → Logout. | June 26, 2026 |
| 40 | **`generatePlanPdf.js` untested** — 716 lines of complex PDF generation | Extracted 4 pure functions (`capitalize`, `computeWeeklyAverages`, `buildMealTableRow`, `buildDailySummaryRows`). Added `tests/generatePlanPdf.test.js` with 19 unit tests covering all edge cases. | June 26, 2026 |
| 53 | **FoodSearchPage tests `act()` warnings** | Wrapped all renders in `await act(async () => { ... })` — eliminated 10+ "not wrapped in act(...)" warnings. | June 26, 2026 |
| 54 | **`generatePlanPdf.js:55` incorrect knife coordinate** | Fixed `circleY * scale` → `circleY`. The multiplication was wrong; the blade endpoint should be at the circle center Y, consistent with the offset pattern used elsewhere. | June 26, 2026 |
| 55 | **Progress streak untested** | Added `tests/progressStreak.test.js` with 8 tests covering edge cases: empty history, single entries, broken streaks, stale entries returning 0 | June 26, 2026 |
| 56 | **NutrientLimits duplicate logic** | Extracted `getActualValue` helper and `TOTALS_KEY_MAP` constant to eliminate repeated if-else chains. | June 26, 2026 |
| 57 | **PDF filename null safety** | `plan.name` could crash if undefined; added fallback `"Meal Plan"`. | June 26, 2026 |
| 58 | **OnboardingFlow null safety** | `selectedPlan.name` could crash when presetPlans is empty; added `?.` guard. | June 26, 2026 |
| 59 | **Tracker pages memory leak** | `syncTimeoutRef` not cleared on unmount in WaterTracker/StepTracker; added cleanup. | June 26, 2026 |
| 60 | **Tracker useEffect infinite loop risk** | `setWaterData`/`setStepData` in useEffect dependencies could cause loops; removed from deps. | June 26, 2026 |

---

## ⚡ Performance

| # | Issue | Fix Applied | Date |
|---|-------|-------------|------|
| 41 | **Summaries recalculated on every plan change** | Split into `activeSummary` (computed eagerly for active plan only) and `summaries` (all plans, used lazily by ComparisonSection). Active plan changes no longer recalculate all plans. | June 26, 2026 |
| 42 | **JSON.stringify for plan comparison** | Replaced `JSON.stringify(prevPlan) !== JSON.stringify(plan)` with reference-equality check (`prevPlan !== plan`). Since `setPlans` always creates new objects on mutation, this is O(1) per plan. | June 26, 2026 |
| 43 | **Search results render all DOM nodes** | Added `visibleCount` state (default 20) with "Show more" button. Only 20 DOM nodes rendered initially; user can load more in batches of 20. | June 26, 2026 |
| 44 | **Inter font loaded from Google CDN** | Replaced Google Fonts CDN link with `@fontsource/inter` package. Font loaded from local bundle — eliminates render-blocking external request. | June 26, 2026 |
| 61 | **useHotkeys re-registers listener on every render** | Shortcuts object now created via `useMemo(…, [])` with refs for dynamic values. Event listener only registered once. | June 26, 2026 |
| 62 | **WeeklyPlannerPage bundles PDF library eagerly** | Lazy-loads `generatePlanPdf.js` via dynamic `import()`. WeeklyPlannerPage chunk dropped from 453KB → 13.9KB (97% reduction). PDF chunk loaded on demand. | June 26, 2026 |
| 76 | **Food list not virtualized** — renders 500+ items | Installed `@tanstack/react-virtual`. Created `VirtualizedList` component. Integrated into `FoodSearchPage.jsx` (replaces slice+show-more) and `FoodAutocomplete.jsx` (virtualized dropdown). Only visible rows rendered. | June 26, 2026 |
| 77 | **No bundle analysis tooling** | Installed `rollup-plugin-visualizer`. Added to `vite.config.js` (gated by `ANALYZE` env var). Added `npm run build:analyze` script → generates `dist/bundle-stats.html` treemap with gzip/brotli sizes. | June 26, 2026 |
| 78 | **Recharts renders full SVG eagerly** — charts load off-screen | Created `src/components/ui/LazyChart.jsx` using `IntersectionObserver`. Wrapped AreaChart in `ProgressPage.jsx` — chart only renders when scrolled into viewport. | June 26, 2026 |
| 79 | **Images not optimized** — no lazy loading, no modern formats | Created `src/components/ui/OptimizedImage.jsx` with `<picture>` fallback (AVIF/WebP), native `loading="lazy"`, `decoding="async"`, explicit `width`/`height` for CLS prevention. | June 26, 2026 |

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
| A10 | **Final interaction polish pass** — no micro-interactions | Added `src/styles/interaction-polish.css` (380+ lines) — premium interaction layer with: hover animations (card lifts, nav spring), click feedback (active scale), button press states, page fade-in transitions, modal spring entrance, table row highlights, input focus glow, empty state fade-in, toast slide animations, staggered KPI entrance, error shake animation, success pop animation, score pill transitions, nutrient bar smoothing, toggle switch spring, focus-visible ring for keyboard nav. All animations respect `prefers-reduced-motion`. Enhanced toast styling with backdrop blur. | June 27, 2026 |

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

---

## 🔐 Dependency Security

| Status | Details | Date |
|--------|---------|------|
| ✅ All clean | No known CVEs found across all npm dependencies | June 26, 2026 |

---

## 🔍 Codebase Audit (June 27, 2026)

| # | Issue | Fix Applied | Date |
|---|-------|-------------|------|
| A1 | **ESLint errors (7)** — unused imports, stale disable directives | Removed unused `DAYS` import from `usePresetPlanAdmin.js`, unused `screen` from `VirtualizedList.test.jsx`, stale `eslint-disable-line` from `FoodAutocomplete.jsx`, 5 stale `eslint-disable-next-line` from `authContext.test.jsx` | June 27, 2026 |
| A2 | **ESLint config missing coverage ignore** | Added `coverage` to `globalIgnores` in `eslint.config.js` | June 27, 2026 |
| A3 | **react-hooks/globals false positives in tests** | Added `'react-hooks/globals': 'off'` rule for `tests/**/*.{js,jsx}` (Spy pattern is valid for testing) | June 27, 2026 |
| A4 | **useSyncedPlans low branch coverage (52%)** | Added `useSyncedPlans.branches.test.js` with 9 tests covering: deletions, modifications, sync errors, retrySync no-op, localStorage failures, no-auth setPlans | June 27, 2026 |
| A5 | **useMealHistory low branch coverage (66%)** | Added `useMealHistory.branches.test.js` with 12 tests covering: default fields, sync error recovery, background upload failures, no-auth paths, localStorage errors, date merge dedup | June 27, 2026 |
| A6 | **queryCache stale-while-revalidate untested** | Added `queryCache.staleRevalidate.test.js` with 10 tests covering: fresh/stale/expired paths, background revalidation failure, inflight dedup, concurrent requests, eviction of expired entries | June 27, 2026 |
| A7 | **withRetry non-retryable fallthrough untested (line 41)** | Added 4 tests: generic app errors, empty message, null message, custom context logging | June 27, 2026 |
| A8 | **dailyHealthService branch gaps at 86-104** | Added `dailyHealthService.branches.test.js` with 12 tests covering: null/undefined rows input, null dates, null row elements, zero values, large counts | June 27, 2026 |
| A9 | **README inconsistencies** — wrong Node version (20→22), stale test count (27→45), E2E listed as roadmap but already done | Fixed Node version, test file count, removed E2E from roadmap, added missing scripts to table | June 27, 2026 |

### Coverage Before → After

| Area | Statements | Branches |
|------|-----------|----------|
| **Overall** | 89.88% → 91.76% | 78.69% → 82.11% |
| **useSyncedPlans** | 83.33% → 99.07% | 52.17% → 82.6% |
| **useMealHistory** | 86.07% → 100% | 66.07% → 89.28% |
| **queryCache** | 91.83% → 100% | 76.92% → 96.15% |
| **withRetry** | 96% → 100% | 93.1% → 100% |
| **dailyHealthService** | 93.75% → 100% | 78.94% → 100% |
| **Services (all)** | 98.65% → 99.55% | 97.18% → 100% |

---

## 🔍 Correctness & Stability Pass (June 27, 2026)

| # | Issue | Fix Applied | Date |
|---|-------|-------------|------|
| C1 | **FoodAutocomplete unstable ARIA ID** — `Math.random()` on every render broke `aria-controls` | Replaced with React 19 `useId()` for stable, render-consistent IDs | June 27 |
| C2 | **ProgressPage streak breaks on DST** — exact `diff === 1` fails during 23h/25h days | Changed inner loop to `Math.round(diff) === 1` | June 27 |
| C3 | **ProfileContext stale `saveToDb` closure** — `setProfile` captured first render's `saveToDb` | Changed to `saveToDbRef.current?.(next)` for always-latest invocation | June 27 |
| C4 | **`withRetry` misclassifies native TypeError** — `TypeError: Failed to fetch` wrongly treated as service error | Moved `error.name === "TypeError"` check before message prefix heuristic | June 27 |

### Tests Added (43 new tests)

| File | Tests |
|------|-------|
| `withRetry.test.js` | +3 (TypeError "Failed to fetch" regression) |
| `progressStreak.test.js` | +2 (DST edge case, same-day duplicates) |
| `schemas.edge-cases.test.js` | +9 (null paths, transforms, nullable fields) |
| `profileContext.edge-cases.test.jsx` | +6 (default profile, persistence, debounce, corrupted localStorage) |
| `FoodAutocomplete.integration.test.jsx` | +8 (stable ID, search, keyboard nav, selection, Escape) |
| `nutrientEngine.edge-cases.test.js` | +13 (DB items, missing foods, combineDay, accumulateNutrients) |
| `useHotkeys.test.js` | +2 (non-ctrl shortcuts, alt+key) |

---

## ⚡ Optimization Pass (June 27, 2026)

| # | Optimization | Measurable Impact |
|---|---|---|
| O1 | **Stabilized `updateMealItem`/`removeMealItem`** — switched to `activePlanIdRef` | Prevents MealBuilder re-render on plan switch |
| O2 | **Memoized `visibleFatLimit` and `isPresetActive`** | Prevents cascading re-renders of PlanSidebar + MealBuilder |
| O3 | **Derived `activeSummary` from `summaries`** | Eliminates redundant computation (7 meals × aggregateMeal + scoring) |
| O4 | **HealthToolsPage lazy sub-components** | Route chunk: 44.29 kB → **4.53 kB** (90% reduction) |
| O5 | **Extracted `getTodayName()`** to shared utility | Eliminated duplicate across 2 files |
| O6 | **Extracted `sanitizeNumeric`/`clampOnBlur`** to `src/utils/inputSanitize.js` | Eliminated duplicate across 2 profile components |
| O7 | **Extracted `COUNTRY_CODES`/`parseContactNumber`** to `src/data/countryCodes.js` | Eliminated 52 duplicate lines |

---

## 🎨 Final Polish Pass (June 27, 2026)

| Area | Improvement |
|------|-------------|
| **Touch targets** | 44px minimum on `pointer: coarse` devices (icon-btn, day-chip, nav elements) |
| **Tap highlight** | Removed `-webkit-tap-highlight-color` flash on mobile |
| **Textarea focus** | Consistent focus ring matching all other inputs |
| **Collapsible content** | Smooth fade+slide animation on meal card expand |
| **Button loading** | `aria-busy="true"` buttons show breathing pulse overlay |
| **Nutrient bars** | Smooth 0.5s cubic-bezier fill transition |
| **Empty cells** | Italic, muted, centered with proper padding |
| **Tablet breakpoint** | Two-column sections stack on 641–1024px |
| **Mobile spacing** | Tighter KPI grid, momentum scrolling tables |
| **Inline add-row** | Dashed border separator for visual clarity |

---

## 📊 Final Metrics (June 27, 2026)

| Metric | Value |
|--------|-------|
| Tests | 617 passing (49 files) |
| Coverage | 91% statements, 80.5% branches |
| Lint | 0 errors, 2 warnings (TanStack Virtual compatibility) |
| TypeScript | Passes (`tsc --noEmit`) |
| Build | ✓ (379ms, 2738 modules) |
| Format | ✓ (Prettier clean) |
