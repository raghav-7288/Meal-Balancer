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
    const factor = grams / food.gramsPerExchange;

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
export function calculateMealTotals(items: Array<{ carbs: number; protein: number; fat: number; fibre: number; vitamins: number; minerals: number; kcal: number }>) {
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
    nutrients: { kcal?: number; carbs?: number; protein?: number; fat?: number; fibre?: number; vitamins?: number; minerals?: number },
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
 * - `cerealEnergy` — kcal contributed by "cereals" group
 * - `cerealEnergyPct` — cereal kcal as % of total meal kcal
 * - `exchangeTotals` — exchange count per food group (factor = grams / reference)
 *
 * @param items - Array of meal items, each with `foodId`, `grams`, and optionally `nutrients` / `foodGroup`
 * @returns NutrientTotals object with all macros, micros, exchange info, and derived percentages
 */
export function aggregateMeal(items: MealItem[]): NutrientTotals {
    const totals: NutrientTotals = {
        kcal: 0, carbs: 0, protein: 0, fat: 0, fibre: 0,
        vitamins: 0, minerals: 0, addedSugar: 0, visibleFat: 0,
        vegetablesG: 0, cerealEnergy: 0, cerealEnergyPct: 0, exchangeTotals: {},
    };

    for (const item of items) {
        if (item.nutrients) {
            // DB items: nutrients are per 100g
            const factor = item.grams / 100;
            const kcal = accumulateNutrients(totals, item.nutrients, factor);

            const group = item.foodGroup || "";
            totals.visibleFat += group === "fats" ? item.grams : 0;
            totals.vegetablesG += group === "vegetables" ? item.grams : 0;
            totals.cerealEnergy += group === "cereals" ? kcal : 0;
            if (group) {
                totals.exchangeTotals[group] = (totals.exchangeTotals[group] || 0) + factor;
            }
        } else {
            // Legacy local food lookup
            const food = foodById(item.foodId);
            if (!food) continue;
            const factor = item.grams / food.gramsPerExchange;
            const kcal = accumulateNutrients(totals, food, factor);

            totals.visibleFat += food.group === "fats" ? item.grams : 0;
            totals.vegetablesG += food.group === "vegetables" ? item.grams : 0;
            totals.cerealEnergy += food.group === "cereals" ? kcal : 0;
            totals.exchangeTotals[food.group] = (totals.exchangeTotals[food.group] || 0) + factor;
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
        kcal: 0, carbs: 0, protein: 0, fat: 0, fibre: 0,
        vitamins: 0, minerals: 0, addedSugar: 0, visibleFat: 0,
        vegetablesG: 0, cerealEnergy: 0, cerealEnergyPct: 0, exchangeTotals: {},
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

