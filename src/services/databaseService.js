import { supabase } from "../lib/supabaseClient";
import { cachedFetch } from "../utils/queryCache";

// ─── Health Goals ───────────────────────────────────────────────────────────

export async function getHealthGoals() {
    return cachedFetch("health_goals", async () => {
        const { data, error } = await supabase
            .from("health_goals")
            .select("health_goal_id, goal_code, goal_name, description, is_active, display_order")
            .eq("is_active", true)
            .order("display_order");
        if (error) throw new Error(`Failed to fetch health goals: ${error.message}`);
        return data;
    });
}

export async function getUserHealthGoals(userId) {
    const { data, error } = await supabase
        .from("user_profile_health_goals")
        .select("user_id, health_goal_id, created_at")
        .eq("user_id", userId);
    if (error) throw new Error(`Failed to fetch user health goals: ${error.message}`);
    return data;
}

export async function saveUserHealthGoals(userId, selectedGoalIds) {
    const current = await getUserHealthGoals(userId);
    const currentIds = current.map((row) => row.health_goal_id);
    const toInsert = selectedGoalIds.filter((id) => !currentIds.includes(id));
    const toDelete = currentIds.filter((id) => !selectedGoalIds.includes(id));

    if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
            .from("user_profile_health_goals")
            .delete()
            .eq("user_id", userId)
            .in("health_goal_id", toDelete);
        if (deleteError) throw new Error(`Failed to remove health goals: ${deleteError.message}`);
    }

    if (toInsert.length > 0) {
        const rows = toInsert.map((goalId) => ({ user_id: userId, health_goal_id: goalId }));
        const { error: insertError } = await supabase
            .from("user_profile_health_goals")
            .insert(rows);
        if (insertError) throw new Error(`Failed to save health goals: ${insertError.message}`);
    }
}

// ─── Major Groups & Foods ───────────────────────────────────────────────────

export async function getMajorGroups() {
    return cachedFetch("major_groups", async () => {
        const { data, error } = await supabase
            .from("major_groups")
            .select("major_group_id, group_code, group_name")
            .order("group_code");
        if (error) throw new Error(`Failed to fetch major groups: ${error.message}`);
        return data;
    });
}

export async function getFoodsByGroup(groupId) {
    return cachedFetch(`foods_group_${groupId}`, async () => {
        const { data, error } = await supabase
            .from("food_items")
            .select("food_id, major_group_id, food_code, food_name")
            .eq("major_group_id", groupId)
            .order("food_name");
        if (error) throw new Error(`Failed to fetch foods for group ${groupId}: ${error.message}`);
        return data;
    });
}

export async function getAllNutrientGroups() {
    return cachedFetch("nutrient_groups", async () => {
        const { data, error } = await supabase
            .from("nutrient_groups")
            .select("nutrient_group_id, group_name, description, display_order")
            .order("display_order");
        if (error) throw new Error(`Failed to fetch nutrient groups: ${error.message}`);
        return data;
    });
}

export async function getNutrientDefinitions() {
    return cachedFetch("nutrient_definitions", async () => {
        const { data, error } = await supabase
            .from("nutrient_definitions")
            .select("nutrient_id, nutrient_group_id, nutrient_name, nutrient_code, unit")
            .order("nutrient_name");
        if (error) throw new Error(`Failed to fetch nutrient definitions: ${error.message}`);
        return data;
    });
}

export async function getFoodNutrients(foodId) {
    return cachedFetch(`food_nutrients_${foodId}`, async () => {
        const { data, error } = await supabase
            .from("food_nutrient_values")
            .select(`
                food_nutrient_value_id,
                food_id,
                nutrient_id,
                value,
                nutrient_definitions (
                    nutrient_name,
                    nutrient_code,
                    unit
                )
            `)
            .eq("food_id", foodId)
            .order("nutrient_id");
        if (error) throw new Error(`Failed to fetch nutrients for food ${foodId}: ${error.message}`);
        return data;
    });
}
