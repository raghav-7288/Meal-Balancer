/**
 * Date-key helpers.
 *
 * The app is used primarily in India (IST, UTC+5:30). Deriving the "current day"
 * with `new Date().toISOString()` returns the **UTC** calendar date, so any time
 * before 05:30 IST it reports the *previous* day. That mislabels early-morning
 * logs and mismatches the local-midnight math used elsewhere (streaks, weekday
 * derivation). Always key daily data by the user's LOCAL calendar date instead.
 */

/**
 * Return the local calendar date as a "YYYY-MM-DD" string.
 * Unlike `toISOString().slice(0, 10)`, this uses the local timezone, so the day
 * rolls over at local midnight (not 00:00 UTC).
 *
 * @param {Date} [date=new Date()] - The date to format (defaults to now).
 * @returns {string} Local date key, e.g. "2026-08-18".
 */
export function getLocalDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

