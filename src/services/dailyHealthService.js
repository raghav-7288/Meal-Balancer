import { supabase } from "../lib/supabaseClient";

// ─── Daily Health Tracking Service ──────────────────────────────────────────
// CRUD operations for daily_health_tracking table in Supabase.
// Combines water intake, step tracking, and future daily metrics.

/**
 * Fetch all daily health tracking entries for the authenticated user.
 * @param {string} userId
 * @param {number} [limit=90] - Max rows to fetch (default: last 90 days)
 * @returns {Promise<Array>} array of daily health entries
 */
export async function fetchDailyHealthData(userId, limit = 90) {
    const { data, error } = await supabase
        .from("daily_health_tracking")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(limit);

    if (error) throw new Error(`Failed to fetch daily health data: ${error.message}`);
    return data || [];
}

/**
 * Fetch a single day's health tracking entry.
 * @param {string} userId
 * @param {string} date - "YYYY-MM-DD"
 * @returns {Promise<object|null>}
 */
export async function fetchDailyHealthForDate(userId, date) {
    const { data, error } = await supabase
        .from("daily_health_tracking")
        .select("*")
        .eq("user_id", userId)
        .eq("date", date)
        .single();

    if (error) {
        if (error.code === "PGRST116") return null; // No row found
        throw new Error(`Failed to fetch daily health for date: ${error.message}`);
    }
    return data;
}

/**
 * Upsert daily health tracking entry (insert or update by user_id + date).
 * Only updates the fields provided — other columns remain unchanged.
 * @param {string} userId
 * @param {string} date - "YYYY-MM-DD"
 * @param {object} fields - Fields to upsert, e.g. { water_glasses: 5, water_target: 8 }
 * @returns {Promise<object>} the upserted row
 */
export async function upsertDailyHealth(userId, date, fields) {
    const row = {
        user_id: userId,
        date,
        ...fields,
    };

    const { data, error } = await supabase
        .from("daily_health_tracking")
        .upsert(row, { onConflict: "user_id,date" })
        .select()
        .single();

    if (error) throw new Error(`Failed to save daily health data: ${error.message}`);
    return data;
}

/**
 * Convert DB rows to client-side water data format { "YYYY-MM-DD": glasses }
 * @param {Array} rows - DB rows from daily_health_tracking
 * @returns {object} waterData map
 */
export function dbRowsToWaterData(rows) {
    const waterData = {};
    for (const row of rows) {
        waterData[row.date] = row.water_glasses;
    }
    return waterData;
}

/**
 * Convert DB rows to client-side step data format { "YYYY-MM-DD": steps }
 * @param {Array} rows - DB rows from daily_health_tracking
 * @returns {object} stepData map
 */
export function dbRowsToStepData(rows) {
    const stepData = {};
    for (const row of rows) {
        stepData[row.date] = row.steps;
    }
    return stepData;
}

