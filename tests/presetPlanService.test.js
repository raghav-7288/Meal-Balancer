/**
 * Preset Plan Service Tests
 * Tests fetchPresetPlans with caching behavior
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

import { fetchPresetPlans } from "../src/services/presetPlanService";

describe("PresetPlanService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearCache();
        terminalResult = { data: null, error: null };
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
                guidelines: "Eat balanced",
                isPreset: true,
            });
            expect(result[1].isPreset).toBe(true);
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
});
