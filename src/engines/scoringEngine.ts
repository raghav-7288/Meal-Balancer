import { APP_CONFIG } from "../data/config";
import type { NutrientTotals, ScoreResult, ScoringRule } from "../data/config";

/**
 * Meal-level scoring rules.
 * Each rule checks a nutrient field against a threshold and applies a penalty.
 */
const MEAL_RULES: ScoringRule[] = [
    {
        field: "cerealEnergyPct",
        op: ">",
        threshold: APP_CONFIG.cerealEnergyTargetPct + 10,
        penalty: 15,
        reason: "Too cereal-heavy relative to the rest of the meal.",
    },
    {
        field: "vegetablesG",
        op: "<",
        threshold: 100,
        penalty: 15,
        reason: "Vegetable quantity is too low.",
    },
    {
        field: "protein",
        op: "<",
        threshold: 10,
        penalty: 12,
        reason: "Low protein or pulse contribution.",
    },
    {
        field: "fibre",
        op: "<",
        threshold: 5,
        penalty: 10,
        reason: "Fibre support is weak.",
    },
    {
        field: "addedSugar",
        op: ">",
        threshold: 5,
        penalty: 10,
        reason: "Added sugar is high.",
    },
    {
        field: "visibleFat",
        op: ">",
        threshold: 7,
        penalty: 10,
        reason: "Visible fat/oil exceeds target.",
    },
];

/**
 * Day-level scoring rules.
 * Uses higher thresholds appropriate for full-day intake.
 */
const DAY_RULES: ScoringRule[] = [
    {
        field: "cerealEnergyPct",
        op: ">",
        threshold: APP_CONFIG.cerealEnergyTargetPct + 10,
        penalty: 15,
        reason: "Day pattern is cereal-forward.",
    },
    {
        field: "vegetablesG",
        op: "<",
        threshold: APP_CONFIG.vegetableBenchmarkG,
        penalty: 15,
        reason: "Vegetables are below the day benchmark.",
    },
    {
        field: "protein",
        op: "<",
        threshold: APP_CONFIG.pulseBenchmarkG / 2,
        penalty: 12,
        reason: "Protein/pulse intake is low.",
    },
    {
        field: "fibre",
        op: "<",
        threshold: 20,
        penalty: 10,
        reason: "Daily fibre needs improvement.",
    },
    {
        field: "addedSugar",
        op: ">",
        threshold: APP_CONFIG.addedSugarLimitG,
        penalty: 10,
        reason: "Added sugar exceeds the limit.",
    },
    {
        field: "visibleFat",
        op: ">",
        threshold: 25,
        penalty: 10,
        reason: "Visible fat/oil is too high.",
    },
];

/**
 * Shared scoring logic used by both `scoreMeal` and `scoreDay`.
 * Evaluates nutrient totals against a set of rules, applying penalties
 * and collecting reason messages.
 *
 * @param totals - Nutrient totals (from aggregateMeal or combineDay)
 * @param rules - Array of scoring rules with thresholds and penalties
 * @returns ScoreResult with score (0–100), band label, and reasons array
 */
export function score(totals: Partial<NutrientTotals>, rules: ScoringRule[]): ScoreResult {
    // If there's no food at all, return a neutral zero score
    const hasFood = (totals.protein || 0) + (totals.carbs || 0) + (totals.fat || 0) > 0;
    if (!hasFood) {
        return { score: 0, band: "No items", reasons: ["Add food items to see a score."] };
    }

    let points = 100;
    const reasons: string[] = [];

    for (const rule of rules) {
        const value = (totals[rule.field] as number) ?? 0;
        const violated =
            rule.op === ">" ? value > rule.threshold : value < rule.threshold;

        if (violated) {
            points -= rule.penalty;
            reasons.push(rule.reason);
        }
    }

    points = Math.max(0, Math.min(100, points));

    let band = "Poor balance";
    if (points >= APP_CONFIG.scoreBands.excellent) band = "Excellent balance";
    else if (points >= APP_CONFIG.scoreBands.good) band = "Good balance";
    else if (points >= APP_CONFIG.scoreBands.moderate) band = "Moderate imbalance";

    return { score: points, band, reasons };
}

/**
 * Score a single meal's nutrient balance.
 *
 * Starts at 100 and applies the following penalty rules:
 * - Cereal energy > 55% of meal kcal → −15 (too cereal-heavy)
 * - Vegetables < 100g → −15 (insufficient vegetables)
 * - Protein < 10g → −12 (low protein/pulse contribution)
 * - Fibre < 5g → −10 (weak fibre support)
 * - Added sugar > 5g → −10 (excess sugar)
 * - Visible fat/oil > 7g → −10 (excess fat)
 *
 * Final score is clamped to [0, 100] and mapped to bands:
 * Excellent (≥85) · Good (≥70) · Moderate (≥50) · Poor (<50)
 *
 * @param totals - Nutrient totals for the meal (output of {@link aggregateMeal})
 * @returns ScoreResult with `score` (0–100), `band` label, and `reasons` array of triggered penalties
 */
export function scoreMeal(totals: Partial<NutrientTotals>): ScoreResult {
    return score(totals, MEAL_RULES);
}

/**
 * Score an entire day's nutrient balance.
 *
 * Starts at 100 and applies the following penalty rules (higher thresholds than meal-level):
 * - Cereal energy > 55% of day kcal → −15 (day pattern is cereal-forward)
 * - Vegetables < 400g (APP_CONFIG.vegetableBenchmarkG) → −15 (below daily benchmark)
 * - Protein < 30g (pulseBenchmarkG / 2) → −12 (low protein/pulse intake)
 * - Fibre < 20g → −10 (daily fibre needs improvement)
 * - Added sugar > 25g (APP_CONFIG.addedSugarLimitG) → −10 (exceeds WHO/ICMR limit)
 * - Visible fat/oil > 25g → −10 (too high for the day)
 *
 * Final score is clamped to [0, 100] and mapped to bands:
 * Excellent (≥85) · Good (≥70) · Moderate (≥50) · Poor (<50)
 *
 * @param dayTotals - Nutrient totals for the day (output of {@link combineDay})
 * @returns ScoreResult with `score` (0–100), `band` label, and `reasons` array of triggered penalties
 */
export function scoreDay(dayTotals: Partial<NutrientTotals>): ScoreResult {
    return score(dayTotals, DAY_RULES);
}

