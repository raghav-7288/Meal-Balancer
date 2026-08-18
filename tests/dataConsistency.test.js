/**
 * Phase 5 — Data consistency tests.
 *
 * Verifies that the same underlying data produces identical values when
 * processed by the dashboard pipeline vs the PDF pipeline.
 *
 * Traces: INPUT → aggregateMeal → combineDay → scoreDay → display
 */
import { describe, it, expect } from "vitest";
import { aggregateMeal, combineDay, foodById } from "../src/engines/nutrientEngine";
import { scoreMeal, scoreDay } from "../src/engines/scoringEngine";
import { computeDaySummaries } from "../src/utils/planSummary";
import { buildMealTableRow, computeWeeklyAverages } from "../src/utils/generatePlanPdf";
import { DAYS } from "../src/data/presetPlans";

// ─── Shared test plan ─────────────────────────────────────────────────
const TEST_PLAN = {
    id: "test-plan",
    name: "Consistency Test",
    meals: {
        "Early morning": [],
        Breakfast: [
            { id: "b1", foodId: "roti", grams: 60, day: "Monday" },
            { id: "b2", foodId: "curd", grams: 150, day: "Monday" },
        ],
        "Post breakfast snack": [],
        Lunch: [
            { id: "l1", foodId: "dal", grams: 150, day: "Monday" },
            { id: "l2", foodId: "mixedveg", grams: 200, day: "Monday" },
            { id: "l3", foodId: "roti", grams: 60, day: "Monday" },
        ],
        "Post lunch snack": [
            { id: "s1", foodId: "banana", grams: 100, day: "Monday" },
        ],
        Dinner: [
            { id: "d1", foodId: "rice", grams: 150, day: "Monday" },
            { id: "d2", foodId: "egg", grams: 50, day: "Monday" },
            { id: "d3", foodId: "mixedveg", grams: 100, day: "Monday" },
        ],
        "Bed time": [],
    },
    mealTimes: {},
    guidelines: "",
};

describe("Dashboard ↔ PDF data consistency", () => {
    // ── Step 1: Compute day totals via the dashboard path ──
    const dashboardMealTotals = {};
    for (const meal of Object.keys(TEST_PLAN.meals)) {
        const items = TEST_PLAN.meals[meal].filter(
            (i) => i.day === "Monday" || !i.day
        );
        dashboardMealTotals[meal] = aggregateMeal(items);
    }
    const dashboardDayTotals = combineDay(dashboardMealTotals);
    const dashboardDayScore = scoreDay(dashboardDayTotals);

    // ── Step 2: Compute day totals via the PDF path (computeDaySummaries) ──
    const pdfDaySummaries = computeDaySummaries(TEST_PLAN);
    const pdfDayTotals = pdfDaySummaries["Monday"]?.dayTotals;
    const pdfDayScore = pdfDaySummaries["Monday"]?.dayScore;

    it("dashboard and PDF produce identical kcal", () => {
        expect(dashboardDayTotals.kcal).toBe(pdfDayTotals.kcal);
    });

    it("dashboard and PDF produce identical protein", () => {
        expect(dashboardDayTotals.protein).toBe(pdfDayTotals.protein);
    });

    it("dashboard and PDF produce identical carbs", () => {
        expect(dashboardDayTotals.carbs).toBe(pdfDayTotals.carbs);
    });

    it("dashboard and PDF produce identical fat", () => {
        expect(dashboardDayTotals.fat).toBe(pdfDayTotals.fat);
    });

    it("dashboard and PDF produce identical fibre", () => {
        expect(dashboardDayTotals.fibre).toBe(pdfDayTotals.fibre);
    });

    it("dashboard and PDF produce identical vegetablesG", () => {
        expect(dashboardDayTotals.vegetablesG).toBe(pdfDayTotals.vegetablesG);
    });

    it("dashboard and PDF produce identical visibleFat", () => {
        expect(dashboardDayTotals.visibleFat).toBe(pdfDayTotals.visibleFat);
    });

    it("dashboard and PDF produce identical cerealEnergyPct", () => {
        expect(dashboardDayTotals.cerealEnergyPct).toBeCloseTo(
            pdfDayTotals.cerealEnergyPct, 5
        );
    });

    it("dashboard and PDF produce identical day score", () => {
        expect(dashboardDayScore.score).toBe(pdfDayScore.score);
        expect(dashboardDayScore.band).toBe(pdfDayScore.band);
    });

    it("dashboard and PDF produce identical score reasons", () => {
        expect(dashboardDayScore.reasons).toEqual(pdfDayScore.reasons);
    });
});

