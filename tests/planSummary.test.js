/**
 * planSummary — computeDaySummaries
 *
 * Regression coverage for the "empty Preset Plan PDF" bug. Preset plans built
 * through the admin UI store meal items that only reference a DB `foodId`
 * (no inline `nutrients`). Without a nutrient resolver those items aggregate to
 * ZERO, so every day fails the PDF's "has food" gate and the export is blank.
 * The Weekly Planner fixes this by resolving + hydrating nutrients before
 * computing summaries — these tests lock in both the root cause and the fix.
 */
import { describe, it, expect } from "vitest";
import { computeDaySummaries } from "../src/utils/planSummary";
import { DAYS } from "../src/data/presetPlans";

// A preset-style plan whose items only carry a DB foodId (no inline nutrients).
const presetPlan = {
    name: "Preset",
    meals: {
        Breakfast: [{ id: "a", foodId: "10", grams: 100, day: "Monday", foodGroupId: 1 }],
        Lunch: [{ id: "b", foodId: "82", grams: 150, day: "Monday", foodGroupId: 3 }],
    },
};

// Per-100g nutrients (Ragi #10, Spinach #82) as the resolver would supply.
const resolver = (id) => {
    if (id === "10") return { kcal: 336, carbs: 72, protein: 7.3, fat: 1.3, fibre: 11.5 };
    if (id === "82") return { kcal: 26, carbs: 2.9, protein: 2, fat: 0.6, fibre: 3.6 };
    return undefined;
};

describe("computeDaySummaries", () => {
    it("root cause: DB items with no inline nutrients aggregate to ZERO without a resolver", () => {
        const summaries = computeDaySummaries(presetPlan);
        // Every day fails the "has food" gate → the PDF would be empty.
        for (const day of DAYS) {
            expect(summaries[day].dayTotals.kcal).toBe(0);
            expect(summaries[day].dayTotals.protein).toBe(0);
        }
    });

    it("fix: a nutrient resolver hydrates DB items so day totals are non-zero", () => {
        const summaries = computeDaySummaries(presetPlan, resolver);
        const mon = summaries.Monday.dayTotals;

        // Ragi 100g (×1.0) + Spinach 150g (×1.5)
        expect(mon.kcal).toBeGreaterThan(0);
        expect(mon.protein).toBeGreaterThan(0);
        expect(Math.round(mon.kcal)).toBe(Math.round(336 + 26 * 1.5));
        expect(mon.protein).toBeCloseTo(7.3 + 2 * 1.5, 5);
        // Spinach counts toward vegetables (group id 3)
        expect(mon.vegetablesG).toBe(150);
    });

    it("computes a numeric day score for each day", () => {
        const summaries = computeDaySummaries(presetPlan, resolver);
        expect(summaries.Monday.dayScore).toBeDefined();
        expect(typeof summaries.Monday.dayScore.score).toBe("number");
    });

    it("assigns undated items to every day", () => {
        const plan = {
            meals: { Breakfast: [{ id: "x", foodId: "10", grams: 100 /* no day */ }] },
        };
        const summaries = computeDaySummaries(plan, resolver);
        expect(summaries.Monday.dayTotals.kcal).toBeGreaterThan(0);
        expect(summaries.Sunday.dayTotals.kcal).toBeGreaterThan(0);
    });

    it("keeps a dated item off other days", () => {
        const summaries = computeDaySummaries(presetPlan, resolver);
        expect(summaries.Tuesday.dayTotals.kcal).toBe(0);
    });

    it("returns an empty object for a null/undefined plan", () => {
        expect(computeDaySummaries(null)).toEqual({});
        expect(computeDaySummaries(undefined)).toEqual({});
    });
});

