/**
 * Format a 24-hour "HH:MM" meal-time string into a friendly 12-hour label.
 * Returns "" for empty/invalid input so callers can conditionally render.
 *
 * @param {string} value - e.g. "08:00" or "13:30"
 * @returns {string} e.g. "8:00 AM" / "1:30 PM" (or "" if not a valid HH:MM)
 */
export function formatMealTime(value) {
    if (!value || typeof value !== "string") return "";
    const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
    if (!match) return "";
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    if (Number.isNaN(hour) || Number.isNaN(minute) || hour > 23 || minute > 59) return "";
    const period = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${String(minute).padStart(2, "0")} ${period}`;
}

/**
 * Sensible default clock ranges per meal slot (24h "HH:MM").
 * Used purely as a display/edit fallback so plans show standard meal windows
 * (e.g. Breakfast 8–10 AM) without seeding data or a migration.
 */
export const DEFAULT_MEAL_TIMES = {
    "Early morning": { start: "06:00", end: "07:00" },
    Breakfast: { start: "08:00", end: "10:00" },
    "Post breakfast snack": { start: "11:00", end: "11:30" },
    Lunch: { start: "13:00", end: "14:00" },
    "Post lunch snack": { start: "16:00", end: "17:00" },
    Dinner: { start: "20:00", end: "21:00" },
    "Bed time": { start: "22:00", end: "22:30" },
};

/**
 * Resolve the effective { start, end } range for a slot:
 *  - an explicit range object if set,
 *  - a legacy single "HH:MM" string coerced to { start, end: "" },
 *  - otherwise the slot's default range (or null for unknown slots).
 *
 * @param {Record<string, any>|undefined|null} mealTimes
 * @param {string} slot
 * @returns {{ start: string, end: string }|null}
 */
export function getMealTimeRange(mealTimes, slot) {
    const value = mealTimes?.[slot];
    if (value && typeof value === "object" && (value.start || value.end)) {
        return { start: value.start || "", end: value.end || "" };
    }
    if (typeof value === "string" && value.trim()) {
        return { start: value.trim(), end: "" };
    }
    return DEFAULT_MEAL_TIMES[slot] || null;
}

/** Internal: "08:00" → { compact: "8", period: "AM" }; "08:30" → { compact: "8:30", period: "AM" }. */
function labelParts(value) {
    const label = formatMealTime(value); // "8:00 AM" or ""
    if (!label) return null;
    const [time, period] = label.split(" ");
    const compact = time.endsWith(":00") ? time.slice(0, -3) : time;
    return { compact, period };
}

/**
 * Format a meal-time range into a compact, friendly label:
 *   { start: "06:00", end: "07:00" } → "6–7 AM"
 *   { start: "08:00", end: "10:00" } → "8–10 AM"
 *   { start: "06:00", end: "13:00" } → "6 AM – 1 PM"  (periods differ)
 * Also accepts a legacy "HH:MM" string. Returns "" when nothing valid.
 *
 * @param {{ start?: string, end?: string }|string|null|undefined} range
 * @returns {string}
 */
export function formatMealTimeRange(range) {
    if (!range) return "";
    if (typeof range === "string") {
        const only = labelParts(range);
        return only ? `${only.compact} ${only.period}` : "";
    }
    const a = labelParts(range.start);
    const b = labelParts(range.end);
    if (a && b) {
        return a.period === b.period
            ? `${a.compact}\u2013${b.compact} ${b.period}`
            : `${a.compact} ${a.period} \u2013 ${b.compact} ${b.period}`;
    }
    const one = a || b;
    return one ? `${one.compact} ${one.period}` : "";
}

