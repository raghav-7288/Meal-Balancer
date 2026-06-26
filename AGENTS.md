# AGENTS.md

## Project Overview

React 19 SPA for Indian diet planning. Users build meals in grams, score dietary balance (0–100), and sync plans via Supabase. Deployed on Vercel.

## Architecture

- **UI Layer**: React JSX components (`src/components/`) with lazy-loaded pages via `lazyWithRetry()` in `App.jsx`
- **Engines** (TypeScript): Pure scoring/nutrient logic in `src/engines/` — imported by JSX components
- **Services**: Supabase CRUD in `src/services/` — every service imports the singleton `supabase` from `src/lib/supabaseClient.js`
- **Hooks**: State + side-effects in `src/hooks/` — `useSyncedPlans` is the core bi-directional sync (localStorage ↔ Supabase)
- **Data**: Static config/types in `src/data/config.ts`, local foods in `src/data/foods.js`

## Key Conventions

- **Mixed TS/JS**: Only `src/engines/*.ts` and `src/data/config.ts` are TypeScript. Everything else is JSX/JS. Don't convert files to TS without explicit instruction.
- **Imports**: Use relative paths (no aliases). Supabase client is always `import { supabase } from "../lib/supabaseClient"`.
- **Env vars**: Prefixed with `VITE_` — access via `import.meta.env.VITE_SUPABASE_URL`.
- **Styling**: Tailwind CSS 4 (`@tailwindcss/vite` plugin) + component-scoped CSS files. No CSS modules.
- **Icons**: `lucide-react` — import individual icons: `import { Home } from "lucide-react"`.
- **Toasts**: Use `react-hot-toast` (`toast.success(...)` / `toast.error(...)`). Global `<Toaster>` is in `App.jsx`.

## Commands

```bash
npm run dev          # Vite dev server (localhost:5173)
npm test             # Vitest (unit tests, excludes e2e/)
npm run test:watch   # Vitest watch mode
npm run typecheck    # tsc --noEmit (engines + config only)
npm run lint         # ESLint
npm run format       # Prettier write
npm run context      # Regenerate CONTEXT.md
```

## Testing Patterns

- Tests live in `tests/` (not `src/__tests__/`). Name: `<module>.test.js` or `<Component>.test.jsx`.
- Vitest globals enabled (`describe`, `it`, `expect` — no imports needed).
- Supabase is mocked via `vi.mock("../src/lib/supabaseClient")` with chainable query builders — see `tests/__mocks__/supabaseClient.js` for the shared mock pattern.
- Service tests use a `terminalResult` variable pattern to control mock responses per-test.
- Engine tests import directly from `src/engines/` — no mocking needed (pure functions).

## Data Flow: Plan Sync

1. `useSyncedPlans` hook reads from localStorage on init
2. On login: fetches remote plans → merges (remote wins for shared IDs) → uploads local-only plans
3. On mutation: updates state + localStorage immediately, then fire-and-forget Supabase upsert
4. Diff uses reference equality (not `JSON.stringify`) — always create new plan objects on mutation

## Scoring System

Penalty-based (starts at 100, deducts points). Rules defined in `src/engines/scoringEngine.ts`. Thresholds sourced from `APP_CONFIG` in `src/data/config.ts`. Two levels: `scoreMeal()` and `scoreDay()` with different thresholds.

## Deployment (Critical)

- **NEVER** modify `installCommand` or `buildCommand` in `vercel.json` — Vercel uses `yarn install --no-lockfile` / `yarn run build` (not npm).
- SPA routing via `vercel.json` rewrites. All paths → `index.html`.
- Env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) set in Vercel dashboard.

## Database

Supabase with RLS on user-scoped tables. Migrations in `supabase/migrations/` (numbered 001–012). RPCs for food search (`search_foods`, `get_food_details`, `search_nutrient_foods`). Schema documented in `DATABASE_SCHEMA.md`.

## File Naming

- Pages: `src/components/pages/<Name>Page.jsx`
- Dashboard sub-components: `src/components/dashboard/<Name>.jsx`
- UI primitives: `src/components/ui/<Name>.jsx`
- Hooks: `src/hooks/use<Name>.js`
- Services: `src/services/<name>Service.js`

