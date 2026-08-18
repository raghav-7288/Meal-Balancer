/**
 * Tests for NutrientSummary exchange table flattening of composite items.
 *
 * Verifies the fix where composite items (with ingredients) were previously
 * displayed as a single row with exchange=0. After the fix, each ingredient
 * gets its own row with proper exchange calculation.
 */
import { describe, it, expect } from "vitest";
import { foodById } from "../src/engines/nutrientEngine";

describe("NutrientSummary exchange flattening", () => {
    /**
     * Mirror the flattening logic from NutrientSummary's exchangeItems useMemo.
     * This lets us unit-test the algorithm without rendering the component.
     */
    function computeExchangeItems(meals, viewDay) {
        const allItems = Object.values(meals || {})
            .flat()
            .filter((i) => i.day === viewDay || !i.day);

        const flatItems = [];
        for (const item of allItems) {
            if (item.ingredients && item.ingredients.length > 0) {
                for (const ing of item.ingredients) {
                    flatItems.push({ ...ing, id: `${item.id}-${ing.foodId}` });
                }
            } else {
                flatItems.push(item);
            }
        }
        return flatItems.map((item) => {
            const food = foodById(item.foodId);
            const exchange = food ? item.grams / food.gramsPerExchange : 0;
            return { item, food, exchange };
        });
    }

    it("flattens composite items into individual ingredient rows", () => {
        const meals = {
            Breakfast: [
                {
                    id: "comp-1",
                    foodId: "composite",
                    foodName: "Banana Shake",
                    grams: 200,
                    day: "Monday",
                    ingredients: [
                        { foodId: "banana", foodName: "Banana", grams: 100 },
                        { foodId: "curd", foodName: "Curd", grams: 100 },
                    ],
                },
            ],
        };

        const result = computeExchangeItems(meals, "Monday");
        expect(result).toHaveLength(2);
        expect(result[0].item.foodId).toBe("banana");
        expect(result[0].exchange).toBeCloseTo(1.0); // 100g / 100g per exchange
        expect(result[1].item.foodId).toBe("curd");
        expect(result[1].exchange).toBeCloseTo(1.0); // 100g / 100g per exchange
    });

    it("keeps non-composite items as single rows", () => {
        const meals = {
            Lunch: [
                {
                    id: "single-1",
                    foodId: "rice",
                    foodName: "Cooked Rice",
                    grams: 200,
                    day: "Monday",
                },
            ],
        };

        const result = computeExchangeItems(meals, "Monday");
        expect(result).toHaveLength(1);
        expect(result[0].item.foodId).toBe("rice");
        expect(result[0].exchange).toBeCloseTo(2.0); // 200g / 100g per exchange
    });

    it("handles mix of composite and single items", () => {
        const meals = {
            Breakfast: [
                {
                    id: "comp-1",
                    foodId: "composite",
                    grams: 250,
                    day: "Tuesday",
                    ingredients: [
                        { foodId: "roti", foodName: "Roti", grams: 60 },
                        { foodId: "dal", foodName: "Dal", grams: 150 },
                    ],
                },
                {
                    id: "single-1",
                    foodId: "banana",
                    grams: 100,
                    day: "Tuesday",
                },
            ],
        };

        const result = computeExchangeItems(meals, "Tuesday");
        expect(result).toHaveLength(3);
        // Composite ingredients
        expect(result[0].item.foodId).toBe("roti");
        expect(result[0].exchange).toBeCloseTo(2.0); // 60g / 30g per exchange
        expect(result[1].item.foodId).toBe("dal");
        expect(result[1].exchange).toBeCloseTo(2.0); // 150g / 75g per exchange
        // Single item
        expect(result[2].item.foodId).toBe("banana");
        expect(result[2].exchange).toBeCloseTo(1.0);
    });

    it("returns empty for a day with no items", () => {
        const meals = {
            Breakfast: [
                { id: "1", foodId: "rice", grams: 100, day: "Monday" },
            ],
        };
        const result = computeExchangeItems(meals, "Tuesday");
        expect(result).toHaveLength(0);
    });

    it("shows exchange=0 for DB foods not in local FOODS array", () => {
        const meals = {
            Lunch: [
                {
                    id: "db-1",
                    foodId: "12345", // DB food_id not in local array
                    foodName: "Some DB food",
                    grams: 100,
                    day: "Monday",
                },
            ],
        };
        const result = computeExchangeItems(meals, "Monday");
        expect(result).toHaveLength(1);
        expect(result[0].food).toBeUndefined();
        expect(result[0].exchange).toBe(0);
    });

    it("handles items without a day field (legacy items)", () => {
        const meals = {
            Breakfast: [
                { id: "1", foodId: "rice", grams: 100 }, // no day field
            ],
        };
        const result = computeExchangeItems(meals, "Monday");
        expect(result).toHaveLength(1); // Should be included (no day = all days)
    });

    it("handles composite items with empty ingredients array", () => {
        const meals = {
            Breakfast: [
                {
                    id: "empty-comp",
                    foodId: "composite",
                    grams: 0,
                    day: "Monday",
                    ingredients: [],
                },
            ],
        };
        const result = computeExchangeItems(meals, "Monday");
        // Empty ingredients → treated as non-composite (single row)
        expect(result).toHaveLength(1);
    });

    it("handles composite items with null ingredients", () => {
        const meals = {
            Breakfast: [
                {
                    id: "null-ing",
                    foodId: "composite",
                    grams: 0,
                    day: "Monday",
                    ingredients: null,
                },
            ],
        };
        const result = computeExchangeItems(meals, "Monday");
        // null ingredients → treated as non-composite
        expect(result).toHaveLength(1);
    });
});

