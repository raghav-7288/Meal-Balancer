# 🍽️ Meal Balancer

A React-based single-page application for **Indian diet planning**. Build meals in grams, convert to exchange-style categories, and score dietary patterns with transparent reasons.

## ✨ Features

- **Meal Builder** — Add foods (Breakfast / Lunch / Dinner / Snacks) with gram quantities
- **Scoring Engine** — 0-100 score with detailed reasons (Excellent / Good / Moderate / Poor)
- **Food Explorer** — Google-style search across 500+ foods with nutrient-ranked results
- **Pre-saved Plans** — 5 read-only templates for quick start
- **User Plans** — Create, name, edit, reset, and delete your own plans (persisted to localStorage)
- **Exchange Conversion** — Indian exchange system (grams → exchanges)
- **Nutrient Tracking** — Carbs, protein, fat, fibre, vitamins, minerals, kcal
- **Combination Comparison** — Compare plans side-by-side + best recommendation
- **Health Goals** — Personalised goals fetched from Supabase
- **Auth** — Email/password sign-up & sign-in via Supabase
- **Profile Management** — View and update user profile
- **Client-side Routing** — Real URLs with browser back/forward support
- **Code Splitting** — Lazy-loaded pages for fast initial load
- **Error Boundary** — Graceful crash recovery

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React (JSX) | ^19.2.6 |
| Routing | React Router | ^7.16.0 |
| Build | Vite | ^8.0.12 |
| Styling | CSS + Tailwind CSS | ^4.3.0 |
| Icons | lucide-react | ^1.17.0 |
| Charts | Recharts | ^3.8.1 |
| Backend | Supabase | ^2.106.2 |
| Testing | Vitest | ^4.1.8 |
| Node | — | 22.x |

## 🚀 Getting Started

### Prerequisites

- Node.js 22.x
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

SPA routing is handled by `vercel.json` rewrites. Make sure to set the environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) in Vercel Project Settings → Environment Variables.

## 📁 Project Structure

```
├── public/                  Static assets + Netlify _redirects
├── scripts/                 Tooling scripts
│   └── generate-context.js
├── src/
│   ├── assets/              Images & SVGs
│   ├── components/
│   │   ├── pages/           Page-level components (Welcome, Dashboard, Profile)
│   │   ├── ui/              Reusable UI (Section, Field, Kpi, StatCard, ErrorBoundary)
│   │   ├── AuthPage.jsx
│   │   ├── FoodSearchPage.jsx
│   │   ├── SupabaseTest.jsx
│   │   └── UserProfile.jsx
│   ├── context/             React context providers (Auth)
│   ├── data/                Static config & food data
│   ├── engines/             Core logic (scoring, nutrients)
│   ├── hooks/               Custom hooks (useAuth, useLocalStorage)
│   ├── lib/                 Third-party client setup (Supabase)
│   ├── services/            API service layers (auth, database)
│   ├── utils/               Utility helpers
│   ├── App.jsx              Router shell + layout
│   ├── App.css              Global styles
│   └── main.jsx             Entry point
├── tests/                   Unit tests (Vitest)
│   ├── scoringEngine.test.js
│   └── nutrientEngine.test.js
├── CONTEXT.md               Auto-generated project context
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
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run context` | Regenerate `CONTEXT.md` |

## 🌐 Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | Welcome | Landing page with feature overview |
| `/dashboard` | Dashboard | Meal builder, scoring, comparisons |
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
- Uses Supabase RPC `search_foods()` and view `food_search_view`

## 🗄️ Supabase Tables & Views

`health_goals` · `user_profile_health_goals` · `user_profiles` · `major_groups` · `food_items` · `nutrient_groups` · `nutrient_definitions` · `food_nutrient_values` · `food_search_view`

## 🔮 Roadmap

- Weekly planner view
## 🧰 Development Tooling

- **Prettier** — Auto-formats code on save/commit (`.prettierrc`)
- **Husky + lint-staged** — Pre-commit hooks run format + lint on staged files
- **GitHub Actions CI** — Lint, test, and build on every push/PR (`.github/workflows/ci.yml`)
- **@testing-library/react** — Component testing with jsdom environment
- **Query Cache** — In-memory TTL cache for Supabase API calls (`src/utils/queryCache.js`)

- Persist plans to Supabase (currently localStorage)
- PDF export
- Recharts nutrient visualizations
- Mobile UX improvements

## 📄 License

Private project — not licensed for redistribution.
