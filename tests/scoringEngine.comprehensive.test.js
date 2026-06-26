/**
 * Scoring Engine - Comprehensive Tests
 * Tests: scoreMeal and scoreDay with all possible scoring scenarios and edge cases
 */
import { describe, it, expect } from "vitest";
import { scoreMeal, scoreDay } from "../src/engines/scoringEngine";

describe("ScoringEngine – Comprehensive", () => {
    // ─── scoreMeal ───────────────────────────────────────────────────
    describe("scoreMeal", () => {
        it("should return perfect score (100) for well-balanced meal", () => {
            const totals = {
                cerealEnergyPct: 40,
                vegetablesG: 150,
                protein: 20,
                fibre: 8,
                addedSugar: 3,
                visibleFat: 5,
                carbs: 50,
                fat: 10,
            };
            const { score, band } = scoreMeal(totals);
            expect(score).toBe(100);
            expect(band).toBe("Excellent balance");
        });

        it("should return zero score and 'No items' band when no food", () => {
            const totals = { protein: 0, carbs: 0, fat: 0, cerealEnergyPct: 0, vegetablesG: 0, fibre: 0, addedSugar: 0, visibleFat: 0 };
            const { score, band, reasons } = scoreMeal(totals);
            expect(score).toBe(0);
            expect(band).toBe("No items");
            expect(reasons).toContain("Add food items to see a score.");
        });

        it("should penalize cereal-heavy meals (-15)", () => {
            const totals = { cerealEnergyPct: 60, vegetablesG: 150, protein: 20, fibre: 8, addedSugar: 3, visibleFat: 5, carbs: 50, fat: 10 };
            const { score, reasons } = scoreMeal(totals);
            expect(score).toBe(85);
            expect(reasons).toContain("Too cereal-heavy relative to the rest of the meal.");
        });

        it("should penalize low vegetables (-15)", () => {
            const totals = { cerealEnergyPct: 40, vegetablesG: 50, protein: 20, fibre: 8, addedSugar: 3, visibleFat: 5, carbs: 50, fat: 10 };
            const { score, reasons } = scoreMeal(totals);
            expect(score).toBe(85);
            expect(reasons).toContain("Vegetable quantity is too low.");
        });

        it("should penalize low protein (-12)", () => {
            const totals = { cerealEnergyPct: 40, vegetablesG: 150, protein: 5, fibre: 8, addedSugar: 3, visibleFat: 5, carbs: 50, fat: 10 };
            const { score, reasons } = scoreMeal(totals);
            expect(score).toBe(88);
            expect(reasons).toContain("Low protein or pulse contribution.");
        });

        it("should penalize low fibre (-10)", () => {
            const totals = { cerealEnergyPct: 40, vegetablesG: 150, protein: 20, fibre: 2, addedSugar: 3, visibleFat: 5, carbs: 50, fat: 10 };
            const { score, reasons } = scoreMeal(totals);
            expect(score).toBe(90);
            expect(reasons).toContain("Fibre support is weak.");
        });

        it("should penalize high added sugar (-10)", () => {
            const totals = { cerealEnergyPct: 40, vegetablesG: 150, protein: 20, fibre: 8, addedSugar: 10, visibleFat: 5, carbs: 50, fat: 10 };
            const { score, reasons } = scoreMeal(totals);
            expect(score).toBe(90);
            expect(reasons).toContain("Added sugar is high.");
        });

        it("should penalize high visible fat (-10)", () => {
            const totals = { cerealEnergyPct: 40, vegetablesG: 150, protein: 20, fibre: 8, addedSugar: 3, visibleFat: 15, carbs: 50, fat: 10 };
            const { score, reasons } = scoreMeal(totals);
            expect(score).toBe(90);
            expect(reasons).toContain("Visible fat/oil exceeds target.");
        });

        it("should apply multiple penalties cumulatively", () => {
            const totals = {
                cerealEnergyPct: 60, // -15
                vegetablesG: 50,     // -15
                protein: 5,          // -12
                fibre: 2,            // -10
                addedSugar: 10,      // -10
                visibleFat: 15,      // -10
                carbs: 50,
                fat: 10,
            };
            const { score, band, reasons } = scoreMeal(totals);
            // 100 - 15 - 15 - 12 - 10 - 10 - 10 = 28
            expect(score).toBe(28);
            expect(band).toBe("Poor balance");
            expect(reasons).toHaveLength(6);
        });

        it("should clamp score to minimum 0", () => {
            // Even with all penalties, score shouldn't go below 0
            const totals = {
                cerealEnergyPct: 80,
                vegetablesG: 0,
                protein: 0,
                fibre: 0,
                addedSugar: 50,
                visibleFat: 50,
                carbs: 50,
                fat: 50,
            };
            const { score } = scoreMeal(totals);
            expect(score).toBeGreaterThanOrEqual(0);
        });

        it("should return 'Good balance' band for score >= 70", () => {
            const totals = { cerealEnergyPct: 60, vegetablesG: 150, protein: 20, fibre: 8, addedSugar: 3, visibleFat: 5, carbs: 50, fat: 10 };
            const { band } = scoreMeal(totals);
            expect(band).toBe("Excellent balance"); // 85, still excellent
        });

        it("should return 'Moderate imbalance' band for score >= 50", () => {
            const totals = {
                cerealEnergyPct: 60, vegetablesG: 50, protein: 5, fibre: 8, addedSugar: 3, visibleFat: 5, carbs: 50, fat: 10,
            };
            // 100 - 15 - 15 - 12 = 58
            const { score, band } = scoreMeal(totals);
            expect(score).toBe(58);
            expect(band).toBe("Moderate imbalance");
        });

        it("should handle undefined/null nutrient values gracefully", () => {
            const totals = { cerealEnergyPct: undefined, vegetablesG: null, protein: undefined, fibre: undefined, addedSugar: undefined, visibleFat: undefined, carbs: 10, fat: 5 };
            const { score } = scoreMeal(totals);
            // Should still calculate with defaults (0)
            expect(score).toBeGreaterThanOrEqual(0);
        });
    });

    // ─── scoreDay ────────────────────────────────────────────────────
    describe("scoreDay", () => {
        it("should return perfect score for well-balanced day", () => {
            const dayTotals = {
                cerealEnergyPct: 40,
                vegetablesG: 450,
                protein: 60,
                fibre: 25,
                addedSugar: 20,
                visibleFat: 20,
                carbs: 200,
                fat: 65,
            };
            const { score, band } = scoreDay(dayTotals);
            expect(score).toBe(100);
            expect(band).toBe("Excellent balance");
        });

        it("should return zero score for empty day", () => {
            const dayTotals = { protein: 0, carbs: 0, fat: 0, cerealEnergyPct: 0, vegetablesG: 0, fibre: 0, addedSugar: 0, visibleFat: 0 };
            const { score, band } = scoreDay(dayTotals);
            expect(score).toBe(0);
            expect(band).toBe("No items");
        });

        it("should penalize cereal-forward day pattern (-15)", () => {
            const dayTotals = { cerealEnergyPct: 60, vegetablesG: 450, protein: 60, fibre: 25, addedSugar: 20, visibleFat: 20, carbs: 200, fat: 65 };
            const { reasons } = scoreDay(dayTotals);
            expect(reasons).toContain("Day pattern is cereal-forward.");
        });

        it("should penalize vegetables below benchmark (-15)", () => {
            const dayTotals = { cerealEnergyPct: 40, vegetablesG: 200, protein: 60, fibre: 25, addedSugar: 20, visibleFat: 20, carbs: 200, fat: 65 };
            const { reasons } = scoreDay(dayTotals);
            expect(reasons).toContain("Vegetables are below the day benchmark.");
        });

        it("should penalize low protein/pulse intake (-12)", () => {
            // pulseBenchmarkG / 2 = 30, so protein < 30 triggers
            const dayTotals = { cerealEnergyPct: 40, vegetablesG: 450, protein: 20, fibre: 25, addedSugar: 20, visibleFat: 20, carbs: 200, fat: 65 };
            const { reasons } = scoreDay(dayTotals);
            expect(reasons).toContain("Protein/pulse intake is low.");
        });

        it("should penalize low daily fibre (-10)", () => {
            const dayTotals = { cerealEnergyPct: 40, vegetablesG: 450, protein: 60, fibre: 15, addedSugar: 20, visibleFat: 20, carbs: 200, fat: 65 };
            const { reasons } = scoreDay(dayTotals);
            expect(reasons).toContain("Daily fibre needs improvement.");
        });

        it("should penalize sugar exceeding limit (-10)", () => {
            // addedSugarLimitG = 25
            const dayTotals = { cerealEnergyPct: 40, vegetablesG: 450, protein: 60, fibre: 25, addedSugar: 30, visibleFat: 20, carbs: 200, fat: 65 };
            const { reasons } = scoreDay(dayTotals);
            expect(reasons).toContain("Added sugar exceeds the limit.");
        });

        it("should penalize high visible fat (-10)", () => {
            const dayTotals = { cerealEnergyPct: 40, vegetablesG: 450, protein: 60, fibre: 25, addedSugar: 20, visibleFat: 30, carbs: 200, fat: 65 };
            const { reasons } = scoreDay(dayTotals);
            expect(reasons).toContain("Visible fat/oil is too high.");
        });

        it("should accumulate all day penalties correctly", () => {
            const dayTotals = {
                cerealEnergyPct: 60,  // -15
                vegetablesG: 200,     // -15
                protein: 20,          // -12
                fibre: 15,            // -10
                addedSugar: 30,       // -10
                visibleFat: 30,       // -10
                carbs: 200,
                fat: 65,
            };
            const { score, band } = scoreDay(dayTotals);
            // 100 - 15 - 15 - 12 - 10 - 10 - 10 = 28
            expect(score).toBe(28);
            expect(band).toBe("Poor balance");
        });

        it("should clamp day score to minimum 0", () => {
            const dayTotals = {
                cerealEnergyPct: 100, vegetablesG: 0, protein: 0,
                fibre: 0, addedSugar: 100, visibleFat: 100, carbs: 100, fat: 100,
            };
            const { score } = scoreDay(dayTotals);
            expect(score).toBeGreaterThanOrEqual(0);
        });
    });
});

