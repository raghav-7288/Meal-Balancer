/**
 * Tests for getLocalDateKey — the local-timezone date-key helper.
 */
import { describe, it, expect } from "vitest";
import { getLocalDateKey } from "../src/utils/dateKey";

describe("getLocalDateKey", () => {
    it("formats a date as local YYYY-MM-DD", () => {
        // Local components (month is 0-based in the Date constructor)
        const d = new Date(2026, 7, 18, 10, 30); // 18 Aug 2026, 10:30 local
        expect(getLocalDateKey(d)).toBe("2026-08-18");
    });

    it("zero-pads single-digit month and day", () => {
        const d = new Date(2026, 0, 5, 9, 0); // 5 Jan 2026
        expect(getLocalDateKey(d)).toBe("2026-01-05");
    });

    it("uses the LOCAL calendar day, not the UTC day", () => {
        // Build a Date whose local calendar day differs from its UTC day:
        // local midnight will be the previous day in UTC for any positive offset.
        const d = new Date(2026, 7, 18, 0, 30); // 00:30 local on 18 Aug
        // The local key must be the 18th regardless of the machine's UTC offset.
        expect(getLocalDateKey(d)).toBe("2026-08-18");
        // Sanity: for an ahead-of-UTC timezone this would differ from toISOString.
        if (d.getTimezoneOffset() < 0) {
            expect(getLocalDateKey(d)).not.toBe(d.toISOString().slice(0, 10));
        }
    });

    it("defaults to the current date when no argument is passed", () => {
        const expected = getLocalDateKey(new Date());
        expect(getLocalDateKey()).toBe(expected);
        expect(getLocalDateKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});

