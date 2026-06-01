import { supabase } from "../lib/supabaseClient";

// ─── Health Goals ───────────────────────────────────────────────────────────

/**
 * @typedef {Object} HealthGoal
 * @property {number} health_goal_id
 * @property {string} goal_code
 * @property {string} goal_name
 * @property {string|null} description
 * @property {boolean} is_active
 * @property {number} display_order
 */

/**
 * @typedef {Object} UserProfileHealthGoal
 * @property {string} user_id
 * @property {number} health_goal_id
 * @property {string} created_at
 */

/**
 * Fetch all active health goals ordered by display_order.
 * @returns {Promise<HealthGoal[]>}
 */
export async function getHealthGoals() {
    const { data, error } = await supabase
        .from("health_goals")
        .select("health_goal_id, goal_code, goal_name, description, is_active, display_order")
        .eq("is_active", true)
        .order("display_order");

    if (error) {
        throw new Error(`Failed to fetch health goals: ${error.message}`);
    }

    return data;
}

/**
 * Fetch health goals selected by a specific user.
 * @param {string} userId - The user's UUID.
 * @returns {Promise<UserProfileHealthGoal[]>}
 */
export async function getUserHealthGoals(userId) {
    const { data, error } = await supabase
        .from("user_profile_health_goals")
        .select("user_id, health_goal_id, created_at")
        .eq("user_id", userId);

    if (error) {
        throw new Error(`Failed to fetch user health goals: ${error.message}`);
    }

    return data;
}

/**
 * Save (sync) the user's selected health goals.
 * Removes deselected goals and inserts newly selected ones.
 * @param {string} userId - The user's UUID.
 * @param {number[]} selectedGoalIds - Array of health_goal_id values to save.
 * @returns {Promise<void>}
 */
export async function saveUserHealthGoals(userId, selectedGoalIds) {
    // 1. Fetch current selections
    const current = await getUserHealthGoals(userId);
    const currentIds = current.map((row) => row.health_goal_id);

    // 2. Determine inserts and deletes
    const toInsert = selectedGoalIds.filter((id) => !currentIds.includes(id));
    const toDelete = currentIds.filter((id) => !selectedGoalIds.includes(id));

    // 3. Delete removed goals
    if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
            .from("user_profile_health_goals")
            .delete()
            .eq("user_id", userId)
            .in("health_goal_id", toDelete);

        if (deleteError) {
            throw new Error(`Failed to remove health goals: ${deleteError.message}`);
        }
    }

    // 4. Insert new goals
    if (toInsert.length > 0) {
        const rows = toInsert.map((goalId) => ({
            user_id: userId,
            health_goal_id: goalId,
        }));

        const { error: insertError } = await supabase
            .from("user_profile_health_goals")
            .insert(rows);

        if (insertError) {
            throw new Error(`Failed to save health goals: ${insertError.message}`);
        }
    }
}

// ─── Major Groups & Foods ───────────────────────────────────────────────────

/**
 * Fetch all major food groups.
 * @returns {Promise<Array>} List of major_groups rows.
 */
export async function getMajorGroups() {
    const { data, error } = await supabase
        .from("major_groups")
        .select("major_group_id, group_code, group_name")
        .order("group_code");

    if (error) {
        throw new Error(`Failed to fetch major groups: ${error.message}`);
    }

    return data;
}

/**
 * Fetch food items belonging to a specific major group.
 * @param {number} groupId - The major_group_id to filter by.
 * @returns {Promise<Array>} List of food_items rows.
 */
export async function getFoodsByGroup(groupId) {
    const { data, error } = await supabase
        .from("food_items")
        .select("food_id, major_group_id, food_code, food_name")
        .eq("major_group_id", groupId)
        .order("food_name");

    if (error) {
        throw new Error(`Failed to fetch foods for group ${groupId}: ${error.message}`);
    }

    return data;
}

/**
 * Fetch all nutrient groups.
 * @returns {Promise<Array>} List of nutrient_groups rows.
 */
export async function getAllNutrientGroups() {
    const { data, error } = await supabase
        .from("nutrient_groups")
        .select("nutrient_group_id, group_name, description, display_order")
        .order("display_order");

    if (error) {
        throw new Error(`Failed to fetch nutrient groups: ${error.message}`);
    }

    return data;
}

/**
 * Fetch all nutrient definitions.
 * @returns {Promise<Array>} List of nutrient_definitions rows.
 */
export async function getNutrientDefinitions() {
    const { data, error } = await supabase
        .from("nutrient_definitions")
        .select("nutrient_id, nutrient_group_id, nutrient_name, nutrient_code, unit")
        .order("nutrient_name");

    if (error) {
        throw new Error(`Failed to fetch nutrient definitions: ${error.message}`);
    }

    return data;
}

/**
 * Fetch nutrient values for a specific food item.
 * @param {number} foodId - The food_id to look up.
 * @returns {Promise<Array>} List of food_nutrient_values joined with nutrient info.
 */
export async function getFoodNutrients(foodId) {
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

    if (error) {
        throw new Error(`Failed to fetch nutrients for food ${foodId}: ${error.message}`);
    }

    return data;
}

