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

    it("should not retry generic application errors (non-retryable fallthrough)", async () => {
        // This error doesn't start with "Failed to" and is not a network/5xx error
        // It hits the `return false` fallthrough in isRetryable()
        const appError = new Error("Validation error: invalid email format");
        const fn = vi.fn().mockRejectedValue(appError);

        await expect(withRetry(fn)).rejects.toThrow("Validation error: invalid email format");
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should not retry errors with empty message", async () => {
        const emptyError = new Error("");
        const fn = vi.fn().mockRejectedValue(emptyError);

        await expect(withRetry(fn)).rejects.toThrow("");
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should not retry errors with no message property", async () => {
        const noMsgError = { name: "CustomError" };
        const fn = vi.fn().mockRejectedValue(noMsgError);

        await expect(withRetry(fn)).rejects.toEqual(noMsgError);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should respect custom context in log messages", async () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const networkError = new TypeError("fetch failed");
        const fn = vi.fn()
            .mockRejectedValueOnce(networkError)
            .mockResolvedValueOnce("ok");

        const promise = withRetry(fn, { baseDelay: 10, context: "fetchPlans" });
        await vi.advanceTimersByTimeAsync(15);
        await promise;

        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining("fetchPlans"),
            expect.any(String)
        );
        warnSpy.mockRestore();
    });

    it("should retry on native TypeError 'Failed to fetch' (browser network failure)", async () => {
        // This is the browser's native error when a network request fails.
        // It starts with "Failed to" which previously matched the service-layer heuristic.
        const nativeNetworkError = new TypeError("Failed to fetch");
        const fn = vi.fn()
            .mockRejectedValueOnce(nativeNetworkError)
            .mockResolvedValueOnce("recovered");

        const promise = withRetry(fn, { baseDelay: 10 });
        await vi.advanceTimersByTimeAsync(15);
        const result = await promise;

        expect(result).toBe("recovered");
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should NOT retry service-layer Error with 'Failed to' prefix (non-TypeError)", async () => {
        // Service-layer errors are regular Error objects (not TypeError)
        const serviceError = new Error("Failed to fetch user plans: row not found");
        const fn = vi.fn().mockRejectedValue(serviceError);

        await expect(withRetry(fn)).rejects.toThrow("Failed to fetch user plans: row not found");
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry TypeError even when message is empty", async () => {
        const typeError = new TypeError("");
        const fn = vi.fn()
            .mockRejectedValueOnce(typeError)
            .mockResolvedValueOnce("ok");

        const promise = withRetry(fn, { baseDelay: 10 });
        await vi.advanceTimersByTimeAsync(15);
        const result = await promise;

        expect(result).toBe("ok");
        expect(fn).toHaveBeenCalledTimes(2);
    });
});




