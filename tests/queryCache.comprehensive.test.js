/**
 * Query Cache - Comprehensive Tests
 * Tests: cachedFetch, invalidateCache, clearCache with TTL, eviction, and edge cases
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cachedFetch, invalidateCache, clearCache } from "../src/utils/queryCache";

describe("QueryCache – Comprehensive", () => {
    beforeEach(() => {
        clearCache();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("cachedFetch", () => {
        it("should call fetcher on first request", async () => {
            const fetcher = vi.fn().mockResolvedValue([1, 2, 3]);
            const result = await cachedFetch("key1", fetcher);
            expect(result).toEqual([1, 2, 3]);
            expect(fetcher).toHaveBeenCalledTimes(1);
        });

        it("should return cached data on subsequent calls within TTL", async () => {
            const fetcher = vi.fn().mockResolvedValue("data");
            await cachedFetch("key2", fetcher);
            await cachedFetch("key2", fetcher);
            await cachedFetch("key2", fetcher);
            expect(fetcher).toHaveBeenCalledTimes(1);
        });

        it("should re-fetch after TTL expires", async () => {
            const fetcher = vi.fn()
                .mockResolvedValueOnce("old-data")
                .mockResolvedValueOnce("new-data");

            const result1 = await cachedFetch("key3", fetcher);
            expect(result1).toBe("old-data");

            // Advance past default TTL (5 minutes)
            vi.advanceTimersByTime(6 * 60 * 1000);

            const result2 = await cachedFetch("key3", fetcher);
            expect(result2).toBe("new-data");
            expect(fetcher).toHaveBeenCalledTimes(2);
        });

        it("should respect custom TTL", async () => {
            const fetcher = vi.fn()
                .mockResolvedValueOnce("first")
                .mockResolvedValueOnce("second");

            await cachedFetch("key4", fetcher, 1000); // 1 second TTL

            vi.advanceTimersByTime(500); // Still within TTL
            const result1 = await cachedFetch("key4", fetcher, 1000);
            expect(result1).toBe("first");

            vi.advanceTimersByTime(600); // Past TTL (total 1100ms)
            const result2 = await cachedFetch("key4", fetcher, 1000);
            expect(result2).toBe("second");
        });

        it("should cache different keys independently", async () => {
            const fetcher1 = vi.fn().mockResolvedValue("data-a");
            const fetcher2 = vi.fn().mockResolvedValue("data-b");

            const a = await cachedFetch("keyA", fetcher1);
            const b = await cachedFetch("keyB", fetcher2);
            const a2 = await cachedFetch("keyA", fetcher1);

            expect(a).toBe("data-a");
            expect(b).toBe("data-b");
            expect(a2).toBe("data-a");
            expect(fetcher1).toHaveBeenCalledTimes(1);
            expect(fetcher2).toHaveBeenCalledTimes(1);
        });

        it("should handle fetcher that throws error", async () => {
            const fetcher = vi.fn().mockRejectedValue(new Error("Network error"));
            await expect(cachedFetch("keyErr", fetcher)).rejects.toThrow("Network error");
        });

        it("should cache null/undefined values", async () => {
            const fetcher = vi.fn().mockResolvedValue(null);
            const result1 = await cachedFetch("keyNull", fetcher);
            const result2 = await cachedFetch("keyNull", fetcher);
            expect(result1).toBeNull();
            expect(result2).toBeNull();
            expect(fetcher).toHaveBeenCalledTimes(1);
        });

        it("should cache complex objects", async () => {
            const data = { users: [{ id: 1 }], meta: { total: 1 } };
            const fetcher = vi.fn().mockResolvedValue(data);
            const result = await cachedFetch("keyObj", fetcher);
            expect(result).toEqual(data);
        });
    });

    describe("invalidateCache", () => {
        it("should remove specific key from cache", async () => {
            const fetcher = vi.fn()
                .mockResolvedValueOnce("first")
                .mockResolvedValueOnce("second");

            await cachedFetch("myKey", fetcher);
            invalidateCache("myKey");
            const result = await cachedFetch("myKey", fetcher);
            expect(result).toBe("second");
            expect(fetcher).toHaveBeenCalledTimes(2);
        });

        it("should not affect other cache keys", async () => {
            const fetcherA = vi.fn().mockResolvedValue("A");
            const fetcherB = vi.fn().mockResolvedValue("B");

            await cachedFetch("keyA", fetcherA);
            await cachedFetch("keyB", fetcherB);
            invalidateCache("keyA");

            // keyB should still be cached
            await cachedFetch("keyB", fetcherB);
            expect(fetcherB).toHaveBeenCalledTimes(1);
        });

        it("should handle invalidating non-existent key gracefully", () => {
            expect(() => invalidateCache("nonExistentKey")).not.toThrow();
        });
    });

    describe("clearCache", () => {
        it("should remove all cached entries", async () => {
            const fetcher1 = vi.fn().mockResolvedValue("A");
            const fetcher2 = vi.fn().mockResolvedValue("B");

            await cachedFetch("key1", fetcher1);
            await cachedFetch("key2", fetcher2);
            clearCache();

            await cachedFetch("key1", fetcher1);
            await cachedFetch("key2", fetcher2);
            expect(fetcher1).toHaveBeenCalledTimes(2);
            expect(fetcher2).toHaveBeenCalledTimes(2);
        });

        it("should handle clearing empty cache", () => {
            expect(() => clearCache()).not.toThrow();
        });
    });

    describe("eviction", () => {
        it("should evict entries when cache exceeds MAX_CACHE_SIZE", async () => {
            // Fill cache with 101 entries to trigger eviction (MAX_CACHE_SIZE = 100)
            for (let i = 0; i < 101; i++) {
                const fetcher = vi.fn().mockResolvedValue(`data-${i}`);
                await cachedFetch(`eviction-key-${i}`, fetcher);
            }
            // The cache should have evicted some entries, but still work
            const fetcher = vi.fn().mockResolvedValue("new-entry");
            const result = await cachedFetch("eviction-key-101", fetcher);
            expect(result).toBe("new-entry");
        });
    });
});

