import { supabase } from "../lib/supabaseClient";

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

