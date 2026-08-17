/**
 * OAuth redirect-error capture.
 *
 * When Google / Supabase returns an OAuth error (e.g. the user cancels the
 * consent screen, or the provider rejects the request), the browser is
 * redirected back to the app with `error` / `error_description` in the URL —
 * in the hash fragment for the implicit flow, or the query string for PKCE.
 *
 * supabase-js can strip the hash during its async `detectSessionInUrl`
 * processing, so we snapshot any error *synchronously at module-load time*
 * (before that async work runs) and expose it for the UI to display once.
 */

function readOAuthErrorFromUrl() {
    if (typeof window === "undefined" || !window.location) return null;

    const candidates = [];
    if (window.location.hash) candidates.push(window.location.hash.replace(/^#/, ""));
    if (window.location.search) candidates.push(window.location.search.replace(/^\?/, ""));

    for (const raw of candidates) {
        if (!raw) continue;
        const params = new URLSearchParams(raw);
        const error = params.get("error");
        const description = params.get("error_description");
        if (error || description) {
            // URLSearchParams already percent-decodes; also collapse '+' to spaces.
            return (description || error).replace(/\+/g, " ").trim();
        }
    }
    return null;
}

// Snapshot once, synchronously, at first import.
let capturedError = readOAuthErrorFromUrl();

/**
 * Return the captured OAuth error message (pure — does not mutate state, so it
 * is safe to call from a React lazy state initializer even under StrictMode's
 * double-invoke).
 * @returns {string|null}
 */
export function getOAuthError() {
    return capturedError;
}

/**
 * Clear the captured OAuth error so it is not surfaced again.
 */
export function clearOAuthError() {
    capturedError = null;
}


