/**
 * useLocalStorageState Hook Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorageState } from "../src/hooks/useLocalStorage";

describe("useLocalStorageState", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it("should return initial value when localStorage is empty", () => {
        const { result } = renderHook(() => useLocalStorageState("test-key", "default"));
        expect(result.current[0]).toBe("default");
    });

    it("should read existing value from localStorage", () => {
        localStorage.setItem("stored-key", JSON.stringify("stored-value"));
        const { result } = renderHook(() => useLocalStorageState("stored-key", "default"));
        expect(result.current[0]).toBe("stored-value");
    });

    it("should persist state changes to localStorage", () => {
        const { result } = renderHook(() => useLocalStorageState("persist-key", "initial"));

        act(() => {
            result.current[1]("updated");
        });

        expect(result.current[0]).toBe("updated");
        expect(JSON.parse(localStorage.getItem("persist-key"))).toBe("updated");
    });

    it("should handle objects as values", () => {
        const initialValue = { name: "test", count: 0 };
        const { result } = renderHook(() => useLocalStorageState("obj-key", initialValue));

        expect(result.current[0]).toEqual(initialValue);

        act(() => {
            result.current[1]({ name: "test", count: 1 });
        });

        expect(result.current[0]).toEqual({ name: "test", count: 1 });
        expect(JSON.parse(localStorage.getItem("obj-key"))).toEqual({ name: "test", count: 1 });
    });

    it("should handle arrays as values", () => {
        const { result } = renderHook(() => useLocalStorageState("arr-key", []));

        act(() => {
            result.current[1]([1, 2, 3]);
        });

        expect(result.current[0]).toEqual([1, 2, 3]);
    });

    it("should return initial value when localStorage has invalid JSON", () => {
        localStorage.setItem("bad-json", "not-valid-json{[");
        const { result } = renderHook(() => useLocalStorageState("bad-json", "fallback"));
        expect(result.current[0]).toBe("fallback");
    });

    it("should handle updater function pattern", () => {
        const { result } = renderHook(() => useLocalStorageState("counter-key", 0));

        act(() => {
            result.current[1]((prev) => prev + 1);
        });
        act(() => {
            result.current[1]((prev) => prev + 1);
        });

        expect(result.current[0]).toBe(2);
    });

    it("should handle null values", () => {
        const { result } = renderHook(() => useLocalStorageState("null-key", null));
        expect(result.current[0]).toBeNull();

        act(() => {
            result.current[1]("not-null");
        });
        expect(result.current[0]).toBe("not-null");
    });

    it("should handle boolean values", () => {
        const { result } = renderHook(() => useLocalStorageState("bool-key", false));

        act(() => {
            result.current[1](true);
        });
        expect(result.current[0]).toBe(true);
        expect(JSON.parse(localStorage.getItem("bool-key"))).toBe(true);
    });

    it("should use different keys independently", () => {
        const { result: result1 } = renderHook(() => useLocalStorageState("key-a", "A"));
        const { result: result2 } = renderHook(() => useLocalStorageState("key-b", "B"));

        expect(result1.current[0]).toBe("A");
        expect(result2.current[0]).toBe("B");

        act(() => {
            result1.current[1]("A-updated");
        });

        expect(result1.current[0]).toBe("A-updated");
        expect(result2.current[0]).toBe("B");
    });
});

