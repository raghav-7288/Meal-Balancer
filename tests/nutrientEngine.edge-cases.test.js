/**
 * Edge case tests for nutrientEngine — covers uncovered branches:
 * - DB items with foodGroup classification
 * - Legacy items where foodById returns undefined
 * - combineDay with empty meal totals
 * - accumulateNutrients with zero/undefined values
 */
import { describe, it, expect } from "vitest";
import {
    aggregateMeal,
    combineDay,
    foodById,
    accumulateNutrients,
} from "../src/engines/nutrientEngine";

describe("nutrientEngine edge cases", () => {
    describe("aggregateMeal with DB items", () => {
        it("tracks vegetablesG for items with foodGroup=vegetables", () => {
            const items = [
                {
                    foodId: "db-1",
                    grams: 200,
                    nutrients: { kcal: 25, carbs: 5, protein: 2, fat: 0.3, fibre: 3, vitamins: 1, minerals: 1 },
                    foodGroup: "vegetables",
                },
            ];
            const result = aggregateMeal(items);
            expect(result.vegetablesG).toBe(200);
            expect(result.cerealEnergy).toBe(0);
            expect(result.visibleFat).toBe(0);
        });

        it("tracks cerealEnergy for items with foodGroup=cereals", () => {
            const items = [
                {
                    foodId: "db-2",
                    grams: 100,
                    nutrients: { kcal: 130, carbs: 28, protein: 2.5, fat: 0.3, fibre: 0.4, vitamins: 1, minerals: 1 },
                    foodGroup: "cereals",
                },
            ];
            const result = aggregateMeal(items);
            expect(result.cerealEnergy).toBe(130); // 130 * (100/100)
            expect(result.cerealEnergyPct).toBe(100); // all kcal from cereals
        });

        it("tracks visibleFat for items with foodGroup=fats", () => {
            const items = [
                {
                    foodId: "db-3",
                    grams: 15,
                    nutrients: { kcal: 135, carbs: 0, protein: 0, fat: 15, fibre: 0, vitamins: 0, minerals: 0 },
                    foodGroup: "fats",
                },
            ];
            const result = aggregateMeal(items);
            expect(result.visibleFat).toBe(15);
        });

        it("handles DB items with no foodGroup", () => {
            const items = [
                {
                    foodId: "db-4",
                    grams: 100,
                    nutrients: { kcal: 50, carbs: 10, protein: 5, fat: 1, fibre: 2, vitamins: 1, minerals: 1 },
                    foodGroup: "",
                },
            ];
            const result = aggregateMeal(items);
            expect(result.visibleFat).toBe(0);
            expect(result.vegetablesG).toBe(0);
            expect(result.cerealEnergy).toBe(0);
            // Empty group should not be tracked in exchangeTotals
            expect(result.exchangeTotals).toEqual({});
        });
    });

    describe("aggregateMeal with legacy items", () => {
        it("skips items where foodById returns undefined", () => {
            const items = [
                { foodId: "nonexistent-food-id", grams: 100 },
            ];
            const result = aggregateMeal(items);
            expect(result.kcal).toBe(0);
            expect(result.protein).toBe(0);
        });

        it("correctly processes known legacy food items", () => {
            const items = [
                { foodId: "rice", grams: 100 },
            ];
            const result = aggregateMeal(items);
            expect(result.kcal).toBe(130); // rice is 130 kcal per 100g exchange
            expect(result.carbs).toBe(28);
            expect(result.cerealEnergy).toBe(130);
            expect(result.cerealEnergyPct).toBe(100);
        });
    });

    describe("combineDay", () => {
        it("returns zero totals for empty meal map", () => {
            const result = combineDay({});
            expect(result.kcal).toBe(0);
            expect(result.cerealEnergyPct).toBe(0);
            expect(result.exchangeTotals).toEqual({});
        });

        it("merges exchangeTotals across meals", () => {
            const meal1 = aggregateMeal([{ foodId: "rice", grams: 100 }]);
            const meal2 = aggregateMeal([{ foodId: "roti", grams: 30 }]);
            const day = combineDay({ Breakfast: meal1, Lunch: meal2 });
            expect(day.exchangeTotals["cereals"]).toBe(2); // 100/100 + 30/30
        });

        it("recomputes cerealEnergyPct as day-wide ratio", () => {
            const cerealMeal = aggregateMeal([{ foodId: "rice", grams: 100 }]); // 130 kcal from cereals
            const nonCerealMeal = aggregateMeal([{ foodId: "dal", grams: 75 }]); // 110 kcal from pulses
            const day = combineDay({ Breakfast: cerealMeal, Lunch: nonCerealMeal });
            // cerealEnergyPct = (130 / (130 + 110)) * 100 ≈ 54.17
            expect(day.cerealEnergyPct).toBeCloseTo(54.17, 0);
        });
    });

    describe("accumulateNutrients", () => {
        it("handles nutrients with undefined values", () => {
            const totals = {
                kcal: 0, carbs: 0, protein: 0, fat: 0, fibre: 0,
                vitamins: 0, minerals: 0, addedSugar: 0, visibleFat: 0,
                vegetablesG: 0, cerealEnergy: 0, cerealEnergyPct: 0, exchangeTotals: {},
            };
            const kcal = accumulateNutrients(totals, { kcal: undefined, carbs: undefined }, 1);
            expect(kcal).toBe(0);
            expect(totals.carbs).toBe(0);
        });

        it("scales nutrients by factor correctly", () => {
            const totals = {
                kcal: 0, carbs: 0, protein: 0, fat: 0, fibre: 0,
                vitamins: 0, minerals: 0, addedSugar: 0, visibleFat: 0,
                vegetablesG: 0, cerealEnergy: 0, cerealEnergyPct: 0, exchangeTotals: {},
            };
            const kcal = accumulateNutrients(
                totals,
                { kcal: 100, carbs: 20, protein: 5, fat: 3, fibre: 2, vitamins: 1, minerals: 1 },
                0.5
            );
            expect(kcal).toBe(50);
            expect(totals.carbs).toBe(10);
            expect(totals.protein).toBe(2.5);
        });
    });

    describe("foodById", () => {
        it("returns the food object for a known ID", () => {
            const food = foodById("rice");
            expect(food).toBeDefined();
            expect(food.name).toBe("Cooked Rice");
        });

        it("returns undefined for unknown ID", () => {
            expect(foodById("nonexistent")).toBeUndefined();
        });
    });
});

