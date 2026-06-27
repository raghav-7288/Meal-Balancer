/**
 * Query Cache - Stale-While-Revalidate & Edge Case Tests
 * Covers: inflight dedup, stale revalidation, eviction of expired entries,
 * and background revalidation failure paths.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cachedFetch, staleWhileRevalidate, clearCache } from "../src/utils/queryCache";

describe("QueryCache – Stale-While-Revalidate", () => {
    beforeEach(() => {
        clearCache();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("staleWhileRevalidate", () => {
        it("should return fresh data immediately when within TTL", async () => {
            const fetcher = vi.fn().mockResolvedValue("fresh-data");
            await staleWhileRevalidate("swr-key", fetcher);

            // Second call within TTL should return cached data without fetching
            const result = await staleWhileRevalidate("swr-key", fetcher);
            expect(result).toBe("fresh-data");
            expect(fetcher).toHaveBeenCalledTimes(1);
        });

        it("should return stale data and revalidate in background when past TTL but within stale window", async () => {
            const fetcher = vi.fn()
                .mockResolvedValueOnce("old-data")
                .mockResolvedValueOnce("new-data");

            await staleWhileRevalidate("swr-stale", fetcher);

            // Advance past TTL (5 min) but within stale window (15 min)
            vi.advanceTimersByTime(6 * 60 * 1000);

            const result = await staleWhileRevalidate("swr-stale", fetcher);
            // Should return stale data immediately
            expect(result).toBe("old-data");
            // Background revalidation should have been triggered
            expect(fetcher).toHaveBeenCalledTimes(2);
        });

        it("should fetch fresh when data is past the stale window", async () => {
            const fetcher = vi.fn()
                .mockResolvedValueOnce("old-data")
                .mockResolvedValueOnce("fresh-data");

            await staleWhileRevalidate("swr-expired", fetcher);

            // Advance past stale window (15 min)
            vi.advanceTimersByTime(16 * 60 * 1000);

            const result = await staleWhileRevalidate("swr-expired", fetcher);
            expect(result).toBe("fresh-data");
            expect(fetcher).toHaveBeenCalledTimes(2);
        });

        it("should handle background revalidation failure gracefully", async () => {
            const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
            const fetcher = vi.fn()
                .mockResolvedValueOnce("cached-data")
                .mockRejectedValueOnce(new Error("Network error"));

            await staleWhileRevalidate("swr-fail", fetcher);

            // Advance past TTL but within stale window
            vi.advanceTimersByTime(6 * 60 * 1000);

            const result = await staleWhileRevalidate("swr-fail", fetcher);
            // Should still return stale data
            expect(result).toBe("cached-data");

            // Let the background promise settle
            await vi.advanceTimersByTimeAsync(0);

            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining("Background revalidation failed"),
                expect.any(String)
            );
            warnSpy.mockRestore();
        });

        it("should not trigger duplicate background revalidation for same key", async () => {
            const fetcher = vi.fn()
                .mockResolvedValueOnce("data")
                .mockImplementation(() => new Promise(() => {})); // Never resolves

            await staleWhileRevalidate("swr-dedup", fetcher);

            // Advance past TTL
            vi.advanceTimersByTime(6 * 60 * 1000);

            // Two calls while background is in-flight
            await staleWhileRevalidate("swr-dedup", fetcher);
            await staleWhileRevalidate("swr-dedup", fetcher);

            // Fetcher should be called exactly 2 times: initial + 1 background
            expect(fetcher).toHaveBeenCalledTimes(2);
        });

        it("should wait for fetch when no cached data exists", async () => {
            const fetcher = vi.fn().mockResolvedValue("first-time");
            const result = await staleWhileRevalidate("swr-new", fetcher);
            expect(result).toBe("first-time");
            expect(fetcher).toHaveBeenCalledTimes(1);
        });
    });

    describe("cachedFetch – inflight dedup", () => {
        it("should deduplicate concurrent requests for the same key", async () => {
            let resolvePromise;
            const fetcher = vi.fn().mockImplementation(() =>
                new Promise((resolve) => { resolvePromise = resolve; })
            );

            // Start two concurrent requests
            const promise1 = cachedFetch("dedup-key", fetcher);
            const promise2 = cachedFetch("dedup-key", fetcher);

            // Resolve the fetcher
            resolvePromise("shared-result");

            const [result1, result2] = await Promise.all([promise1, promise2]);
            expect(result1).toBe("shared-result");
            expect(result2).toBe("shared-result");
            // Fetcher should only be called once
            expect(fetcher).toHaveBeenCalledTimes(1);
        });

        it("should not dedup requests for different keys", async () => {
            const fetcher1 = vi.fn().mockResolvedValue("A");
            const fetcher2 = vi.fn().mockResolvedValue("B");

            const [r1, r2] = await Promise.all([
                cachedFetch("key-a", fetcher1),
                cachedFetch("key-b", fetcher2),
            ]);

            expect(r1).toBe("A");
            expect(r2).toBe("B");
            expect(fetcher1).toHaveBeenCalledTimes(1);
            expect(fetcher2).toHaveBeenCalledTimes(1);
        });

        it("should clean up inflight after error", async () => {
            const fetcher = vi.fn()
                .mockRejectedValueOnce(new Error("fail"))
                .mockResolvedValueOnce("success");

            await expect(cachedFetch("err-key", fetcher)).rejects.toThrow("fail");
            // After error, inflight should be cleared, allowing retry
            const result = await cachedFetch("err-key", fetcher);
            expect(result).toBe("success");
            expect(fetcher).toHaveBeenCalledTimes(2);
        });
    });

    describe("eviction – expired entries", () => {
        it("should evict entries past stale window when cache overflows", async () => {
            // Fill cache with entries that will be expired
            for (let i = 0; i < 50; i++) {
                const fetcher = vi.fn().mockResolvedValue(`old-${i}`);
                await cachedFetch(`old-key-${i}`, fetcher);
            }

            // Advance past stale window (15 min) so these are expired
            vi.advanceTimersByTime(16 * 60 * 1000);

            // Fill more entries to trigger eviction
            for (let i = 0; i < 60; i++) {
                const fetcher = vi.fn().mockResolvedValue(`new-${i}`);
                await cachedFetch(`new-key-${i}`, fetcher);
            }

            // The old entries should have been evicted
            // Fetching old keys should require new fetcher calls
            const fetcher = vi.fn().mockResolvedValue("refetched");
            const result = await cachedFetch("old-key-0", fetcher);
            expect(result).toBe("refetched");
            expect(fetcher).toHaveBeenCalledTimes(1);
        });
    });
});

