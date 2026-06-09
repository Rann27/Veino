import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme, SHINY_PURPLE } from '@/Contexts/ThemeContext';
import PremiumDiamond from '@/Components/PremiumDiamond';

type RequestType = 'request' | 'commission';
type RequestStatus = 'pending' | 'approved' | 'billed' | 'on_queue' | 'completed';

interface RequestItem {
    id: number;
    type: RequestType;
    title: string;
    raw_link?: string | null;
    note_for_admin?: string | null;
    is_private: boolean;
    email: string;
    status: RequestStatus;
    bill_amount?: number | null;
    admin_note?: string | null;
    paid_at?: string | null;
    created_at: string;
}

interface Props {
    [key: string]: unknown;
    requests: RequestItem[];
    auth?: {
        user?: {
            email: string;
            coins: number;
        };
    };
    flash?: {
        request_commission_sent?: { type: RequestType };
        success?: string | null;
        error?: string | null;
    };
    errors?: Record<string, string>;
}

function hexToRgb(hex: string) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function isLight(hex: string) {
    const { r, g, b } = hexToRgb(hex);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

function wa(hex: string, alpha: number) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${alpha})`;
}

function statusLabel(status: RequestStatus) {
    return status.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function getSafeExternalUrl(value?: string | null) {
    if (!value) return null;

    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch {
        return null;
    }
}

function RequestPageContent({ requests }: { requests: RequestItem[] }) {
    const page = usePage<Props>();
    const { auth, flash, errors = {} } = page.props;
    const { currentTheme } = useTheme();
    const light = isLight(currentTheme.background);
    const fg = currentTheme.foreground;
    const bg = currentTheme.background;
    const muted = wa(fg, 0.55);
    const border = wa(fg, 0.12);
    const cardBg = light ? wa(fg, 0.03) : wa(fg, 0.06);
    const panelBg = light ? wa(fg, 0.055) : wa(fg, 0.09);
    const inputBg = light ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.055)';
    const accent = SHINY_PURPLE;

    const [activeTab, setActiveTab] = useState<'form' | 'mine'>(() => {
        if (typeof window === 'undefined') return 'form';

        return new URLSearchParams(window.location.search).get('tab') === 'mine' ? 'mine' : 'form';
    });
    const [type, setType] = useState<RequestType>('request');
    const [title, setTitle] = useState('');
    const [rawLink, setRawLink] = useState('');
    const [noteForAdmin, setNoteForAdmin] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [email, setEmail] = useState(auth?.user?.email || '');
    const [submitting, setSubmitting] = useState(false);
    const [sentType, setSentType] = useState<RequestType | null>(null);
    const [payingItem, setPayingItem] = useState<RequestItem | null>(null);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        if (flash?.request_commission_sent?.type) {
            setSentType(flash.request_commission_sent.type);
            setActiveTab('mine');
            setTitle('');
            setRawLink('');
            setNoteForAdmin('');
            setIsPrivate(false);
        }
    }, [flash?.request_commission_sent]);

    const sortedRequests = useMemo(() => requests, [requests]);
    const userCoins = auth?.user?.coins ?? 0;

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        setSubmitting(true);

        router.post(route('request.store'), {
            type,
            title,
            raw_link: rawLink,
            note_for_admin: noteForAdmin,
            is_private: type === 'commission' ? isPrivate : false,
            email,
        }, {
            preserveScroll: true,
            onFinish: () => setSubmitting(false),
        });
    };

    const handlePay = () => {
        if (!payingItem || paying) return;

        setPaying(true);

        router.post(route('request.pay', payingItem.id), {}, {
            preserveScroll: true,
            onSuccess: () => setPayingItem(null),
            onFinish: () => setPaying(false),
        });
    };

    const inputStyle = (hasError = false): React.CSSProperties => ({
        width: '100%',
        borderRadius: 10,
        border: `1px solid ${hasError ? '#ef4444' : border}`,
        background: inputBg,
        color: fg,
        outline: 'none',
        padding: '0.8rem 0.95rem',
        fontSize: '0.93rem',
    });

    const statusColors: Record<RequestStatus, { color: string; bg: string; border: string }> = {
        pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.13)', border: 'rgba(245,158,11,0.28)' },
        approved: { color: '#22c55e', bg: 'rgba(34,197,94,0.13)', border: 'rgba(34,197,94,0.28)' },
        billed: { color: '#fbbf24', bg: 'rgba(251,191,36,0.13)', border: 'rgba(251,191,36,0.3)' },
        on_queue: { color: '#60a5fa', bg: 'rgba(96,165,250,0.13)', border: 'rgba(96,165,250,0.28)' },
        completed: { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.35)' },
    };

    return (
        <div style={{ minHeight: '100vh', background: bg, color: fg }}>
            <Head title="Request / Commission" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-4"
                        style={{ color: accent, background: `${accent}18`, border: `1px solid ${accent}25` }}>
                        <PremiumDiamond size={13} />
                        Request Desk
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Request / Commission</h1>
                    <p className="mt-2 text-sm sm:text-base" style={{ color: muted }}>
                        Recommend a novel, or commission a translation for priority.
                    </p>
                </div>

                <div className="inline-flex p-1 rounded-xl mb-6" style={{ background: panelBg, border: `1px solid ${border}` }}>
                    <button type="button" onClick={() => setActiveTab('form')}
                        className="px-4 py-2 rounded-lg text-sm font-bold transition"
                        style={{ background: activeTab === 'form' ? accent : 'transparent', color: activeTab === 'form' ? '#fff' : muted }}>
                        Request/Commission
                    </button>
                    <button type="button" onClick={() => setActiveTab('mine')}
                        className="px-4 py-2 rounded-lg text-sm font-bold transition"
                        style={{ background: activeTab === 'mine' ? accent : 'transparent', color: activeTab === 'mine' ? '#fff' : muted }}>
                        My Request/Commission
                    </button>
                </div>

                {flash?.error && (
                    <div className="mb-5 rounded-xl px-4 py-3 text-sm font-semibold" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                        {flash.error}
                    </div>
                )}
                {flash?.success && (
                    <div className="mb-5 rounded-xl px-4 py-3 text-sm font-semibold" style={{ color: '#22c55e', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                        {flash.success}
                    </div>
                )}

                {activeTab === 'form' ? (
                    <form onSubmit={handleSubmit} className="max-w-3xl rounded-2xl p-5 sm:p-6 space-y-5"
                        style={{ background: cardBg, border: `1px solid ${border}` }}>
                        <div>
                            <label className="block text-sm font-bold mb-2">Type</label>
                            <div className="inline-flex p-1 rounded-xl" style={{ background: panelBg, border: `1px solid ${border}` }}>
                                {(['request', 'commission'] as RequestType[]).map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => setType(item)}
                                        className="px-4 py-2 rounded-lg text-sm font-bold capitalize transition"
                                        style={{ background: type === item ? accent : 'transparent', color: type === item ? '#fff' : fg }}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                            <p className="mt-2 text-sm" style={{ color: muted }}>
                                {type === 'request'
                                    ? 'Recommend your favorite novel.'
                                    : 'Get your favorite novels translated faster.'}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">Title</label>
                            <input value={title} onChange={(event) => setTitle(event.target.value)} style={inputStyle(!!errors.title)} required />
                            <p className="mt-2 text-xs" style={{ color: muted }}>
                                You can paste the original title.
                            </p>
                            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">Raw Link</label>
                            <textarea value={rawLink} onChange={(event) => setRawLink(event.target.value)} rows={4} style={{ ...inputStyle(!!errors.raw_link), resize: 'vertical' }} />
                            <p className="mt-2 text-xs" style={{ color: muted }}>
                                You can paste an http or https file link, or an official store page link.
                            </p>
                            {errors.raw_link && <p className="mt-1 text-xs text-red-500">{errors.raw_link}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">Note for Admin</label>
                            <textarea value={noteForAdmin} onChange={(event) => setNoteForAdmin(event.target.value)} rows={4} style={{ ...inputStyle(!!errors.note_for_admin), resize: 'vertical' }} />
                            <p className="mt-2 text-xs" style={{ color: muted }}>
                                Add any extra details, preferences, or context that may help us review it.
                            </p>
                            {errors.note_for_admin && <p className="mt-1 text-xs text-red-500">{errors.note_for_admin}</p>}
                        </div>

                        {type === 'commission' && (
                            <div>
                                <label className="block text-sm font-bold mb-2">Private Commission</label>
                                <div className="flex gap-3">
                                    {[
                                        { label: 'Yes', value: true },
                                        { label: 'No', value: false },
                                    ].map((option) => (
                                        <label key={option.label} className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer"
                                            style={{ background: isPrivate === option.value ? `${accent}18` : panelBg, border: `1px solid ${isPrivate === option.value ? accent : border}` }}>
                                            <input type="radio" checked={isPrivate === option.value} onChange={() => setIsPrivate(option.value)} />
                                            <span className="text-sm font-semibold">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="mt-2 text-xs" style={{ color: muted }}>
                                    {isPrivate ? "We won't release it on the site." : 'We will make it free for everyone.'}
                                </p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold mb-2">Your Email</label>
                            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} style={inputStyle(!!errors.email)} required />
                            <p className="mt-2 text-xs" style={{ color: muted }}>
                                We will contact you about your {type === 'request' ? 'request' : 'commission'} by email.
                            </p>
                            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                        </div>

                        <button type="submit" disabled={submitting}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl font-extrabold transition disabled:opacity-60"
                            style={{ background: accent, color: '#fff' }}>
                            {submitting ? 'Sending...' : `Send ${type === 'request' ? 'Request' : 'Commission'}`}
                        </button>
                    </form>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {sortedRequests.length === 0 ? (
                            <div className="lg:col-span-2 rounded-2xl p-8 text-center" style={{ background: cardBg, border: `1px solid ${border}`, color: muted }}>
                                No request or commission yet.
                            </div>
                        ) : sortedRequests.map((item) => {
                            const color = statusColors[item.status];
                            const canPay = item.type === 'commission' && item.status === 'billed' && !!item.bill_amount;
                            const insufficient = canPay && userCoins < (item.bill_amount || 0);
                            const safeRawLink = getSafeExternalUrl(item.raw_link);

                            return (
                                <div key={item.id} className="rounded-2xl p-5" style={{ background: cardBg, border: `1px solid ${border}` }}>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: item.type === 'commission' ? accent : '#60a5fa' }}>
                                                {item.type === 'commission' ? 'Commission' : 'Request'}
                                            </div>
                                            <h3 className="text-lg font-extrabold leading-snug">{item.title}</h3>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                                            style={{ color: color.color, background: color.bg, border: `1px solid ${color.border}` }}>
                                            {statusLabel(item.status)}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm" style={{ color: muted }}>
                                        {item.raw_link && (
                                            <div>
                                                <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: wa(fg, 0.42) }}>Raw Link</div>
                                                {safeRawLink ? (
                                                    <a href={safeRawLink} target="_blank" rel="noreferrer" className="break-all hover:underline" style={{ color: fg }}>
                                                        {item.raw_link}
                                                    </a>
                                                ) : (
                                                    <span className="break-all" style={{ color: fg }}>
                                                        {item.raw_link}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {item.note_for_admin && (
                                            <div>
                                                <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: wa(fg, 0.42) }}>Your Note</div>
                                                <p style={{ color: fg }}>{item.note_for_admin}</p>
                                            </div>
                                        )}
                                        <p>Email: <span style={{ color: fg }}>{item.email}</span></p>
                                        {item.type === 'commission' && <p>Private: <span style={{ color: fg }}>{item.is_private ? 'Yes' : 'No'}</span></p>}
                                        <p>Submitted: <span style={{ color: fg }}>{new Date(item.created_at).toLocaleDateString()}</span></p>
                                    </div>

                                    {item.admin_note && (
                                        <div className="mt-4 rounded-xl p-3 text-sm" style={{ background: panelBg, border: `1px solid ${border}` }}>
                                            <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: accent }}>Admin Note</div>
                                            <p style={{ color: fg }}>{item.admin_note}</p>
                                        </div>
                                    )}

                                    {canPay && (
                                        <div className="mt-4 rounded-xl p-4" style={{ background: `${SHINY_PURPLE}12`, border: `1px solid ${SHINY_PURPLE}35` }}>
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <div className="text-xs font-bold uppercase tracking-wide" style={{ color: muted }}>Commission Bill</div>
                                                    <div className="text-2xl font-extrabold text-amber-400">¢{item.bill_amount?.toLocaleString()}</div>
                                                </div>
                                                <button type="button" onClick={() => setPayingItem(item)} disabled={insufficient}
                                                    className="px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-60"
                                                    style={{ background: insufficient ? wa(fg, 0.18) : SHINY_PURPLE, color: insufficient ? muted : '#fff' }}>
                                                    {insufficient ? 'Insufficient Coins' : 'Pay Now'}
                                                </button>
                                            </div>
                                            {insufficient && (
                                                <p className="mt-2 text-xs" style={{ color: muted }}>
                                                    Your balance is ¢{userCoins.toLocaleString()}.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {sentType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.62)' }}>
                    <div className="w-full max-w-md rounded-2xl p-6 text-center" style={{ background: bg, border: `1px solid ${border}`, boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}>
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-extrabold mb-2">
                            {sentType === 'request' ? 'Your Request has been sent!' : 'Your Commission Request has been sent!'}
                        </h2>
                        <p className="text-sm leading-relaxed" style={{ color: muted }}>
                            {sentType === 'request'
                                ? 'You can check the status on the Request page, under the My Request/Commission tab.'
                                : 'We will calculate and send the bill in a few hours. You can check it on the Request page under My Request/Commission, or wait for our email. You will pay the commission with coins (¢).'}
                        </p>
                        <button type="button" onClick={() => setSentType(null)} className="mt-5 px-6 py-2.5 rounded-xl font-bold" style={{ background: accent, color: '#fff' }}>
                            Okay
                        </button>
                    </div>
                </div>
            )}

            {payingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.62)' }}>
                    <div className="w-full max-w-md rounded-2xl p-6" style={{ background: bg, border: `1px solid ${border}`, boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}>
                        <h2 className="text-xl font-extrabold mb-2">Pay Commission</h2>
                        <p className="text-sm mb-4" style={{ color: muted }}>
                            Pay ¢{payingItem.bill_amount?.toLocaleString()} for "{payingItem.title}"? Your current balance is ¢{userCoins.toLocaleString()}.
                        </p>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setPayingItem(null)} disabled={paying} className="flex-1 py-2.5 rounded-xl font-bold disabled:opacity-60" style={{ background: panelBg, color: fg, border: `1px solid ${border}` }}>
                                Cancel
                            </button>
                            <button type="button" onClick={handlePay} disabled={paying} className="flex-1 py-2.5 rounded-xl font-bold disabled:opacity-70" style={{ background: accent, color: '#fff' }}>
                                {paying ? 'Processing...' : 'Pay Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function RequestIndex(props: Props) {
    return (
        <UserLayout title="Request / Commission">
            <RequestPageContent requests={props.requests} />
        </UserLayout>
    );
}
