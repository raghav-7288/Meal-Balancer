/**
 * Nutrient Engine - Comprehensive Tests
 * Tests: calculateFoodNutrients, calculateMealTotals, foodById, aggregateMeal, combineDay
 */
import { describe, it, expect } from "vitest";
import {
    calculateFoodNutrients,
    calculateMealTotals,
    foodById,
    aggregateMeal,
    combineDay,
} from "../src/engines/nutrientEngine";

describe("NutrientEngine – Comprehensive", () => {
    // ─── calculateFoodNutrients ──────────────────────────────────────
    describe("calculateFoodNutrients", () => {
        const rice = {
            id: "rice", name: "Cooked Rice", group: "cereals",
            gramsPerExchange: 100, carbs: 28, protein: 2.5, fat: 0.3, fibre: 0.4, vitamins: 1, minerals: 1, kcal: 130,
        };

        it("should return exact nutrients for 1 exchange (100g)", () => {
            const result = calculateFoodNutrients(rice, 100);
            expect(result.carbs).toBe(28);
            expect(result.protein).toBe(2.5);
            expect(result.fat).toBe(0.3);
            expect(result.fibre).toBe(0.4);
            expect(result.kcal).toBe(130);
        });

        it("should scale nutrients for 2 exchanges (200g)", () => {
            const result = calculateFoodNutrients(rice, 200);
            expect(result.carbs).toBe(56);
            expect(result.protein).toBe(5);
            expect(result.kcal).toBe(260);
        });

        it("should scale down for half an exchange (50g)", () => {
            const result = calculateFoodNutrients(rice, 50);
            expect(result.carbs).toBe(14);
            expect(result.protein).toBe(1.25);
            expect(result.kcal).toBe(65);
        });

        it("should return zero for 0 grams", () => {
            const result = calculateFoodNutrients(rice, 0);
            expect(result.carbs).toBe(0);
            expect(result.protein).toBe(0);
            expect(result.kcal).toBe(0);
        });

        it("should handle non-standard gramsPerExchange", () => {
            const roti = { gramsPerExchange: 30, carbs: 18, protein: 3, fat: 1, fibre: 2, vitamins: 1, minerals: 1, kcal: 90 };
            const result = calculateFoodNutrients(roti, 60); // 2 exchanges
            expect(result.carbs).toBe(36);
            expect(result.protein).toBe(6);
            expect(result.kcal).toBe(180);
        });
    });

    // ─── calculateMealTotals ─────────────────────────────────────────
    describe("calculateMealTotals", () => {
        it("should sum nutrients from multiple items", () => {
            const items = [
                { carbs: 28, protein: 2.5, fat: 0.3, fibre: 0.4, vitamins: 1, minerals: 1, kcal: 130 },
                { carbs: 15, protein: 7, fat: 1, fibre: 4, vitamins: 2, minerals: 2, kcal: 110 },
            ];
            const result = calculateMealTotals(items);
            expect(result.carbs).toBe(43);
            expect(result.protein).toBe(9.5);
            expect(result.fat).toBeCloseTo(1.3);
            expect(result.fibre).toBeCloseTo(4.4);
            expect(result.kcal).toBe(240);
        });

        it("should return zeros for empty items array", () => {
            const result = calculateMealTotals([]);
            expect(result.carbs).toBe(0);
            expect(result.protein).toBe(0);
            expect(result.kcal).toBe(0);
        });

        it("should handle single item", () => {
            const items = [{ carbs: 10, protein: 5, fat: 2, fibre: 1, vitamins: 0.5, minerals: 0.5, kcal: 80 }];
            const result = calculateMealTotals(items);
            expect(result).toEqual(items[0]);
        });
    });

    // ─── foodById ────────────────────────────────────────────────────
    describe("foodById", () => {
        it("should find a food by ID", () => {
            const food = foodById("rice");
            expect(food).toBeDefined();
            expect(food.name).toBe("Cooked Rice");
        });

        it("should return undefined for unknown ID", () => {
            const food = foodById("nonexistent");
            expect(food).toBeUndefined();
        });

        it("should find all known foods", () => {
            const ids = ["rice", "roti", "dal", "curd", "egg", "mixedveg", "banana"];
            for (const id of ids) {
                expect(foodById(id)).toBeDefined();
            }
        });
    });

    // ─── aggregateMeal ───────────────────────────────────────────────
    describe("aggregateMeal", () => {
        it("should aggregate nutrients from DB items (per 100g)", () => {
            const items = [
                { foodId: "db-1", grams: 200, nutrients: { kcal: 130, carbs: 28, protein: 2.5, fat: 0.3, fibre: 0.4, vitamins: 1, minerals: 1 }, foodGroup: "cereals" },
            ];
            const result = aggregateMeal(items);
            expect(result.kcal).toBeCloseTo(260);
            expect(result.carbs).toBeCloseTo(56);
            expect(result.protein).toBeCloseTo(5);
        });

        it("should aggregate nutrients from legacy local items", () => {
            const items = [
                { foodId: "rice", grams: 100 },
                { foodId: "dal", grams: 75 },
            ];
            const result = aggregateMeal(items);
            expect(result.kcal).toBeCloseTo(240); // 130 + 110
            expect(result.carbs).toBeCloseTo(43); // 28 + 15
        });

        it("should track vegetables grams for vegetable group", () => {
            const items = [
                { foodId: "db-1", grams: 150, nutrients: { kcal: 35, carbs: 6, protein: 1.5, fat: 0.5, fibre: 3, vitamins: 5, minerals: 5 }, foodGroup: "vegetables" },
            ];
            const result = aggregateMeal(items);
            expect(result.vegetablesG).toBe(150);
        });

        it("should track visible fat for fats group", () => {
            const items = [
                { foodId: "db-1", grams: 10, nutrients: { kcal: 90, carbs: 0, protein: 0, fat: 10, fibre: 0, vitamins: 0, minerals: 0 }, foodGroup: "fats" },
            ];
            const result = aggregateMeal(items);
            expect(result.visibleFat).toBe(10);
        });

        it("should track cereal energy and calculate percentage", () => {
            const items = [
                { foodId: "db-1", grams: 100, nutrients: { kcal: 200, carbs: 40, protein: 5, fat: 2, fibre: 1, vitamins: 0, minerals: 0 }, foodGroup: "cereals" },
                { foodId: "db-2", grams: 100, nutrients: { kcal: 100, carbs: 5, protein: 10, fat: 5, fibre: 2, vitamins: 0, minerals: 0 }, foodGroup: "pulses" },
            ];
            const result = aggregateMeal(items);
            expect(result.cerealEnergy).toBeCloseTo(200);
            expect(result.cerealEnergyPct).toBeCloseTo(66.67, 1);
        });

        it("should handle empty items array", () => {
            const result = aggregateMeal([]);
            expect(result.kcal).toBe(0);
            expect(result.cerealEnergyPct).toBe(0);
        });

        it("should skip unknown local food IDs gracefully", () => {
            const items = [
                { foodId: "unknown-food", grams: 100 },
                { foodId: "rice", grams: 100 },
            ];
            const result = aggregateMeal(items);
            expect(result.kcal).toBeCloseTo(130); // Only rice counted
        });

        it("should track exchange totals per food group", () => {
            const items = [
                { foodId: "rice", grams: 200 }, // 2 exchanges of cereals
                { foodId: "dal", grams: 150 },  // 2 exchanges of pulses
            ];
            const result = aggregateMeal(items);
            expect(result.exchangeTotals.cereals).toBeCloseTo(2);
            expect(result.exchangeTotals.pulses).toBeCloseTo(2);
        });

        it("should handle mixed DB and local items", () => {
            const items = [
                { foodId: "rice", grams: 100 }, // local
                { foodId: "db-1", grams: 100, nutrients: { kcal: 50, carbs: 10, protein: 3, fat: 1, fibre: 2, vitamins: 1, minerals: 1 }, foodGroup: "vegetables" },
            ];
            const result = aggregateMeal(items);
            expect(result.kcal).toBeCloseTo(180); // 130 + 50
        });
    });

    // ─── combineDay ──────────────────────────────────────────────────
    describe("combineDay", () => {
        it("should combine multiple meal totals into day totals", () => {
            const mealTotals = {
                breakfast: { kcal: 400, carbs: 50, protein: 15, fat: 10, fibre: 5, vitamins: 3, minerals: 3, addedSugar: 2, visibleFat: 5, vegetablesG: 50, cerealEnergy: 300, exchangeTotals: { cereals: 3 } },
                lunch: { kcal: 600, carbs: 70, protein: 25, fat: 20, fibre: 8, vitamins: 5, minerals: 5, addedSugar: 3, visibleFat: 10, vegetablesG: 150, cerealEnergy: 200, exchangeTotals: { cereals: 2, pulses: 1 } },
                dinner: { kcal: 500, carbs: 60, protein: 20, fat: 15, fibre: 7, vitamins: 4, minerals: 4, addedSugar: 1, visibleFat: 8, vegetablesG: 200, cerealEnergy: 100, exchangeTotals: { cereals: 1, vegetables: 2 } },
            };

            const day = combineDay(mealTotals);
            expect(day.kcal).toBe(1500);
            expect(day.carbs).toBe(180);
            expect(day.protein).toBe(60);
            expect(day.fat).toBe(45);
            expect(day.fibre).toBe(20);
            expect(day.addedSugar).toBe(6);
            expect(day.visibleFat).toBe(23);
            expect(day.vegetablesG).toBe(400);
            expect(day.cerealEnergy).toBe(600);
            expect(day.exchangeTotals.cereals).toBe(6);
            expect(day.exchangeTotals.pulses).toBe(1);
            expect(day.exchangeTotals.vegetables).toBe(2);
        });

        it("should calculate cerealEnergyPct for the day", () => {
            const mealTotals = {
                breakfast: { kcal: 500, carbs: 50, protein: 10, fat: 10, fibre: 5, vitamins: 1, minerals: 1, addedSugar: 0, visibleFat: 0, vegetablesG: 0, cerealEnergy: 250, exchangeTotals: {} },
                lunch: { kcal: 500, carbs: 50, protein: 10, fat: 10, fibre: 5, vitamins: 1, minerals: 1, addedSugar: 0, visibleFat: 0, vegetablesG: 0, cerealEnergy: 250, exchangeTotals: {} },
            };
            const day = combineDay(mealTotals);
            expect(day.cerealEnergyPct).toBeCloseTo(50);
        });

        it("should handle empty meal totals", () => {
            const day = combineDay({});
            expect(day.kcal).toBe(0);
            expect(day.cerealEnergyPct).toBe(0);
        });

        it("should handle single meal", () => {
            const mealTotals = {
                snack: { kcal: 100, carbs: 15, protein: 2, fat: 3, fibre: 1, vitamins: 0, minerals: 0, addedSugar: 5, visibleFat: 0, vegetablesG: 0, cerealEnergy: 0, exchangeTotals: { fruit: 1 } },
            };
            const day = combineDay(mealTotals);
            expect(day.kcal).toBe(100);
            expect(day.addedSugar).toBe(5);
            expect(day.exchangeTotals.fruit).toBe(1);
        });
    });
});

