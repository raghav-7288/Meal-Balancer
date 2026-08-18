import { FOODS } from "../data/foods";
import type { LocalFood, MealItem, NutrientTotals } from "../data/config";

/**
 * Calculate scaled nutrient values for a food item at a given gram amount.
 *
 * @param food - The food item definition (from FOODS array)
 * @param grams - How many grams are being consumed
 * @returns Object with scaled nutrient values
 */
export function calculateFoodNutrients(food: LocalFood, grams: number) {
    const factor = grams / (food.gramsPerExchange || 1);

    return {
        carbs: food.carbs * factor,
        protein: food.protein * factor,
        fat: food.fat * factor,
        fibre: food.fibre * factor,
        vitamins: food.vitamins * factor,
        minerals: food.minerals * factor,
        kcal: food.kcal * factor,
    };
}

/**
 * Sum pre-calculated nutrient values for an array of food items.
 *
 * @param items - Array of objects with nutrient properties
 * @returns Aggregated nutrient totals
 */
export function calculateMealTotals(
    items: Array<{
        carbs: number;
        protein: number;
        fat: number;
        fibre: number;
        vitamins: number;
        minerals: number;
        kcal: number;
    }>
) {
    return items.reduce(
        (acc, item) => {
            acc.carbs += item.carbs;
            acc.protein += item.protein;
            acc.fat += item.fat;
            acc.fibre += item.fibre;
            acc.vitamins += item.vitamins;
            acc.minerals += item.minerals;
            acc.kcal += item.kcal;
            return acc;
        },
        {
            carbs: 0,
            protein: 0,
            fat: 0,
            fibre: 0,
            vitamins: 0,
            minerals: 0,
            kcal: 0,
        }
    );
}

/**
 * Look up a food by its ID from the local FOODS array.
 *
 * @param id - Food item identifier
 * @returns The matching food object, or undefined if not found
 */
export function foodById(id: string): LocalFood | undefined {
    return (FOODS as LocalFood[]).find((f) => f.id === id);
}

/** Per-100g nutrient values as stored on DB-backed meal items. */
export type NutrientValues = NonNullable<MealItem["nutrients"]>;

/**
 * Resolver that provides per-100g nutrients for a DB food id.
 * Used so meal items that only reference a `foodId` (no embedded `nutrients`)
 * — e.g. preset plans built through the admin UI — can still be aggregated.
 */
export type NutrientResolver = (foodId: string) => NutrientValues | undefined;

// ── Food-group normalisation ────────────────────────────────────────────────
// DB foods carry ICMR/IFCT major-group names (e.g. "Green Leafy Vegetables") or
// ids (1–20), while the scoring engine reasons in terms of a handful of semantic
// categories ("vegetables", "fats", "cereals", …). Map both representations onto
// those categories so vegetable/visible-fat/cereal tracking works for DB foods.

/** Semantic categories the engine already understands (identity-mapped). */
const KNOWN_CATEGORIES = new Set([
    "cereals",
    "pulses",
    "vegetables",
    "fats",
    "fruit",
    "roots",
    "condiments",
    "nuts",
    "sugar",
    "misc",
    "dairy",
    "egg",
    "meat",
    "fish",
]);

/** DB major_group_id → semantic category. */
const GROUP_ID_TO_CATEGORY: Record<number, string> = {
    1: "cereals", // Cereals and Millets
    2: "pulses", // Grain Legumes
    3: "vegetables", // Green Leafy Vegetables
    4: "vegetables", // Other Vegetables
    5: "fruit", // Fruits
    6: "roots", // Roots and Tubers
    7: "condiments", // Condiments and Spices
    8: "nuts", // Nuts and Oil Seeds
    9: "sugar", // Sugars
    10: "vegetables", // Mushrooms
    11: "misc", // Miscellaneous Foods
    12: "dairy", // Milk and Milk Products
    13: "egg", // Egg and Egg Products
    14: "meat", // Poultry
    15: "meat", // Animal Meat
    16: "fish", // Marine Fish
    17: "fish", // Marine Shellfish
    18: "fish", // Marine Mollusks
    19: "fish", // Fresh Water Fish and Shellfish
    20: "fats", // Edible Oils and Fats
};

