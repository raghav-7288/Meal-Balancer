import { supabase } from "../lib/supabaseClient";
import { cachedFetch } from "../utils/queryCache";

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
            .select("id, name, meals, guidelines, display_order, created_at")
            .eq("is_active", true)
            .order("display_order", { ascending: true });

        if (error) throw new Error(`Failed to fetch preset plans: ${error.message}`);
        return (data || []).map((plan) => ({
            id: plan.id,
            name: plan.name,
            meals: plan.meals || {},
            guidelines: plan.guidelines || "",
            isPreset: true,
        }));
    });
}

