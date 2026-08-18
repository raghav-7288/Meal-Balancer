import { aggregateMeal, combineDay } from "../engines/nutrientEngine";
import { scoreDay } from "../engines/scoringEngine";
import { MEALS, DAYS } from "../data/presetPlans";

/**
 * Compute per-day nutrient totals and day scores for a weekly plan.
 *
 * Shared by the Weekly Planner's live view and the PDF export so both derive
 * numbers identically. Items are assigned to a day via `item.day` (items with
 * no `day` count toward every day). DB-backed items that don't embed
 * `nutrients` are hydrated through the optional `resolveNutrients` resolver.
 *
 * @param {object|null|undefined} plan - `{ meals: { slot: item[] } }`
 * @param {(foodId: string) => object | undefined} [resolveNutrients] - per-100g nutrient resolver for DB foods
 * @returns {Record<string, { dayTotals: object, dayScore: object }>} keyed by day name
 */
export function computeDaySummaries(plan, resolveNutrients) {
    const summaries = {};
    if (!plan) return summaries;

    const planMeals = plan.meals || {};
    for (const day of DAYS) {
        const mealTotals = {};
        for (const meal of MEALS) {
            const items = (planMeals[meal] || []).filter((i) => i.day === day || !i.day);
            mealTotals[meal] = aggregateMeal(items, resolveNutrients);
        }
        const dayTotals = combineDay(mealTotals);
        const dayScore = scoreDay(dayTotals);
        summaries[day] = { dayTotals, dayScore };
    }
    return summaries;
}
