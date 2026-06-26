import { describe, it, expect, vi, beforeEach } from "vitest";
import { cachedFetch, staleWhileRevalidate, invalidateCache, clearCache } from "../src/utils/queryCache";

describe("queryCache", () => {
    beforeEach(() => {
        clearCache();
    });

    it("fetches data on first call", async () => {
        const fetcher = vi.fn().mockResolvedValue({ result: "test" });
        const data = await cachedFetch("key1", fetcher);

        expect(data).toEqual({ result: "test" });
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it("returns cached data on second call within TTL", async () => {
        const fetcher = vi.fn().mockResolvedValue({ result: "test" });

        await cachedFetch("key2", fetcher);
        const data = await cachedFetch("key2", fetcher);

        expect(data).toEqual({ result: "test" });
        expect(fetcher).toHaveBeenCalledTimes(1); // only called once
    });

    it("re-fetches after TTL expires", async () => {
        const fetcher = vi.fn()
            .mockResolvedValueOnce({ result: "old" })
            .mockResolvedValueOnce({ result: "new" });

        await cachedFetch("key3", fetcher, 0); // TTL of 0ms
        const data = await cachedFetch("key3", fetcher, 0);

        expect(data).toEqual({ result: "new" });
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it("invalidateCache removes a specific key", async () => {
        const fetcher = vi.fn().mockResolvedValue("data");

        await cachedFetch("key4", fetcher);
        invalidateCache("key4");
        await cachedFetch("key4", fetcher);

        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it("clearCache removes all entries", async () => {
        const fetcher1 = vi.fn().mockResolvedValue("a");
        const fetcher2 = vi.fn().mockResolvedValue("b");

        await cachedFetch("k1", fetcher1);
        await cachedFetch("k2", fetcher2);
        clearCache();
        await cachedFetch("k1", fetcher1);
        await cachedFetch("k2", fetcher2);

        expect(fetcher1).toHaveBeenCalledTimes(2);
        expect(fetcher2).toHaveBeenCalledTimes(2);
    });

    // ─── staleWhileRevalidate (#75) ──────────────────────────────────
    describe("staleWhileRevalidate", () => {
        it("fetches fresh data on first call (no cache)", async () => {
            const fetcher = vi.fn().mockResolvedValue("fresh");
            const result = await staleWhileRevalidate("swr-1", fetcher);
            expect(result).toBe("fresh");
            expect(fetcher).toHaveBeenCalledTimes(1);
        });

        it("returns cached data within TTL without re-fetching", async () => {
            const fetcher = vi.fn().mockResolvedValue("data");
            await staleWhileRevalidate("swr-2", fetcher, 60000);
            const result = await staleWhileRevalidate("swr-2", fetcher, 60000);
            expect(result).toBe("data");
            expect(fetcher).toHaveBeenCalledTimes(1);
        });

        it("returns stale data and revalidates in background when TTL expired but within stale window", async () => {
            const fetcher = vi.fn()
                .mockResolvedValueOnce("stale")
                .mockResolvedValueOnce("refreshed");

            // First call — populates cache
            await staleWhileRevalidate("swr-3", fetcher, 0); // TTL=0 means immediately stale
            // Second call — should return stale data and fire background revalidation
            const result = await staleWhileRevalidate("swr-3", fetcher, 0);
            expect(result).toBe("stale"); // Returns stale immediately
            // Background revalidation fires (give it a tick)
            await new Promise((r) => setTimeout(r, 10));
            expect(fetcher).toHaveBeenCalledTimes(2);
        });
    });
});

