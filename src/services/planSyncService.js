import { supabase } from "../lib/supabaseClient";
import { validateResponse, UserPlanArraySchema } from "../utils/schemas";
import { withRetry } from "../utils/withRetry";

// ─── Plan Sync Service ──────────────────────────────────────────────────────
// CRUD operations for user_plans table in Supabase.
// Each plan: { id, user_id, name, meals (JSONB), guidelines, created_at, updated_at }

/**
 * Fetch all plans for the authenticated user.
 * @param {string} userId
 * @returns {Promise<Array>} array of plan objects
 */
export async function fetchUserPlans(userId) {
    return withRetry(
        async () => {
            const { data, error } = await supabase
                .from("user_plans")
                .select("id, user_id, name, meals, guidelines, created_at, updated_at")
                .eq("user_id", userId)
                .order("created_at", { ascending: true });

            if (error) throw new Error(`Failed to fetch user plans: ${error.message}`);
            return validateResponse(UserPlanArraySchema, data || [], "fetchUserPlans");
        },
        { context: "fetchUserPlans" }
    );
}

/**
 * Upsert a single plan (insert or update by id).
 * @param {string} userId
 * @param {object} plan - { id, name, meals, guidelines }
 * @returns {Promise<object>} the upserted plan row
 */
export async function upsertPlan(userId, plan) {
    return withRetry(
        async () => {
            const row = {
                id: plan.id,
                user_id: userId,
                name: plan.name,
                meals: plan.meals,
                guidelines: plan.guidelines || "",
            };

            const { data, error } = await supabase
                .from("user_plans")
                .upsert(row, { onConflict: "id" })
                .select()
                .single();

            if (error) throw new Error(`Failed to save plan: ${error.message}`);
            return data;
        },
        { context: "upsertPlan" }
    );
}

/**
 * Upsert multiple plans in a batch.
 * @param {string} userId
 * @param {Array} plans - array of { id, name, meals, guidelines }
 * @returns {Promise<Array>} the upserted plan rows
 */
export async function upsertPlans(userId, plans) {
    if (!plans.length) return [];

    return withRetry(
        async () => {
            const rows = plans.map((plan) => ({
                id: plan.id,
                user_id: userId,
                name: plan.name,
                meals: plan.meals,
                guidelines: plan.guidelines || "",
            }));

            const { data, error } = await supabase
                .from("user_plans")
                .upsert(rows, { onConflict: "id" })
                .select();

            if (error) throw new Error(`Failed to batch save plans: ${error.message}`);
            return data || [];
        },
        { context: "upsertPlans" }
    );
}

/**
 * Delete a plan by id.
 * @param {string} userId
 * @param {string} planId
 */
export async function deletePlan(userId, planId) {
    return withRetry(
        async () => {
            const { error } = await supabase
                .from("user_plans")
                .delete()
                .eq("id", planId)
                .eq("user_id", userId);

            if (error) throw new Error(`Failed to delete plan: ${error.message}`);
        },
        { context: "deletePlan" }
    );
}
