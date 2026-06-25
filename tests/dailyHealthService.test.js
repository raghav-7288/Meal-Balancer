/**
 * Daily Health Service Tests
 * Tests: fetchDailyHealthData, fetchDailyHealthForDate, upsertDailyHealth,
 * dbRowsToWaterData, dbRowsToStepData
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
    fetchDailyHealthData,
    fetchDailyHealthForDate,
    upsertDailyHealth,
    dbRowsToWaterData,
    dbRowsToStepData,
} from "../src/services/dailyHealthService";

describe("DailyHealthService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        terminalResult = { data: null, error: null };
    });

    // ─── fetchDailyHealthData ────────────────────────────────────────
    describe("fetchDailyHealthData", () => {
        it("should fetch daily health entries", async () => {
            const mockData = [
                { user_id: "user-1", date: "2024-06-25", water_glasses: 8, steps: 10000 },
                { user_id: "user-1", date: "2024-06-24", water_glasses: 6, steps: 8000 },
            ];
            terminalResult = { data: mockData, error: null };

            const result = await fetchDailyHealthData("user-1");
            expect(result).toEqual(mockData);
        });

        it("should return empty array when no data", async () => {
            terminalResult = { data: null, error: null };

            const result = await fetchDailyHealthData("user-1");
            expect(result).toEqual([]);
        });

        it("should throw on error", async () => {
            terminalResult = { data: null, error: { message: "Connection refused" } };

            await expect(fetchDailyHealthData("user-1")).rejects.toThrow("Failed to fetch daily health data: Connection refused");
        });
    });

    // ─── fetchDailyHealthForDate ─────────────────────────────────────
    describe("fetchDailyHealthForDate", () => {
        it("should fetch single day health tracking entry", async () => {
            const mockData = { user_id: "user-1", date: "2024-06-25", water_glasses: 8, steps: 10000 };
            terminalResult = { data: mockData, error: null };

            const result = await fetchDailyHealthForDate("user-1", "2024-06-25");
            expect(result).toEqual(mockData);
        });

        it("should return null when no entry for that date (PGRST116)", async () => {
            terminalResult = { data: null, error: { code: "PGRST116", message: "No rows returned" } };

            const result = await fetchDailyHealthForDate("user-1", "2024-01-01");
            expect(result).toBeNull();
        });

        it("should throw on unexpected error", async () => {
            terminalResult = { data: null, error: { code: "42501", message: "RLS violation" } };

            await expect(fetchDailyHealthForDate("user-1", "2024-01-01")).rejects.toThrow("Failed to fetch daily health for date: RLS violation");
        });
    });

    // ─── upsertDailyHealth ───────────────────────────────────────────
    describe("upsertDailyHealth", () => {
        it("should upsert daily health entry with water data", async () => {
            const upsertedRow = { user_id: "user-1", date: "2024-06-25", water_glasses: 5, water_target: 8 };
            terminalResult = { data: upsertedRow, error: null };

            const result = await upsertDailyHealth("user-1", "2024-06-25", { water_glasses: 5, water_target: 8 });
            expect(result).toEqual(upsertedRow);
        });

        it("should upsert daily health entry with step data", async () => {
            const upsertedRow = { user_id: "user-1", date: "2024-06-25", steps: 12000, step_target: 10000 };
            terminalResult = { data: upsertedRow, error: null };

            const result = await upsertDailyHealth("user-1", "2024-06-25", { steps: 12000, step_target: 10000 });
            expect(result).toEqual(upsertedRow);
        });

        it("should throw on upsert failure", async () => {
            terminalResult = { data: null, error: { message: "Duplicate key" } };

            await expect(upsertDailyHealth("user-1", "2024-06-25", { water_glasses: 5 })).rejects.toThrow("Failed to save daily health data: Duplicate key");
        });
    });

    // ─── dbRowsToWaterData ───────────────────────────────────────────
    describe("dbRowsToWaterData", () => {
        it("should convert DB rows to date-keyed water data map", () => {
            const rows = [
                { date: "2024-06-25", water_glasses: 8 },
                { date: "2024-06-24", water_glasses: 6 },
            ];
            const result = dbRowsToWaterData(rows);
            expect(result).toEqual({ "2024-06-25": 8, "2024-06-24": 6 });
        });

        it("should return empty object for empty rows", () => {
            expect(dbRowsToWaterData([])).toEqual({});
        });

        it("should handle null water_glasses values", () => {
            const rows = [{ date: "2024-06-25", water_glasses: null }];
            expect(dbRowsToWaterData(rows)["2024-06-25"]).toBeNull();
        });
    });

    // ─── dbRowsToStepData ────────────────────────────────────────────
    describe("dbRowsToStepData", () => {
        it("should convert DB rows to date-keyed step data map", () => {
            const rows = [
                { date: "2024-06-25", steps: 10000 },
                { date: "2024-06-24", steps: 8500 },
            ];
            const result = dbRowsToStepData(rows);
            expect(result).toEqual({ "2024-06-25": 10000, "2024-06-24": 8500 });
        });

        it("should return empty object for empty rows", () => {
            expect(dbRowsToStepData([])).toEqual({});
        });

        it("should handle null steps values", () => {
            const rows = [{ date: "2024-06-25", steps: null }];
            expect(dbRowsToStepData(rows)["2024-06-25"]).toBeNull();
        });

        it("should handle zero steps", () => {
            const rows = [{ date: "2024-06-25", steps: 0 }];
            expect(dbRowsToStepData(rows)["2024-06-25"]).toBe(0);
        });
    });
});
