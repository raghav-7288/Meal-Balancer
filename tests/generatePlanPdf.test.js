import { describe, it, expect, vi } from "vitest";
import {
    capitalize,
    computeWeeklyAverages,
    buildMealTableRow,
    buildDailySummaryRows,
} from "../src/utils/generatePlanPdf";

describe("generatePlanPdf — pure functions", () => {
    describe("capitalize", () => {
        it("capitalizes first letter", () => {
            expect(capitalize("hello")).toBe("Hello");
        });

        it("returns em-dash unchanged", () => {
            expect(capitalize("\u2014")).toBe("\u2014");
        });

        it("returns empty string unchanged", () => {
            expect(capitalize("")).toBe("");
        });

        it("returns null/undefined unchanged", () => {
            expect(capitalize(null)).toBe(null);
            expect(capitalize(undefined)).toBe(undefined);
        });

        it("handles single character", () => {
            expect(capitalize("a")).toBe("A");
        });

        it("handles already capitalized string", () => {
            expect(capitalize("Weight Loss")).toBe("Weight Loss");
        });
    });

    describe("computeWeeklyAverages", () => {
        const days = ["Monday", "Tuesday", "Wednesday"];

        it("computes averages for days with food", () => {
            const daySummaries = {
                Monday: { dayTotals: { kcal: 2000, protein: 80, carbs: 250, fat: 60, fibre: 30 } },
                Tuesday: { dayTotals: { kcal: 1800, protein: 70, carbs: 200, fat: 50, fibre: 25 } },
                Wednesday: { dayTotals: { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 } },
            };

            const result = computeWeeklyAverages(daySummaries, days);

            expect(result.daysWithFood).toEqual(["Monday", "Tuesday"]);
            expect(result.avgKcal).toBe(1900);
            expect(result.avgProtein).toBe(75);
            expect(result.avgCarbs).toBe(225);
            expect(result.avgFat).toBe(55);
            expect(result.avgFibre).toBe(28); // (30+25)/2 = 27.5 → 28
        });

        it("returns zeros when no days have food", () => {
            const daySummaries = {
                Monday: { dayTotals: { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 } },
            };

            const result = computeWeeklyAverages(daySummaries, ["Monday"]);

            expect(result.daysWithFood).toEqual([]);
            expect(result.avgKcal).toBe(0);
            expect(result.avgProtein).toBe(0);
        });

        it("handles missing daySummaries entries gracefully", () => {
            const daySummaries = {
                Monday: { dayTotals: { kcal: 2400, protein: 100, carbs: 300, fat: 80, fibre: 35 } },
            };

            const result = computeWeeklyAverages(daySummaries, ["Monday", "Tuesday"]);

            expect(result.daysWithFood).toEqual(["Monday"]);
            expect(result.avgKcal).toBe(2400);
        });

        it("handles null dayTotals", () => {
            const daySummaries = {
                Monday: { dayTotals: null },
                Tuesday: {},
            };

            const result = computeWeeklyAverages(daySummaries, ["Monday", "Tuesday"]);

            expect(result.daysWithFood).toEqual([]);
            expect(result.avgKcal).toBe(0);
        });
    });

    describe("buildMealTableRow", () => {
        const mockLookup = vi.fn();

        it("uses item.nutrients when available (per 100g basis)", () => {
            const item = {
                foodId: "f1",
                foodName: "Rice",
                grams: 200,
                instructions: "Cooked",
                nutrients: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, fibre: 0.4 },
            };
            mockLookup.mockReturnValue(null);

            const row = buildMealTableRow(item, mockLookup);

            expect(row[0]).toBe("Rice"); // name
            expect(row[1]).toBe("200g"); // qty
            expect(row[2]).toBe("Cooked"); // instructions
            expect(row[3]).toBe(260); // kcal: 130 * 2
            expect(row[4]).toBe("5.4"); // protein: 2.7 * 2
            expect(row[5]).toBe("56.0"); // carbs: 28 * 2
            expect(row[6]).toBe("0.6"); // fat: 0.3 * 2
        });

        it("uses food lookup when nutrients not available", () => {
            const item = { foodId: "f2", grams: 50, instructions: "" };
            mockLookup.mockReturnValue({
                name: "Dal",
                gramsPerExchange: 100,
                kcal: 350,
                protein: 25,
                carbs: 60,
                fat: 1.2,
                fibre: 15,
            });

            const row = buildMealTableRow(item, mockLookup);

            expect(row[0]).toBe("Dal");
            expect(row[1]).toBe("50g");
            expect(row[3]).toBe(175); // 350 * 0.5
            expect(row[4]).toBe("12.5"); // 25 * 0.5
            expect(row[5]).toBe("30.0"); // 60 * 0.5
            expect(row[6]).toBe("0.6"); // 1.2 * 0.5
        });

        it("includes fibre column when option is set", () => {
            const item = {
                foodId: "f3",
                foodName: "Oats",
                grams: 100,
                nutrients: { kcal: 389, protein: 16.9, carbs: 66.3, fat: 6.9, fibre: 10.6 },
            };
            mockLookup.mockReturnValue(null);

            const row = buildMealTableRow(item, mockLookup, { includeFibre: true });

            expect(row.length).toBe(8);
            expect(row[7]).toBe("10.6"); // fibre
        });

        it("excludes fibre column by default", () => {
            const item = {
                foodId: "f4",
                foodName: "Egg",
                grams: 50,
                nutrients: { kcal: 155, protein: 13, carbs: 1.1, fat: 11, fibre: 0 },
            };
            mockLookup.mockReturnValue(null);

            const row = buildMealTableRow(item, mockLookup);

            expect(row.length).toBe(7);
        });

        it("falls back to foodId when no name available", () => {
            const item = { foodId: "unknown_id", grams: 100, nutrients: { kcal: 0, protein: 0, carbs: 0, fat: 0 } };
            mockLookup.mockReturnValue(null);

            const row = buildMealTableRow(item, mockLookup);

            expect(row[0]).toBe("unknown_id");
        });

        it("returns zeros when no nutrients and no food lookup match", () => {
            const item = { foodId: "x", foodName: "Mystery", grams: 100 };
            mockLookup.mockReturnValue(null);

            const row = buildMealTableRow(item, mockLookup);

            expect(row[3]).toBe(0); // kcal
            expect(row[4]).toBe("0"); // protein
            expect(row[5]).toBe("0"); // carbs
            expect(row[6]).toBe("0"); // fat
        });
    });

    describe("buildMealTableRow — menu column & custom foods", () => {
        const mockLookup = vi.fn(() => null);

        it("prepends the Menu column when includeMenu is set", () => {
            const item = {
                foodId: "f1",
                foodName: "Rice",
                menu: "Veg Pulao",
                grams: 200,
                instructions: "Cooked",
                nutrients: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, fibre: 0.4 },
            };

            const row = buildMealTableRow(item, mockLookup, { includeMenu: true });

            expect(row[0]).toBe("Veg Pulao"); // menu is first
            expect(row[1]).toBe("Rice"); // then food name
            expect(row[2]).toBe("200g");
            expect(row[3]).toBe("Cooked");
            expect(row.length).toBe(8); // menu + name + qty + instr + 4 macros (no fibre)
        });

        it("includes menu + fibre together (full dashboard-parity row)", () => {
            const item = {
                foodId: "f1",
                foodName: "Oats",
                menu: "Oats Bowl",
                grams: 100,
                nutrients: { kcal: 389, protein: 16.9, carbs: 66.3, fat: 6.9, fibre: 10.6 },
            };

            const row = buildMealTableRow(item, mockLookup, { includeMenu: true, includeFibre: true });

            expect(row[0]).toBe("Oats Bowl");
            expect(row.length).toBe(9);
            expect(row[8]).toBe("10.6"); // fibre last
        });

        it("uses an empty menu cell for a single food with no explicit menu", () => {
            const item = { foodId: "f1", foodName: "Apple", grams: 100, nutrients: { kcal: 52 } };

            const row = buildMealTableRow(item, mockLookup, { includeMenu: true });

            expect(row[0]).toBe(""); // no menu provided
            expect(row[1]).toBe("Apple");
        });

        it("marks a custom single food with its database equivalent", () => {
            const item = {
                foodId: "f1",
                foodName: "Grandma's Laddoo",
                grams: 50,
                isCustom: true,
                equivalentFoodName: "Besan Laddoo",
                nutrients: { kcal: 400, protein: 8, carbs: 50, fat: 18, fibre: 3 },
            };

            const row = buildMealTableRow(item, mockLookup);

            expect(row[0]).toBe("Grandma's Laddoo (custom \u2248 Besan Laddoo)");
        });

        it("marks a custom single food without an equivalent", () => {
            const item = {
                foodId: "f1",
                foodName: "Secret Snack",
                grams: 30,
                isCustom: true,
                nutrients: { kcal: 100 },
            };

            const row = buildMealTableRow(item, mockLookup);

            expect(row[0]).toBe("Secret Snack (custom)");
        });

        it("derives the menu from the dish name for composite items", () => {
            const item = {
                foodId: "composite",
                foodName: "Rajma Chawal",
                grams: 300,
                instructions: "Serve hot",
                ingredients: [
                    { foodName: "Rajma", grams: 150, nutrients: { kcal: 100, protein: 7, carbs: 18, fat: 0.5, fibre: 6 } },
                    { foodName: "Rice", grams: 150, nutrients: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, fibre: 0.4 } },
                ],
            };

            const row = buildMealTableRow(item, mockLookup, { includeMenu: true });

            expect(row[0]).toBe("Rajma Chawal"); // menu = dish name
            expect(row[1]).toBe("Rajma 150g, Rice 150g"); // ingredient list
            expect(row[2]).toBe("300g");
            expect(row[3]).toBe("Serve hot");
        });

        it("flags custom ingredients inside a composite item", () => {
            const item = {
                foodId: "composite",
                foodName: "Special Thali",
                grams: 200,
                ingredients: [
                    { foodName: "Homemade Sabzi", grams: 100, isCustom: true, nutrients: { kcal: 80, protein: 3, carbs: 10, fat: 3, fibre: 4 } },
                    { foodName: "Roti", grams: 100, nutrients: { kcal: 250, protein: 8, carbs: 50, fat: 3, fibre: 5 } },
                ],
            };

            const row = buildMealTableRow(item, mockLookup, { includeMenu: true });

            expect(row[1]).toBe("Homemade Sabzi (custom) 100g, Roti 100g");
        });
    });

    describe("buildDailySummaryRows", () => {
        it("formats all nutrient rows correctly", () => {
            const dayTotals = {
                kcal: 2150.7,
                protein: 85.3,
                carbs: 270.6,
                fat: 65.2,
                fibre: 32.1,
                visibleFat: 20.5,
                vegetablesG: 350.0,
            };

            const rows = buildDailySummaryRows(dayTotals);

            expect(rows).toEqual([
                ["Total Calories", "2151 kcal"],
                ["Protein", "85.3 g"],
                ["Carbohydrates", "270.6 g"],
                ["Fat", "65.2 g"],
                ["Fibre", "32.1 g"],
                ["Visible Fat", "20.5 g"],
                ["Vegetables", "350.0 g"],
            ]);
        });

        it("handles zero values", () => {
            const dayTotals = {
                kcal: 0,
                protein: 0,
                carbs: 0,
                fat: 0,
                fibre: 0,
                visibleFat: 0,
                vegetablesG: 0,
            };

            const rows = buildDailySummaryRows(dayTotals);

            expect(rows[0]).toEqual(["Total Calories", "0 kcal"]);
            expect(rows[1]).toEqual(["Protein", "0.0 g"]);
        });

        it("returns 7 rows always", () => {
            const dayTotals = {
                kcal: 1000, protein: 50, carbs: 120,
                fat: 40, fibre: 20, visibleFat: 10, vegetablesG: 200,
            };

            const rows = buildDailySummaryRows(dayTotals);

            expect(rows.length).toBe(7);
        });
    });
});

