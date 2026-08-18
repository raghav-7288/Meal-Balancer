/**
 * Preset Plan Service Tests
 * Tests fetchPresetPlans with caching behavior
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { clearCache } from "../src/utils/queryCache";

let terminalResult;
let lastUpsertPayload;

function createChainableMock() {
    const mock = {};
    const chainFn = () => mock;
    const methods = ["from","select","insert","update","upsert","delete","eq","neq","in","ilike","order","limit","not","gt"];
    for (const m of methods) { mock[m] = chainFn; }
    mock.upsert = (payload) => { lastUpsertPayload = payload; return mock; };
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

import { fetchPresetPlans, fetchAllPresetPlans, upsertPresetPlan } from "../src/services/presetPlanService";

describe("PresetPlanService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearCache();
        terminalResult = { data: null, error: null };
        lastUpsertPayload = undefined;
    });

    describe("fetchPresetPlans", () => {
        it("should fetch active preset plans with correct shape", async () => {
            const mockDbPlans = [
                { id: "preset-1", name: "Balanced Diet", meals: { breakfast: [], lunch: [] }, guidelines: "Eat balanced", display_order: 1, created_at: "2024-01-01" },
                { id: "preset-2", name: "High Protein", meals: { breakfast: [], dinner: [] }, guidelines: "", display_order: 2, created_at: "2024-01-02" },
            ];
            terminalResult = { data: mockDbPlans, error: null };

            const result = await fetchPresetPlans();
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                id: "preset-1",
                name: "Balanced Diet",
                meals: { breakfast: [], lunch: [] },
                mealTimes: {},
                guidelines: "Eat balanced",
                isPreset: true,
            });
            expect(result[1].isPreset).toBe(true);
        });

        it("maps the meal_times column to mealTimes", async () => {
            const mockDbPlans = [
                { id: "preset-1", name: "Timed", meals: {}, meal_times: { Breakfast: "07:30" }, guidelines: "", display_order: 1, created_at: "2024-01-01" },
            ];
            terminalResult = { data: mockDbPlans, error: null };

            const result = await fetchPresetPlans();
            expect(result[0].mealTimes).toEqual({ Breakfast: "07:30" });
        });

        it("should add isPreset: true to all plans", async () => {
            const mockDbPlans = [
                { id: "p1", name: "Plan 1", meals: {}, guidelines: "", display_order: 1, created_at: "2024-01-01" },
            ];
            terminalResult = { data: mockDbPlans, error: null };

            const result = await fetchPresetPlans();
            expect(result.every((p) => p.isPreset === true)).toBe(true);
        });

        it("should handle null meals and guidelines", async () => {
            const mockDbPlans = [
                { id: "p1", name: "Sparse Plan", meals: null, guidelines: null, display_order: 1, created_at: "2024-01-01" },
            ];
            terminalResult = { data: mockDbPlans, error: null };

            const result = await fetchPresetPlans();
            expect(result[0].meals).toEqual({});
            expect(result[0].guidelines).toBe("");
            expect(result[0].mealTimes).toEqual({});
        });

        it("should return empty array when no plans exist", async () => {
            terminalResult = { data: null, error: null };

            const result = await fetchPresetPlans();
            expect(result).toEqual([]);
        });

        it("should throw on error", async () => {
            terminalResult = { data: null, error: { message: "Table does not exist" } };

            await expect(fetchPresetPlans()).rejects.toThrow("Failed to fetch preset plans: Table does not exist");
        });

        it("should cache results on subsequent calls", async () => {
            const mockDbPlans = [{ id: "p1", name: "Cached Plan", meals: {}, guidelines: "", display_order: 1, created_at: "2024-01-01" }];
            terminalResult = { data: mockDbPlans, error: null };

            const result1 = await fetchPresetPlans();
            // Change the result - should still get cached data
            terminalResult = { data: [], error: null };
            const result2 = await fetchPresetPlans();

            expect(result1).toEqual(result2);
        });
    });

    describe("fetchAllPresetPlans", () => {
        it("maps meal_times to mealTimes (admin fetch)", async () => {
            terminalResult = {
                data: [
                    { id: "p1", name: "Admin Plan", meals: {}, meal_times: { Lunch: "12:45" }, guidelines: "", display_order: 1, is_active: true, created_at: "2024-01-01", updated_at: "2024-01-02" },
                ],
                error: null,
            };

            const result = await fetchAllPresetPlans();
            expect(result[0].mealTimes).toEqual({ Lunch: "12:45" });
        });
    });

    describe("upsertPresetPlan", () => {
        it("writes mealTimes to meal_times and returns mapped mealTimes", async () => {
            const plan = { id: "p1", name: "Timed", meals: {}, mealTimes: { Dinner: "19:30" }, guidelines: "", displayOrder: 1, isActive: true };
            terminalResult = {
                data: { id: "p1", name: "Timed", meals: {}, meal_times: { Dinner: "19:30" }, guidelines: "", display_order: 1, is_active: true, created_at: "2024-01-01", updated_at: "2024-01-02" },
                error: null,
            };

            const result = await upsertPresetPlan(plan);
            expect(lastUpsertPayload.meal_times).toEqual({ Dinner: "19:30" });
            expect(result.mealTimes).toEqual({ Dinner: "19:30" });
        });

        it("defaults meal_times to {} when mealTimes is absent", async () => {
            const plan = { name: "No Times", meals: {}, guidelines: "", displayOrder: 0 };
            terminalResult = {
                data: { id: "p2", name: "No Times", meals: {}, meal_times: {}, guidelines: "", display_order: 0, is_active: true, created_at: "2024-01-01", updated_at: "2024-01-02" },
                error: null,
            };

            await upsertPresetPlan(plan);
            expect(lastUpsertPayload.meal_times).toEqual({});
        });
    });
});
