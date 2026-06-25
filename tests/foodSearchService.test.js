/**
 * Food Search Service Tests
 * Tests searchFoodItems and fetchFoodNutrients with various scenarios
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

let terminalResult;

function createChainableMock() {
    const mock = {};
    const chainFn = () => mock;
    const methods = ["from","select","insert","update","upsert","delete","eq","neq","in","ilike","order","limit","not","gt"];
    for (const m of methods) { mock[m] = chainFn; }
    mock.single = () => Promise.resolve(terminalResult);
    mock.then = (resolve, reject) => Promise.resolve(terminalResult).then(resolve, reject);
    mock.catch = (rej) => Promise.resolve(terminalResult).catch(rej);
    return mock;
}

vi.mock("../src/lib/supabaseClient", () => ({
    supabase: {
        from: vi.fn(() => createChainableMock()),
    },
}));

import { searchFoodItems, fetchFoodNutrients } from "../src/services/foodSearchService";

describe("FoodSearchService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        terminalResult = { data: [], error: null };
    });

    // ─── searchFoodItems ─────────────────────────────────────────────
    describe("searchFoodItems", () => {
        it("should return empty array for empty query", async () => {
            const result = await searchFoodItems("");
            expect(result).toEqual([]);
        });

        it("should return empty array for null query", async () => {
            const result = await searchFoodItems(null);
            expect(result).toEqual([]);
        });

        it("should return empty array for single character query", async () => {
            const result = await searchFoodItems("a");
            expect(result).toEqual([]);
        });

        it("should return empty array for whitespace only query", async () => {
            const result = await searchFoodItems("   ");
            expect(result).toEqual([]);
        });

        it("should search food items with valid query", async () => {
            const mockFoods = [
                { food_id: 1, food_code: "A001", food_name: "Rice, raw", major_group_id: 1 },
                { food_id: 2, food_code: "A002", food_name: "Rice, cooked", major_group_id: 1 },
            ];
            terminalResult = { data: mockFoods, error: null };

            const result = await searchFoodItems("Rice");
            expect(result).toEqual(mockFoods);
            expect(result).toHaveLength(2);
        });

        it("should return empty array on search error", async () => {
            terminalResult = { data: null, error: { message: "Search failed" } };

            const result = await searchFoodItems("rice");
            expect(result).toEqual([]);
        });

        it("should return empty array when data is null (no error)", async () => {
            terminalResult = { data: null, error: null };

            const result = await searchFoodItems("rice");
            expect(result).toEqual([]);
        });
    });

    // ─── fetchFoodNutrients ──────────────────────────────────────────
    describe("fetchFoodNutrients", () => {
        it("should fetch and normalize nutrient data for a food", async () => {
            const mockNutrientData = [
                { value: 130, nutrient_definitions: { nutrient_name: "Energy", nutrient_code: "ENER", unit: "kcal" } },
                { value: 28, nutrient_definitions: { nutrient_name: "Carbohydrate", nutrient_code: "CARB", unit: "g" } },
                { value: 2.5, nutrient_definitions: { nutrient_name: "Protein", nutrient_code: "PROT", unit: "g" } },
                { value: 0.3, nutrient_definitions: { nutrient_name: "Fat", nutrient_code: "FAT", unit: "g" } },
                { value: 0.4, nutrient_definitions: { nutrient_name: "Fibre", nutrient_code: "FIB", unit: "g" } },
            ];
            terminalResult = { data: mockNutrientData, error: null };

            const result = await fetchFoodNutrients(1);
            expect(result).not.toBeNull();
            expect(result.nutrients.kcal).toBe(130);
            expect(result.nutrients.carbs).toBe(28);
            expect(result.nutrients.protein).toBe(2.5);
            expect(result.nutrients.fat).toBe(0.3);
            expect(result.nutrients.fibre).toBe(0.4);
        });

        it("should return null on fetch error", async () => {
            terminalResult = { data: null, error: { message: "Database error" } };

            const result = await fetchFoodNutrients(999);
            expect(result).toBeNull();
        });

        it("should return null when no nutrient data exists", async () => {
            terminalResult = { data: [], error: null };

            const result = await fetchFoodNutrients(1);
            expect(result).toBeNull();
        });

        it("should return null when data is null (not array)", async () => {
            terminalResult = { data: null, error: null };

            const result = await fetchFoodNutrients(1);
            expect(result).toBeNull();
        });

        it("should map alternative nutrient names correctly", async () => {
            const mockNutrientData = [
                { value: 250, nutrient_definitions: { nutrient_name: "Energy (kcal)", nutrient_code: "ENER", unit: "kcal" } },
                { value: 40, nutrient_definitions: { nutrient_name: "Total Carbohydrate", nutrient_code: "CARB", unit: "g" } },
                { value: 15, nutrient_definitions: { nutrient_name: "Total Protein", nutrient_code: "PROT", unit: "g" } },
                { value: 5, nutrient_definitions: { nutrient_name: "Total Fat", nutrient_code: "FAT", unit: "g" } },
                { value: 8, nutrient_definitions: { nutrient_name: "Dietary Fibre", nutrient_code: "FIB", unit: "g" } },
                { value: 10, nutrient_definitions: { nutrient_name: "Total Vitamins", nutrient_code: "VIT", unit: "mg" } },
                { value: 5, nutrient_definitions: { nutrient_name: "Total Minerals", nutrient_code: "MIN", unit: "mg" } },
            ];
            terminalResult = { data: mockNutrientData, error: null };

            const result = await fetchFoodNutrients(2);
            expect(result.nutrients.kcal).toBe(250);
            expect(result.nutrients.carbs).toBe(40);
            expect(result.nutrients.protein).toBe(15);
            expect(result.nutrients.fat).toBe(5);
            expect(result.nutrients.fibre).toBe(8);
            expect(result.nutrients.vitamins).toBe(10);
            expect(result.nutrients.minerals).toBe(5);
        });

        it("should default to 0 for missing nutrient values", async () => {
            const mockNutrientData = [
                { value: 100, nutrient_definitions: { nutrient_name: "Energy", nutrient_code: "ENER", unit: "kcal" } },
            ];
            terminalResult = { data: mockNutrientData, error: null };

            const result = await fetchFoodNutrients(3);
            expect(result.nutrients.carbs).toBe(0);
            expect(result.nutrients.protein).toBe(0);
            expect(result.nutrients.fat).toBe(0);
            expect(result.nutrients.fibre).toBe(0);
            expect(result.nutrients.vitamins).toBe(0);
            expect(result.nutrients.minerals).toBe(0);
        });

        it("should include rawNutrients in the response", async () => {
            const mockNutrientData = [
                { value: 130, nutrient_definitions: { nutrient_name: "Energy", nutrient_code: "ENER", unit: "kcal" } },
            ];
            terminalResult = { data: mockNutrientData, error: null };

            const result = await fetchFoodNutrients(1);
            expect(result.rawNutrients).toBeDefined();
            expect(result.rawNutrients["energy"]).toEqual({ value: 130, unit: "kcal", code: "ENER" });
        });

        it("should handle nutrient rows with null definitions gracefully", async () => {
            const mockNutrientData = [
                { value: 100, nutrient_definitions: null },
                { value: 28, nutrient_definitions: { nutrient_name: "Carbohydrate", nutrient_code: "CARB", unit: "g" } },
            ];
            terminalResult = { data: mockNutrientData, error: null };

            const result = await fetchFoodNutrients(1);
            expect(result.nutrients.carbs).toBe(28);
        });
    });
});
