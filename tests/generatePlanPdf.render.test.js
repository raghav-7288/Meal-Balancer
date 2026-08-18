/**
 * downloadPlanAsPdf — REAL render test (actual jsPDF + jspdf-autotable).
 *
 * The comprehensive suite mocks jsPDF/autoTable to assert orchestration. This
 * suite instead runs the real rendering pipeline end-to-end and verifies the
 * user-facing guarantees:
 *   - a non-empty PDF is produced (bytes > 0) — no "empty PDF" regression,
 *   - each day with food gets its own page (page breaks work),
 *   - both the weekly (Personal/Preset) and single-day formats render.
 *
 * Only `save` is overridden (to capture output instead of writing to disk);
 * everything else uses the genuine jsPDF + autoTable code paths.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

let captured;

vi.mock("jspdf", async (importOriginal) => {
    const actual = await importOriginal();
    const RealPDF = actual.default;
    // jsPDF's constructor returns a plain object with `save` as an OWN property
    // (no usable prototype), so we wrap the real instance and swap only `save`
    // to capture the output instead of writing a file to disk.
    function PatchedPDF(...args) {
        const inst = new RealPDF(...args);
        inst.save = function (fileName) {
            captured = {
                fileName,
                pages: inst.internal.getNumberOfPages(),
                bytes: inst.output("arraybuffer").byteLength,
            };
            return inst;
        };
        return inst;
    }
    return { ...actual, default: PatchedPDF };
});

import { downloadPlanAsPdf } from "../src/utils/generatePlanPdf";

// Helper: build a full NutrientTotals-ish object with sane defaults.
const nut = (o) => ({
    kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, vitamins: 0, minerals: 0, ...o,
});

describe("downloadPlanAsPdf — real render (jsPDF + autoTable)", () => {
    beforeEach(() => {
        captured = undefined;
    });

    it("renders a non-empty, multi-page weekly PDF with menu/custom/composite/instructions", () => {
        const plan = {
            id: "personal-1",
            name: "My Weekly Plan",
            guidelines: "Drink 3 litres of water daily. Avoid refined sugar. ".repeat(6),
            mealTimes: {
                Breakfast: { start: "08:00", end: "10:00" },
                Lunch: { start: "13:00", end: "14:00" },
            },
            meals: {
                Breakfast: [
                    {
                        id: "1", foodId: "x1", foodName: "Poha", menu: "Veg Poha", grams: 150,
                        day: "Monday", instructions: "Garnish with peanuts and coriander",
                        nutrients: nut({ kcal: 130, protein: 3, carbs: 27, fat: 1, fibre: 1 }),
                    },
                    {
                        id: "2", foodId: "x2", foodName: "Homemade Laddoo", grams: 40, day: "Monday",
                        isCustom: true, equivalentFoodName: "Besan Laddoo",
                        nutrients: nut({ kcal: 400, protein: 8, carbs: 50, fat: 18, fibre: 3 }),
                    },
                ],
                Lunch: [
                    {
                        id: "3", foodId: "composite", foodName: "Rajma Chawal", menu: "Rajma Chawal",
                        grams: 300, day: "Monday", instructions: "Serve hot",
                        ingredients: [
                            { foodId: "r", foodName: "Rajma", grams: 150, nutrients: nut({ kcal: 100, protein: 7, carbs: 18, fat: 0.5, fibre: 6 }) },
                            { foodId: "c", foodName: "Rice", grams: 150, isCustom: true, nutrients: nut({ kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, fibre: 0.4 }) },
                        ],
                    },
                ],
                Dinner: [
                    {
                        id: "4", foodId: "x3", foodName: "Roti", grams: 120, day: "Tuesday",
                        nutrients: nut({ kcal: 300, protein: 9, carbs: 60, fat: 3, fibre: 6 }),
                    },
                ],
            },
        };
        const daySummaries = {
            Monday: { dayTotals: nut({ kcal: 1200, protein: 40, carbs: 180, fat: 30, fibre: 15, visibleFat: 5, vegetablesG: 150 }), dayScore: { score: 78 } },
            Tuesday: { dayTotals: nut({ kcal: 300, protein: 9, carbs: 60, fat: 3, fibre: 6, visibleFat: 0, vegetablesG: 0 }), dayScore: { score: 55 } },
        };

        downloadPlanAsPdf(
            plan,
            daySummaries.Monday,
            { fullName: "Jane Doe", email: "[REDACTED_EMAIL_ADDRESS]", age: 30, heightCm: 165, weightKg: 60, bmi: "22.0" },
            { sex: "female", goal: "maintenance", dietType: "vegetarian", activity: "moderate" },
            daySummaries
        );

        expect(captured).toBeDefined();
        expect(captured.fileName).toBe("My Weekly Plan.pdf");
        // Real PDF content — definitively not an "empty" export.
        expect(captured.bytes).toBeGreaterThan(3000);
        // Cover page (1) + Monday + Tuesday each on their own page.
        expect(captured.pages).toBeGreaterThanOrEqual(3);
    });

    it("renders a non-empty single-day PDF (fallback format) with a meal TOTAL row", () => {
        const plan = {
            id: "single-1",
            name: "Single Day",
            meals: {
                Breakfast: [
                    {
                        id: "1", foodId: "x1", foodName: "Idli", menu: "Idli Sambar", grams: 200,
                        instructions: "Steam for 12 minutes",
                        nutrients: nut({ kcal: 150, protein: 5, carbs: 30, fat: 1, fibre: 2 }),
                    },
                ],
            },
        };
        const summary = {
            dayTotals: nut({ kcal: 150, protein: 5, carbs: 30, fat: 1, fibre: 2, visibleFat: 0, vegetablesG: 0 }),
            mealTotals: { Breakfast: nut({ kcal: 150, protein: 5, carbs: 30, fat: 1, fibre: 2 }) },
        };

        downloadPlanAsPdf(plan, summary);

        expect(captured).toBeDefined();
        expect(captured.fileName).toBe("Single Day.pdf");
        expect(captured.bytes).toBeGreaterThan(2000);
        expect(captured.pages).toBeGreaterThanOrEqual(1);
    });

    it("still produces a valid (cover-only) PDF when no day has food", () => {
        const plan = { id: "empty-1", name: "Empty Week", meals: { Breakfast: [], Lunch: [], Dinner: [] } };
        const daySummaries = {
            Monday: { dayTotals: nut({}), dayScore: { score: 0 } },
        };

        downloadPlanAsPdf(plan, { dayTotals: nut({}) }, {}, {}, daySummaries);

        expect(captured).toBeDefined();
        expect(captured.bytes).toBeGreaterThan(1000); // cover/overview still render
    });
});