/** DB major_group_name (lowercased) → semantic category. */
const GROUP_NAME_TO_CATEGORY: Record<string, string> = {
    "cereals and millets": "cereals",
    "grain legumes": "pulses",
    "green leafy vegetables": "vegetables",
    "other vegetables": "vegetables",
    fruits: "fruit",
    "roots and tubers": "roots",
    "condiments and spices": "condiments",
    "nuts and oil seeds": "nuts",
    sugars: "sugar",
    mushrooms: "vegetables",
    "miscellaneous foods": "misc",
    "milk and milk products": "dairy",
    "egg and egg products": "egg",
    poultry: "meat",
    "animal meat": "meat",
    "marine fish": "fish",
    "marine shellfish": "fish",
    "marine mollusks": "fish",
    "fresh water fish and shellfish": "fish",
    "edible oils and fats": "fats",
};

/**
 * Normalise a food group (name and/or DB id) to a semantic category the scoring
 * engine understands. Already-normalised values (e.g. "vegetables") pass through
 * unchanged, so legacy/local foods are unaffected.
 *
 * @param group - Group name (semantic category or DB major-group name)
 * @param groupId - Optional DB major_group_id (1–20)
 * @returns A semantic category string (may be "" when unknown/empty)
 */
export function normalizeFoodGroup(group?: string | null, groupId?: number | null): string {
    const g = (group || "").trim().toLowerCase();
    if (KNOWN_CATEGORIES.has(g)) return g;
    if (groupId != null && GROUP_ID_TO_CATEGORY[groupId]) return GROUP_ID_TO_CATEGORY[groupId];
    if (g && GROUP_NAME_TO_CATEGORY[g]) return GROUP_NAME_TO_CATEGORY[g];
    return g;
}

/**
 * Shared helper to accumulate nutrient values into totals.
 * Eliminates duplication between DB-item and legacy-item branches.
 *
 * @param totals - The running totals object to mutate
 * @param nutrients - Source nutrient values (per unit)
 * @param factor - Multiplier (grams / 100 for DB items, grams / gramsPerExchange for legacy)
 */
export function accumulateNutrients(
    totals: NutrientTotals,
    nutrients: {
        kcal?: number;
        carbs?: number;
        protein?: number;
        fat?: number;
        fibre?: number;
        vitamins?: number;
        minerals?: number;
    },
    factor: number
): number {
    const kcal = (nutrients.kcal || 0) * factor;
    totals.kcal += kcal;
    totals.carbs += (nutrients.carbs || 0) * factor;
    totals.protein += (nutrients.protein || 0) * factor;
    totals.fat += (nutrients.fat || 0) * factor;
    totals.fibre += (nutrients.fibre || 0) * factor;
    totals.vitamins += (nutrients.vitamins || 0) * factor;
    totals.minerals += (nutrients.minerals || 0) * factor;
    return kcal;
}

/**
 * Aggregate nutrient totals for a single meal's items.
 *
 * Supports two food item formats:
 * - **DB items**: Have a `nutrients` property with values per 100g.
 *   Scaled by `grams / 100`. The `foodGroup` field is used for exchange tracking.
 * - **Legacy local items**: Looked up via {@link foodById} using `foodId`.
 *   Scaled by `grams / gramsPerExchange`. The food's `group` field is used.
 *
 * In addition to macro/micro sums, tracks:
 * - `vegetablesG` — total grams from "vegetables" group
 * - `visibleFat` — total grams from "fats" group (added oils/ghee)
 * - `addedSugar` — total grams from "sugar" group (added sugars/jaggery)
 * - `cerealEnergy` — kcal contributed by "cereals" group
 * - `cerealEnergyPct` — cereal kcal as % of total meal kcal
 * - `exchangeTotals` — exchange count per food group (factor = grams / reference)
 *
 * @param items - Array of meal items, each with `foodId`, `grams`, and optionally `nutrients` / `foodGroup`
 * @param resolveNutrients - Optional resolver providing per-100g nutrients for a DB `foodId`
 *   when an item has no embedded `nutrients` (e.g. admin-built preset plans).
 * @returns NutrientTotals object with all macros, micros, exchange info, and derived percentages
 */
