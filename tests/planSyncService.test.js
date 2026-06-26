/**
 * Plan Sync Service Tests
 * Tests CRUD operations: fetchUserPlans, upsertPlan, upsertPlans, deletePlan
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// We need a mock that properly chains ANY sequence of calls.
// We'll capture the final "terminal" call result.
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

import { fetchUserPlans, upsertPlan, upsertPlans, deletePlan } from "../src/services/planSyncService";

describe("PlanSyncService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── fetchUserPlans ──────────────────────────────────────────────
    describe("fetchUserPlans", () => {
        it("should fetch all plans for a user ordered by created_at", async () => {
            const mockPlans = [
                { id: "plan-1", user_id: "user-1", name: "Breakfast Plan", meals: {}, guidelines: "", created_at: "2024-01-01", updated_at: "2024-01-01" },
                { id: "plan-2", user_id: "user-1", name: "Dinner Plan", meals: {}, guidelines: "Low carb", created_at: "2024-01-02", updated_at: "2024-01-02" },
            ];
            terminalResult = { data: mockPlans, error: null };

            const result = await fetchUserPlans("user-1");
            expect(result).toEqual(mockPlans);
            expect(result).toHaveLength(2);
        });

        it("should return empty array when no plans exist", async () => {
            terminalResult = { data: null, error: null };

            const result = await fetchUserPlans("user-1");
            expect(result).toEqual([]);
        });

        it("should throw on fetch failure", async () => {
            terminalResult = { data: null, error: { message: "Timeout" } };

            await expect(fetchUserPlans("user-1")).rejects.toThrow("Failed to fetch user plans: Timeout");
        });
    });

    // ─── upsertPlan ──────────────────────────────────────────────────
    describe("upsertPlan", () => {
        it("should upsert a single plan and return it", async () => {
            const plan = { id: "plan-1", name: "Test Plan", meals: { breakfast: [] }, guidelines: "Eat healthy" };
            const dbRow = { id: "plan-1", user_id: "user-1", name: "Test Plan", meals: { breakfast: [] }, guidelines: "Eat healthy" };
            terminalResult = { data: dbRow, error: null };

            const result = await upsertPlan("user-1", plan);
            expect(result).toEqual(dbRow);
        });

        it("should use empty string for missing guidelines", async () => {
            const plan = { id: "plan-1", name: "No Guidelines", meals: {} };
            terminalResult = { data: { ...plan, user_id: "user-1", guidelines: "" }, error: null };

            const result = await upsertPlan("user-1", plan);
            expect(result.guidelines).toBe("");
        });

        it("should throw on upsert failure", async () => {
            const plan = { id: "plan-1", name: "Fail Plan", meals: {} };
            terminalResult = { data: null, error: { message: "Insert conflict" } };

            await expect(upsertPlan("user-1", plan)).rejects.toThrow("Failed to save plan: Insert conflict");
        });
    });

    // ─── upsertPlans (batch) ─────────────────────────────────────────
    describe("upsertPlans", () => {
        it("should upsert multiple plans in batch", async () => {
            const plans = [
                { id: "plan-1", name: "Plan A", meals: {}, guidelines: "" },
                { id: "plan-2", name: "Plan B", meals: {}, guidelines: "High protein" },
            ];
            const dbRows = plans.map((p) => ({ ...p, user_id: "user-1" }));
            terminalResult = { data: dbRows, error: null };

            const result = await upsertPlans("user-1", plans);
            expect(result).toEqual(dbRows);
            expect(result).toHaveLength(2);
        });

        it("should return empty array for empty plans input", async () => {
            const result = await upsertPlans("user-1", []);
            expect(result).toEqual([]);
        });

        it("should throw on batch upsert failure", async () => {
            const plans = [{ id: "p1", name: "X", meals: {} }];
            terminalResult = { data: null, error: { message: "Batch failed" } };

            await expect(upsertPlans("user-1", plans)).rejects.toThrow("Failed to batch save plans: Batch failed");
        });

        it("should return empty array when data is null (no error)", async () => {
            const plans = [{ id: "p1", name: "X", meals: {} }];
            terminalResult = { data: null, error: null };

            const result = await upsertPlans("user-1", plans);
            expect(result).toEqual([]);
        });
    });

    // ─── deletePlan ──────────────────────────────────────────────────
    describe("deletePlan", () => {
        it("should delete a plan by id and user_id", async () => {
            terminalResult = { error: null };

            await expect(deletePlan("user-1", "plan-1")).resolves.toBeUndefined();
        });

        it("should throw on delete failure", async () => {
            terminalResult = { error: { message: "Plan not found" } };

            await expect(deletePlan("user-1", "plan-1")).rejects.toThrow("Failed to delete plan: Plan not found");
        });
    });
});
