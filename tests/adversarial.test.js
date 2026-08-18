/**
 * Phase 4 — Adversarial end-to-end tests.
 *
 * Exercises edge cases, invalid inputs, empty/extreme values,
 * and unexpected states across the critical engine and utility code.
 */
import { describe, it, expect } from "vitest";
import {
    aggregateMeal,
    combineDay,
    calculateFoodNutrients,
    foodById,
    normalizeFoodGroup,
    accumulateNutrients,
} from "../src/engines/nutrientEngine";
import { score, scoreMeal, scoreDay } from "../src/engines/scoringEngine";
import { calculateStreak } from "../src/utils/progressStats";
import { buildDayCopies, mealItemSignature } from "../src/utils/copyMealItem";
import { getLocalDateKey } from "../src/utils/dateKey";

// ════════════════════════════════════════════════════════════════════════
// 1. NUTRIENT ENGINE — adversarial inputs
// ════════════════════════════════════════════════════════════════════════
describe("nutrientEngine — adversarial", () => {
    it("aggregateMeal handles empty array", () => {
        const result = aggregateMeal([]);
        expect(result.kcal).toBe(0);
        expect(result.protein).toBe(0);
        expect(result.cerealEnergyPct).toBe(0);
    });

    it("aggregateMeal handles item with grams=0", () => {
        const result = aggregateMeal([{ foodId: "rice", grams: 0 }]);
        expect(result.kcal).toBe(0);
        expect(result.protein).toBe(0);
        expect(Number.isNaN(result.kcal)).toBe(false);
    });

    it("aggregateMeal handles item with undefined grams", () => {
        const result = aggregateMeal([{ foodId: "rice", grams: undefined }]);
        // Should not produce NaN — grams coerced to 0 or item skipped
        expect(Number.isNaN(result.kcal)).toBe(false);
        expect(Number.isNaN(result.protein)).toBe(false);
    });

    it("aggregateMeal handles item with NaN grams", () => {
        const result = aggregateMeal([{ foodId: "rice", grams: NaN }]);
        expect(Number.isNaN(result.kcal)).toBe(false);
        expect(Number.isNaN(result.protein)).toBe(false);
    });

    it("aggregateMeal handles item with negative grams", () => {
        const result = aggregateMeal([{ foodId: "rice", grams: -100 }]);
        // Negative grams should not produce positive nutrients
        expect(result.kcal).toBeLessThanOrEqual(0);
    });

    it("aggregateMeal handles unknown foodId without nutrients", () => {
        const result = aggregateMeal([{ foodId: "nonexistent-food", grams: 100 }]);
        // Should skip the item, not crash
        expect(result.kcal).toBe(0);
        expect(Number.isNaN(result.kcal)).toBe(false);
    });

    it("aggregateMeal handles item with nutrients but grams=0", () => {
        const result = aggregateMeal([{
            foodId: "db-123",
            grams: 0,
            nutrients: { kcal: 200, carbs: 50, protein: 10, fat: 5, fibre: 2 },
        }]);
        expect(result.kcal).toBe(0);
    });

    it("aggregateMeal handles composite item with empty ingredients", () => {
        const result = aggregateMeal([{
            foodId: "composite",
            grams: 100,
            ingredients: [],
        }]);
        expect(result.kcal).toBe(0);
    });

    it("aggregateMeal handles composite item with null ingredients", () => {
        const result = aggregateMeal([{
            foodId: "composite",
            grams: 100,
            ingredients: null,
        }]);
        // null ingredients → treated as non-composite → falls to foodById("composite") → skipped
        expect(result.kcal).toBe(0);
    });

    it("aggregateMeal handles extremely large grams", () => {
        const result = aggregateMeal([{ foodId: "rice", grams: 999999 }]);
        expect(Number.isFinite(result.kcal)).toBe(true);
        expect(result.kcal).toBeGreaterThan(0);
    });

    it("calculateFoodNutrients handles grams=0 without division error", () => {
        const food = foodById("rice");
        const result = calculateFoodNutrients(food, 0);
        expect(result.kcal).toBe(0);
        expect(Number.isNaN(result.protein)).toBe(false);
    });

    it("accumulateNutrients handles all-undefined nutrient values", () => {
        const totals = {
            kcal: 0, carbs: 0, protein: 0, fat: 0, fibre: 0,
            vitamins: 0, minerals: 0, addedSugar: 0, visibleFat: 0,
            vegetablesG: 0, cerealEnergy: 0, cerealEnergyPct: 0, exchangeTotals: {},
        };
        const kcal = accumulateNutrients(totals, {}, 1);
        expect(kcal).toBe(0);
        expect(totals.protein).toBe(0);
    });

    it("normalizeFoodGroup handles null/undefined/empty", () => {
        expect(normalizeFoodGroup(null, null)).toBe("");
        expect(normalizeFoodGroup(undefined, undefined)).toBe("");
        expect(normalizeFoodGroup("", null)).toBe("");
    });

    it("normalizeFoodGroup handles unknown group name", () => {
        expect(normalizeFoodGroup("completely unknown group")).toBe("completely unknown group");
    });

    it("combineDay handles empty mealTotals", () => {
        const result = combineDay({});
        expect(result.kcal).toBe(0);
        expect(result.cerealEnergyPct).toBe(0);
    });
});

