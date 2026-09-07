/**
 * CSRF headers for hand-rolled `fetch` calls.
 *
 * `meta[name="csrf-token"]` is stamped into the HTML once, when the document is
 * first served. Laravel regenerates the session token on login, on logout, and
 * whenever a session expires — and because Inertia never reloads the document,
 * that meta tag keeps serving the token from before. The next POST then fails
 * with "CSRF token mismatch" (419), and stays broken until a hard refresh.
 *
 * The XSRF-TOKEN cookie does not have that problem: Laravel re-sends it on every
 * response, so it always matches the current session. `VerifyCsrfToken` accepts
 * it through the X-XSRF-TOKEN header, decrypting it the same way it does for
 * axios. The meta tag remains only as a fallback for the case where the cookie
 * is missing entirely.
 *
 * Requests made through Inertia (`router.post`, `useForm`) already handle this
 * via axios — this is only for direct `fetch`.
 */
export function csrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);

    if (match) {
        return decodeURIComponent(match[1]);
    }

    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

/** Spread into a `fetch` headers object: `{ ...csrfHeaders(), Accept: '...' }`. */
export function csrfHeaders(): Record<string, string> {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);

    if (match) {
        return { 'X-XSRF-TOKEN': decodeURIComponent(match[1]) };
    }

    return { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '' };
}
