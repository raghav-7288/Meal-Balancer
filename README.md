# 🍽️ Meal Balancer

A React 19 single-page application for **Indian diet planning**. Build meals in grams, convert to exchange-style categories, score dietary patterns with transparent reasons, and export styled PDF reports — all backed by Supabase.

🔗 **Live App:** [https://meal-balancer-three.vercel.app/](https://meal-balancer-three.vercel.app/)

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
- **Profile Management** — Body measurements, diet preferences & health goals
- **Onboarding Flow** — Guided first-time user setup
- **Water Tracker** — Daily water intake logging with streaks
- **Step Tracker** — Daily step count with goal progress
- **Dark Mode** — System-aware + manual toggle (flash-free)
- **Code Splitting** — Lazy-loaded pages with retry logic for stale deploys
- **Error Boundary** — Graceful crash recovery
- **Query Cache** — 5-min TTL in-memory cache with max-size eviction
- **Plan Sync** — Bi-directional sync between localStorage and Supabase

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React (JSX) | ^19.2.6 |
| Routing | React Router DOM | ^7.16.0 |
| Build | Vite | ^8.0.12 |
| Styling | CSS + Tailwind CSS | ^4.3.0 |
| Icons | lucide-react | ^1.17.0 |
| Charts | Recharts | ^3.8.1 |
| PDF | jsPDF + jspdf-autotable | ^4.2.1 / ^5.0.8 |
| Backend | Supabase | ^2.106.2 |
| Testing | Vitest + Testing Library | ^4.1.8 / ^16.3.2 |
| Linting | ESLint + Prettier | ^10.3.0 / ^3.8.4 |
| Git Hooks | Husky + lint-staged | ^9.1.7 / ^16.4.0 |
| Node | — | 20.x |

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x
- npm 10+

### Installation

```bash
git clone <repo-url>
cd meal-balancer
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

The app is deployed on Vercel at [https://meal-balancer-three.vercel.app/](https://meal-balancer-three.vercel.app/).

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
│   │   ├── dashboard/       Dashboard sub-components (MealBuilder, PlanSidebar, etc.)
│   │   ├── pages/           Page-level components (11 pages)
│   │   ├── ui/              Reusable UI primitives (Section, Field, Kpi, StatCard, ErrorBoundary)
│   │   ├── AuthPage.jsx     Login / Sign-up form
│   │   ├── FoodSearchPage.* Food explorer (search + nutrient details)
│   │   └── UserProfile.jsx  User profile display
│   ├── context/             React context providers (Auth, Profile)
│   ├── data/                Static config, food data & preset plans
│   ├── engines/             Core logic (scoring, nutrients)
│   ├── hooks/               Custom hooks (useAuth, useDebounce, useLocalStorage, useSyncedPlans, useMealHistory, usePresetPlans)
│   ├── lib/                 Third-party client setup (Supabase)
│   ├── services/            API service layers (auth, database, foodSearch, planSync, presetPlan)
│   ├── styles/              Page-specific CSS modules
│   ├── utils/               Helpers (PDF export, query cache)
│   ├── App.jsx              Router shell + layout
│   ├── App.css              Global styles
│   ├── index.css            Tailwind imports + base styles
│   └── main.jsx             Entry point
├── supabase/
│   ├── migrations/          SQL migration files (001–011)
│   ├── diagnostic-queries.sql
│   └── SUPABASE_AUDIT.md
├── tests/                   Unit & component tests (Vitest)
├── CONTEXT.md               Auto-generated project context
├── DATABASE_SCHEMA.md       Full Supabase schema documentation
├── SUGGESTIONS.md           Improvement suggestions & roadmap
├── package.json
└── vite.config.js
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build (output: `dist/`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Auto-format all source files (Prettier) |
| `npm run format:check` | Check formatting without modifying files |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
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
| `major_groups` | Food group classifications |
| `nutrient_groups` | Nutrient category groupings |
| `nutrient_definitions` | Nutrient names, codes, and units |
| `health_goals` | Available health goals for selection |
| `user_profiles` | User body measurements & info (RLS enabled) |
| `user_profile_health_goals` | User ↔ health goal junction (RLS enabled) |
| `user_plans` | User meal plans synced from app (RLS enabled) |
| `preset_plans` | Pre-saved template plans (read-only) |
| `food_search_view` | Denormalized view for fast food search |

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for full schema details including RLS policies, triggers, and RPCs.

## 🧰 Development Tooling

- **Prettier** — Auto-formats code on save/commit
- **Husky + lint-staged** — Pre-commit hooks run format + lint on staged files
- **@testing-library/react** — Component testing with jsdom environment
- **Query Cache** — In-memory TTL cache with max-size eviction for Supabase API calls
- **Error Boundary** — Catches React render errors with recovery option
- **Code Splitting** — React.lazy with retry logic for stale deploys

## 🔮 Roadmap

- [ ] Persist profile preferences (activity, goal, dietType) to Supabase
- [ ] Persist meal history & water tracker to Supabase
- [ ] Mobile-responsive navigation (hamburger menu / bottom tabs)
- [ ] Loading skeletons & empty states
- [ ] Food favorites / recently used
- [ ] Nutrient RDA comparison (ICMR 2020 guidelines)
- [ ] Toast system (shared context-based)
- [ ] Refactor DashboardPage & ProfilePage (550+ lines → extracted components)
- [ ] Google OAuth sign-in
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] E2E tests (Playwright)
- [ ] PWA / offline support

## 📄 License

Private project — not licensed for redistribution.
