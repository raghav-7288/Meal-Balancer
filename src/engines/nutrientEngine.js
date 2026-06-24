import { FOODS } from "../data/foods";

export function calculateFoodNutrients(food, grams) {
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

export function calculateMealTotals(items) {
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
 * @param {string} id
 * @returns {object|undefined}
 */
export function foodById(id) {
    return FOODS.find((f) => f.id === id);
}

/**
 * Aggregate nutrient totals for a single meal's items.
 * Supports both:
 *   - DB items with `nutrients` property (values per 100g)
 *   - Legacy local items looked up via foodById (using gramsPerExchange)
 *
 * @param {Array<{foodId: string, grams: number, nutrients?: object, foodGroup?: string}>} items
 * @returns {object} Aggregated totals including exchange info.
 */
export function aggregateMeal(items) {
    const totals = {
        kcal: 0, carbs: 0, protein: 0, fat: 0, fibre: 0,
        vitamins: 0, minerals: 0, addedSugar: 0, visibleFat: 0,
        vegetablesG: 0, cerealEnergy: 0, exchangeTotals: {},
    };

    for (const item of items) {
        // If the item has nutrients stored from DB (per 100g values)
        if (item.nutrients) {
            const factor = item.grams / 100;
            const kcal = (item.nutrients.kcal || 0) * factor;

            totals.kcal += kcal;
            totals.carbs += (item.nutrients.carbs || 0) * factor;
            totals.protein += (item.nutrients.protein || 0) * factor;
            totals.fat += (item.nutrients.fat || 0) * factor;
            totals.fibre += (item.nutrients.fibre || 0) * factor;
            totals.vitamins += (item.nutrients.vitamins || 0) * factor;
            totals.minerals += (item.nutrients.minerals || 0) * factor;

            // Use foodGroup stored on item for group-based calculations
            const group = item.foodGroup || "";
            totals.visibleFat += group === "fats" ? item.grams : 0;
            totals.vegetablesG += group === "vegetables" ? item.grams : 0;
            totals.cerealEnergy += group === "cereals" ? kcal : 0;
            if (group) {
                totals.exchangeTotals[group] = (totals.exchangeTotals[group] || 0) + factor;
            }
        } else {
            // Fallback: legacy local food lookup
            const food = foodById(item.foodId);
            if (!food) continue;
            const factor = item.grams / food.gramsPerExchange;
            const kcal = food.kcal * factor;

            totals.kcal += kcal;
            totals.carbs += food.carbs * factor;
            totals.protein += food.protein * factor;
            totals.fat += food.fat * factor;
            totals.fibre += food.fibre * factor;
            totals.vitamins += food.vitamins * factor;
            totals.minerals += food.minerals * factor;
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
 * @param {object} mealTotals - keyed by meal name, values from aggregateMeal().
 * @returns {object} Day-level aggregated totals.
 */
export function combineDay(mealTotals) {
    const day = {
        kcal: 0, carbs: 0, protein: 0, fat: 0, fibre: 0,
        vitamins: 0, minerals: 0, addedSugar: 0, visibleFat: 0,
        vegetablesG: 0, cerealEnergy: 0, exchangeTotals: {},
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
