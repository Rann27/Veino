import React, { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { useToast } from '@/Contexts/ToastContext';
import { formatVoucherCountdown, rememberVoucher, type AutoVoucher } from '@/lib/voucherHandoff';

/**
 * The monthly first-come voucher, offered once per visit while it is still
 * unclaimed (the 1st to the 3rd of each month).
 *
 *  - "Once per visit": sessionStorage, so a new tab or tomorrow shows it again.
 *  - "Don't show again until next month": localStorage, keyed by the month,
 *    so next month's voucher is offered as normal.
 *  - Never interrupts a checkout or a sign-in already under way.
 */
const SEEN_KEY = 'veinovel-monthly-voucher-seen';
const MUTED_KEY = 'veinovel-monthly-voucher-muted';
const QUIET_PAGES = ['Shop', 'MyChart', 'Auth/Index', 'Auth/ForgotPassword', 'Auth/ResetPassword', 'UserBanned'];

const GRADIENT = 'linear-gradient(135deg, #6d28d9 0%, #9333ea 45%, #f59e0b 100%)';

function readStore(store: Storage | undefined, key: string): string | null {
    try { return store?.getItem(key) ?? null; } catch { return null; }
}
function writeStore(store: Storage | undefined, key: string, value: string): void {
    try { store?.setItem(key, value); } catch { /* storage off: shows again, harmless */ }
}

export default function MonthlyVoucherModal() {
    const { props, component } = usePage<{ monthlyVoucher?: AutoVoucher | null }>();
    const voucher = props.monthlyVoucher ?? null;
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [mute, setMute] = useState(false);
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!voucher || voucher.claimed || open) return;
        if (QUIET_PAGES.includes(component)) return;
        if (readStore(window.localStorage, MUTED_KEY) === voucher.period) return;
        if (readStore(window.sessionStorage, SEEN_KEY) === voucher.period) return;

        // A beat after the page settles, so it reads as an offer rather than
        // a wall in front of the content.
        const t = window.setTimeout(() => {
            writeStore(window.sessionStorage, SEEN_KEY, voucher.period);
            setOpen(true);
        }, 1500);

        return () => window.clearTimeout(t);
    }, [voucher?.period, voucher?.claimed, component]);

    useEffect(() => {
        if (!open) return;
        const started = Date.now();
        const tick = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
        window.addEventListener('keydown', onKey);

        return () => { window.clearInterval(tick); window.removeEventListener('keydown', onKey); };
    }, [open]);

    if (!open || !voucher) return null;

    const left = Math.max(0, voucher.seconds_left - elapsed);

    function close() {
        if (mute && voucher) writeStore(window.localStorage, MUTED_KEY, voucher.period);
        setOpen(false);
    }

    const go = (url: string) => {
        if (mute) writeStore(window.localStorage, MUTED_KEY, voucher.period);
        rememberVoucher(voucher.code);
        setOpen(false);
        router.visit(url);
    };

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(voucher.code);
            toast.success('Paste it at checkout. First one to use it wins.', `${voucher.code} copied`);
        } catch {
            toast.info(`Your code: ${voucher.code}`);
        }
    };

    const code = encodeURIComponent(voucher.code);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="monthly-voucher-title">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

            <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ background: GRADIENT }}>
                {/* soft light blobs */}
                <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, #fde68a, transparent 70%)' }} />
                <div className="pointer-events-none absolute -bottom-20 -left-16 w-56 h-56 rounded-full opacity-25" style={{ background: 'radial-gradient(circle, #c4b5fd, transparent 70%)' }} />

                <button type="button" onClick={close} aria-label="Close"
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /></svg>
                </button>

                <div className="relative px-6 pt-8 pb-6 text-center text-white">
                    <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-200">Monthly Mega Voucher</p>
                    <h2 id="monthly-voucher-title" className="mt-2 leading-none font-extrabold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        <span className="text-7xl sm:text-8xl drop-shadow-lg">{voucher.discount}%</span>
                        <span className="block text-2xl tracking-widest mt-1">OFF</span>
                    </h2>
                    <p className="mt-3 text-sm text-white/85">
                        Membership or epub. <b>One reader only</b>: the first to check out with it wins.
                    </p>

                    <div className="mt-5 flex items-center justify-center gap-2">
                        <span className="px-4 py-2 rounded-lg font-mono text-lg font-bold tracking-widest bg-white/15 border border-dashed border-white/60 select-all">
                            {voucher.code}
                        </span>
                        <button type="button" onClick={copy} className="px-3 py-2 rounded-lg text-sm font-semibold bg-white/20 hover:bg-white/30 transition">
                            Copy
                        </button>
                    </div>
                    <p className="mt-2 text-xs text-white/75">
                        Ends in <span className="font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatVoucherCountdown(left)}</span>
                    </p>

                    <div className="mt-6 grid gap-2">
                        <button type="button" onClick={() => go(`/shop?tab=membership&voucher=${code}`)}
                            className="w-full py-3 rounded-xl font-bold text-violet-900 bg-amber-300 hover:bg-amber-200 shadow-lg transition">
                            Use on Membership →
                        </button>
                        <button type="button" onClick={() => go(`/my-chart?voucher=${code}`)}
                            className="w-full py-2.5 rounded-xl font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/30 transition">
                            Use on Epub Checkout
                        </button>
                    </div>

                    <label className="mt-5 inline-flex items-center gap-2 text-xs text-white/80 cursor-pointer select-none">
                        <input type="checkbox" checked={mute} onChange={(e) => setMute(e.target.checked)} className="w-3.5 h-3.5 accent-amber-300" />
                        Don&apos;t show again until next month
                    </label>
                </div>
            </div>
        </div>
    );
}
