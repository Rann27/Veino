/**
 * Carries a voucher code from where it was offered (the homepage strip, the
 * monthly modal) to the checkout that applies it, across a login redirect if
 * need be. The URL carries it on the way in (`?voucher=CODE`); storage keeps
 * it for a reader who has to sign in or fill a cart first.
 */
const KEY = 'veinovel-pending-voucher';

/** Long enough to sign in and pick a package; short enough not to linger. */
const TTL_MS = 2 * 60 * 60 * 1000;

export type AutoVoucherKind = 'daily' | 'weekly' | 'monthly';

export interface AutoVoucher {
    kind: AutoVoucherKind;
    code: string;
    discount: number;
    expires_at: string;
    seconds_left: number;
    claimed: boolean;
    period: string;
}

export function rememberVoucher(code: string): void {
    try {
        localStorage.setItem(KEY, JSON.stringify({ code, at: Date.now() }));
    } catch {
        // Private mode or storage off: the URL parameter still carries it.
    }
}

/** The code to pre-fill: the URL's first, else a recent hand-off. */
export function pendingVoucher(): string | null {
    const fromUrl = new URLSearchParams(window.location.search).get('voucher');
    if (fromUrl) return fromUrl.toUpperCase();

    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        const { code, at } = JSON.parse(raw) as { code: string; at: number };
        if (Date.now() - at > TTL_MS) {
            localStorage.removeItem(KEY);
            return null;
        }
        return code;
    } catch {
        return null;
    }
}

export function clearPendingVoucher(): void {
    try {
        localStorage.removeItem(KEY);
    } catch {
        // nothing to clear
    }
}

/** "2d 05:07" while days remain, then "05:07:09". */
export function formatVoucherCountdown(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds));
    const pad = (n: number) => String(n).padStart(2, '0');
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);

    return d > 0 ? `${d}d ${pad(h)}:${pad(m)}` : `${pad(h)}:${pad(m)}:${pad(s % 60)}`;
}

export const VOUCHER_LABEL: Record<AutoVoucherKind, string> = {
    daily: 'Daily Voucher',
    weekly: 'Weekly Voucher',
    monthly: 'Monthly Mega Voucher',
};
