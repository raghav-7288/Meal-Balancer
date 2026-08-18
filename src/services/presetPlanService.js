import { supabase } from "../lib/supabaseClient";
import { cachedFetch, invalidateCache } from "../utils/queryCache";

// ─── Preset Plan Service ────────────────────────────────────────────────────
// Fetches system-wide preset plans from the preset_plans table.
// These are read-only templates available to all users.

/**
 * Fetch all active preset plans from the database.
 * Results are cached to avoid redundant network calls.
 * @returns {Promise<Array>} array of preset plan objects
 */
export async function fetchPresetPlans() {
    return cachedFetch("preset_plans", async () => {
        const { data, error } = await supabase
            .from("preset_plans")
            .select("id, name, meals, meal_times, guidelines, display_order, created_at")
            .eq("is_active", true)
            .order("display_order", { ascending: true });

        if (error) throw new Error(`Failed to fetch preset plans: ${error.message}`);
        return (data || []).map((plan) => ({
            id: plan.id,
            name: plan.name,
            meals: plan.meals || {},
            mealTimes: plan.meal_times || {},
            guidelines: plan.guidelines || "",
            isPreset: true,
        }));
    });
}

// ─── Admin Functions ────────────────────────────────────────────────────────

/**
 * Fetch ALL preset plans (including inactive) for admin management.
 * @returns {Promise<Array>} array of full preset plan objects
 */
export async function fetchAllPresetPlans() {
    const { data, error } = await supabase
        .from("preset_plans")
        .select("id, name, meals, meal_times, guidelines, display_order, is_active, created_at, updated_at")
        .order("display_order", { ascending: true });

    if (error) throw new Error(`Failed to fetch preset plans: ${error.message}`);
    return (data || []).map((plan) => ({
        id: plan.id,
        name: plan.name,
        meals: plan.meals || {},
        mealTimes: plan.meal_times || {},
        guidelines: plan.guidelines || "",
        displayOrder: plan.display_order,
        isActive: plan.is_active,
        createdAt: plan.created_at,
        updatedAt: plan.updated_at,
    }));
}

/**
 * Insert or update a preset plan.
 * @param {Object} plan - Plan object with id (for update) or without (for insert)
 * @returns {Promise<Object>} the upserted plan
 */
export async function upsertPresetPlan(plan) {
    const row = {
        name: plan.name,
        meals: plan.meals || {},
        meal_times: plan.mealTimes || {},
        guidelines: plan.guidelines || "",
        display_order: plan.displayOrder ?? 0,
        is_active: plan.isActive !== false,
    };

    if (plan.id) {
        row.id = plan.id;
    }

    const { data, error } = await supabase
        .from("preset_plans")
        .upsert(row, { onConflict: "id" })
        .select("id, name, meals, meal_times, guidelines, display_order, is_active, created_at, updated_at")
        .single();

    if (error) throw new Error(`Failed to save preset plan: ${error.message}`);

    // Invalidate cache so dashboard picks up changes
    invalidateCache("preset_plans");

    return {
        id: data.id,
        name: data.name,
        meals: data.meals || {},
        mealTimes: data.meal_times || {},
        guidelines: data.guidelines || "",
        displayOrder: data.display_order,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    };
}

/**
 * Delete a preset plan by ID.
 * @param {string} id - UUID of the plan to delete
 */
export async function deletePresetPlan(id) {
    const { error } = await supabase.from("preset_plans").delete().eq("id", id);

    if (error) throw new Error(`Failed to delete preset plan: ${error.message}`);

    // Invalidate cache
    invalidateCache("preset_plans");
}
