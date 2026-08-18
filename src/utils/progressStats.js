/**
 * Progress statistics helpers.
 *
 * Extracted from ProgressPage so the streak logic can be unit-tested directly
 * (previously the test re-implemented a copy, which could silently drift from
 * the real component code).
 */

/**
 * Count the current consecutive-day streak from a list of daily log entries.
 *
 * Rules:
 * - Entries must be sorted ascending by `date` ("YYYY-MM-DD"), oldest first.
 * - The streak only counts if the most recent entry is from today or yesterday
 *   (a gap of 2+ days means the streak is broken → 0).
 * - Consecutive calendar days increment the streak; the first gap stops it.
 * - `Math.round` on the day delta tolerates DST (23h/25h) day boundaries.
 *
 * Dates are parsed at LOCAL midnight so this aligns with `getLocalDateKey`
 * (the date keys written by the meal-history logger).
 *
 * @param {Array<{ date: string }>} sorted - Entries sorted ascending by date.
 * @returns {number} The current streak length (0 if broken/empty).
 */
export function calculateStreak(sorted) {
    if (!sorted || sorted.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mostRecent = new Date(sorted[sorted.length - 1].date + "T00:00:00");

    // Guard against invalid date strings (e.g. "", "not-a-date")
    if (isNaN(mostRecent.getTime())) return 0;

    const daysSinceLast = Math.round((today.getTime() - mostRecent.getTime()) / 86400000);

    if (daysSinceLast > 1) return 0;

    let streak = 1;
    for (let i = sorted.length - 1; i > 0; i--) {
        const curr = new Date(sorted[i].date + "T00:00:00");
        const prev = new Date(sorted[i - 1].date + "T00:00:00");
        // Skip entries with invalid dates
        if (isNaN(curr.getTime()) || isNaN(prev.getTime())) break;
        const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
        if (diff === 1) streak++;
        else break;
    }
    return streak;
}

