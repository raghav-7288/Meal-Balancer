/**
 * Tests for useLocalStorage hook — edge cases and error handling
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorageState } from "../src/hooks/useLocalStorage";

describe("useLocalStorageState — edge cases", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it("handles corrupted JSON in localStorage gracefully", () => {
        localStorage.setItem("corrupt-key", "not{valid}json[");
        const { result } = renderHook(() => useLocalStorageState("corrupt-key", "fallback"));
        expect(result.current[0]).toBe("fallback");
    });

    it("handles localStorage write errors gracefully", () => {
        const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("QuotaExceededError");
        });
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        const { result } = renderHook(() => useLocalStorageState("error-key", "init"));

        act(() => {
            result.current[1]("new-value");
        });

        // State still updates in memory even if localStorage write fails
        expect(result.current[0]).toBe("new-value");
        expect(consoleSpy).toHaveBeenCalled();

        spy.mockRestore();
        consoleSpy.mockRestore();
    });

    it("supports arrays as values", () => {
        const { result } = renderHook(() =>
            useLocalStorageState("array-key", [1, 2, 3])
        );

        act(() => {
            result.current[1]([4, 5, 6]);
        });

        expect(result.current[0]).toEqual([4, 5, 6]);
        expect(JSON.parse(localStorage.getItem("array-key"))).toEqual([4, 5, 6]);
    });

    it("supports null as value", () => {
        const { result } = renderHook(() =>
            useLocalStorageState("null-key", null)
        );

        expect(result.current[0]).toBeNull();
        act(() => {
            result.current[1]("something");
        });
        expect(result.current[0]).toBe("something");
    });
});

