/**
 * Per-device reading state: which chapters have been opened, and how far into
 * one the reader had scrolled.
 *
 * This lives in localStorage rather than the database on purpose. Guests get
 * the same "visited link" cue and the same resume prompt as members, and a
 * scroll position updates far too often to be worth a round trip. For signed-in
 * readers the server still sends the authoritative visited list, which syncs
 * across devices; the two are merged on the page.
 *
 * Every read is defensive: private browsing and storage-full both throw on
 * access, and a reader losing their place is never worth a crashed page.
 */

const VISITED_KEY = 'veinovel:visited-chapters';
const SCROLL_KEY = 'veinovel:chapter-scroll';

/** Keeps localStorage bounded — oldest entries fall off first. */
const MAX_SERIES_TRACKED = 60;
const MAX_SCROLL_ENTRIES = 200;

function read<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function write(key: string, value: unknown): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        /* private mode or quota exceeded — reading state is not worth a throw */
    }
}

// ─── Visited chapters ─────────────────────────────────────────────────────────

type VisitedMap = Record<string, number[]>;

export function markChapterVisited(seriesId: number, chapterId: number): void {
    const map = read<VisitedMap>(VISITED_KEY, {});
    const key = String(seriesId);
    const current = map[key] ?? [];

    if (current.includes(chapterId)) {
        return;
    }

    map[key] = [...current, chapterId];

    // Trim the least recently touched series once the map grows too large.
    const keys = Object.keys(map);
    if (keys.length > MAX_SERIES_TRACKED) {
        for (const stale of keys.slice(0, keys.length - MAX_SERIES_TRACKED)) {
            delete map[stale];
        }
    }

    write(VISITED_KEY, map);
}

export function getVisitedChapters(seriesId: number): number[] {
    return read<VisitedMap>(VISITED_KEY, {})[String(seriesId)] ?? [];
}

// ─── Scroll position ──────────────────────────────────────────────────────────

type ScrollMap = Record<string, { percent: number; at: number }>;

/** `percent` is 0–100 of the scrollable height. */
export function saveScrollPosition(chapterId: number, percent: number): void {
    const map = read<ScrollMap>(SCROLL_KEY, {});
    map[String(chapterId)] = { percent, at: Date.now() };

    const entries = Object.entries(map);
    if (entries.length > MAX_SCROLL_ENTRIES) {
        entries.sort((a, b) => b[1].at - a[1].at);
        write(SCROLL_KEY, Object.fromEntries(entries.slice(0, MAX_SCROLL_ENTRIES)));
        return;
    }

    write(SCROLL_KEY, map);
}

export function getScrollPosition(chapterId: number): number | null {
    const entry = read<ScrollMap>(SCROLL_KEY, {})[String(chapterId)];

    return entry ? entry.percent : null;
}

export function clearScrollPosition(chapterId: number): void {
    const map = read<ScrollMap>(SCROLL_KEY, {});

    if (map[String(chapterId)]) {
        delete map[String(chapterId)];
        write(SCROLL_KEY, map);
    }
}
