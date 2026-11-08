import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';
import { useToast } from '@/Contexts/ToastContext';
import { formatVoucherCountdown, rememberVoucher, VOUCHER_LABEL, type AutoVoucher } from '@/lib/voucherHandoff';

/**
 * Today's and this week's first-come vouchers, right under the announcements
 * and dressed like them, with their own accent: amber for daily, emerald for
 * weekly. A claimed voucher stays on show, greyed out, so readers learn the
 * vouchers are real and go fast.
 */
const ACCENT: Record<'daily' | 'weekly', string> = {
    daily: '#d97706',
    weekly: '#059669',
};

function TicketIcon({ color }: { color: string }) {
    return (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke={color} strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9a2 2 0 0 0 2-2V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v1a2 2 0 0 0 0 4v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-1a2 2 0 0 0-2-2Z" transform="translate(0 3)" />
            <path d="M14 8v8" strokeDasharray="2 2" />
        </svg>
    );
}

export default function AutoVoucherStrip({ vouchers }: { vouchers: AutoVoucher[] }) {
    const { currentTheme } = useTheme();
    const { toast } = useToast();
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (vouchers.length === 0) return;
        const started = Date.now();
        const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);

        return () => window.clearInterval(id);
    }, [vouchers.length]);

    const shown = vouchers
        .filter((v) => v.kind === 'daily' || v.kind === 'weekly')
        .filter((v) => v.seconds_left - elapsed > 0);

    if (shown.length === 0) return null;

    const copy = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            toast.success(`Use it at checkout before someone else does.`, `${code} copied`);
        } catch {
            toast.info(`Your code: ${code}`);
        }
    };

    const use = (code: string) => {
        rememberVoucher(code);
        router.visit(`/shop?tab=membership&voucher=${encodeURIComponent(code)}`);
    };

    return (
        <div className="space-y-2">
            {shown.map((v) => {
                const kind = v.kind as 'daily' | 'weekly';
                const accent = v.claimed ? `${currentTheme.foreground}55` : ACCENT[kind];
                const left = Math.max(0, v.seconds_left - elapsed);

                return (
                    <div
                        key={v.kind}
                        className="rounded-lg py-3 px-4 flex flex-wrap items-center gap-x-3 gap-y-2 transition-all duration-200"
                        style={{
                            backgroundColor: v.claimed ? `${currentTheme.foreground}06` : `${ACCENT[kind]}14`,
                            borderLeft: `4px solid ${accent}`,
                            filter: v.claimed ? 'grayscale(1)' : undefined,
                            opacity: v.claimed ? 0.7 : 1,
                        }}
                        aria-disabled={v.claimed}
                    >
                        <div className="flex-shrink-0"><TicketIcon color={accent} /></div>

                        <div className="flex-grow min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base truncate" style={{ color: currentTheme.foreground }}>
                                {VOUCHER_LABEL[kind]}: <span style={{ color: accent }}>{v.discount}% OFF</span>
                                {v.claimed && <span className="font-normal" style={{ color: `${currentTheme.foreground}70` }}> (claimed)</span>}
                            </h3>
                            <p className="text-xs truncate" style={{ color: `${currentTheme.foreground}65` }}>
                                {v.claimed
                                    ? 'Someone got there first. Watch for the next one!'
                                    : <>Membership &amp; epub · first come, first served · ends in <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatVoucherCountdown(left)}</span></>}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                                className="px-2.5 py-1 rounded-md text-xs sm:text-sm font-mono font-bold tracking-wider select-all"
                                style={{
                                    color: accent,
                                    border: `1px dashed ${accent}`,
                                    textDecoration: v.claimed ? 'line-through' : undefined,
                                }}
                            >
                                {v.code}
                            </span>
                            {!v.claimed && (
                                <>
                                    <button type="button" onClick={() => copy(v.code)}
                                        className="px-2.5 py-1 rounded-md text-xs font-semibold transition-opacity hover:opacity-80"
                                        style={{ color: accent, backgroundColor: `${ACCENT[kind]}1f` }}>
                                        Copy
                                    </button>
                                    <button type="button" onClick={() => use(v.code)}
                                        className="px-2.5 py-1 rounded-md text-xs font-semibold text-white transition-opacity hover:opacity-90"
                                        style={{ backgroundColor: ACCENT[kind] }}>
                                        Use →
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