// ════════════════════════════════════════════════════════════════════════
// 2. SCORING ENGINE — boundary & adversarial inputs
// ════════════════════════════════════════════════════════════════════════
describe("scoringEngine — adversarial", () => {
    it("scoreMeal with all-zero nutrients returns 'No items'", () => {
        const result = scoreMeal({ protein: 0, carbs: 0, fat: 0 });
        expect(result.score).toBe(0);
        expect(result.band).toBe("No items");
    });

    it("scoreMeal with undefined fields returns 'No items'", () => {
        const result = scoreMeal({});
        expect(result.score).toBe(0);
        expect(result.band).toBe("No items");
    });

    it("scoreMeal with NaN fields returns 'No items'", () => {
        const result = scoreMeal({ protein: NaN, carbs: NaN, fat: NaN });
        expect(result.score).toBe(0);
        expect(result.band).toBe("No items");
    });

    it("score never returns negative", () => {
        // All penalties triggered: 15+15+12+10+10+10 = 72, so 100-72=28
        const result = scoreMeal({
            cerealEnergyPct: 100,
            vegetablesG: 0,
            protein: 0,
            fibre: 0,
            addedSugar: 100,
            visibleFat: 100,
            carbs: 1, // need non-zero to pass hasFood check
        });
        expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it("score never exceeds 100", () => {
        const result = scoreMeal({
            cerealEnergyPct: 0,
            vegetablesG: 999,
            protein: 999,
            fibre: 999,
            addedSugar: 0,
            visibleFat: 0,
            carbs: 1,
        });
        expect(result.score).toBeLessThanOrEqual(100);
        expect(result.score).toBe(100);
    });

    it("scoreDay with exact threshold values (boundary)", () => {
        // Values exactly AT the threshold — should NOT trigger penalty
        const result = scoreDay({
            cerealEnergyPct: 55, // threshold is > 55
            vegetablesG: 400,    // threshold is < 400
            protein: 30,         // threshold is < 30
            fibre: 20,           // threshold is < 20
            addedSugar: 25,      // threshold is > 25
            visibleFat: 25,      // threshold is > 25
            carbs: 1,
        });
        expect(result.score).toBe(100);
    });

    it("scoreDay with values just past thresholds", () => {
        // Values just past every threshold — all penalties should trigger
        const result = scoreDay({
            cerealEnergyPct: 55.1,
            vegetablesG: 399.9,
            protein: 29.9,
            fibre: 19.9,
            addedSugar: 25.1,
            visibleFat: 25.1,
            carbs: 1,
        });
        expect(result.score).toBe(100 - 15 - 15 - 12 - 10 - 10 - 10);
        expect(result.score).toBe(28);
    });

    it("score with empty rules array returns 100", () => {
        const result = score({ carbs: 1 }, []);
        expect(result.score).toBe(100);
    });
});

// ════════════════════════════════════════════════════════════════════════
// 3. PROGRESS STATS — adversarial inputs
// ════════════════════════════════════════════════════════════════════════
describe("calculateStreak — adversarial", () => {
    it("returns 0 for null input", () => {
        expect(calculateStreak(null)).toBe(0);
    });

    it("returns 0 for undefined input", () => {
        expect(calculateStreak(undefined)).toBe(0);
    });

    it("returns 0 for empty array", () => {
        expect(calculateStreak([])).toBe(0);
    });

    it("returns 0 for entries with invalid date strings", () => {
        const result = calculateStreak([{ date: "not-a-date" }]);
        // Invalid Date → daysSinceLast is NaN → NaN > 1 is false → streak = 1?
        // Actually: NaN > 1 → false, so it falls through to streak=1
        // This is a bug if the date is truly invalid
        // After fix: should return 0
        expect(result).toBe(0);
    });

    it("handles entries with empty string dates", () => {
        const result = calculateStreak([{ date: "" }]);
        expect(result).toBe(0);
    });

    it("handles single entry from today", () => {
        const today = getLocalDateKey();
        const result = calculateStreak([{ date: today }]);
        expect(result).toBe(1);
    });

    it("handles duplicate consecutive dates", () => {
        const today = getLocalDateKey();
        const result = calculateStreak([
            { date: today },
            { date: today },
        ]);
        // Duplicate dates should count as 1 day streak, not 2
        // diff between same date = 0, which != 1, so loop breaks
        expect(result).toBe(1);
    });

    it("handles entries far in the future", () => {
        const result = calculateStreak([{ date: "2099-01-01" }]);
        // Future date: daysSinceLast is negative → negative > 1 is false → streak=1
        // This is questionable but not a crash
        expect(typeof result).toBe("number");
        expect(Number.isNaN(result)).toBe(false);
    });
});

// ════════════════════════════════════════════════════════════════════════
// 4. COPY MEAL ITEM — adversarial inputs
// ════════════════════════════════════════════════════════════════════════
describe("copyMealItem — adversarial", () => {
    it("buildDayCopies with null source returns empty", () => {
        expect(buildDayCopies(null, [], ["Monday"])).toEqual([]);
    });

    it("buildDayCopies with empty targetDays returns empty", () => {
        const source = { id: "1", foodId: "rice", grams: 100, day: "Monday" };
        expect(buildDayCopies(source, [], [])).toEqual([]);
    });

    it("buildDayCopies with null targetDays returns empty", () => {
        const source = { id: "1", foodId: "rice", grams: 100, day: "Monday" };
        expect(buildDayCopies(source, [], null)).toEqual([]);
    });

    it("buildDayCopies skips undefined days in targetDays", () => {
        const source = { id: "1", foodId: "rice", grams: 100, day: "Monday" };
        const result = buildDayCopies(source, [], [undefined, null, ""], () => "new-id");
        expect(result).toEqual([]);
    });

    it("buildDayCopies creates deep clone of ingredients (not shared refs)", () => {
        const source = {
            id: "1",
            foodId: "composite",
            grams: 200,
            day: "Monday",
            menu: "Shake",
            foodName: "Shake",
            ingredients: [
                { foodId: "banana", grams: 100, nutrients: { kcal: 90 } },
                { foodId: "curd", grams: 100, nutrients: { kcal: 60 } },
            ],
        };
        const copies = buildDayCopies(source, [], ["Tuesday"], () => "copy-id");
        expect(copies).toHaveLength(1);
        // Ingredients should be shallow-cloned (each ingredient is a new object)
        expect(copies[0].ingredients).not.toBe(source.ingredients);
        expect(copies[0].ingredients[0]).not.toBe(source.ingredients[0]);
    });

    it("mealItemSignature handles null item", () => {
        expect(mealItemSignature(null)).toBe("");
        expect(mealItemSignature(undefined)).toBe("");
    });

    it("mealItemSignature handles item with missing fields", () => {
        const sig = mealItemSignature({});
        expect(typeof sig).toBe("string");
    });
});

// ════════════════════════════════════════════════════════════════════════
// 5. DATE KEY — edge cases
// ════════════════════════════════════════════════════════════════════════
describe("getLocalDateKey — adversarial", () => {
    it("returns valid YYYY-MM-DD format", () => {
        const key = getLocalDateKey();
        expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("handles explicit date objects", () => {
        const key = getLocalDateKey(new Date(2026, 0, 1)); // Jan 1 2026
        expect(key).toBe("2026-01-01");
    });

    it("pads single-digit months and days", () => {
        const key = getLocalDateKey(new Date(2026, 2, 5)); // Mar 5 2026
        expect(key).toBe("2026-03-05");
    });
});

