import { supabase } from "../lib/supabaseClient";
import { validateResponse, DailyHealthArraySchema, DailyHealthRowSchema } from "../utils/schemas";
import { withRetry } from "../utils/withRetry";

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
    return withRetry(async () => {
        const { data, error } = await supabase
            .from("daily_health_tracking")
            .select("*")
            .eq("user_id", userId)
            .order("date", { ascending: false })
            .limit(limit);

        if (error) throw new Error(`Failed to fetch daily health data: ${error.message}`);
        return validateResponse(DailyHealthArraySchema, data || [], "fetchDailyHealthData");
    }, { context: "fetchDailyHealthData" });
}

/**
 * Fetch a single day's health tracking entry.
 * @param {string} userId
 * @param {string} date - "YYYY-MM-DD"
 * @returns {Promise<object|null>}
 */
export async function fetchDailyHealthForDate(userId, date) {
    return withRetry(async () => {
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
        return validateResponse(DailyHealthRowSchema, data, "fetchDailyHealthForDate");
    }, { context: "fetchDailyHealthForDate" });
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
    return withRetry(async () => {
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
    }, { context: "upsertDailyHealth" });
}

/**
 * Convert DB rows to client-side water data format { "YYYY-MM-DD": glasses }
 * @param {Array} rows - DB rows from daily_health_tracking
 * @returns {object} waterData map
 */
export function dbRowsToWaterData(rows) {
    const waterData = {};
    if (!rows) return waterData;
    for (const row of rows) {
        if (row?.date != null) {
            waterData[row.date] = row.water_glasses;
        }
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
    if (!rows) return stepData;
    for (const row of rows) {
        if (row?.date != null) {
            stepData[row.date] = row.steps;
        }
    }
    return stepData;
}

