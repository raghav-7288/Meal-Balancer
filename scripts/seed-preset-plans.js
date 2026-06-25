/**
 * Seed script: Populate the preset_plans table in Supabase.
 *
 * Usage:
 *   node scripts/seed-preset-plans.js
 *
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY in .env
 * (service role key is needed to bypass RLS for inserts).
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error(
        "Missing environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY in .env"
    );
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const MEALS = [
    "Early morning",
    "Breakfast",
    "Post breakfast snack",
    "Lunch",
    "Post lunch snack",
    "Dinner",
    "Bed time",
];

const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

function createWeeklyMeals(dayTemplate) {
    const meals = {};
    for (const slot of MEALS) {
        meals[slot] = [];
        for (const day of DAYS) {
            for (const item of dayTemplate[slot] || []) {
                meals[slot].push({
                    id: crypto.randomUUID(),
                    foodId: item.foodId,
                    grams: item.grams,
                    day,
                });
            }
        }
    }
    return meals;
}

const PRESET_PLAN_DEFINITIONS = [
    {
        name: "Balanced office day",
        display_order: 1,
        template: {
            "Early morning": [{ foodId: "banana", grams: 100 }],
            Breakfast: [
                { foodId: "curd", grams: 150 },
                { foodId: "roti", grams: 60 },
            ],
            "Post breakfast snack": [],
            Lunch: [
                { foodId: "dal", grams: 150 },
                { foodId: "mixedveg", grams: 150 },
                { foodId: "roti", grams: 60 },
            ],
            "Post lunch snack": [{ foodId: "banana", grams: 100 }],
            Dinner: [
                { foodId: "rice", grams: 150 },
                { foodId: "egg", grams: 50 },
                { foodId: "mixedveg", grams: 100 },
            ],
            "Bed time": [],
        },
    },
    {
        name: "Cereal-heavy pattern",
        display_order: 2,
        template: {
            "Early morning": [],
            Breakfast: [{ foodId: "rice", grams: 250 }],
            "Post breakfast snack": [],
            Lunch: [
                { foodId: "rice", grams: 300 },
                { foodId: "roti", grams: 60 },
            ],
            "Post lunch snack": [{ foodId: "banana", grams: 100 }],
            Dinner: [
                { foodId: "rice", grams: 200 },
                { foodId: "roti", grams: 60 },
            ],
            "Bed time": [],
        },
    },
    {
        name: "High-protein day",
        display_order: 3,
        template: {
            "Early morning": [{ foodId: "banana", grams: 100 }],
            Breakfast: [
                { foodId: "egg", grams: 100 },
                { foodId: "curd", grams: 200 },
            ],
            "Post breakfast snack": [],
            Lunch: [
                { foodId: "dal", grams: 200 },
                { foodId: "roti", grams: 60 },
                { foodId: "mixedveg", grams: 100 },
            ],
            "Post lunch snack": [{ foodId: "curd", grams: 150 }],
            Dinner: [
                { foodId: "egg", grams: 100 },
                { foodId: "dal", grams: 150 },
                { foodId: "rice", grams: 100 },
            ],
            "Bed time": [],
        },
    },
    {
        name: "Light veggie day",
        display_order: 4,
        template: {
            "Early morning": [],
            Breakfast: [
                { foodId: "banana", grams: 100 },
                { foodId: "curd", grams: 100 },
            ],
            "Post breakfast snack": [],
            Lunch: [
                { foodId: "mixedveg", grams: 200 },
                { foodId: "roti", grams: 30 },
                { foodId: "dal", grams: 100 },
            ],
            "Post lunch snack": [{ foodId: "banana", grams: 100 }],
            Dinner: [
                { foodId: "mixedveg", grams: 200 },
                { foodId: "roti", grams: 30 },
            ],
            "Bed time": [],
        },
    },
    {
        name: "Dal & roti comfort",
        display_order: 5,
        template: {
            "Early morning": [],
            Breakfast: [
                { foodId: "roti", grams: 90 },
                { foodId: "curd", grams: 150 },
            ],
            "Post breakfast snack": [],
            Lunch: [
                { foodId: "dal", grams: 200 },
                { foodId: "roti", grams: 90 },
                { foodId: "mixedveg", grams: 100 },
            ],
            "Post lunch snack": [],
            Dinner: [
                { foodId: "dal", grams: 150 },
                { foodId: "roti", grams: 60 },
                { foodId: "mixedveg", grams: 100 },
            ],
            "Bed time": [
                { foodId: "banana", grams: 100 },
                { foodId: "curd", grams: 100 },
            ],
        },
    },
];

async function seed() {
    console.log("🌱 Seeding preset plans...\n");

    // Check if preset plans already exist
    const { data: existing, error: fetchError } = await supabase
        .from("preset_plans")
        .select("id, name");

    if (fetchError) {
        console.error("Failed to check existing preset plans:", fetchError.message);
        process.exit(1);
    }

    if (existing && existing.length > 0) {
        console.log(`⚠️  Found ${existing.length} existing preset plans. Clearing and re-seeding...\n`);
        const { error: deleteError } = await supabase
            .from("preset_plans")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all

        if (deleteError) {
            console.error("Failed to clear existing plans:", deleteError.message);
            process.exit(1);
        }
    }

    const rows = PRESET_PLAN_DEFINITIONS.map((def) => ({
        name: def.name,
        meals: createWeeklyMeals(def.template),
        guidelines: "",
        display_order: def.display_order,
        is_active: true,
    }));

    const { data, error } = await supabase
        .from("preset_plans")
        .insert(rows)
        .select("id, name, display_order");

    if (error) {
        console.error("Failed to seed preset plans:", error.message);
        process.exit(1);
    }

    console.log("✅ Seeded preset plans:\n");
    for (const plan of data) {
        console.log(`   ${plan.display_order}. ${plan.name} (${plan.id})`);
    }
    console.log(`\n🎉 Done! ${data.length} preset plans inserted.`);
}

seed();