export function aggregateMeal(
    items: MealItem[],
    resolveNutrients?: NutrientResolver
): NutrientTotals {
    // Flatten composite items: expand ingredients into virtual MealItems
    const flatItems: MealItem[] = [];
    for (const item of items) {
        if (item.ingredients && item.ingredients.length > 0) {
            for (const ing of item.ingredients) {
                flatItems.push({
                    foodId: ing.foodId,
                    grams: ing.grams,
                    nutrients: ing.nutrients,
                    foodGroup: ing.foodGroup,
                    foodGroupId: ing.foodGroupId,
                    day: item.day,
                });
            }
        } else {
            flatItems.push(item);
        }
    }

    const totals: NutrientTotals = {
        kcal: 0,
        carbs: 0,
        protein: 0,
        fat: 0,
        fibre: 0,
        vitamins: 0,
        minerals: 0,
        addedSugar: 0,
        visibleFat: 0,
        vegetablesG: 0,
        cerealEnergy: 0,
        cerealEnergyPct: 0,
        exchangeTotals: {},
    };

    for (const item of flatItems) {
        // Guard against undefined/NaN/non-numeric grams — coerce to 0
        const grams = Number.isFinite(item.grams) ? item.grams : 0;

        // Prefer embedded nutrients; otherwise hydrate DB items via the resolver.
        const nutrients =
            item.nutrients ||
            (resolveNutrients && item.foodId ? resolveNutrients(item.foodId) : undefined);

        if (nutrients) {
            // DB items: nutrients are per 100g
            const factor = grams / 100;
            const kcal = accumulateNutrients(totals, nutrients, factor);

            const group = normalizeFoodGroup(item.foodGroup, item.foodGroupId);
            totals.visibleFat += group === "fats" ? grams : 0;
            totals.vegetablesG += group === "vegetables" ? grams : 0;
            totals.addedSugar += group === "sugar" ? grams : 0;
            totals.cerealEnergy += group === "cereals" ? kcal : 0;
            if (group) {
                totals.exchangeTotals[group] = (totals.exchangeTotals[group] || 0) + factor;
            }
        } else {
            // Legacy local food lookup
            const food = foodById(item.foodId);
            if (!food) continue;
            const gramsPerExch = food.gramsPerExchange || 1; // guard against 0/undefined
            const factor = grams / gramsPerExch;
            const kcal = accumulateNutrients(totals, food, factor);

            const group = normalizeFoodGroup(food.group);
            totals.visibleFat += group === "fats" ? grams : 0;
            totals.vegetablesG += group === "vegetables" ? grams : 0;
            totals.addedSugar += group === "sugar" ? grams : 0;
            totals.cerealEnergy += group === "cereals" ? kcal : 0;
            totals.exchangeTotals[group] = (totals.exchangeTotals[group] || 0) + factor;
        }
    }

    totals.cerealEnergyPct = totals.kcal > 0 ? (totals.cerealEnergy / totals.kcal) * 100 : 0;
    return totals;
}

/**
 * Combine multiple meal totals into day-level totals.
 *
 * Sums all numeric nutrient fields across meals and merges `exchangeTotals`
 * maps. Recomputes `cerealEnergyPct` as the day-wide ratio (not a simple
 * sum of per-meal percentages).
 *
 * Typical usage: pass the output of {@link aggregateMeal} for each meal slot
 * (e.g., "Breakfast", "Lunch", "Dinner") keyed by meal name.
 *
 * The resulting totals can be scored with {@link scoreDay} from scoringEngine.
 *
 * @param mealTotals - Object keyed by meal name (e.g., "Breakfast"), values are NutrientTotals from aggregateMeal()
 * @returns Day-level NutrientTotals with all fields summed and `cerealEnergyPct` recomputed
 */
export function combineDay(mealTotals: Record<string, NutrientTotals>): NutrientTotals {
    const day: NutrientTotals = {
        kcal: 0,
        carbs: 0,
        protein: 0,
        fat: 0,
        fibre: 0,
        vitamins: 0,
        minerals: 0,
        addedSugar: 0,
        visibleFat: 0,
        vegetablesG: 0,
        cerealEnergy: 0,
        cerealEnergyPct: 0,
        exchangeTotals: {},
    };

    for (const meal of Object.values(mealTotals)) {
        day.kcal += meal.kcal;
        day.carbs += meal.carbs;
        day.protein += meal.protein;
        day.fat += meal.fat;
        day.fibre += meal.fibre;
        day.vitamins += meal.vitamins;
        day.minerals += meal.minerals;
        day.addedSugar += meal.addedSugar;
        day.visibleFat += meal.visibleFat;
        day.vegetablesG += meal.vegetablesG;
        day.cerealEnergy += meal.cerealEnergy;

        for (const [k, v] of Object.entries(meal.exchangeTotals)) {
            day.exchangeTotals[k] = (day.exchangeTotals[k] || 0) + v;
        }
    }

    day.cerealEnergyPct = day.kcal > 0 ? (day.cerealEnergy / day.kcal) * 100 : 0;
    return day;
}
