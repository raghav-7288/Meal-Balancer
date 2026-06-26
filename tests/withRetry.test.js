/**
 * Tests for withRetry utility (#74)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withRetry } from "../src/utils/withRetry";

describe("withRetry", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should return result on first successful call", async () => {
        const fn = vi.fn().mockResolvedValue("success");
        const result = await withRetry(fn);
        expect(result).toBe("success");
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should not retry non-retryable errors (service-layer errors)", async () => {
        const fn = vi.fn().mockRejectedValue(new Error("Failed to fetch user plans: Timeout"));
        await expect(withRetry(fn)).rejects.toThrow("Failed to fetch user plans: Timeout");
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry on TypeError (network failure)", async () => {
        const networkError = new TypeError("fetch failed");
        const fn = vi.fn()
            .mockRejectedValueOnce(networkError)
            .mockResolvedValueOnce("recovered");

        const promise = withRetry(fn, { baseDelay: 10 });
        await vi.advanceTimersByTimeAsync(15);
        const result = await promise;

        expect(result).toBe("recovered");
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should retry on AbortError", async () => {
        const abortError = new DOMException("Aborted", "AbortError");
        const fn = vi.fn()
            .mockRejectedValueOnce(abortError)
            .mockResolvedValueOnce("ok");

        const promise = withRetry(fn, { baseDelay: 10 });
        await vi.advanceTimersByTimeAsync(15);
        const result = await promise;

        expect(result).toBe("ok");
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should throw after max retries exhausted", async () => {
        vi.useRealTimers(); // Use real timers for this test to avoid dangling promises
        const networkError = new TypeError("fetch failed");
        const fn = vi.fn().mockRejectedValue(networkError);

        await expect(withRetry(fn, { maxRetries: 2, baseDelay: 1 })).rejects.toThrow("fetch failed");
        expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it("should use exponential backoff delays", async () => {
        const networkError = new TypeError("fetch failed");
        const fn = vi.fn()
            .mockRejectedValueOnce(networkError)
            .mockRejectedValueOnce(networkError)
            .mockResolvedValueOnce("ok");

        const promise = withRetry(fn, { baseDelay: 100, maxRetries: 3 });

        // First retry after 100ms (100 * 2^0)
        await vi.advanceTimersByTimeAsync(100);
        expect(fn).toHaveBeenCalledTimes(2);

        // Second retry after 200ms (100 * 2^1)
        await vi.advanceTimersByTimeAsync(200);
        const result = await promise;

        expect(result).toBe("ok");
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should not retry 4xx-style errors from Supabase", async () => {
        const fn = vi.fn().mockRejectedValue(new Error("Failed to save plan: Insert conflict"));
        await expect(withRetry(fn)).rejects.toThrow("Failed to save plan: Insert conflict");
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry on 503 server error", async () => {
        const serverError = new Error("503 Service Unavailable");
        const fn = vi.fn()
            .mockRejectedValueOnce(serverError)
            .mockResolvedValueOnce("recovered");

        const promise = withRetry(fn, { baseDelay: 10 });
        await vi.advanceTimersByTimeAsync(15);
        const result = await promise;

        expect(result).toBe("recovered");
        expect(fn).toHaveBeenCalledTimes(2);
    });
});




