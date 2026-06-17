/**
 * Simple in-memory cache for API responses.
 * Avoids redundant network calls for the same data within a TTL window.
 */
const cache = new Map();

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

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

    const data = await fetcher();
    cache.set(key, { data, timestamp: now });
    return data;
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

