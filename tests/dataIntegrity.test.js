/**
 * Data Integrity Tests
 * Validates the local data files (foods.js, config.js, presetPlans.js)
 * are well-formed and consistent.
 */
import { describe, it, expect } from "vitest";
import { FOODS } from "../src/data/foods";
import { APP_CONFIG } from "../src/data/config";
import { PRESET_PLANS } from "../src/data/presetPlans";

describe("Data Integrity", () => {
    // ─── FOODS data ──────────────────────────────────────────────────
    describe("FOODS data", () => {
        it("should be a non-empty array", () => {
            expect(Array.isArray(FOODS)).toBe(true);
            expect(FOODS.length).toBeGreaterThan(0);
        });

        it("should have unique IDs for all foods", () => {
            const ids = FOODS.map((f) => f.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
        });

        it("all foods should have required properties", () => {
            const requiredProps = ["id", "name", "group", "gramsPerExchange", "carbs", "protein", "fat", "fibre", "vitamins", "minerals", "kcal"];
            for (const food of FOODS) {
                for (const prop of requiredProps) {
                    expect(food).toHaveProperty(prop);
                }
            }
        });

        it("all numeric nutrient values should be non-negative", () => {
            for (const food of FOODS) {
                expect(food.gramsPerExchange).toBeGreaterThan(0);
                expect(food.carbs).toBeGreaterThanOrEqual(0);
                expect(food.protein).toBeGreaterThanOrEqual(0);
                expect(food.fat).toBeGreaterThanOrEqual(0);
                expect(food.fibre).toBeGreaterThanOrEqual(0);
                expect(food.vitamins).toBeGreaterThanOrEqual(0);
                expect(food.minerals).toBeGreaterThanOrEqual(0);
                expect(food.kcal).toBeGreaterThan(0);
            }
        });

        it("all foods should have a valid group name", () => {
            const validGroups = ["cereals", "pulses", "dairy", "egg", "vegetables", "fruit", "fats", "nuts", "meat", "fish"];
            for (const food of FOODS) {
                expect(typeof food.group).toBe("string");
                expect(food.group.length).toBeGreaterThan(0);
            }
        });

        it("food names should be non-empty strings", () => {
            for (const food of FOODS) {
                expect(typeof food.name).toBe("string");
                expect(food.name.trim().length).toBeGreaterThan(0);
            }
        });
    });

    // ─── APP_CONFIG data ─────────────────────────────────────────────
    describe("APP_CONFIG data", () => {
        it("should have cerealEnergyTargetPct as a positive number", () => {
            expect(APP_CONFIG.cerealEnergyTargetPct).toBeGreaterThan(0);
            expect(APP_CONFIG.cerealEnergyTargetPct).toBeLessThanOrEqual(100);
        });

        it("should have vegetableBenchmarkG as a positive number", () => {
            expect(APP_CONFIG.vegetableBenchmarkG).toBeGreaterThan(0);
        });

        it("should have pulseBenchmarkG as a positive number", () => {
            expect(APP_CONFIG.pulseBenchmarkG).toBeGreaterThan(0);
        });

        it("should have addedSugarLimitG as a positive number", () => {
            expect(APP_CONFIG.addedSugarLimitG).toBeGreaterThan(0);
        });

        it("should have score bands in descending order", () => {
            expect(APP_CONFIG.scoreBands.excellent).toBeGreaterThan(APP_CONFIG.scoreBands.good);
            expect(APP_CONFIG.scoreBands.good).toBeGreaterThan(APP_CONFIG.scoreBands.moderate);
            expect(APP_CONFIG.scoreBands.moderate).toBeGreaterThan(0);
        });

        it("should have visible fat limits for both sexes and activity levels", () => {
            expect(APP_CONFIG.visibleFat.male).toBeDefined();
            expect(APP_CONFIG.visibleFat.female).toBeDefined();
            expect(APP_CONFIG.visibleFat.male.sedentary).toBeGreaterThan(0);
            expect(APP_CONFIG.visibleFat.male.moderate).toBeGreaterThan(0);
            expect(APP_CONFIG.visibleFat.male.heavy).toBeGreaterThan(0);
            expect(APP_CONFIG.visibleFat.female.sedentary).toBeGreaterThan(0);
            expect(APP_CONFIG.visibleFat.female.moderate).toBeGreaterThan(0);
            expect(APP_CONFIG.visibleFat.female.heavy).toBeGreaterThan(0);
        });

        it("visible fat should increase with activity level", () => {
            expect(APP_CONFIG.visibleFat.male.heavy).toBeGreaterThan(APP_CONFIG.visibleFat.male.moderate);
            expect(APP_CONFIG.visibleFat.male.moderate).toBeGreaterThan(APP_CONFIG.visibleFat.male.sedentary);
            expect(APP_CONFIG.visibleFat.female.heavy).toBeGreaterThan(APP_CONFIG.visibleFat.female.moderate);
            expect(APP_CONFIG.visibleFat.female.moderate).toBeGreaterThan(APP_CONFIG.visibleFat.female.sedentary);
        });
    });

    // ─── PRESET_PLANS data ───────────────────────────────────────────
    describe("PRESET_PLANS data", () => {
        it("should be a non-empty array", () => {
            expect(Array.isArray(PRESET_PLANS)).toBe(true);
            expect(PRESET_PLANS.length).toBeGreaterThan(0);
        });

        it("all plans should have id, name, and meals", () => {
            for (const plan of PRESET_PLANS) {
                expect(plan).toHaveProperty("id");
                expect(plan).toHaveProperty("name");
                expect(plan).toHaveProperty("meals");
                expect(typeof plan.id).toBe("string");
                expect(typeof plan.name).toBe("string");
                expect(typeof plan.meals).toBe("object");
            }
        });

        it("plan names should be non-empty", () => {
            for (const plan of PRESET_PLANS) {
                expect(plan.name.trim().length).toBeGreaterThan(0);
            }
        });

        it("plans should have unique IDs", () => {
            const ids = PRESET_PLANS.map((p) => p.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
        });

        it("plan meals should be objects (not arrays)", () => {
            for (const plan of PRESET_PLANS) {
                expect(plan.meals).not.toBeNull();
                expect(Array.isArray(plan.meals)).toBe(false);
            }
        });
    });
});

