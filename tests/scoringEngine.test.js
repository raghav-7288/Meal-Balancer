import { describe, it, expect } from "vitest";
import { scoreMeal, scoreDay } from "../src/engines/scoringEngine";

describe("scoreMeal", () => {
    it("returns zero score with no food", () => {
        const result = scoreMeal({
            cerealEnergyPct: 0,
            vegetablesG: 0,
            protein: 0,
            fibre: 0,
            addedSugar: 0,
            visibleFat: 0,
            carbs: 0,
            fat: 0,
        });
        expect(result.score).toBe(0);
        expect(result.band).toBe("No items");
    });

    it("returns excellent for a well-balanced meal", () => {
        const result = scoreMeal({
            cerealEnergyPct: 40,
            vegetablesG: 150,
            protein: 20,
            fibre: 8,
            addedSugar: 0,
            visibleFat: 3,
            carbs: 30,
            fat: 5,
        });
        expect(result.score).toBeGreaterThanOrEqual(85);
        expect(result.band).toBe("Excellent balance");
        expect(result.reasons).toHaveLength(0);
    });

    it("penalizes cereal-heavy meals", () => {
        const result = scoreMeal({
            cerealEnergyPct: 70,
            vegetablesG: 150,
            protein: 20,
            fibre: 8,
            addedSugar: 0,
            visibleFat: 3,
            carbs: 50,
            fat: 5,
        });
        expect(result.score).toBeLessThan(100);
        expect(result.reasons).toContain("Too cereal-heavy relative to the rest of the meal.");
    });

    it("penalizes low vegetables", () => {
        const result = scoreMeal({
            cerealEnergyPct: 40,
            vegetablesG: 30,
            protein: 20,
            fibre: 8,
            addedSugar: 0,
            visibleFat: 3,
            carbs: 30,
            fat: 5,
        });
        expect(result.reasons).toContain("Vegetable quantity is too low.");
    });

    it("penalizes low protein", () => {
        const result = scoreMeal({
            cerealEnergyPct: 40,
            vegetablesG: 150,
            protein: 5,
            fibre: 8,
            addedSugar: 0,
            visibleFat: 3,
            carbs: 30,
            fat: 5,
        });
        expect(result.reasons).toContain("Low protein or pulse contribution.");
    });

    it("penalizes high sugar", () => {
        const result = scoreMeal({
            cerealEnergyPct: 40,
            vegetablesG: 150,
            protein: 20,
            fibre: 8,
            addedSugar: 10,
            visibleFat: 3,
            carbs: 30,
            fat: 5,
        });
        expect(result.reasons).toContain("Added sugar is high.");
    });

    it("score is clamped between 0 and 100", () => {
        const result = scoreMeal({
            cerealEnergyPct: 90,
            vegetablesG: 0,
            protein: 0,
            fibre: 0,
            addedSugar: 50,
            visibleFat: 50,
            carbs: 10,
            fat: 10,
        });
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
    });
});

describe("scoreDay", () => {
    it("returns zero score with no food", () => {
        const result = scoreDay({
            cerealEnergyPct: 0,
            vegetablesG: 0,
            protein: 0,
            fibre: 0,
            addedSugar: 0,
            visibleFat: 0,
            carbs: 0,
            fat: 0,
        });
        expect(result.score).toBe(0);
        expect(result.band).toBe("No items");
    });

    it("returns excellent for a well-balanced day", () => {
        const result = scoreDay({
            cerealEnergyPct: 40,
            vegetablesG: 450,
            protein: 60,
            fibre: 30,
            addedSugar: 10,
            visibleFat: 15,
            carbs: 200,
            fat: 50,
        });
        expect(result.score).toBeGreaterThanOrEqual(85);
        expect(result.band).toBe("Excellent balance");
    });

    it("penalizes low vegetable intake for the day", () => {
        const result = scoreDay({
            cerealEnergyPct: 40,
            vegetablesG: 100,
            protein: 60,
            fibre: 30,
            addedSugar: 10,
            visibleFat: 15,
            carbs: 200,
            fat: 50,
        });
        expect(result.reasons).toContain("Vegetables are below the day benchmark.");
    });

    it("penalizes excessive sugar for the day", () => {
        const result = scoreDay({
            cerealEnergyPct: 40,
            vegetablesG: 450,
            protein: 60,
            fibre: 30,
            addedSugar: 50,
            visibleFat: 15,
            carbs: 200,
            fat: 50,
        });
        expect(result.reasons).toContain("Added sugar exceeds the limit.");
    });
});

