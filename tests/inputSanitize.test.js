/**
 * Input sanitization utility tests.
 * Covers sanitizeNumeric() (free-typing strip) and clampOnBlur() (range clamp),
 * verified branch-by-branch against src/utils/inputSanitize.js:
 *   - normal, zero, boundary, negative, extreme, and invalid inputs
 *   - empty-string handling and NaN handling
 *   - documented limitation: multiple dots are NOT collapsed
 */
import { describe, it, expect } from "vitest";
import { sanitizeNumeric, clampOnBlur } from "../src/utils/inputSanitize";

describe("sanitizeNumeric", () => {
    describe("normal values", () => {
        it("passes through a plain integer string", () => {
            expect(sanitizeNumeric("123")).toBe("123");
        });

        it("passes through a decimal string", () => {
            expect(sanitizeNumeric("12.5")).toBe("12.5");
        });

        it("preserves a leading decimal point", () => {
            expect(sanitizeNumeric(".5")).toBe(".5");
        });

        it("preserves a trailing decimal point (mid-typing)", () => {
            expect(sanitizeNumeric("5.")).toBe("5.");
        });

        it("preserves leading zeros (does not normalize)", () => {
            expect(sanitizeNumeric("007")).toBe("007");
        });
    });

    describe("zero / empty", () => {
        it("returns empty string for empty input", () => {
            expect(sanitizeNumeric("")).toBe("");
        });

        it("keeps a literal zero", () => {
            expect(sanitizeNumeric("0")).toBe("0");
        });
    });

    describe("negatives are stripped", () => {
        it("strips a single leading minus", () => {
            expect(sanitizeNumeric("-5")).toBe("5");
        });

        it("strips a minus appearing mid-string", () => {
            expect(sanitizeNumeric("5-3")).toBe("53");
        });

        it("strips repeated leading minus signs", () => {
            expect(sanitizeNumeric("--5")).toBe("5");
        });

        it("returns empty string for a lone minus", () => {
            expect(sanitizeNumeric("-")).toBe("");
        });
    });

    describe("non-numeric characters are stripped", () => {
        it("strips trailing unit letters", () => {
            expect(sanitizeNumeric("12.5kg")).toBe("12.5");
        });

        it("strips currency symbols and separators", () => {
            expect(sanitizeNumeric("$1,234.50")).toBe("1234.50");
        });

        it("strips surrounding whitespace", () => {
            expect(sanitizeNumeric("  5  ")).toBe("5");
        });

        it("returns empty string when only letters are present", () => {
            expect(sanitizeNumeric("abc")).toBe("");
        });

        it("returns empty string when only symbols are present", () => {
            expect(sanitizeNumeric("@#$")).toBe("");
        });
    });

    describe("dot edge cases", () => {
        it("returns empty string for a lone dot", () => {
            expect(sanitizeNumeric(".")).toBe("");
        });

        it("does NOT collapse multiple dots (documented limitation)", () => {
            expect(sanitizeNumeric("1.2.3")).toBe("1.2.3");
        });
    });
});

describe("clampOnBlur", () => {
    describe("empty / invalid input", () => {
        it("returns empty string for empty input", () => {
            expect(clampOnBlur("")).toBe("");
        });

        it("returns empty string for non-numeric input", () => {
            expect(clampOnBlur("abc")).toBe("");
        });
    });

    describe("default range [0, Infinity]", () => {
        it("keeps an in-range value unchanged", () => {
            expect(clampOnBlur("50")).toBe("50");
        });

        it("keeps zero", () => {
            expect(clampOnBlur("0")).toBe("0");
        });

        it("clamps a negative value up to 0", () => {
            expect(clampOnBlur("-5")).toBe("0");
        });

        it("normalizes negative zero to '0'", () => {
            expect(clampOnBlur("-0")).toBe("0");
        });

        it("leaves very large values untouched (no upper bound)", () => {
            expect(clampOnBlur("999999")).toBe("999999");
        });

        it("preserves decimals", () => {
            expect(clampOnBlur("12.5")).toBe("12.5");
        });
    });

    describe("custom range clamping", () => {
        it("clamps above the max", () => {
            expect(clampOnBlur("500", 0, 300)).toBe("300");
        });

        it("clamps below the min", () => {
            expect(clampOnBlur("5", 10, 300)).toBe("10");
        });

        it("keeps a value within the range", () => {
            expect(clampOnBlur("50", 10, 300)).toBe("50");
        });

        it("returns the min at the exact lower boundary", () => {
            expect(clampOnBlur("10", 10, 300)).toBe("10");
        });

        it("returns the max at the exact upper boundary", () => {
            expect(clampOnBlur("300", 10, 300)).toBe("300");
        });

        it("allows negative results when min is negative", () => {
            expect(clampOnBlur("-5", -10, 10)).toBe("-5");
        });
    });

    describe("parseFloat coercion", () => {
        it("parses the leading number and drops a trailing unit", () => {
            expect(clampOnBlur("12.5kg", 0, 100)).toBe("12.5");
        });

        it("trims surrounding whitespace", () => {
            expect(clampOnBlur("  7  ")).toBe("7");
        });

        it("stops at the second dot (parseFloat semantics)", () => {
            expect(clampOnBlur("1.2.3")).toBe("1.2");
        });

        it("returns a string type", () => {
            expect(typeof clampOnBlur("50")).toBe("string");
        });
    });
});

