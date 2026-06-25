/**
 * Database Service Tests
 * Tests all database query functions: getHealthGoals, getUserHealthGoals,
 * saveUserHealthGoals, getMajorGroups, getFoodsByGroup, getAllNutrientGroups,
 * getNutrientDefinitions, getFoodNutrients
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { clearCache } from "../src/utils/queryCache";

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

import {
    getHealthGoals,
    getUserHealthGoals,
    saveUserHealthGoals,
    getMajorGroups,
    getFoodsByGroup,
    getAllNutrientGroups,
    getNutrientDefinitions,
    getFoodNutrients,
} from "../src/services/databaseService";

describe("DatabaseService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearCache();
    });

    // ─── getHealthGoals ──────────────────────────────────────────────
    describe("getHealthGoals", () => {
        it("should fetch active health goals ordered by display_order", async () => {
            const mockGoals = [
                { health_goal_id: 1, goal_code: "weight_loss", goal_name: "Weight Loss", description: "Lose weight", is_active: true, display_order: 1 },
                { health_goal_id: 2, goal_code: "muscle_gain", goal_name: "Muscle Gain", description: "Build muscle", is_active: true, display_order: 2 },
            ];
            terminalResult = { data: mockGoals, error: null };

            const result = await getHealthGoals();
            expect(result).toEqual(mockGoals);
            expect(result).toHaveLength(2);
        });

        it("should throw error on fetch failure", async () => {
            terminalResult = { data: null, error: { message: "Connection refused" } };

            await expect(getHealthGoals()).rejects.toThrow("Failed to fetch health goals: Connection refused");
        });

        it("should use cache on subsequent calls", async () => {
            const mockGoals = [{ health_goal_id: 1, goal_code: "wl", goal_name: "WL", description: "", is_active: true, display_order: 1 }];
            terminalResult = { data: mockGoals, error: null };

            const result1 = await getHealthGoals();
            const result2 = await getHealthGoals();

            expect(result1).toEqual(result2);
        });
    });

    // ─── getUserHealthGoals ──────────────────────────────────────────
    describe("getUserHealthGoals", () => {
        it("should fetch health goals for a specific user", async () => {
            const mockData = [
                { user_id: "user-1", health_goal_id: 1, created_at: "2024-01-01" },
                { user_id: "user-1", health_goal_id: 3, created_at: "2024-01-02" },
            ];
            terminalResult = { data: mockData, error: null };

            const result = await getUserHealthGoals("user-1");
            expect(result).toEqual(mockData);
        });

        it("should throw error on fetch failure", async () => {
            terminalResult = { data: null, error: { message: "RLS policy violation" } };

            await expect(getUserHealthGoals("user-1")).rejects.toThrow("Failed to fetch user health goals: RLS policy violation");
        });

        it("should return empty array when user has no goals", async () => {
            terminalResult = { data: [], error: null };

            const result = await getUserHealthGoals("user-1");
            expect(result).toEqual([]);
        });
    });

    // ─── saveUserHealthGoals ─────────────────────────────────────────
    describe("saveUserHealthGoals", () => {
        it("should handle no changes needed (same goals)", async () => {
            terminalResult = { data: [{ user_id: "user-1", health_goal_id: 1, created_at: "2024-01-01" }], error: null };

            // getUserHealthGoals returns [1], saving [1] means no changes
            await expect(saveUserHealthGoals("user-1", [1])).resolves.toBeUndefined();
        });

        it("should handle empty selection (delete all)", async () => {
            // First call returns current goals, subsequent calls are delete operations
            terminalResult = { data: [{ user_id: "user-1", health_goal_id: 1, created_at: "2024-01-01" }], error: null };
            // After getUserHealthGoals, the delete chain will also use terminalResult
            // Since delete doesn't throw (error is null), it should succeed
            await expect(saveUserHealthGoals("user-1", [])).resolves.toBeUndefined();
        });
    });

    // ─── getMajorGroups ──────────────────────────────────────────────
    describe("getMajorGroups", () => {
        it("should fetch all major food groups ordered by group_code", async () => {
            const mockGroups = [
                { major_group_id: 1, group_code: "01", group_name: "Cereals" },
                { major_group_id: 2, group_code: "02", group_name: "Pulses" },
            ];
            terminalResult = { data: mockGroups, error: null };

            const result = await getMajorGroups();
            expect(result).toEqual(mockGroups);
        });

        it("should throw on error", async () => {
            terminalResult = { data: null, error: { message: "Table not found" } };

            await expect(getMajorGroups()).rejects.toThrow("Failed to fetch major groups: Table not found");
        });
    });

    // ─── getFoodsByGroup ─────────────────────────────────────────────
    describe("getFoodsByGroup", () => {
        it("should fetch foods filtered by major group ID", async () => {
            const mockFoods = [
                { food_id: 1, major_group_id: 1, food_code: "A001", food_name: "Rice" },
                { food_id: 2, major_group_id: 1, food_code: "A002", food_name: "Wheat" },
            ];
            terminalResult = { data: mockFoods, error: null };

            const result = await getFoodsByGroup(1);
            expect(result).toEqual(mockFoods);
            expect(result).toHaveLength(2);
        });

        it("should return empty array for group with no foods", async () => {
            terminalResult = { data: [], error: null };

            const result = await getFoodsByGroup(99);
            expect(result).toEqual([]);
        });

        it("should throw on error", async () => {
            terminalResult = { data: null, error: { message: "Connection timeout" } };

            await expect(getFoodsByGroup(1)).rejects.toThrow("Failed to fetch foods for group 1: Connection timeout");
        });
    });

    // ─── getAllNutrientGroups ─────────────────────────────────────────
    describe("getAllNutrientGroups", () => {
        it("should fetch all nutrient groups ordered by display_order", async () => {
            const mockGroups = [
                { nutrient_group_id: 1, group_name: "Macronutrients", description: "Main macros", display_order: 1 },
                { nutrient_group_id: 2, group_name: "Vitamins", description: "Vitamin group", display_order: 2 },
            ];
            terminalResult = { data: mockGroups, error: null };

            const result = await getAllNutrientGroups();
            expect(result).toEqual(mockGroups);
        });

        it("should throw on error", async () => {
            terminalResult = { data: null, error: { message: "Internal server error" } };

            await expect(getAllNutrientGroups()).rejects.toThrow("Failed to fetch nutrient groups: Internal server error");
        });
    });

    // ─── getNutrientDefinitions ──────────────────────────────────────
    describe("getNutrientDefinitions", () => {
        it("should fetch all nutrient definitions ordered by name", async () => {
            const mockDefs = [
                { nutrient_id: 1, nutrient_group_id: 1, nutrient_name: "Carbohydrate", nutrient_code: "CARB", unit: "g" },
                { nutrient_id: 2, nutrient_group_id: 1, nutrient_name: "Fat", nutrient_code: "FAT", unit: "g" },
                { nutrient_id: 3, nutrient_group_id: 1, nutrient_name: "Protein", nutrient_code: "PROT", unit: "g" },
            ];
            terminalResult = { data: mockDefs, error: null };

            const result = await getNutrientDefinitions();
            expect(result).toHaveLength(3);
            expect(result[0].nutrient_name).toBe("Carbohydrate");
        });

        it("should throw on error", async () => {
            terminalResult = { data: null, error: { message: "Unauthorized" } };

            await expect(getNutrientDefinitions()).rejects.toThrow("Failed to fetch nutrient definitions: Unauthorized");
        });
    });

    // ─── getFoodNutrients ────────────────────────────────────────────
    describe("getFoodNutrients", () => {
        it("should fetch nutrient values with definitions for a food", async () => {
            const mockData = [
                {
                    food_nutrient_value_id: 1,
                    food_id: 100,
                    nutrient_id: 1,
                    value: 28.5,
                    nutrient_definitions: { nutrient_name: "Carbohydrate", nutrient_code: "CARB", unit: "g" },
                },
                {
                    food_nutrient_value_id: 2,
                    food_id: 100,
                    nutrient_id: 2,
                    value: 2.7,
                    nutrient_definitions: { nutrient_name: "Protein", nutrient_code: "PROT", unit: "g" },
                },
            ];
            terminalResult = { data: mockData, error: null };

            const result = await getFoodNutrients(100);
            expect(result).toHaveLength(2);
            expect(result[0].nutrient_definitions.nutrient_name).toBe("Carbohydrate");
            expect(result[0].value).toBe(28.5);
        });

        it("should throw on error", async () => {
            terminalResult = { data: null, error: { message: "Food not found" } };

            await expect(getFoodNutrients(999)).rejects.toThrow("Failed to fetch nutrients for food 999: Food not found");
        });
    });
});
