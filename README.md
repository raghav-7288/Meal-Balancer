# 🍽️ Meal Balancer

A React-based single-page application for **Indian diet planning**. Build meals in grams, convert to exchange-style categories, and score dietary patterns with transparent reasons.

## ✨ Features

- **Meal Builder** — Add foods (Breakfast / Lunch / Dinner / Snacks) with gram quantities
- **Scoring Engine** — 0-100 score with detailed reasons (Excellent / Good / Moderate / Poor)
- **Pre-saved Plans** — 5 read-only templates for quick start
- **User Plans** — Create, name, edit, reset, and delete your own plans
- **Exchange Conversion** — Indian exchange system (grams → exchanges)
- **Nutrient Tracking** — Carbs, protein, fat, fibre, vitamins, minerals, kcal
- **Combination Comparison** — Compare plans side-by-side + best recommendation
- **Health Goals** — Personalised goals fetched from Supabase
- **Auth** — Email/password sign-up & sign-in via Supabase
- **Profile Management** — View and update user profile

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React (JSX) | ^19.2.6 |
| Build | Vite | ^8.0.12 |
| Styling | Tailwind CSS | ^4.3.0 |
| Icons | lucide-react | ^1.17.0 |
| Charts | Recharts | ^3.8.1 |
| Backend | Supabase | ^2.106.2 |
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

## 📁 Project Structure

```
├── public/             Static assets (favicon, icons SVG)
├── scripts/            Tooling scripts
│   └── generate-context.js
├── src/
│   ├── assets/         Images & SVGs
│   ├── components/     Reusable UI components
│   ├── context/        React context providers (Auth)
│   ├── data/           Static config & food data
│   ├── engines/        Core logic (scoring, nutrients, recommendations)
│   ├── hooks/          Custom React hooks
│   ├── lib/            Third-party client setup (Supabase)
│   ├── services/       API service layers (auth, database)
│   ├── utils/          Utility helpers
│   ├── App.jsx         Main application component
│   └── main.jsx        Entry point
├── .env.example
├── CONTEXT.md          Auto-generated project context
├── package.json
└── vite.config.js
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run context` | Regenerate `CONTEXT.md` |

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

## 🗄️ Supabase Tables

`health_goals` · `user_profile_health_goals` · `user_profiles` · `major_groups` · `food_items` · `nutrient_groups` · `nutrient_definitions` · `food_nutrient_values`

## 🔮 Roadmap

- More foods sourced from Supabase DB
- Weekly planner view
- Persist plans to database
- PDF export
- Mobile UX improvements

## 📄 License

Private project — not licensed for redistribution.
