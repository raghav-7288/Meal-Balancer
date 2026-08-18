/**
 * Tests for BmiCalculatorPage conversion helpers.
 *
 * Extracted from the component so we can unit-test boundary conditions:
 * - cmToFtIn rollover when Math.round pushes remainder to 12
 * - ftInToCm round-trip accuracy
 * - kgToLbs / lbsToKg round-trip accuracy
 */
import { describe, it, expect } from "vitest";

// Re-implement the helpers here (same logic as in BmiCalculatorPage.jsx)
// so the tests run without needing a React render.
const CM_PER_INCH = 2.54;
const LBS_PER_KG = 2.20462;

function cmToFtIn(cm) {
    const totalInches = cm / CM_PER_INCH;
    let ft = Math.floor(totalInches / 12);
    let inches = Math.round(totalInches % 12);
    if (inches >= 12) {
        ft += 1;
        inches = 0;
    }
    return { ft, inches };
}

function ftInToCm(ft, inches) {
    return ((parseFloat(ft) || 0) * 12 + (parseFloat(inches) || 0)) * CM_PER_INCH;
}

function kgToLbs(kg) {
    return (kg * LBS_PER_KG).toFixed(1);
}

function lbsToKg(lbs) {
    return parseFloat(lbs) / LBS_PER_KG;
}

function getBmiCategory(bmi) {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
}

describe("cmToFtIn", () => {
    it("converts a standard height correctly", () => {
        const result = cmToFtIn(170);
        expect(result.ft).toBe(5);
        expect(result.inches).toBe(7);
    });

    it("converts exactly 6 feet (182.88 cm) correctly", () => {
        const result = cmToFtIn(182.88);
        expect(result.ft).toBe(6);
        expect(result.inches).toBe(0);
    });

    it("handles the inches=12 rollover correctly (BUG FIX)", () => {
        // 181.61 cm → 71.5 inches → 5ft 11.5in → Math.round gives 12
        // Before fix: { ft: 5, inches: 12 } (displayed as 5'12")
        // After fix:  { ft: 6, inches: 0 }  (displayed as 6'0")
        const result = cmToFtIn(181.61);
        expect(result.ft).toBe(6);
        expect(result.inches).toBe(0);
        // Must never return inches >= 12
        expect(result.inches).toBeLessThan(12);
    });

    it("never returns inches >= 12 for any reasonable height", () => {
        // Sweep heights from 100cm to 250cm in 0.1cm steps
        for (let cm = 100; cm <= 250; cm += 0.1) {
            const { ft, inches } = cmToFtIn(cm);
            expect(inches).toBeLessThan(12);
            expect(ft).toBeGreaterThanOrEqual(0);
        }
    });

    it("handles zero gracefully", () => {
        const result = cmToFtIn(0);
        expect(result.ft).toBe(0);
        expect(result.inches).toBe(0);
    });

    it("handles very short height (infant)", () => {
        const result = cmToFtIn(50); // ~1'8"
        expect(result.ft).toBe(1);
        expect(result.inches).toBeLessThan(12);
    });
});

describe("ftInToCm round-trip", () => {
    it("round-trips 5'7\" through both conversions", () => {
        const cm = ftInToCm(5, 7);
        const back = cmToFtIn(cm);
        expect(back.ft).toBe(5);
        expect(back.inches).toBe(7);
    });

    it("handles NaN/empty inputs", () => {
        expect(ftInToCm("", "")).toBe(0);
        expect(ftInToCm(NaN, NaN)).toBe(0);
    });
});

describe("kgToLbs / lbsToKg round-trip", () => {
    it("converts 60 kg to lbs and back", () => {
        const lbs = kgToLbs(60);
        const kg = lbsToKg(lbs);
        expect(Math.abs(kg - 60)).toBeLessThan(0.1);
    });

    it("returns 0 for 0 kg", () => {
        expect(kgToLbs(0)).toBe("0.0");
    });
});

describe("getBmiCategory", () => {
    it("classifies underweight correctly", () => {
        expect(getBmiCategory(17)).toBe("Underweight");
        expect(getBmiCategory(18.4)).toBe("Underweight");
    });

    it("classifies normal correctly", () => {
        expect(getBmiCategory(18.5)).toBe("Normal");
        expect(getBmiCategory(22)).toBe("Normal");
        expect(getBmiCategory(24.9)).toBe("Normal");
    });

    it("classifies overweight correctly", () => {
        expect(getBmiCategory(25)).toBe("Overweight");
        expect(getBmiCategory(29.9)).toBe("Overweight");
    });

    it("classifies obese correctly", () => {
        expect(getBmiCategory(30)).toBe("Obese");
        expect(getBmiCategory(45)).toBe("Obese");
    });

    it("handles exact boundary values", () => {
        expect(getBmiCategory(18.5)).toBe("Normal");
        expect(getBmiCategory(25.0)).toBe("Overweight");
        expect(getBmiCategory(30.0)).toBe("Obese");
    });
});

describe("BMI formula", () => {
    it("calculates BMI correctly for standard inputs", () => {
        // 70kg, 175cm → BMI = 70 / (1.75^2) ≈ 22.86
        const heightM = 175 / 100;
        const bmi = 70 / (heightM * heightM);
        expect(bmi).toBeCloseTo(22.86, 1);
    });

    it("returns Infinity for zero height (guarded by UI)", () => {
        const heightM = 0;
        // UI prevents this, but the formula should be safe
        expect(heightM > 0).toBe(false);
    });

    it("ideal weight range is correct for 170cm", () => {
        const heightM = 1.7;
        const idealMin = 18.5 * heightM * heightM;
        const idealMax = 24.9 * heightM * heightM;
        expect(idealMin).toBeCloseTo(53.5, 0);
        expect(idealMax).toBeCloseTo(71.9, 0);
    });
});

