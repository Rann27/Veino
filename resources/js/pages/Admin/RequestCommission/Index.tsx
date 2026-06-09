import React, { FormEvent, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTheme, SHINY_PURPLE } from '@/Contexts/ThemeContext';

type RequestType = 'request' | 'commission';
type RequestStatus = 'pending' | 'approved' | 'billed' | 'on_queue' | 'completed';

interface User {
    id: number;
    display_name?: string;
    email: string;
    coins: number;
}

interface RequestItem {
    id: number;
    user: User;
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

interface Paginated<T> {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    total: number;
}

interface Props {
    items: Paginated<RequestItem>;
    filters: {
        type: string;
        status: string;
    };
    stats: {
        pending: number;
        billed: number;
        on_queue: number;
        completed: number;
    };
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

function EditPanel({ item, onClose, fg, muted, border, cardBg, inputBg, accent }: {
    item: RequestItem;
    onClose: () => void;
    fg: string;
    muted: string;
    border: string;
    cardBg: string;
    inputBg: string;
    accent: string;
}) {
    const [status, setStatus] = useState<RequestStatus>(item.status);
    const [billAmount, setBillAmount] = useState(item.bill_amount?.toString() || '');
    const [adminNote, setAdminNote] = useState(item.admin_note || '');
    const [saving, setSaving] = useState(false);

    const statuses: RequestStatus[] = item.type === 'request'
        ? ['pending', 'approved']
        : ['pending', 'billed', 'on_queue', 'completed'];

    const inputStyle: React.CSSProperties = {
        width: '100%',
        borderRadius: 10,
        border: `1px solid ${border}`,
        background: inputBg,
        color: fg,
        outline: 'none',
        padding: '0.75rem 0.9rem',
        fontSize: '0.9rem',
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        setSaving(true);

        router.put(route('admin.request-commission.update', item.id), {
            status,
            bill_amount: billAmount,
            admin_note: adminNote,
        }, {
            preserveScroll: true,
            onSuccess: onClose,
            onFinish: () => setSaving(false),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.62)' }}>
            <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl p-5 space-y-4" style={{ background: cardBg, border: `1px solid ${border}`, boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-extrabold" style={{ color: fg }}>Update Request</h2>
                        <p className="text-sm mt-1" style={{ color: muted }}>{item.title}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-2xl leading-none" style={{ color: muted }}>×</button>
                </div>

                <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: fg }}>Status</label>
                    <select value={status} onChange={(event) => setStatus(event.target.value as RequestStatus)} style={inputStyle}>
                        {statuses.map((statusOption) => (
                            <option key={statusOption} value={statusOption}>{statusLabel(statusOption)}</option>
                        ))}
                    </select>
                </div>

                {item.type === 'commission' && (
                    <div>
                        <label className="block text-sm font-bold mb-2" style={{ color: fg }}>Bill Amount (coins)</label>
                        <input type="number" min={1} value={billAmount} onChange={(event) => setBillAmount(event.target.value)} style={inputStyle} placeholder="e.g. 2500" />
                        <p className="mt-1 text-xs" style={{ color: muted }}>Visible to user when status is Billed.</p>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: fg }}>Admin Note</label>
                    <textarea rows={5} value={adminNote} onChange={(event) => setAdminNote(event.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl font-bold" style={{ background: wa(fg, 0.08), color: fg, border: `1px solid ${border}` }}>
                        Cancel
                    </button>
                    <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl font-bold disabled:opacity-60" style={{ background: accent, color: '#fff' }}>
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function RequestCommissionContent({ items, filters, stats }: Props) {
    const { currentTheme } = useTheme();
    const page = usePage<{ flash?: { success?: string; error?: string } }>();
    const light = isLight(currentTheme.background);
    const fg = currentTheme.foreground;
    const bg = currentTheme.background;
    const muted = wa(fg, 0.5);
    const border = wa(fg, 0.12);
    const cardBg = light ? wa(fg, 0.035) : wa(fg, 0.065);
    const panelBg = light ? wa(fg, 0.055) : wa(fg, 0.09);
    const inputBg = light ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.055)';
    const accent = light ? '#7c3aed' : SHINY_PURPLE;
    const [editing, setEditing] = useState<RequestItem | null>(null);

    const statusColors: Record<RequestStatus, { color: string; bg: string; border: string }> = {
        pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.13)', border: 'rgba(245,158,11,0.28)' },
        approved: { color: '#22c55e', bg: 'rgba(34,197,94,0.13)', border: 'rgba(34,197,94,0.28)' },
        billed: { color: '#fbbf24', bg: 'rgba(251,191,36,0.13)', border: 'rgba(251,191,36,0.3)' },
        on_queue: { color: '#60a5fa', bg: 'rgba(96,165,250,0.13)', border: 'rgba(96,165,250,0.28)' },
        completed: { color: SHINY_PURPLE, bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.35)' },
    };

    const updateFilter = (key: 'type' | 'status', value: string) => {
        router.get(route('admin.request-commission.index'), {
            ...filters,
            [key]: value,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <div style={{ color: fg }}>
            <Head title="Request / Commission" />

            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold">Request / Commission</h1>
                    <p className="text-sm mt-1" style={{ color: muted }}>Manage user requests, commission billing, and queue progress.</p>
                </div>
            </div>

            {page.props.flash?.success && (
                <div className="mb-5 rounded-xl px-4 py-3 text-sm font-semibold" style={{ color: '#22c55e', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                    {page.props.flash.success}
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                    ['Pending', stats.pending, '#f59e0b'],
                    ['Billed', stats.billed, '#fbbf24'],
                    ['On Queue', stats.on_queue, '#60a5fa'],
                    ['Completed', stats.completed, SHINY_PURPLE],
                ].map(([label, value, color]) => (
                    <div key={String(label)} className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
                        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: muted }}>{label}</p>
                        <p className="text-2xl font-extrabold mt-1" style={{ color: String(color) }}>{String(value)}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap gap-3 mb-5">
                <select value={filters.type} onChange={(event) => updateFilter('type', event.target.value)}
                    className="rounded-xl px-3 py-2 text-sm font-semibold outline-none"
                    style={{ background: panelBg, color: fg, border: `1px solid ${border}` }}>
                    <option value="all">All Types</option>
                    <option value="request">Request</option>
                    <option value="commission">Commission</option>
                </select>
                <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}
                    className="rounded-xl px-3 py-2 text-sm font-semibold outline-none"
                    style={{ background: panelBg, color: fg, border: `1px solid ${border}` }}>
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="billed">Billed</option>
                    <option value="on_queue">On Queue</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {items.data.length === 0 ? (
                    <div className="xl:col-span-2 rounded-2xl p-8 text-center" style={{ background: cardBg, border: `1px solid ${border}`, color: muted }}>
                        No request or commission found.
                    </div>
                ) : items.data.map((item) => {
                    const color = statusColors[item.status];
                    const safeRawLink = getSafeExternalUrl(item.raw_link);

                    return (
                        <div key={item.id} className="rounded-2xl p-5" style={{ background: cardBg, border: `1px solid ${border}` }}>
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: item.type === 'commission' ? accent : '#60a5fa' }}>
                                        {item.type}
                                    </div>
                                    <h2 className="text-lg font-extrabold leading-snug">{item.title}</h2>
                                </div>
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                                    style={{ color: color.color, background: color.bg, border: `1px solid ${color.border}` }}>
                                    {statusLabel(item.status)}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm" style={{ color: muted }}>
                                <p>User: <span style={{ color: fg }}>{item.user.display_name || item.user.email}</span></p>
                                <p>Contact Email: <span style={{ color: fg }}>{item.email}</span></p>
                                <p>User Coins: <span className="text-amber-400 font-bold">¢{item.user.coins.toLocaleString()}</span></p>
                                <p>Submitted: <span style={{ color: fg }}>{new Date(item.created_at).toLocaleString()}</span></p>
                                {item.type === 'commission' && <p>Private: <span style={{ color: fg }}>{item.is_private ? 'Yes' : 'No'}</span></p>}
                                {item.paid_at && <p>Paid At: <span style={{ color: fg }}>{new Date(item.paid_at).toLocaleString()}</span></p>}
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
                                        <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: wa(fg, 0.42) }}>Note for Admin</div>
                                        <p style={{ color: fg }}>{item.note_for_admin}</p>
                                    </div>
                                )}
                            </div>

                            {item.type === 'commission' && item.bill_amount && (
                                <div className="mt-4 rounded-xl p-3" style={{ background: `${SHINY_PURPLE}12`, border: `1px solid ${SHINY_PURPLE}30` }}>
                                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: muted }}>Bill</span>
                                    <div className="text-xl font-extrabold text-amber-400">¢{item.bill_amount.toLocaleString()}</div>
                                </div>
                            )}

                            {item.admin_note && (
                                <div className="mt-4 rounded-xl p-3 text-sm" style={{ background: panelBg, border: `1px solid ${border}` }}>
                                    <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: accent }}>Admin Note</div>
                                    <p>{item.admin_note}</p>
                                </div>
                            )}

                            <button type="button" onClick={() => setEditing(item)}
                                className="mt-4 px-4 py-2 rounded-xl text-sm font-bold"
                                style={{ background: accent, color: '#fff' }}>
                                Update
                            </button>
                        </div>
                    );
                })}
            </div>

            {items.links.length > 3 && (
                <div className="mt-6 flex flex-wrap gap-2">
                    {items.links.map((link, index) => (
                        link.url ? (
                            <Link key={index} href={link.url} preserveScroll preserveState
                                className="px-3 py-2 rounded-lg text-sm font-semibold"
                                style={{ background: link.active ? accent : panelBg, color: link.active ? '#fff' : fg, border: `1px solid ${border}` }}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ) : (
                            <span key={index} className="px-3 py-2 rounded-lg text-sm font-semibold opacity-45" style={{ background: panelBg, color: muted }} dangerouslySetInnerHTML={{ __html: link.label }} />
                        )
                    ))}
                </div>
            )}

            {editing && (
                <EditPanel
                    item={editing}
                    onClose={() => setEditing(null)}
                    fg={fg}
                    muted={muted}
                    border={border}
                    cardBg={bg}
                    inputBg={inputBg}
                    accent={accent}
                />
            )}
        </div>
    );
}

export default function AdminRequestCommissionIndex(props: Props) {
    return (
        <AdminLayout title="Request / Commission">
            <RequestCommissionContent {...props} />
        </AdminLayout>
    );
}
