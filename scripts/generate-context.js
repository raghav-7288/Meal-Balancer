#!/usr/bin/env node

/**
 * generate-context.js
 *
 * Generates CONTEXT.md - a comprehensive project summary file.
 * Usage: node scripts/generate-context.js  OR  npm run context
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

function readFileContent(relativePath) {
    const fullPath = path.join(ROOT, relativePath);
    if (!fs.existsSync(fullPath)) return null;
    return fs.readFileSync(fullPath, "utf-8");
}

function getDirectoryTree(dir, prefix, depth, maxDepth) {
    if (prefix === undefined) prefix = "";
    if (depth === undefined) depth = 0;
    if (maxDepth === undefined) maxDepth = 4;
    if (depth > maxDepth) return "";

    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true })
            .filter(function (e) {
                return !["node_modules", "dist", ".git", ".idea", ".env"].includes(e.name);
            })
            .sort(function (a, b) {
                if (a.isDirectory() && !b.isDirectory()) return -1;
                if (!a.isDirectory() && b.isDirectory()) return 1;
                return a.name.localeCompare(b.name);
            });
    } catch (err) {
        return "";
    }

    let tree = "";
    entries.forEach(function (entry, i) {
        var isLast = i === entries.length - 1;
        var connector = isLast ? "└── " : "├── ";
        var childPrefix = isLast ? "    " : "│   ";
        var suffix = entry.isDirectory() ? "/" : "";
        tree += prefix + connector + entry.name + suffix + "\n";
        if (entry.isDirectory()) {
            tree += getDirectoryTree(path.join(dir, entry.name), prefix + childPrefix, depth + 1, maxDepth);
        }
    });
    return tree;
}

function extractExports(content) {
    var exports = [];
    var regex = /export\s+(?:async\s+)?(?:function|const|let|var|class)\s+(\w+)/g;
    var match;
    while ((match = regex.exec(content)) !== null) {
        exports.push(match[1]);
    }
    return exports;
}

function countLines(content) {
    return content.split("\n").length;
}

// Main
var now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
var pkg = JSON.parse(readFileContent("package.json"));
var dependencies = Object.keys(pkg.dependencies || {});
var devDependencies = Object.keys(pkg.devDependencies || {});

var srcFiles = [
    "src/main.jsx",
    "src/App.jsx",
    "src/App.css",
    "src/data/config.js",
    "src/data/foods.js",
    "src/engines/scoringEngine.js",
    "src/engines/nutrientEngine.js",
    "src/engines/recommendationEngine.js",
    "src/context/AuthContext.jsx",
    "src/hooks/useAuth.js",
    "src/lib/supabaseClient.js",
    "src/services/authService.js",
    "src/services/databaseService.js",
    "src/components/AuthPage.jsx",
    "src/components/UserProfile.jsx",
    "src/components/SupabaseTest.jsx",
];

var stats = srcFiles.map(function (p) {
    var content = readFileContent(p);
    if (!content) return null;
    return { path: p, lines: countLines(content), exports: extractExports(content) };
}).filter(Boolean);

var totalLines = stats.reduce(function (sum, s) { return sum + s.lines; }, 0);
var tree = getDirectoryTree(ROOT);
var foodsContent = readFileContent("src/data/foods.js") || "";
var foodIds = [...foodsContent.matchAll(/id:\s*"(\w+)"/g)].map(function (m) { return m[1]; });
var configContent = readFileContent("src/data/config.js") || "";

// Build output
var L = [];
function w(s) { L.push(s === undefined ? "" : s); }

w("# Meal Balancer - Project Context File");
w();
w("> **Auto-generated**: " + now);
w("> Run `npm run context` to regenerate this file.");
w("> Total source lines: ~" + totalLines + " across " + stats.length + " key files.");
w();
w("---");
w();
w("## 1. Project Overview");
w();
w("**Meal Balancer** is a React-based SPA for Indian diet planning. Users build meals in grams, convert to exchange-style categories, and score dietary patterns with transparent reasons.");
w();
w("### Key Features");
w("- Meal Builder (Breakfast/Lunch/Dinner/Snacks)");
w("- Scoring Engine (0-100 with reasons)");
w("- Pre-saved Plans (5 read-only templates)");
w("- User Plans (create, name, edit, reset, delete)");
w("- Plan Toggle (Pre-saved vs My Plans)");
w("- Exchange Conversion");
w("- Nutrient Tracking");
w("- Combination Comparison + Best Recommendation");
w("- Health Goals (from Supabase)");
w("- Auth (email/password via Supabase)");
w("- Profile Management");
w();
w("---");
w();
w("## 2. Tech Stack");
w();
w("| Layer | Technology | Version |");
w("|-------|-----------|---------|");
w("| Framework | React (JSX) | " + (pkg.dependencies.react || "?") + " |");
w("| Build | Vite | " + (pkg.devDependencies.vite || "?") + " |");
w("| Styling | CSS + Tailwind | " + (pkg.dependencies.tailwindcss || "?") + " |");
w("| Icons | lucide-react | " + (pkg.dependencies["lucide-react"] || "?") + " |");
w("| Charts | recharts | " + (pkg.dependencies.recharts || "?") + " |");
w("| Backend | Supabase | " + (pkg.dependencies["@supabase/supabase-js"] || "?") + " |");
w("| Node | - | " + (pkg.engines && pkg.engines.node || "?") + " |");
w();
w("---");
w();
w("## 3. Folder Structure");
w();
w("```");
w(tree.trimEnd());
w("```");
w();
w("---");
w();
w("## 4. File Map & Exports");
w();
w("| File | Lines | Exports |");
w("|------|-------|---------|");
stats.forEach(function (s) {
    w("| `" + s.path + "` | " + s.lines + " | " + (s.exports.join(", ") || "-") + " |");
});
w();
w("---");
w();
w("## 5. Data Model");
w();
w("### Foods (" + foodIds.length + " items): " + foodIds.join(", "));
w("```js");
w("{ id, name, group, gramsPerExchange, carbs, protein, fat, fibre, vitamins, minerals, kcal }");
w("```");
w();
w("### Config");
w("```js");
w(configContent.trim());
w("```");
w();
w("### Plan Structure");
w("```js");
w("{ id: UUID, name: string, isPreset?: boolean, meals: { Breakfast: [{id, foodId, grams, day?, instructions?}], Lunch, Dinner, Snacks } }");
w("```");
w();
w("### Supabase Tables");
w("health_goals, user_profile_health_goals, user_profiles, major_groups, food_items, nutrient_groups, nutrient_definitions, food_nutrient_values");
w();
w("---");
w();
w("## 6. Scoring Logic");
w();
w("**Meal** (starts 100): cereal>55% -15, veg<100g -15, protein<10g -12, fibre<5g -10, sugar>5g -10, fat>7g -10");
w("**Day** (starts 100): cereal>55% -15, veg<400g -15, protein<30g -12, fibre<20g -10, sugar>25g -10, fat>25g -10");
w("Bands: Excellent(>=85), Good(>=70), Moderate(>=50), Poor(<50)");
w();
w("---");
w();
w("## 7. Auth Flow");
w();
w("AuthProvider -> getSession -> onAuthStateChange -> signIn/signUp/signOut -> user_profiles table");
w();
w("---");
w();
w("## 8. State (Dashboard)");
w();
w("profile, presetPlans(5), userPlans, planView, activePlanId, newPlanName, selectedMeal/FoodId/grams/day/instructions, vegetableTarget(400g), sugarLimit(25g), currentPage");
w();
w("---");
w();
w("## 9. Pre-saved Plans");
w();
w("1. Balanced office day  2. Cereal-heavy pattern  3. High-protein day  4. Light veggie day  5. Dal & roti comfort");
w();
w("---");
w();
w("## 10. Dependencies");
w();
var prodDeps = dependencies.map(function (d) { return d + "@" + pkg.dependencies[d]; }).join(", ");
var devDeps = devDependencies.map(function (d) { return d + "@" + pkg.devDependencies[d]; }).join(", ");
w("**Prod**: " + prodDeps);
w("**Dev**: " + devDeps);
w();
w("---");
w();
w("## 11. Env Vars");
w();
w("```");
w("VITE_SUPABASE_URL=<url>");
w("VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>");
w("```");
w();
w("---");
w();
w("## 12. Scripts");
w();
w("```json");
w(JSON.stringify(pkg.scripts, null, 2));
w("```");
w();
w("---");
w();
w("## 13. Design Decisions");
w();
w("- No TypeScript - plain JSX");
w("- Single App.jsx with colocated pages");
w("- Preset plans read-only; edits auto-copy to user plan");
w("- Indian exchange system (grams / gramsPerExchange)");
w("- Transparent scoring with reasons");
w("- Supabase for auth + health goals");
w("- " + foodIds.length + " local foods (expandable via DB)");
w();
w("---");
w();
w("## 14. Future");
w();
w("- More foods from Supabase");
w("- Weekly planner view");
w("- Persist plans to DB");
w("- Recharts integration");
w("- PDF export");
w("- Mobile improvements");
w();

var output = L.join("\n");
var outputPath = path.join(ROOT, "CONTEXT.md");
fs.writeFileSync(outputPath, output, "utf-8");
console.log("CONTEXT.md generated (" + L.length + " lines)");
console.log("  " + stats.length + " files analyzed, ~" + totalLines + " total source lines");

