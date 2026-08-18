import { describe, it, expect } from "vitest";
import {
    formatMealTime,
    getMealTimeRange,
    formatMealTimeRange,
    DEFAULT_MEAL_TIMES,
} from "../src/utils/mealTime";

describe("formatMealTime", () => {
    it("formats a morning time", () => {
        expect(formatMealTime("08:00")).toBe("8:00 AM");
    });

    it("formats noon as 12 PM", () => {
        expect(formatMealTime("12:00")).toBe("12:00 PM");
    });

    it("formats an afternoon time", () => {
        expect(formatMealTime("13:30")).toBe("1:30 PM");
    });

    it("formats midnight as 12 AM", () => {
        expect(formatMealTime("00:15")).toBe("12:15 AM");
    });

    it("pads single-digit minutes", () => {
        expect(formatMealTime("9:05")).toBe("9:05 AM");
    });

    it("returns '' for empty input", () => {
        expect(formatMealTime("")).toBe("");
    });

    it("returns '' for null/undefined", () => {
        expect(formatMealTime(null)).toBe("");
        expect(formatMealTime(undefined)).toBe("");
    });

    it("returns '' for non-string input", () => {
        expect(formatMealTime(830)).toBe("");
    });

    it("returns '' for malformed strings", () => {
        expect(formatMealTime("abc")).toBe("");
        expect(formatMealTime("8")).toBe("");
        expect(formatMealTime("08-00")).toBe("");
    });

    it("returns '' for out-of-range values", () => {
        expect(formatMealTime("25:00")).toBe("");
        expect(formatMealTime("10:75")).toBe("");
    });
});

describe("getMealTimeRange", () => {
    it("returns an explicit range object when set", () => {
        const mealTimes = { Breakfast: { start: "08:00", end: "10:00" } };
        expect(getMealTimeRange(mealTimes, "Breakfast")).toEqual({
            start: "08:00",
            end: "10:00",
        });
    });

    it("returns a partial range object (start only)", () => {
        const mealTimes = { Breakfast: { start: "07:00" } };
        expect(getMealTimeRange(mealTimes, "Breakfast")).toEqual({
            start: "07:00",
            end: "",
        });
    });

    it("coerces a legacy single-string time to { start, end: '' }", () => {
        expect(getMealTimeRange({ Breakfast: "08:00" }, "Breakfast")).toEqual({
            start: "08:00",
            end: "",
        });
    });

    it("falls back to the slot default when unset", () => {
        expect(getMealTimeRange({}, "Breakfast")).toEqual(DEFAULT_MEAL_TIMES.Breakfast);
        expect(getMealTimeRange({}, "Early morning")).toEqual(
            DEFAULT_MEAL_TIMES["Early morning"]
        );
    });

    it("handles null/undefined mealTimes via the slot default", () => {
        expect(getMealTimeRange(null, "Lunch")).toEqual(DEFAULT_MEAL_TIMES.Lunch);
        expect(getMealTimeRange(undefined, "Dinner")).toEqual(DEFAULT_MEAL_TIMES.Dinner);
    });

    it("returns null for an unknown slot with no default", () => {
        expect(getMealTimeRange({}, "Brunch")).toBeNull();
    });
});

describe("formatMealTimeRange", () => {
    it("formats a same-period morning range compactly", () => {
        expect(formatMealTimeRange({ start: "06:00", end: "07:00" })).toBe("6\u20137 AM");
        expect(formatMealTimeRange({ start: "08:00", end: "10:00" })).toBe("8\u201310 AM");
    });

    it("shows both periods when they differ", () => {
        expect(formatMealTimeRange({ start: "06:00", end: "13:00" })).toBe(
            "6 AM \u2013 1 PM"
        );
    });

    it("preserves non-zero minutes", () => {
        expect(formatMealTimeRange({ start: "08:30", end: "10:15" })).toBe(
            "8:30\u201310:15 AM"
        );
    });

    it("formats a single legacy string", () => {
        expect(formatMealTimeRange("08:30")).toBe("8:30 AM");
    });

    it("formats when only start or only end is present", () => {
        expect(formatMealTimeRange({ start: "08:00", end: "" })).toBe("8 AM");
        expect(formatMealTimeRange({ start: "", end: "20:00" })).toBe("8 PM");
    });

    it("returns '' for empty/null/invalid input", () => {
        expect(formatMealTimeRange(null)).toBe("");
        expect(formatMealTimeRange(undefined)).toBe("");
        expect(formatMealTimeRange({})).toBe("");
        expect(formatMealTimeRange({ start: "", end: "" })).toBe("");
    });
});

