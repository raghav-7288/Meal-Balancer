/**
 * Preset Plan Admin Service Tests
 * Tests fetchAllPresetPlans, upsertPresetPlan, deletePresetPlan
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { clearCache } from "../src/utils/queryCache";

let terminalResult;
let singleResult;

function createChainableMock() {
    const mock = {};
    const chainFn = () => mock;
    const methods = ["from", "select", "insert", "update", "upsert", "delete", "eq", "neq", "in", "ilike", "order", "limit", "not", "gt"];
    for (const m of methods) { mock[m] = chainFn; }
    mock.single = () => Promise.resolve(singleResult);
    mock.then = (resolve, reject) => Promise.resolve(terminalResult).then(resolve, reject);
    mock.catch = (rej) => Promise.resolve(terminalResult).catch(rej);
    return mock;
}

vi.mock("../src/lib/supabaseClient", () => ({
    supabase: {
        from: vi.fn(() => createChainableMock()),
    },
}));

import { fetchAllPresetPlans, upsertPresetPlan, deletePresetPlan } from "../src/services/presetPlanService";

describe("PresetPlanService — Admin Functions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearCache();
        terminalResult = { data: null, error: null };
        singleResult = { data: null, error: null };
    });

    // ─── fetchAllPresetPlans ─────────────────────────────────────────
    describe("fetchAllPresetPlans", () => {
        it("should fetch all plans including inactive ones", async () => {
            const mockPlans = [
                {
                    id: "plan-1", name: "Active Plan", meals: { Breakfast: [] },
                    guidelines: "Eat well", display_order: 1, is_active: true,
                    created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-02T00:00:00Z",
                },
                {
                    id: "plan-2", name: "Inactive Plan", meals: { Lunch: [] },
                    guidelines: "", display_order: 2, is_active: false,
                    created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-03T00:00:00Z",
                },
            ];
            terminalResult = { data: mockPlans, error: null };

            const result = await fetchAllPresetPlans();

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                id: "plan-1", name: "Active Plan", meals: { Breakfast: [] },
                guidelines: "Eat well", displayOrder: 1, isActive: true,
                createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-02T00:00:00Z",
            });
            expect(result[1].isActive).toBe(false);
            expect(result[1].displayOrder).toBe(2);
        });

        it("should map display_order to displayOrder and is_active to isActive", async () => {
            terminalResult = {
                data: [{ id: "p1", name: "Test", meals: {}, guidelines: "", display_order: 5, is_active: false, created_at: "2024-01-01", updated_at: "2024-01-01" }],
                error: null,
            };
            const result = await fetchAllPresetPlans();
            expect(result[0].displayOrder).toBe(5);
            expect(result[0].isActive).toBe(false);
            expect(result[0].display_order).toBeUndefined();
            expect(result[0].is_active).toBeUndefined();
        });

        it("should handle null meals and guidelines", async () => {
            terminalResult = {
                data: [{ id: "p1", name: "Sparse", meals: null, guidelines: null, display_order: 0, is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" }],
                error: null,
            };
            const result = await fetchAllPresetPlans();
            expect(result[0].meals).toEqual({});
            expect(result[0].guidelines).toBe("");
        });

        it("should return empty array when data is null", async () => {
            terminalResult = { data: null, error: null };
            const result = await fetchAllPresetPlans();
            expect(result).toEqual([]);
        });

        it("should throw on database error", async () => {
            terminalResult = { data: null, error: { message: "permission denied" } };
            await expect(fetchAllPresetPlans()).rejects.toThrow("Failed to fetch preset plans: permission denied");
        });
    });

    // ─── upsertPresetPlan ────────────────────────────────────────────
    describe("upsertPresetPlan", () => {
        it("should upsert a new plan (no id) and return mapped object", async () => {
            singleResult = {
                data: { id: "new-uuid", name: "New Plan", meals: { Breakfast: [] }, guidelines: "Tips", display_order: 3, is_active: true, created_at: "2024-06-01", updated_at: "2024-06-01" },
                error: null,
            };

            const result = await upsertPresetPlan({
                name: "New Plan", meals: { Breakfast: [] }, guidelines: "Tips", displayOrder: 3, isActive: true,
            });

            expect(result.id).toBe("new-uuid");
            expect(result.displayOrder).toBe(3);
            expect(result.isActive).toBe(true);
            expect(result.createdAt).toBe("2024-06-01");
        });

        it("should upsert an existing plan (with id)", async () => {
            singleResult = {
                data: { id: "existing-id", name: "Updated", meals: {}, guidelines: "Updated", display_order: 1, is_active: false, created_at: "2024-01-01", updated_at: "2024-06-27" },
                error: null,
            };

            const result = await upsertPresetPlan({
                id: "existing-id", name: "Updated", meals: {}, guidelines: "Updated", displayOrder: 1, isActive: false,
            });

            expect(result.id).toBe("existing-id");
            expect(result.isActive).toBe(false);
        });

        it("should default isActive to true when not specified", async () => {
            singleResult = {
                data: { id: "x", name: "X", meals: {}, guidelines: "", display_order: 0, is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
                error: null,
            };
            const result = await upsertPresetPlan({ name: "X", meals: {} });
            expect(result.isActive).toBe(true);
        });

        it("should default displayOrder to 0 when not specified", async () => {
            singleResult = {
                data: { id: "x", name: "X", meals: {}, guidelines: "", display_order: 0, is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
                error: null,
            };
            const result = await upsertPresetPlan({ name: "X", meals: {} });
            expect(result.displayOrder).toBe(0);
        });

        it("should handle null meals/guidelines in response", async () => {
            singleResult = {
                data: { id: "x", name: "X", meals: null, guidelines: null, display_order: 0, is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
                error: null,
            };
            const result = await upsertPresetPlan({ name: "X" });
            expect(result.meals).toEqual({});
            expect(result.guidelines).toBe("");
        });

        it("should throw on database error", async () => {
            singleResult = { data: null, error: { message: "RLS policy violation" } };
            await expect(upsertPresetPlan({ name: "Fail" })).rejects.toThrow("Failed to save preset plan: RLS policy violation");
        });

        it("should invalidate cache after successful upsert", async () => {
            const { fetchPresetPlans } = await import("../src/services/presetPlanService");
            clearCache();
            terminalResult = {
                data: [{ id: "p1", name: "Cached", meals: {}, guidelines: "", display_order: 1, created_at: "2024-01-01" }],
                error: null,
            };
            await fetchPresetPlans();

            singleResult = {
                data: { id: "new", name: "New", meals: {}, guidelines: "", display_order: 2, is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
                error: null,
            };
            await upsertPresetPlan({ name: "New" });

            // Cache invalidated — next fetch gets fresh data
            terminalResult = {
                data: [
                    { id: "p1", name: "Cached", meals: {}, guidelines: "", display_order: 1, created_at: "2024-01-01" },
                    { id: "new", name: "New", meals: {}, guidelines: "", display_order: 2, created_at: "2024-01-01" },
                ],
                error: null,
            };
            const updated = await fetchPresetPlans();
            expect(updated).toHaveLength(2);
        });
    });

    // ─── deletePresetPlan ────────────────────────────────────────────
    describe("deletePresetPlan", () => {
        it("should delete a plan by ID successfully", async () => {
            terminalResult = { data: null, error: null };
            await expect(deletePresetPlan("plan-id-123")).resolves.toBeUndefined();
        });

        it("should throw on database error", async () => {
            terminalResult = { data: null, error: { message: "plan not found" } };
            await expect(deletePresetPlan("bad-id")).rejects.toThrow("Failed to delete preset plan: plan not found");
        });

        it("should invalidate cache after successful delete", async () => {
            const { fetchPresetPlans } = await import("../src/services/presetPlanService");
            clearCache();
            terminalResult = {
                data: [{ id: "p1", name: "Will Delete", meals: {}, guidelines: "", display_order: 1, created_at: "2024-01-01" }],
                error: null,
            };
            await fetchPresetPlans();

            terminalResult = { data: null, error: null };
            await deletePresetPlan("p1");

            terminalResult = { data: [], error: null };
            const result = await fetchPresetPlans();
            expect(result).toEqual([]);
        });
    });
});