describe("Per-item PDF rows sum to day total", () => {
    const pdfDaySummaries = computeDaySummaries(TEST_PLAN);
    const mondayTotals = pdfDaySummaries["Monday"]?.dayTotals;

    it("per-item kcal rows sum matches day total kcal", () => {
        let sumKcal = 0;
        for (const meal of Object.keys(TEST_PLAN.meals)) {
            const items = TEST_PLAN.meals[meal].filter(
                (i) => i.day === "Monday" || !i.day
            );
            for (const item of items) {
                const row = buildMealTableRow(item, foodById, { includeFibre: true });
                // row: [name, grams, instructions, kcal, protein, carbs, fat, fibre]
                sumKcal += Number(row[3]) || 0;
            }
        }
        // Math.round may cause ±1 difference per item, so allow tolerance
        expect(Math.abs(sumKcal - Math.round(mondayTotals.kcal))).toBeLessThanOrEqual(
            Object.values(TEST_PLAN.meals).flat().filter(i => i.day === "Monday").length
        );
    });
});

describe("scoreMeal and scoreDay receive carbs+fat for hasFood check", () => {
    it("scoreMeal detects food even with protein=0 if carbs or fat > 0", () => {
        // A meal with no protein but with carbs and fat should NOT return "No items"
        const totals = {
            kcal: 200,
            carbs: 50,
            protein: 0,
            fat: 10,
            fibre: 0,
            addedSugar: 0,
            visibleFat: 0,
            vegetablesG: 0,
            cerealEnergyPct: 0,
            cerealEnergy: 0,
            vitamins: 0,
            minerals: 0,
            exchangeTotals: {},
        };
        const result = scoreMeal(totals);
        expect(result.band).not.toBe("No items");
        expect(result.score).toBeGreaterThan(0);
    });

    it("scoreDay detects food even with protein=0 if carbs or fat > 0", () => {
        const totals = {
            kcal: 500,
            carbs: 100,
            protein: 0,
            fat: 20,
            fibre: 5,
            addedSugar: 0,
            visibleFat: 0,
            vegetablesG: 100,
            cerealEnergyPct: 0,
            cerealEnergy: 0,
            vitamins: 0,
            minerals: 0,
            exchangeTotals: {},
        };
        const result = scoreDay(totals);
        expect(result.band).not.toBe("No items");
    });
});

describe("Weekly averages consistency", () => {
    const daySummaries = computeDaySummaries(TEST_PLAN);

    it("PDF computeWeeklyAverages matches manual calculation", () => {
        const { daysWithFood, avgKcal } = computeWeeklyAverages(daySummaries, DAYS);
        // Only Monday has food in our test plan
        expect(daysWithFood).toContain("Monday");
        expect(daysWithFood.length).toBe(1);
        const mondayKcal = daySummaries["Monday"]?.dayTotals?.kcal || 0;
        expect(avgKcal).toBe(Math.round(mondayKcal));
    });
});

describe("buildMealTableRow handles invalid grams", () => {
    it("does not produce NaN for undefined grams", () => {
        const item = { foodId: "rice", grams: undefined, foodName: "Rice" };
        const row = buildMealTableRow(item, foodById, { includeFibre: true });
        // row: [name, grams, instructions, kcal, protein, carbs, fat, fibre]
        expect(Number.isNaN(Number(row[3]))).toBe(false); // kcal
        expect(row[4]).not.toBe("NaN"); // protein
    });

    it("does not produce NaN for NaN grams", () => {
        const item = { foodId: "rice", grams: NaN, foodName: "Rice" };
        const row = buildMealTableRow(item, foodById, { includeFibre: true });
        expect(Number.isNaN(Number(row[3]))).toBe(false);
    });

    it("does not produce NaN for composite item with undefined ingredient grams", () => {
        const item = {
            foodId: "composite",
            grams: 200,
            foodName: "Shake",
            ingredients: [
                { foodId: "banana", grams: undefined, foodName: "Banana" },
                { foodId: "curd", grams: 100, foodName: "Curd" },
            ],
        };
        const row = buildMealTableRow(item, foodById, { includeFibre: true });
        expect(Number.isNaN(Number(row[3]))).toBe(false); // kcal
    });
});

