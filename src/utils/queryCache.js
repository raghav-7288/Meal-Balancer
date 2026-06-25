/**
 * Simple in-memory cache for API responses.
 * Avoids redundant network calls for the same data within a TTL window.
 */
const cache = new Map();
const inflight = new Map(); // Dedup in-flight requests

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Evict oldest entries if cache grows beyond this

/**
 * Evict expired entries and, if still over limit, remove the oldest.
 */
function evictIfNeeded() {
    if (cache.size <= MAX_CACHE_SIZE) return;

    const now = Date.now();
    // First pass: remove expired entries
    for (const [key, entry] of cache) {
        if (now - entry.timestamp >= DEFAULT_TTL) {
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

    const promise = fetcher().then((data) => {
        cache.set(key, { data, timestamp: Date.now() });
        inflight.delete(key);
        evictIfNeeded();
        return data;
    }).catch((err) => {
        inflight.delete(key);
        throw err;
    });

    inflight.set(key, promise);
    return promise;
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

