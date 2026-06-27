/**
 * Exponential backoff retry wrapper for Supabase calls (#74).
 * Retries failed async operations with increasing delays (1s, 2s, 4s).
 * Use for all non-auth Supabase calls to handle network blips gracefully.
 */

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY = 1000; // 1 second

/**
 * Determine if an error is retryable (network issue, 5xx server errors).
 * Service-layer errors that wrap Supabase `error.message` (e.g., "Failed to fetch user plans: ...")
 * are NOT retried — only raw network/fetch failures are.
 * @param {Error} error
 * @returns {boolean}
 */
function isRetryable(error) {
    const message = error?.message?.toLowerCase() || "";

    // Service-layer errors always start with "Failed to ..." — these wrap Supabase
    // error objects and should NOT be retried (the DB responded with an error).
    if (message.startsWith("failed to ")) {
        return false;
    }

    // Network errors (fetch itself failed)
    if (message.includes("fetch failed") || message.includes("networkerror") || message.includes("network request failed")) {
        return true;
    }

    // HTTP 5xx server errors
    if (message.includes("500") || message.includes("502") || message.includes("503") || message.includes("504")) {
        return true;
    }

    // AbortError or TypeError from fetch API
    if (error?.name === "TypeError" || error?.name === "AbortError") {
        return true;
    }

    return false;
}

/**
 * Execute an async function with exponential backoff retry.
 * @param {() => Promise<*>} fn - The async function to execute.
 * @param {object} [options]
 * @param {number} [options.maxRetries=3] - Maximum number of retry attempts.
 * @param {number} [options.baseDelay=1000] - Base delay in ms (doubles each retry).
 * @param {string} [options.context=""] - Description for error logging.
 * @returns {Promise<*>} The result of the function.
 */
export async function withRetry(fn, options = {}) {
    const {
        maxRetries = DEFAULT_MAX_RETRIES,
        baseDelay = DEFAULT_BASE_DELAY,
        context = "",
    } = options;

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Don't retry on the last attempt or non-retryable errors
            if (attempt === maxRetries || !isRetryable(error)) {
                throw error;
            }

            const delay = baseDelay * Math.pow(2, attempt); // 1s, 2s, 4s
            if (import.meta.env.DEV) {
                console.warn(
                    `[Retry] ${context || "operation"} failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`,
                    error.message,
                );
            }

            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}


