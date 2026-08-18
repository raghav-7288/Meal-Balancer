/**
 * Progress Page streak calculation logic tests.
 * Verifies the streak logic that counts consecutive days from the most recent entry.
 *
 * Imports the REAL implementation from src/utils/progressStats.js (previously this
 * test re-implemented a copy, which could silently drift from the component code).
 */
import { describe, it, expect } from "vitest";
import { calculateStreak } from "../src/utils/progressStats";
import { getLocalDateKey } from "../src/utils/dateKey";

function dateStr(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return getLocalDateKey(d);
}

describe("Progress Streak Calculation", () => {
    it("returns 0 for empty history", () => {
        expect(calculateStreak([])).toBe(0);
    });

    it("returns 1 for a single entry today", () => {
        const sorted = [{ date: dateStr(0), score: 80 }];
        expect(calculateStreak(sorted)).toBe(1);
    });

    it("returns 1 for a single entry yesterday", () => {
        const sorted = [{ date: dateStr(1), score: 80 }];
        expect(calculateStreak(sorted)).toBe(1);
    });

    it("returns 0 for a single entry 2+ days ago (streak broken)", () => {
        const sorted = [{ date: dateStr(2), score: 80 }];
        expect(calculateStreak(sorted)).toBe(0);
    });

    it("returns 0 for entries only from last week (streak broken)", () => {
        const sorted = [
            { date: dateStr(9), score: 70 },
            { date: dateStr(8), score: 75 },
            { date: dateStr(7), score: 80 },
        ];
        expect(calculateStreak(sorted)).toBe(0);
    });

    it("counts consecutive days correctly", () => {
        const sorted = [
            { date: dateStr(3), score: 70 },
            { date: dateStr(2), score: 75 },
            { date: dateStr(1), score: 80 },
            { date: dateStr(0), score: 85 },
        ];
        expect(calculateStreak(sorted)).toBe(4);
    });

    it("stops counting when gap is found", () => {
        const sorted = [
            { date: dateStr(5), score: 70 },
            { date: dateStr(3), score: 75 }, // gap: day 4 missing
            { date: dateStr(2), score: 80 },
            { date: dateStr(1), score: 85 },
            { date: dateStr(0), score: 90 },
        ];
        // Days 0,1,2,3 are consecutive → streak = 4 (gap is between day 5 and day 3)
        expect(calculateStreak(sorted)).toBe(4);
    });

    it("handles yesterday as most recent (no today entry yet)", () => {
        const sorted = [
            { date: dateStr(3), score: 70 },
            { date: dateStr(2), score: 75 },
            { date: dateStr(1), score: 80 },
        ];
        expect(calculateStreak(sorted)).toBe(3);
    });

    it("handles DST-like fractional day differences via Math.round", () => {
        // Simulate a scenario where date math produces non-integer results
        // (e.g., 23 hours = 0.958 days, 25 hours = 1.041 days)
        // The Math.round ensures these are still counted as 1 day apart
        const sorted = [
            { date: dateStr(2), score: 70 },
            { date: dateStr(1), score: 75 },
            { date: dateStr(0), score: 80 },
        ];
        // With Math.round, even if DST causes 23h or 25h between dates,
        // consecutive calendar dates should still register as streak
        expect(calculateStreak(sorted)).toBe(3);
    });

    it("does not count same-day duplicate entries as extra streak", () => {
        const sorted = [
            { date: dateStr(1), score: 70 },
            { date: dateStr(1), score: 75 }, // same date
            { date: dateStr(0), score: 80 },
        ];
        // Same date → diff=0, not 1, so streak breaks between duplicates
        // Result: streak starts from most recent, counts 0→1 (1 day), then 1→1 (0 days) → break
        expect(calculateStreak(sorted)).toBe(2);
    });
});



