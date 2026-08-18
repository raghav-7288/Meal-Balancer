/**
 * Tests for the DB-food fixes in nutrientEngine:
 * - normalizeFoodGroup: maps ICMR/IFCT group names + ids → engine categories
 * - aggregateMeal(items, resolveNutrients): hydrates DB foods that store only a
 *   foodId (no inline nutrients), e.g. admin-built preset plans.
 *
 * Regression guard for the bug where dashboard/planner cards read 0 because
 * preset ingredients (DB numeric foodIds, group names like "Green Leafy
 * Vegetables", no nutrients) were skipped entirely by aggregateMeal.
 */
import { describe, it, expect } from "vitest";
import { aggregateMeal, normalizeFoodGroup } from "../src/engines/nutrientEngine";

describe("normalizeFoodGroup", () => {
    it("passes through already-normalised engine categories", () => {
        for (const g of ["vegetables", "cereals", "fats", "pulses", "fruit", "dairy", "egg"]) {
            expect(normalizeFoodGroup(g)).toBe(g);
        }
    });

    it("maps DB major_group ids to categories", () => {
        expect(normalizeFoodGroup(undefined, 1)).toBe("cereals");
        expect(normalizeFoodGroup(undefined, 2)).toBe("pulses");
        expect(normalizeFoodGroup(undefined, 3)).toBe("vegetables");
        expect(normalizeFoodGroup(undefined, 4)).toBe("vegetables");
        expect(normalizeFoodGroup(undefined, 20)).toBe("fats");
    });

    it("maps DB major_group names (case-insensitive) to categories", () => {
        expect(normalizeFoodGroup("Green Leafy Vegetables")).toBe("vegetables");
        expect(normalizeFoodGroup("Other Vegetables")).toBe("vegetables");
        expect(normalizeFoodGroup("Cereals and Millets")).toBe("cereals");
        expect(normalizeFoodGroup("Edible Oils and Fats")).toBe("fats");
        expect(normalizeFoodGroup("grain legumes")).toBe("pulses");
    });

    it("returns '' for empty/unknown groups", () => {
        expect(normalizeFoodGroup("")).toBe("");
        expect(normalizeFoodGroup(undefined, undefined)).toBe("");
        expect(normalizeFoodGroup("Something Unlisted")).toBe("something unlisted");
    });

    it("prefers an already-known category name over an id", () => {
        // Local foods pass group only; keep them intact.
        expect(normalizeFoodGroup("cereals", 3)).toBe("cereals");
    });
});

describe("aggregateMeal with a nutrient resolver", () => {
    // Simulates a preset ingredient: DB numeric foodId, DB group, NO nutrients.
    const dbItem = (over = {}) => ({
        foodId: "10",
        grams: 100,
        foodGroup: "Green Leafy Vegetables",
        foodGroupId: 3,
        ...over,
    });

    const resolver = (foodId) =>
        ({
            10: { kcal: 40, carbs: 5, protein: 3, fat: 1, fibre: 6, vitamins: 0, minerals: 0 },
            37: { kcal: 120, carbs: 20, protein: 8, fat: 1, fibre: 4, vitamins: 0, minerals: 0 },
        })[foodId];

    it("skips DB items without nutrients when no resolver is given (legacy behaviour)", () => {
        const result = aggregateMeal([dbItem()]);
        expect(result.protein).toBe(0);
        expect(result.vegetablesG).toBe(0);
    });

    it("hydrates DB items via the resolver and normalises the group", () => {
        const result = aggregateMeal([dbItem({ grams: 200 })], resolver);
        // 200g at per-100g → factor 2
        expect(result.protein).toBe(6);
        expect(result.carbs).toBe(10);
        expect(result.fibre).toBe(12);
        // group "Green Leafy Vegetables" → vegetables
        expect(result.vegetablesG).toBe(200);
        expect(result.exchangeTotals.vegetables).toBe(2);
    });

    it("hydrates composite ingredients via the resolver", () => {
        const composite = {
            foodId: "composite",
            grams: 200,
            ingredients: [
                { foodId: "10", grams: 100, foodGroup: "Green Leafy Vegetables", foodGroupId: 3 },
                { foodId: "37", grams: 100, foodGroup: "Grain Legumes", foodGroupId: 2 },
            ],
        };
        const result = aggregateMeal([composite], resolver);
        expect(result.protein).toBe(3 + 8); // 100g each → factor 1
        expect(result.vegetablesG).toBe(100); // only the leafy-veg ingredient
        expect(result.exchangeTotals.pulses).toBe(1);
    });

    it("prefers embedded nutrients over the resolver", () => {
        const item = dbItem({
            nutrients: { kcal: 999, carbs: 1, protein: 1, fat: 1, fibre: 1, vitamins: 0, minerals: 0 },
        });
        const result = aggregateMeal([item], resolver);
        expect(result.kcal).toBe(999); // embedded wins, not resolver's 40
    });

    it("tracks visible fat for DB oil foods (group id 20)", () => {
        const oil = { foodId: "500", grams: 10, foodGroupId: 20 };
        const oilResolver = () => ({ kcal: 90, carbs: 0, protein: 0, fat: 10, fibre: 0 });
        const result = aggregateMeal([oil], oilResolver);
        expect(result.visibleFat).toBe(10);
    });
});

