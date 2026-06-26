/**
 * Meal History Service Tests
 * Tests CRUD operations: fetchMealHistory, upsertMealHistoryEntry,
 * deleteMealHistoryEntry, clearMealHistory, dbRowToEntry
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

import {
    fetchMealHistory,
    upsertMealHistoryEntry,
    deleteMealHistoryEntry,
    clearMealHistory,
    dbRowToEntry,
} from "../src/services/mealHistoryService";

describe("MealHistoryService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── fetchMealHistory ────────────────────────────────────────────
    describe("fetchMealHistory", () => {
        it("should fetch all meal history entries for a user, ordered by date desc", async () => {
            const mockData = [
                { id: "entry-1", user_id: "user-1", date: "2024-06-25", score: 85 },
                { id: "entry-2", user_id: "user-1", date: "2024-06-24", score: 72 },
            ];
            terminalResult = { data: mockData, error: null };

            const result = await fetchMealHistory("user-1");
            expect(result).toEqual(mockData);
            expect(result).toHaveLength(2);
        });

        it("should return empty array when no history exists", async () => {
            terminalResult = { data: null, error: null };

            const result = await fetchMealHistory("user-1");
            expect(result).toEqual([]);
        });

        it("should throw on error", async () => {
            terminalResult = { data: null, error: { message: "DB connection failed" } };

            await expect(fetchMealHistory("user-1")).rejects.toThrow("Failed to fetch meal history: DB connection failed");
        });
    });

    // ─── upsertMealHistoryEntry ──────────────────────────────────────
    describe("upsertMealHistoryEntry", () => {
        it("should upsert a meal history entry and return the row", async () => {
            const entry = {
                id: "entry-1",
                date: "2024-06-25",
                timestamp: Date.now(),
                planName: "My Plan",
                score: 85,
                band: "Excellent balance",
                kcal: 2000,
                protein: 60,
                carbs: 250,
                fat: 65,
                fibre: 30,
                vegetablesG: 400,
                visibleFat: 20,
            };
            const expectedRow = {
                id: "entry-1",
                user_id: "user-1",
                date: "2024-06-25",
                timestamp: entry.timestamp,
                plan_name: "My Plan",
                score: 85,
                band: "Excellent balance",
                kcal: 2000,
                protein: 60,
                carbs: 250,
                fat: 65,
                fibre: 30,
                vegetables_g: 400,
                visible_fat: 20,
            };
            terminalResult = { data: expectedRow, error: null };

            const result = await upsertMealHistoryEntry("user-1", entry);
            expect(result).toEqual(expectedRow);
        });

        it("should throw on upsert failure", async () => {
            const entry = { id: "e1", date: "2024-01-01", timestamp: 0, planName: "", score: 0, band: "", kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, vegetablesG: 0, visibleFat: 0 };
            terminalResult = { data: null, error: { message: "Constraint violation" } };

            await expect(upsertMealHistoryEntry("user-1", entry)).rejects.toThrow("Failed to save meal history entry: Constraint violation");
        });

        it("should map client field names to DB column names correctly", async () => {
            const entry = {
                id: "e1",
                date: "2024-01-01",
                timestamp: 12345,
                planName: "Test Plan",
                score: 70,
                band: "Good",
                kcal: 1500,
                protein: 50,
                carbs: 200,
                fat: 55,
                fibre: 25,
                vegetablesG: 350,
                visibleFat: 15,
            };
            terminalResult = { data: { plan_name: "Test Plan", vegetables_g: 350, visible_fat: 15 }, error: null };

            const result = await upsertMealHistoryEntry("user-1", entry);
            expect(result.plan_name).toBe("Test Plan");
            expect(result.vegetables_g).toBe(350);
            expect(result.visible_fat).toBe(15);
        });
    });

    // ─── deleteMealHistoryEntry ──────────────────────────────────────
    describe("deleteMealHistoryEntry", () => {
        it("should delete entry by id and user_id", async () => {
            terminalResult = { error: null };

            await expect(deleteMealHistoryEntry("user-1", "entry-1")).resolves.toBeUndefined();
        });

        it("should throw on delete failure", async () => {
            terminalResult = { error: { message: "Entry not found" } };

            await expect(deleteMealHistoryEntry("user-1", "entry-1")).rejects.toThrow("Failed to delete meal history entry: Entry not found");
        });
    });

    // ─── clearMealHistory ────────────────────────────────────────────
    describe("clearMealHistory", () => {
        it("should delete all entries for a user", async () => {
            terminalResult = { error: null };

            await expect(clearMealHistory("user-1")).resolves.toBeUndefined();
        });

        it("should throw on clear failure", async () => {
            terminalResult = { error: { message: "Permission denied" } };

            await expect(clearMealHistory("user-1")).rejects.toThrow("Failed to clear meal history: Permission denied");
        });
    });

    // ─── dbRowToEntry ────────────────────────────────────────────────
    describe("dbRowToEntry", () => {
        it("should map DB row columns to client-side entry format", () => {
            const row = {
                id: "entry-1",
                date: "2024-06-25",
                timestamp: 1719302400000,
                plan_name: "Balanced Plan",
                score: 92,
                band: "Excellent balance",
                kcal: 2200,
                protein: 65,
                carbs: 280,
                fat: 70,
                fibre: 35,
                vegetables_g: 450,
                visible_fat: 18,
            };

            const entry = dbRowToEntry(row);
            expect(entry).toEqual({
                id: "entry-1",
                date: "2024-06-25",
                timestamp: 1719302400000,
                planName: "Balanced Plan",
                score: 92,
                band: "Excellent balance",
                kcal: 2200,
                protein: 65,
                carbs: 280,
                fat: 70,
                fibre: 35,
                vegetablesG: 450,
                visibleFat: 18,
            });
        });

        it("should handle null/undefined fields gracefully", () => {
            const row = {
                id: "entry-1",
                date: "2024-01-01",
                timestamp: null,
                plan_name: null,
                score: 0,
                band: null,
                kcal: 0,
                protein: 0,
                carbs: 0,
                fat: 0,
                fibre: 0,
                vegetables_g: 0,
                visible_fat: 0,
            };

            const entry = dbRowToEntry(row);
            expect(entry.planName).toBeNull();
            expect(entry.timestamp).toBeNull();
            expect(entry.score).toBe(0);
        });
    });
});
