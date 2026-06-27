/**
 * Additional databaseService tests — covers saveUserHealthGoals insert/delete branches
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

let callResults = [];
let callIdx = 0;

function createSequentialChain() {
    const mock = {};
    const chainFn = () => mock;
    ["from", "select", "insert", "update", "upsert", "delete", "eq", "neq", "in", "ilike", "order", "limit"].forEach(m => {
        mock[m] = vi.fn(chainFn);
    });
    // Each call to the terminal returns next result in sequence
    mock.then = (resolve, reject) => {
        const result = callResults[callIdx] || callResults[callResults.length - 1];
        callIdx++;
        return Promise.resolve(result).then(resolve, reject);
    };
    mock.catch = (rej) => {
        const result = callResults[callIdx] || callResults[callResults.length - 1];
        callIdx++;
        return Promise.resolve(result).catch(rej);
    };
    return mock;
}

const mockChain = createSequentialChain();

vi.mock("../src/lib/supabaseClient", () => ({
    supabase: {
        from: vi.fn(() => mockChain),
        auth: {},
    },
}));

// Mock query cache to always call through
vi.mock("../src/utils/queryCache", () => ({
    cachedFetch: vi.fn((key, fetcher) => fetcher()),
}));

import { saveUserHealthGoals } from "../src/services/databaseService";

describe("databaseService - saveUserHealthGoals", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        callIdx = 0;
        callResults = [];
    });

    it("inserts new goals and deletes removed goals", async () => {
        // First call: getUserHealthGoals returns current goals
        callResults = [
            { data: [{ user_id: "u1", health_goal_id: "g1" }, { user_id: "u1", health_goal_id: "g2" }], error: null },
            // Second call: delete old goals
            { data: null, error: null },
            // Third call: insert new goals
            { data: null, error: null },
        ];

        // selectedGoalIds: keep g1, remove g2, add g3
        await saveUserHealthGoals("u1", ["g1", "g3"]);

        // delete should be called for g2, insert for g3
        expect(mockChain.delete).toHaveBeenCalled();
        expect(mockChain.insert).toHaveBeenCalled();
    });

    it("only inserts when no goals to delete", async () => {
        callResults = [
            { data: [], error: null }, // no current goals
            { data: null, error: null }, // insert result
        ];

        await saveUserHealthGoals("u1", ["g1", "g2"]);

        expect(mockChain.delete).not.toHaveBeenCalled();
        expect(mockChain.insert).toHaveBeenCalled();
    });

    it("only deletes when no goals to insert", async () => {
        callResults = [
            { data: [{ user_id: "u1", health_goal_id: "g1" }, { user_id: "u1", health_goal_id: "g2" }], error: null },
            { data: null, error: null }, // delete result
        ];

        // Keep nothing — delete all
        await saveUserHealthGoals("u1", []);

        expect(mockChain.delete).toHaveBeenCalled();
    });

    it("does nothing when goals haven't changed", async () => {
        callResults = [
            { data: [{ user_id: "u1", health_goal_id: "g1" }], error: null },
        ];

        await saveUserHealthGoals("u1", ["g1"]);

        expect(mockChain.delete).not.toHaveBeenCalled();
        expect(mockChain.insert).not.toHaveBeenCalled();
    });

    it("throws on delete error", async () => {
        callResults = [
            { data: [{ user_id: "u1", health_goal_id: "g1" }], error: null },
            { data: null, error: { message: "Delete failed" } },
        ];

        await expect(saveUserHealthGoals("u1", [])).rejects.toThrow("Failed to remove health goals: Delete failed");
    });

    it("throws on insert error", async () => {
        callResults = [
            { data: [], error: null },
            { data: null, error: { message: "Insert failed" } },
        ];

        await expect(saveUserHealthGoals("u1", ["g1"])).rejects.toThrow("Failed to save health goals: Insert failed");
    });
});

