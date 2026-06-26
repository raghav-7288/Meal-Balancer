import { supabase } from "../lib/supabaseClient";
import { validateResponse, MealHistoryArraySchema } from "../utils/schemas";
import { withRetry } from "../utils/withRetry";

// ─── Meal History Sync Service ──────────────────────────────────────────────
// CRUD operations for meal_history table in Supabase.

/**
 * Fetch all meal history entries for the authenticated user.
 * @param {string} userId
 * @returns {Promise<Array>} array of meal history entries
 */
export async function fetchMealHistory(userId) {
    return withRetry(async () => {
        const { data, error } = await supabase
            .from("meal_history")
            .select("*")
            .eq("user_id", userId)
            .order("date", { ascending: false });

        if (error) throw new Error(`Failed to fetch meal history: ${error.message}`);
        return validateResponse(MealHistoryArraySchema, data || [], "fetchMealHistory");
    }, { context: "fetchMealHistory" });
}

/**
 * Upsert a meal history entry (insert or update by user_id + date).
 * @param {string} userId
 * @param {object} entry - { id, date, timestamp, planName, score, band, kcal, protein, carbs, fat, fibre, vegetablesG, visibleFat }
 * @returns {Promise<object>} the upserted row
 */
export async function upsertMealHistoryEntry(userId, entry) {
    return withRetry(async () => {
        const row = {
            id: entry.id,
            user_id: userId,
            date: entry.date,
            timestamp: entry.timestamp,
            plan_name: entry.planName,
            score: entry.score,
            band: entry.band,
            kcal: entry.kcal,
            protein: entry.protein,
            carbs: entry.carbs,
            fat: entry.fat,
            fibre: entry.fibre,
            vegetables_g: entry.vegetablesG,
            visible_fat: entry.visibleFat,
        };

        const { data, error } = await supabase
            .from("meal_history")
            .upsert(row, { onConflict: "user_id,date" })
            .select()
            .single();

        if (error) throw new Error(`Failed to save meal history entry: ${error.message}`);
        return data;
    }, { context: "upsertMealHistoryEntry" });
}

/**
 * Delete a meal history entry by id.
 * @param {string} userId
 * @param {string} entryId
 */
export async function deleteMealHistoryEntry(userId, entryId) {
    return withRetry(async () => {
        const { error } = await supabase
            .from("meal_history")
            .delete()
            .eq("id", entryId)
            .eq("user_id", userId);

        if (error) throw new Error(`Failed to delete meal history entry: ${error.message}`);
    }, { context: "deleteMealHistoryEntry" });
}

/**
 * Delete all meal history entries for a user.
 * @param {string} userId
 */
export async function clearMealHistory(userId) {
    return withRetry(async () => {
        const { error } = await supabase
            .from("meal_history")
            .delete()
            .eq("user_id", userId);

        if (error) throw new Error(`Failed to clear meal history: ${error.message}`);
    }, { context: "clearMealHistory" });
}

/**
 * Convert DB row to client-side entry format.
 * @param {object} row - DB row
 * @returns {object} client-side entry
 */
export function dbRowToEntry(row) {
    return {
        id: row.id,
        date: row.date,
        timestamp: row.timestamp,
        planName: row.plan_name,
        score: row.score,
        band: row.band,
        kcal: row.kcal,
        protein: row.protein,
        carbs: row.carbs,
        fat: row.fat,
        fibre: row.fibre,
        vegetablesG: row.vegetables_g,
        visibleFat: row.visible_fat,
    };
}

