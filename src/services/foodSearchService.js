import { supabase } from "../lib/supabaseClient";

/**
 * Search food items from Supabase using trigram similarity.
 * @param {string} query - The search term typed by the user.
 * @param {number} limit - Max results to return (default 15).
 * @returns {Promise<Array<{food_id: number, food_code: string, food_name: string, major_group_id: number}>>}
 */
export async function searchFoodItems(query, limit = 15) {
    if (!query || query.trim().length < 2) return [];

    const { data, error } = await supabase
        .from("food_items")
        .select("food_id, food_code, food_name, major_group_id")
        .ilike("food_name", `%${query.trim()}%`)
        .limit(limit);

    if (error) {
        console.error("Food search error:", error);
        return [];
    }

    return data || [];
}

/**
 * Fetch all nutrient values for a given food_id from the database.
 * Returns a normalized object with nutrient values per 100g.
 * @param {number|string} foodId - The food_id from the food_items table.
 * @returns {Promise<object>} Nutrient map: { nutrient_name: value, ... } and a flat object for the engine.
 */
export async function fetchFoodNutrients(foodId) {
    const { data, error } = await supabase
        .from("food_nutrient_values")
        .select(`
            value,
            nutrient_definitions (
                nutrient_name,
                nutrient_code,
                unit
            )
        `)
        .eq("food_id", foodId);

    if (error) {
        console.error("Nutrient fetch error:", error);
        return null;
    }

    if (!data || data.length === 0) return null;

    // Build a raw map of all nutrients: { nutrient_name: { value, unit, code } }
    const rawNutrients = {};
    for (const row of data) {
        const def = row.nutrient_definitions;
        if (def) {
            rawNutrients[def.nutrient_name.toLowerCase()] = {
                value: Number(row.value),
                unit: def.unit,
                code: def.nutrient_code,
            };
        }
    }

    // Map DB nutrient names to the app's internal nutrient keys (values are per 100g)
    const nutrients = {
        kcal: findNutrientValue(rawNutrients, ["energy", "energy (kcal)", "calories", "kcal"]),
        carbs: findNutrientValue(rawNutrients, ["carbohydrate", "carbs", "total carbohydrate", "carbohydrate, total"]),
        protein: findNutrientValue(rawNutrients, ["protein", "total protein"]),
        fat: findNutrientValue(rawNutrients, ["fat", "total fat", "fat, total"]),
        fibre: findNutrientValue(rawNutrients, ["fibre", "fiber", "dietary fibre", "dietary fiber", "total dietary fibre"]),
        vitamins: findNutrientValue(rawNutrients, ["total vitamins", "vitamins"]),
        minerals: findNutrientValue(rawNutrients, ["total minerals", "minerals", "mineral"]),
    };

    return { nutrients, rawNutrients };
}

/**
 * Find a nutrient value by trying multiple possible name keys (case-insensitive).
 */
function findNutrientValue(rawNutrients, possibleNames) {
    for (const name of possibleNames) {
        if (rawNutrients[name]) {
            return rawNutrients[name].value;
        }
    }
    return 0;
}

