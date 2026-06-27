/**
 * Daily Health Service – Additional branch coverage tests
 * Covers: dbRowsToWaterData/dbRowsToStepData null input, null date rows
 */
import { describe, it, expect } from "vitest";
import { dbRowsToWaterData, dbRowsToStepData } from "../src/services/dailyHealthService";

describe("DailyHealthService – edge cases", () => {
    describe("dbRowsToWaterData", () => {
        it("should return empty object when rows is null", () => {
            expect(dbRowsToWaterData(null)).toEqual({});
        });

        it("should return empty object when rows is undefined", () => {
            expect(dbRowsToWaterData(undefined)).toEqual({});
        });

        it("should skip rows with null date", () => {
            const rows = [
                { date: "2024-06-25", water_glasses: 8 },
                { date: null, water_glasses: 5 },
                { date: "2024-06-24", water_glasses: 6 },
            ];
            const result = dbRowsToWaterData(rows);
            expect(result).toEqual({ "2024-06-25": 8, "2024-06-24": 6 });
        });

        it("should skip rows with undefined date", () => {
            const rows = [
                { date: "2024-06-25", water_glasses: 8 },
                { water_glasses: 3 }, // no date property
            ];
            const result = dbRowsToWaterData(rows);
            expect(result).toEqual({ "2024-06-25": 8 });
        });

        it("should handle rows where row itself is null/undefined", () => {
            const rows = [
                { date: "2024-06-25", water_glasses: 8 },
                null,
                undefined,
            ];
            const result = dbRowsToWaterData(rows);
            expect(result).toEqual({ "2024-06-25": 8 });
        });

        it("should handle zero water_glasses", () => {
            const rows = [{ date: "2024-06-25", water_glasses: 0 }];
            expect(dbRowsToWaterData(rows)["2024-06-25"]).toBe(0);
        });
    });

    describe("dbRowsToStepData", () => {
        it("should return empty object when rows is null", () => {
            expect(dbRowsToStepData(null)).toEqual({});
        });

        it("should return empty object when rows is undefined", () => {
            expect(dbRowsToStepData(undefined)).toEqual({});
        });

        it("should skip rows with null date", () => {
            const rows = [
                { date: "2024-06-25", steps: 10000 },
                { date: null, steps: 5000 },
                { date: "2024-06-24", steps: 8000 },
            ];
            const result = dbRowsToStepData(rows);
            expect(result).toEqual({ "2024-06-25": 10000, "2024-06-24": 8000 });
        });

        it("should skip rows with undefined date", () => {
            const rows = [
                { date: "2024-06-25", steps: 10000 },
                { steps: 7000 }, // no date
            ];
            const result = dbRowsToStepData(rows);
            expect(result).toEqual({ "2024-06-25": 10000 });
        });

        it("should handle rows where row itself is null/undefined", () => {
            const rows = [
                { date: "2024-06-25", steps: 10000 },
                null,
                undefined,
            ];
            const result = dbRowsToStepData(rows);
            expect(result).toEqual({ "2024-06-25": 10000 });
        });

        it("should handle large step counts", () => {
            const rows = [{ date: "2024-06-25", steps: 99999 }];
            expect(dbRowsToStepData(rows)["2024-06-25"]).toBe(99999);
        });
    });
});

