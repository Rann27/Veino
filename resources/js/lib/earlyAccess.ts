import { useEffect, useState } from 'react';

/**
 * Premium early access: a new premium chapter is members-only for a set number
 * of days before the free unlock opens. The server sends the seconds left, and
 * the countdown runs from when the page loaded, so a device clock that is off
 * by a few minutes cannot open the button before the server will honour it.
 */

/** "3d" while a day or more remains, then "05:07:09". */
export function formatOpensIn(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds));

    if (s >= 86400) {
        return `${Math.floor(s / 86400)}d`;
    }

    const pad = (n: number) => String(n).padStart(2, '0');

    return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/**
 * Seconds since the page loaded, for lists that count many chapters down off
 * one timer. Ticks every second only when asked to (something on screen is
 * under a day away); otherwise once a minute is plenty for "3d".
 */
export function useElapsedSeconds(everySecond: boolean): number {
    const [startedAt] = useState(() => Date.now());
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = window.setInterval(() => setNow(Date.now()), everySecond ? 1000 : 60_000);

        return () => window.clearInterval(id);
    }, [everySecond]);

    return Math.floor((now - startedAt) / 1000);
}

/**
 * Seconds left, ticking down from the value the page was served with.
 *
 * Ticks once a second only while under a day is left; above that the display
 * reads in whole days and a per-second re-render would be wasted work.
 */
export function useCountdown(initialSeconds: number | null | undefined): number | null {
    const [startedAt] = useState(() => Date.now());
    const [now, setNow] = useState(() => Date.now());

    const left = initialSeconds == null
        ? null
        : Math.max(0, initialSeconds - Math.floor((now - startedAt) / 1000));

    useEffect(() => {
        if (left === null || left <= 0) return;

        const delay = left > 86400 ? 60_000 : 1000;
        const id = window.setInterval(() => setNow(Date.now()), delay);

        return () => window.clearInterval(id);
    }, [left === null, left !== null && left <= 0, left !== null && left > 86400]);

    return left;
}
