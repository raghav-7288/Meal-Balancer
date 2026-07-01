/**
 * Tests for withRetry — covering additional branches
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock import.meta.env.DEV
vi.stubEnv("DEV", true);

const { withRetry } = await import("../src/utils/withRetry");

describe("withRetry — additional branch coverage", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("retries on 'network request failed' error message", async () => {
        let attempts = 0;
        const fn = vi.fn(async () => {
            attempts++;
            if (attempts < 2) {
                const err = new Error("network request failed");
                throw err;
            }
            return "success";
        });

        const promise = withRetry(fn, { maxRetries: 3, baseDelay: 10, context: "test" });
        await vi.advanceTimersByTimeAsync(10);
        const result = await promise;

        expect(result).toBe("success");
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it("retries on 'networkerror' in message", async () => {
        let attempts = 0;
        const fn = vi.fn(async () => {
            attempts++;
            if (attempts < 2) {
                throw new Error("NetworkError when attempting to fetch resource");
            }
            return "done";
        });

        const promise = withRetry(fn, { maxRetries: 3, baseDelay: 10, context: "test" });
        await vi.advanceTimersByTimeAsync(10);
        const result = await promise;

        expect(result).toBe("done");
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it("does NOT retry service-layer errors that start with 'failed to'", async () => {
        const fn = vi.fn(async () => {
            throw new Error("Failed to fetch user plans: permission denied");
        });

        await expect(
            withRetry(fn, { maxRetries: 3, baseDelay: 10, context: "test" })
        ).rejects.toThrow("Failed to fetch user plans: permission denied");

        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("retries on TypeError (native fetch error)", async () => {
        let attempts = 0;
        const fn = vi.fn(async () => {
            attempts++;
            if (attempts < 2) {
                const err = new TypeError("Failed to fetch");
                throw err;
            }
            return "recovered";
        });

        const promise = withRetry(fn, { maxRetries: 3, baseDelay: 10, context: "test" });
        await vi.advanceTimersByTimeAsync(10);
        const result = await promise;

        expect(result).toBe("recovered");
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it("retries on AbortError", async () => {
        let attempts = 0;
        const fn = vi.fn(async () => {
            attempts++;
            if (attempts < 2) {
                const err = new Error("The operation was aborted");
                err.name = "AbortError";
                throw err;
            }
            return "ok";
        });

        const promise = withRetry(fn, { maxRetries: 2, baseDelay: 10, context: "test" });
        await vi.advanceTimersByTimeAsync(10);
        const result = await promise;

        expect(result).toBe("ok");
    });

    it("does not retry non-retryable errors even with retries remaining", async () => {
        const fn = vi.fn(async () => {
            throw new Error("Invalid input: bad request");
        });

        await expect(
            withRetry(fn, { maxRetries: 3, baseDelay: 10, context: "test" })
        ).rejects.toThrow("Invalid input: bad request");

        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("gives up after maxRetries exhausted", async () => {
        vi.useRealTimers(); // Use real timers to avoid unhandled rejection with fakes
        const fn = vi.fn(async () => {
            throw new TypeError("Failed to fetch");
        });

        await expect(
            withRetry(fn, { maxRetries: 2, baseDelay: 1, context: "test" })
        ).rejects.toThrow("Failed to fetch");
        expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it("uses default options when none provided", async () => {
        const fn = vi.fn(async () => "quick");
        const result = await withRetry(fn);
        expect(result).toBe("quick");
        expect(fn).toHaveBeenCalledTimes(1);
    });
});



