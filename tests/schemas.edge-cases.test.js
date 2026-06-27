/**
 * Edge-case tests for validateResponse and Zod schemas.
 * Covers the null/undefined paths and schema mismatch graceful degradation.
 */
import { describe, it, expect, vi } from "vitest";
import {
    validateResponse,
    FoodItemArraySchema,
    FoodNutrientArraySchema,
    UserPlanArraySchema,
    DailyHealthRowSchema,
    MealHistoryRowSchema,
} from "../src/utils/schemas";

describe("validateResponse", () => {
    it("returns null when data is null", () => {
        const result = validateResponse(FoodItemArraySchema, null, "test-null");
        expect(result).toBeNull();
    });

    it("returns undefined when data is undefined", () => {
        const result = validateResponse(FoodItemArraySchema, undefined, "test-undefined");
        expect(result).toBeUndefined();
    });

    it("returns parsed data when schema matches", () => {
        const data = [{ food_id: 1, food_code: "A001", food_name: "Rice", major_group_id: 2 }];
        const result = validateResponse(FoodItemArraySchema, data, "test-valid");
        expect(result).toEqual(data);
    });

    it("returns raw data (graceful degradation) when schema doesn't match", () => {
        const badData = [{ wrong_field: "oops" }];
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const result = validateResponse(FoodItemArraySchema, badData, "test-mismatch");
        // Should return the raw data, not throw
        expect(result).toEqual(badData);
        warnSpy.mockRestore();
    });

    it("transforms string values to numbers in FoodNutrientArraySchema", () => {
        const data = [
            {
                value: "42.5",
                nutrient_definitions: {
                    nutrient_name: "Protein",
                    nutrient_code: "PROT",
                    unit: "g",
                },
            },
        ];
        const result = validateResponse(FoodNutrientArraySchema, data, "test-transform");
        expect(result[0].value).toBe(42.5);
        expect(typeof result[0].value).toBe("number");
    });

    it("handles null nutrient_definitions in FoodNutrientArraySchema", () => {
        const data = [{ value: 10, nutrient_definitions: null }];
        const result = validateResponse(FoodNutrientArraySchema, data, "test-null-def");
        expect(result[0].nutrient_definitions).toBeNull();
    });

    it("handles nullable meals in UserPlanArraySchema", () => {
        const data = [{
            id: "plan-1",
            user_id: "user-1",
            name: "Test Plan",
            meals: null,
            guidelines: null,
            created_at: null,
            updated_at: null,
        }];
        const result = validateResponse(UserPlanArraySchema, data, "test-null-meals");
        // meals with .nullable().default({}) — null is a valid value, default only applies to undefined
        expect(result[0].meals).toBeNull();
    });

    it("validates DailyHealthRowSchema with optional fields", () => {
        const data = {
            id: "123",
            user_id: "user-1",
            date: "2026-06-27",
            water_glasses: null,
            water_target: null,
            steps: null,
            steps_target: null,
        };
        const result = validateResponse(DailyHealthRowSchema, data, "test-daily");
        expect(result.date).toBe("2026-06-27");
    });

    it("validates MealHistoryRowSchema with all optional fields null", () => {
        const data = {
            id: "entry-1",
            user_id: "user-1",
            date: "2026-06-27",
            timestamp: null,
            plan_name: null,
            score: null,
            band: null,
            kcal: null,
            protein: null,
            carbs: null,
            fat: null,
            fibre: null,
            vegetables_g: null,
            visible_fat: null,
        };
        const result = validateResponse(MealHistoryRowSchema, data, "test-history");
        expect(result.id).toBe("entry-1");
    });
});


