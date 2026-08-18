import { z } from "zod";

// ─── Zod Schemas for Supabase Response Validation (#71) ─────────────────────
// Validates data at service layer boundaries to prevent silent corruption.

// ── Food Search ──
export const FoodItemSchema = z.object({
    food_id: z.number(),
    food_code: z.string(),
    food_name: z.string(),
    major_group_id: z.number().nullable().optional(),
});

export const FoodItemArraySchema = z.array(FoodItemSchema);

// ── Food Nutrient Values ──
export const FoodNutrientRowSchema = z.object({
    value: z.union([z.number(), z.string()]).transform(Number),
    nutrient_definitions: z
        .object({
            nutrient_name: z.string(),
            nutrient_code: z.string().nullable().optional(),
            unit: z.string().nullable().optional(),
        })
        .nullable()
        .optional(),
});

export const FoodNutrientArraySchema = z.array(FoodNutrientRowSchema);

// ── User Plans ──
export const UserPlanSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    name: z.string(),
    meals: z
        .record(z.string(), z.array(z.object({}).passthrough()))
        .nullable()
        .default({}),
    meal_times: z
        .record(
            z.string(),
            z.union([
                z.string(),
                z
                    .object({ start: z.string().optional(), end: z.string().optional() })
                    .passthrough(),
            ])
        )
        .nullable()
        .optional(),
    guidelines: z.string().nullable().optional(),
    created_at: z.string().nullable().optional(),
    updated_at: z.string().nullable().optional(),
});

export const UserPlanArraySchema = z.array(UserPlanSchema);

// ── Daily Health Tracking ──
export const DailyHealthRowSchema = z.object({
    id: z.union([z.string(), z.number()]).optional(),
    user_id: z.string(),
    date: z.string(),
    water_glasses: z.number().nullable().optional(),
    water_target: z.number().nullable().optional(),
    steps: z.number().nullable().optional(),
    steps_target: z.number().nullable().optional(),
});

export const DailyHealthArraySchema = z.array(DailyHealthRowSchema);

// ── Meal History ──
export const MealHistoryRowSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    date: z.string(),
    timestamp: z.string().nullable().optional(),
    plan_name: z.string().nullable().optional(),
    score: z.number().nullable().optional(),
    band: z.string().nullable().optional(),
    kcal: z.number().nullable().optional(),
    protein: z.number().nullable().optional(),
    carbs: z.number().nullable().optional(),
    fat: z.number().nullable().optional(),
    fibre: z.number().nullable().optional(),
    vegetables_g: z.number().nullable().optional(),
    visible_fat: z.number().nullable().optional(),
});

export const MealHistoryArraySchema = z.array(MealHistoryRowSchema);

// ── Validation Helper ──
/**
 * Validate data against a Zod schema. Returns parsed data on success.
 * On failure, logs a warning and returns the raw data (graceful degradation).
 * @param {z.ZodType} schema
 * @param {unknown} data
 * @param {string} context - Description for error logging
 * @returns {*} Parsed data or raw data on failure
 */
export function validateResponse(schema, data, context = "unknown") {
    if (data == null) {
        if (import.meta.env.DEV) {
            console.warn(`[Schema Validation] ${context}: received null/undefined data`);
        }
        return data;
    }
    const result = schema.safeParse(data);
    if (!result.success) {
        if (import.meta.env.DEV) {
            console.warn(
                `[Schema Validation] ${context}: response shape mismatch`,
                result.error.issues.slice(0, 3)
            );
        }
        return data; // Graceful degradation — don't break the app
    }
    return result.data;
}
