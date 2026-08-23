/**
 * Helpers for making file uploads survive the host's web application firewall.
 *
 * An upload's filename travels in the multipart Content-Disposition header, and
 * the WAF inspects that header before the request ever reaches PHP. Characters
 * that look like injection payloads — an apostrophe above all, as in
 * "Humanity's Extinction Vol 1.epub" — trip the SQL-injection rules and the
 * request dies with a bare 403 from the web server. Nothing reaches Laravel, so
 * there is no log entry and no validation message to explain it.
 *
 * Sanitising server-side would be too late. It has to happen before the request
 * leaves the browser.
 *
 * Losing the original name costs nothing: Laravel stores every upload under a
 * generated hash, and downloads are named after the item title, not the file
 * that was uploaded.
 */

/** Anything outside this set is not worth the risk in a filename. */
const UNSAFE = /[^A-Za-z0-9._-]+/g;

export function sanitizeFileName(name: string, fallback = 'upload'): string {
    const lastDot = name.lastIndexOf('.');

    // `lastDot === 0` still counts: a name like ".epub" has no base but the
    // extension has to survive, or the upload fails the `extensions:` rule.
    const hasExtension = lastDot >= 0 && lastDot < name.length - 1;

    const rawBase = hasExtension ? name.slice(0, lastDot) : name;
    const rawExtension = hasExtension ? name.slice(lastDot + 1) : '';

    // The extension is what Laravel's `extensions:epub` rule checks, so it has
    // to survive intact — only strip characters that could never belong to one.
    const extension = rawExtension.replace(/[^A-Za-z0-9]/g, '').toLowerCase();

    const base = rawBase
        .replace(UNSAFE, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^[._-]+|[._-]+$/g, '')
        .slice(0, 80) || fallback;

    return extension ? `${base}.${extension}` : base;
}

/**
 * Returns the same file with a WAF-safe name, or the original when its name is
 * already clean (so the common case copies nothing).
 */
export function safeFile(file: File): File {
    const cleaned = sanitizeFileName(file.name);

    if (cleaned === file.name) {
        return file;
    }

    return new File([file], cleaned, {
        type: file.type,
        lastModified: file.lastModified,
    });
}

/** Appends a file to a FormData payload under a sanitised name. */
export function appendFile(data: FormData, key: string, file: File): void {
    data.append(key, safeFile(file));
}
