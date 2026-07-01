/**
 * Tests for presetPlans.js data module — MEALS, DAYS, getTodayName
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { MEALS, DAYS, getTodayName } from "../src/data/presetPlans";

describe("presetPlans data", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("exports 7 MEALS slots", () => {
        expect(MEALS).toHaveLength(7);
        expect(MEALS).toContain("Breakfast");
        expect(MEALS).toContain("Lunch");
        expect(MEALS).toContain("Dinner");
        expect(MEALS).toContain("Early morning");
        expect(MEALS).toContain("Post breakfast snack");
        expect(MEALS).toContain("Post lunch snack");
        expect(MEALS).toContain("Bed time");
    });

    it("exports 7 DAYS", () => {
        expect(DAYS).toHaveLength(7);
        expect(DAYS[0]).toBe("Monday");
        expect(DAYS[6]).toBe("Sunday");
    });

    describe("getTodayName", () => {
        it("returns Monday for getDay()=1", () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date("2026-07-06T12:00:00")); // Monday
            expect(getTodayName()).toBe("Monday");
        });

        it("returns Tuesday for getDay()=2", () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date("2026-07-07T12:00:00")); // Tuesday
            expect(getTodayName()).toBe("Tuesday");
        });

        it("returns Sunday for getDay()=0", () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date("2026-07-05T12:00:00")); // Sunday
            expect(getTodayName()).toBe("Sunday");
        });

        it("returns Saturday for getDay()=6", () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date("2026-07-04T12:00:00")); // Saturday
            expect(getTodayName()).toBe("Saturday");
        });

        it("returns Wednesday for getDay()=3", () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date("2026-07-01T12:00:00")); // Wednesday
            expect(getTodayName()).toBe("Wednesday");
        });
    });
});

