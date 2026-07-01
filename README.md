# 🍽️ Diet Specifix

A React 19 single-page application for **Indian diet planning**. Build meals in grams, convert to exchange-style categories, score dietary patterns with transparent reasons, and export styled PDF reports — all backed by Supabase.

🔗 **Live App:** [https://diet-specifix.vercel.app/](https://diet-specifix.vercel.app/)

## ✨ Features

- **Meal Builder** — Add foods (7 meal slots per day) with gram quantities
- **Scoring Engine** — 0-100 score with detailed reasons (Excellent / Good / Moderate / Poor)
- **Food Explorer** — Google-style search across 500+ foods with nutrient-ranked results
- **Weekly Planner** — Plan meals across 7 days with per-day scoring
- **Health Tools Hub** — BMI Calculator, Calorie Calculator, Step Tracker, Water Tracker
- **Progress Tracking** — Meal history with charts (Recharts) and streak monitoring
- **PDF Export** — Download styled meal plan reports (jsPDF + autoTable)
- **Pre-saved Plans** — Read-only templates loaded from Supabase
- **User Plans** — Create, name, edit, reset, and delete plans (synced to Supabase)
- **Exchange Conversion** — Indian exchange system (grams → exchanges)
- **Nutrient Tracking** — Carbs, protein, fat, fibre, vitamins, minerals, kcal
- **Plan Comparison** — Compare plans side-by-side + best recommendation
- **Health Goals** — Personalised goals fetched from Supabase
- **Auth** — Email/password sign-up & sign-in via Supabase
- **Profile Management** — Body measurements, diet preferences & health goals (synced to Supabase)
- **Onboarding Flow** — Guided first-time user setup
- **Water Tracker** — Daily water intake logging with streaks (synced to Supabase)
- **Step Tracker** — Daily step count with goal progress (synced to Supabase)
- **Dark Mode** — System-aware + manual toggle (flash-free)
- **Keyboard Shortcuts** — `Ctrl+S` save, `Ctrl+N` new plan, `Ctrl+P` export, `Esc` close modals
- **Accessibility** — Focus traps, `aria-live` regions, skip navigation link
- **Toast Notifications** — Global feedback via react-hot-toast
- **Responsive Navigation** — Hamburger menu on mobile (< 768px)
- **Loading Skeletons** — Shimmer placeholders during data fetches
- **Empty States** — Illustrated empty states with CTA buttons
- **Score Gauge** — Animated semicircle visualization
- **Interaction Polish** — Premium micro-interactions (hover lifts, press feedback, page transitions, modal springs, staggered entrances) respecting `prefers-reduced-motion`
- **Code Splitting** — Lazy-loaded pages with retry logic for stale deploys
- **Error Boundary** — Graceful crash recovery
- **Query Cache** — 5-min TTL in-memory cache with max-size eviction & request deduplication
- **Plan Sync** — Bi-directional sync between localStorage and Supabase
- **TypeScript Engines** — Typed scoring & nutrient engines with full interface definitions

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React (JSX) | ^19.2.6 |
| Type System | TypeScript (engines & config) | ^6.0.3 |
| Routing | React Router DOM | ^7.16.0 |
| Build | Vite | ^8.0.12 |
| Styling | CSS + Tailwind CSS | ^4.3.0 |
| Icons | lucide-react | ^1.17.0 |
| Charts | Recharts | ^3.8.1 |
| PDF | jsPDF + jspdf-autotable | ^4.2.1 / ^5.0.8 |
| Toasts | react-hot-toast | ^2.x |
| Backend | Supabase | ^2.106.2 |
| Testing | Vitest + Testing Library | ^4.1.8 / ^16.3.2 |
| Linting | ESLint + Prettier | ^10.3.0 / ^3.8.4 |
| Git Hooks | Husky + lint-staged | ^9.1.7 / ^16.4.0 |
| Node | — | 22.x |

## 🚀 Getting Started

### Prerequisites

- Node.js 22.x
- npm 10+

### Installation

```bash
git clone <repo-url>
cd diet-specifix
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

For the seed script (admin only):

```env
VITE_SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview   # preview the production build locally
```

### Deploy to Vercel


```bash
npm run build
# Push to GitHub — Vercel auto-deploys from main branch
```

SPA routing is handled by `vercel.json` rewrites. Set environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) in Vercel Project Settings → Environment Variables.

> ⚠️ **IMPORTANT:** Never change the `installCommand` or `buildCommand` in `vercel.json`. The current `yarn install --no-lockfile` and `yarn run build` commands are required for Vercel to build successfully. Changing them will break the deployment.

## 📁 Project Structure

```
├── public/                  Static assets (favicon, logos, headers)
├── scripts/                 Tooling scripts
│   ├── generate-context.js  Auto-generate CONTEXT.md
│   └── seed-preset-plans.js Seed preset plans to Supabase
├── src/
│   ├── assets/              Images & SVGs
│   ├── components/
│   │   ├── dashboard/       Dashboard sub-components (MealBuilder, PlanSidebar, DaySelector, etc.)
│   │   ├── pages/           Page-level components (11 pages + profile subdir)
│   │   ├── ui/              Reusable UI primitives (Section, Field, Kpi, StatCard, ErrorBoundary, Skeleton, ScoreGauge, EmptyState)
│   │   ├── AuthPage.jsx     Login / Sign-up form
│   │   ├── FoodSearchPage.* Food explorer (search + nutrient details)
│   │   └── UserProfile.jsx  User profile display
│   ├── context/             React context providers (Auth, Profile)
│   ├── data/                Static config (config.ts), food data & preset plans
│   ├── engines/             Core logic — TypeScript (scoringEngine.ts, nutrientEngine.ts)
│   ├── hooks/               Custom hooks (useAuth, useDashboardState, useDebounce, useFocusTrap, useHotkeys, useLocalStorage, useSyncedPlans, useMealHistory, usePresetPlans)
│   ├── lib/                 Third-party client setup (Supabase)
│   ├── services/            API service layers (auth, dailyHealth, database, foodSearch, mealHistory, planSync, presetPlan)
│   ├── styles/              Design tokens, component base & interaction polish CSS
│   ├── utils/               Helpers (PDF export, query cache, retry, schemas)
│   ├── App.jsx              Router shell + layout
│   ├── App.css              Global styles
│   ├── index.css            Tailwind imports + base styles
│   └── main.jsx             Entry point
├── supabase/
│   ├── migrations/          SQL migration files (001–012)
│   ├── diagnostic-queries.sql
│   └── SUPABASE_AUDIT.md
├── tests/                   Unit & component tests (Vitest, 56 test files, 661 tests)
├── COMPLETED.md             Implemented changes log
├── CONTEXT.md               Auto-generated project context
├── DATABASE_SCHEMA.md       Full Supabase schema documentation
├── SUGGESTIONS.md           Improvement suggestions & roadmap
├── package.json
├── tsconfig.json
└── vite.config.js
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build (output: `dist/`) |
| `npm run build:analyze` | Bundle analysis (opens treemap in browser) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Auto-format all source files (Prettier) |
| `npm run format:check` | Check formatting without modifying files |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run typecheck` | TypeScript type-check (no emit) |
| `npm run context` | Regenerate `CONTEXT.md` |
| `npm run seed:preset-plans` | Seed preset plans to Supabase |

## 🌐 Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | Welcome | Landing page with feature overview |
| `/health-tools` | Health Tools | Hub for BMI, Calorie, Step & Water trackers |
| `/dashboard` | Dashboard | Meal builder, scoring, comparisons |
| `/weekly-planner` | Weekly Planner | 7-day meal planning view |
| `/progress` | Progress | Meal history, trends & streak tracking |
| `/foods` | Food Explorer | Search foods & view nutrient profiles |
| `/profile` | Profile | Account settings & health goals |

## 🧮 Scoring Logic

Scores start at **100** and deduct points for imbalances:

| Check | Deduction |
|-------|-----------|
| Cereal energy > 55% | −15 |
| Vegetables < target | −15 |
| Protein below minimum | −12 |
| Fibre below minimum | −10 |
| Sugar above limit | −10 |
| Fat above limit | −10 |

**Bands:** Excellent (≥85) · Good (≥70) · Moderate (≥50) · Poor (<50)

## 🔍 Food Explorer

- **Live search** with 300ms debounce (fires after 2+ characters)
- **Nutrient-ranked results** — search "Protein" to see foods sorted by protein content
- **Nutrient detail panel** — grouped by nutrient category with collapsible sections
- **Keyboard navigation** — Arrow keys + Enter
- **Filter chips** — All / Foods / Groups
- Uses Supabase `food_items` ILIKE search and `food_search_view`

## 🗄️ Supabase Tables & Views

| Table | Purpose |
|-------|---------|
| `food_items` | 500+ food items with codes and group references |
| `food_nutrient_values` | Nutrient values per food (38 nutrients) |
| `food_nutrient_values_staging` | ETL import staging table (wide-format, not used at runtime) |
| `major_groups` | Food group classifications |
| `nutrient_groups` | Nutrient category groupings |
| `nutrient_definitions` | Nutrient names, codes, and units |
| `health_goals` | Available health goals for selection (RLS enabled) |
| `user_profiles` | User body measurements & preferences (RLS enabled) |
| `user_profile_health_goals` | User ↔ health goal junction (RLS enabled) |
| `user_plans` | User meal plans synced from app (RLS enabled) |
| `preset_plans` | Pre-saved template plans (read-only, RLS enabled) |
| `meal_history` | Persisted meal history entries (RLS enabled) |
| `daily_health_tracking` | Water & step tracker data (RLS enabled) |
| `food_search_view` | Denormalized view for fast food search |

### RPCs

| Function | Description |
|----------|-------------|
| `search_foods(search_text)` | Multi-field ILIKE search, LIMIT 20 |
| `get_food_details(p_food_id)` | All nutrients for a single food |
| `search_nutrient_foods(nutrient_search)` | Foods ranked by nutrient value DESC, LIMIT 100 |
| `search_foods_all_fields(search_text)` | Broad 7-way ILIKE search, LIMIT 500 |

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for full schema details including RLS policies, triggers, and RPCs.

## 🧰 Development Tooling

- **TypeScript** — Typed engines (`config.ts`, `scoringEngine.ts`, `nutrientEngine.ts`) with full interface definitions
- **Prettier** — Auto-formats code on save/commit
- **Husky + lint-staged** — Pre-commit hooks run format + lint on staged files
- **@testing-library/react** — Component testing with jsdom environment (56 test files, 661 tests)
- **Playwright** — E2E tests with auto-started dev server
- **react-hot-toast** — Global toast notification system
- **Query Cache** — In-memory TTL cache with max-size eviction & request deduplication for Supabase API calls
- **Error Boundary** — Catches React render errors with recovery option
- **Code Splitting** — React.lazy with retry logic for stale deploys

## 🔮 Roadmap

- [ ] Food favorites / recently used
- [ ] Nutrient RDA comparison (ICMR 2020 guidelines)
- [ ] Google OAuth sign-in
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] PWA / offline support
- [ ] Food portion presets (Indian-specific)
- [ ] Grocery list generation
- [ ] Drag-and-drop meal items
- [ ] Meal templates (save & reuse)
- [ ] Barcode scanner (Open Food Facts API)

See [SUGGESTIONS.md](./SUGGESTIONS.md) for full details and [COMPLETED.md](./COMPLETED.md) for finished work.

## 📄 License

Private project — not licensed for redistribution.
