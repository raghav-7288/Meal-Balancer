/**
 * useDebounce Hook Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "../src/hooks/useDebounce";

describe("useDebounce", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should return initial value immediately", () => {
        const { result } = renderHook(() => useDebounce("hello", 500));
        expect(result.current).toBe("hello");
    });

    it("should not update value before delay elapses", () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: "initial", delay: 500 } }
        );

        rerender({ value: "updated", delay: 500 });
        vi.advanceTimersByTime(300);
        expect(result.current).toBe("initial");
    });

    it("should update value after delay elapses", async () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: "initial", delay: 500 } }
        );

        rerender({ value: "updated", delay: 500 });
        await act(async () => {
            vi.advanceTimersByTime(500);
        });
        expect(result.current).toBe("updated");
    });

    it("should reset timer on rapid changes", async () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: "a", delay: 300 } }
        );

        rerender({ value: "b", delay: 300 });
        await act(async () => {
            vi.advanceTimersByTime(200);
        });
        rerender({ value: "c", delay: 300 });
        await act(async () => {
            vi.advanceTimersByTime(200);
        });
        // 'b' should not have been emitted
        expect(result.current).toBe("a");

        await act(async () => {
            vi.advanceTimersByTime(100);
        });
        // Now 'c' should be emitted after full 300ms from last change
        expect(result.current).toBe("c");
    });

    it("should handle delay of 0", async () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: "fast", delay: 0 } }
        );

        rerender({ value: "instant", delay: 0 });
        await act(async () => {
            vi.advanceTimersByTime(1);
        });
        expect(result.current).toBe("instant");
    });

    it("should handle changing delay value", async () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: "start", delay: 500 } }
        );

        rerender({ value: "end", delay: 100 });
        await act(async () => {
            vi.advanceTimersByTime(100);
        });
        expect(result.current).toBe("end");
    });
});


