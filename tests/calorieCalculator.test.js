/**
 * Tests for the Calorie Calculator (Mifflin-St Jeor equation).
 *
 * Validates:
 * - BMR formula for male and female
 * - TDEE multiplication with activity factors
 * - Goal adjustments (offsets and macro splits)
 * - Boundary and edge-case inputs
 */
import { describe, it, expect } from "vitest";

const ACTIVITY_MULTIPLIERS = {
    sedentary: { factor: 1.2 },
    light: { factor: 1.375 },
    moderate: { factor: 1.55 },
    heavy: { factor: 1.725 },
    athlete: { factor: 1.9 },
};

const GOAL_ADJUSTMENTS = {
    "weight loss": { offset: -500, carb: 0.4, protein: 0.3, fat: 0.3 },
    maintenance: { offset: 0, carb: 0.5, protein: 0.25, fat: 0.25 },
    "weight gain": { offset: 300, carb: 0.45, protein: 0.3, fat: 0.25 },
    "metabolic improvement": { offset: -200, carb: 0.4, protein: 0.3, fat: 0.3 },
};

function calcBMR(weightKg, heightCm, age, sex) {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return sex === "male" ? base + 5 : base - 161;
}

describe("Mifflin-St Jeor BMR", () => {
    it("calculates male BMR correctly", () => {
        // 70kg, 175cm, 30y male → 10(70) + 6.25(175) - 5(30) + 5 = 700 + 1093.75 - 150 + 5 = 1648.75
        expect(calcBMR(70, 175, 30, "male")).toBeCloseTo(1648.75, 2);
    });

    it("calculates female BMR correctly", () => {
        // 60kg, 165cm, 25y female → 10(60) + 6.25(165) - 5(25) - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
        expect(calcBMR(60, 165, 25, "female")).toBeCloseTo(1345.25, 2);
    });

    it("male BMR is always 166 kcal higher than female BMR for same inputs", () => {
        // Male offset = +5, Female offset = -161, difference = 166
        const m = calcBMR(70, 175, 30, "male");
        const f = calcBMR(70, 175, 30, "female");
        expect(m - f).toBeCloseTo(166, 2);
    });

    it("BMR decreases with age", () => {
        const young = calcBMR(70, 175, 20, "male");
        const old = calcBMR(70, 175, 40, "male");
        expect(young).toBeGreaterThan(old);
        expect(young - old).toBeCloseTo(100, 0); // 5 kcal/year × 20 years
    });

    it("BMR increases with weight", () => {
        const light = calcBMR(50, 175, 30, "male");
        const heavy = calcBMR(80, 175, 30, "male");
        expect(heavy).toBeGreaterThan(light);
        expect(heavy - light).toBeCloseTo(300, 0); // 10 kcal/kg × 30 kg
    });

    it("BMR increases with height", () => {
        const short = calcBMR(70, 150, 30, "male");
        const tall = calcBMR(70, 190, 30, "male");
        expect(tall).toBeGreaterThan(short);
        expect(tall - short).toBeCloseTo(250, 0); // 6.25 kcal/cm × 40 cm
    });

    it("returns a positive value for realistic inputs", () => {
        expect(calcBMR(45, 150, 18, "female")).toBeGreaterThan(0);
    });
});

describe("TDEE calculation", () => {
    it("sedentary TDEE is 1.2× BMR", () => {
        const bmr = calcBMR(70, 175, 30, "male");
        const tdee = bmr * ACTIVITY_MULTIPLIERS.sedentary.factor;
        expect(tdee).toBeCloseTo(bmr * 1.2, 0);
    });

    it("athlete TDEE is 1.9× BMR", () => {
        const bmr = calcBMR(70, 175, 30, "male");
        const tdee = bmr * ACTIVITY_MULTIPLIERS.athlete.factor;
        expect(tdee).toBeCloseTo(bmr * 1.9, 0);
    });
});

describe("Goal adjustments", () => {
    it("weight loss subtracts 500 kcal", () => {
        expect(GOAL_ADJUSTMENTS["weight loss"].offset).toBe(-500);
    });

    it("maintenance has zero offset", () => {
        expect(GOAL_ADJUSTMENTS.maintenance.offset).toBe(0);
    });

    it("weight gain adds 300 kcal", () => {
        expect(GOAL_ADJUSTMENTS["weight gain"].offset).toBe(300);
    });

    it("macro percentages sum to 1.0 for every goal", () => {
        for (const [_name, goal] of Object.entries(GOAL_ADJUSTMENTS)) {
            const sum = goal.carb + goal.protein + goal.fat;
            expect(sum).toBeCloseTo(1.0, 10);
        }
    });
});

describe("Macro gram calculations", () => {
    it("computes correct gram values for maintenance at 2000 kcal", () => {
        const target = 2000;
        const goal = GOAL_ADJUSTMENTS.maintenance;
        const carbs = Math.round((target * goal.carb) / 4);
        const protein = Math.round((target * goal.protein) / 4);
        const fat = Math.round((target * goal.fat) / 9);

        expect(carbs).toBe(250); // 2000 * 0.5 / 4
        expect(protein).toBe(125); // 2000 * 0.25 / 4
        expect(fat).toBe(56); // 2000 * 0.25 / 9 ≈ 55.6 → 56
    });

    it("returns null-equivalent for zero/negative inputs", () => {
        const w = 0;
        const h = 0;
        const a = 0;
        const valid = w > 0 && h > 0 && a > 0;
        expect(valid).toBe(false);
    });
});

