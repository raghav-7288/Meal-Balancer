import { describe, it, expect } from "vitest";
import { calculateFoodNutrients, calculateMealTotals } from "../src/engines/nutrientEngine";

describe("calculateFoodNutrients", () => {
    const rice = {
        id: "rice",
        name: "Cooked Rice",
        group: "cereals",
        gramsPerExchange: 100,
        carbs: 28,
        protein: 2.5,
        fat: 0.3,
        fibre: 0.4,
        vitamins: 1,
        minerals: 1,
        kcal: 130,
    };

    it("returns exact values for 1 exchange (100g)", () => {
        const result = calculateFoodNutrients(rice, 100);
        expect(result.carbs).toBe(28);
        expect(result.protein).toBe(2.5);
        expect(result.fat).toBe(0.3);
        expect(result.fibre).toBe(0.4);
        expect(result.kcal).toBe(130);
    });

    it("scales proportionally for different grams", () => {
        const result = calculateFoodNutrients(rice, 200);
        expect(result.carbs).toBe(56);
        expect(result.protein).toBe(5);
        expect(result.kcal).toBe(260);
    });

    it("returns zero for 0 grams", () => {
        const result = calculateFoodNutrients(rice, 0);
        expect(result.carbs).toBe(0);
        expect(result.protein).toBe(0);
        expect(result.kcal).toBe(0);
    });

    it("handles fractional exchanges", () => {
        const result = calculateFoodNutrients(rice, 50);
        expect(result.carbs).toBe(14);
        expect(result.protein).toBe(1.25);
        expect(result.kcal).toBe(65);
    });
});

describe("calculateMealTotals", () => {
    it("sums nutrients across multiple items", () => {
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

    it("returns zeros for empty array", () => {
        const result = calculateMealTotals([]);
        expect(result.carbs).toBe(0);
        expect(result.protein).toBe(0);
        expect(result.kcal).toBe(0);
    });

    it("handles single item", () => {
        const items = [
            { carbs: 10, protein: 5, fat: 3, fibre: 2, vitamins: 1, minerals: 1, kcal: 80 },
        ];
        const result = calculateMealTotals(items);
        expect(result.carbs).toBe(10);
        expect(result.protein).toBe(5);
        expect(result.kcal).toBe(80);
    });
});

