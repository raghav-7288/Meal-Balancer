/**
 * Simple in-memory cache for API responses (#75).
 * Supports stale-while-revalidate pattern for food search results.
 * Avoids redundant network calls for the same data within a TTL window.
 */
const cache = new Map();
const inflight = new Map(); // Dedup in-flight requests

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const STALE_TTL = 15 * 60 * 1000; // 15 minutes — serve stale while revalidating
const MAX_CACHE_SIZE = 100; // Evict oldest entries if cache grows beyond this

/**
 * Evict expired entries and, if still over limit, remove the oldest.
 */
function evictIfNeeded() {
    if (cache.size <= MAX_CACHE_SIZE) return;

    const now = Date.now();
    // First pass: remove expired entries (past stale window)
    for (const [key, entry] of cache) {
        if (now - entry.timestamp >= STALE_TTL) {
            cache.delete(key);
        }
    }
    // Second pass: if still over limit, remove oldest entries
    if (cache.size > MAX_CACHE_SIZE) {
        const sorted = [...cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toRemove = sorted.slice(0, cache.size - MAX_CACHE_SIZE);
        for (const [key] of toRemove) {
            cache.delete(key);
        }
    }
}

/**
 * Get a cached value or fetch it.
 * @param {string} key - Cache key.
 * @param {() => Promise<*>} fetcher - Async function to fetch data if not cached.
 * @param {number} [ttl] - Time-to-live in ms (default: 5 minutes).
 * @returns {Promise<*>} The cached or freshly fetched data.
 */
export async function cachedFetch(key, fetcher, ttl = DEFAULT_TTL) {
    const now = Date.now();
    const entry = cache.get(key);

    if (entry && now - entry.timestamp < ttl) {
        return entry.data;
    }

    // Deduplicate in-flight requests for the same key
    if (inflight.has(key)) {
        return inflight.get(key);
    }

    const promise = fetcher()
        .then((data) => {
            cache.set(key, { data, timestamp: Date.now() });
            inflight.delete(key);
            evictIfNeeded();
            return data;
        })
        .catch((err) => {
            inflight.delete(key);
            throw err;
        });

    inflight.set(key, promise);
    return promise;
}

/**
 * Stale-while-revalidate fetch (#75).
 * Returns stale data immediately if available, and revalidates in the background.
 * If no cached data exists, waits for the fetch.
 * @param {string} key - Cache key.
 * @param {() => Promise<*>} fetcher - Async function to fetch fresh data.
 * @param {number} [ttl] - Fresh TTL in ms (default: 5 minutes).
 * @returns {Promise<*>} Cached data (may be stale) or fresh data if no cache.
 */
export async function staleWhileRevalidate(key, fetcher, ttl = DEFAULT_TTL) {
    const now = Date.now();
    const entry = cache.get(key);

    // Fresh — return immediately
    if (entry && now - entry.timestamp < ttl) {
        return entry.data;
    }

    // Stale but within stale window — return stale, revalidate in background
    if (entry && now - entry.timestamp < STALE_TTL) {
        // Fire-and-forget background revalidation
        if (!inflight.has(key)) {
            const bgPromise = fetcher()
                .then((data) => {
                    cache.set(key, { data, timestamp: Date.now() });
                    inflight.delete(key);
                    return data;
                })
                .catch(() => {
                    // Background revalidation failed — stale data remains cached
                    // This is expected under poor network; no action needed
                    inflight.delete(key);
                });
            inflight.set(key, bgPromise);
        }
        return entry.data;
    }

    // No cache or expired past stale window — must fetch
    return cachedFetch(key, fetcher, ttl);
}

/**
 * Invalidate a specific cache entry.
 * @param {string} key - Cache key to invalidate.
 */
export function invalidateCache(key) {
    cache.delete(key);
}

/**
 * Clear all cached entries.
 */
export function clearCache() {
    cache.clear();
}
