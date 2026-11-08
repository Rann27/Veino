import React from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTheme } from '@/Contexts/ThemeContext';

interface Props {
    filters: { days: number; ranges: number[] };
    threshold: { minSeconds: number; suspiciousCeiling: number };
    stats: {
        started: number; attempts: number; abandoned: number;
        granted: number; refused: number; suspicious: number;
        median: number | null; fastest: number | null; slowest: number | null; uniqueUsers: number;
    };
    outcomes: { outcome: string; count: number }[];
    buckets: { label: string; count: number }[];
    topUsers: { id: number; display_name: string; email: string; attempts: number; granted: number; refused: number; fastest: number | null }[];
    topChapters: { id: number; chapter: string; url: string | null; granted: number; attempts: number; avg: number | null }[];
    recent: {
        id: number; outcome: string; elapsed: number | null; source: string; ip: string | null;
        at: string | null; user: string; email: string | null; chapter: string; url: string | null;
    }[];
}

// Plain language beats the stored slug — an admin should not have to remember
// what "not_started" meant at three in the morning.
const OUTCOME_LABEL: Record<string, string> = {
    granted: 'Granted',
    too_fast: 'Too fast',
    bad_referer: 'Foreign referer',
    not_started: 'Never started',
    daily_limit: 'Daily limit',
    throttled: 'Too many refusals',
    expired_token: 'Expired link',
    disabled: 'Challenge off',
    ip_limit: 'IP daily limit',
    fraud_hold: 'Fraud hold',
    early_access: 'Early access',
    started: 'Started',
};

const OUTCOME_COLOR: Record<string, string> = {
    granted: '#22c55e',
    too_fast: '#ef4444',
    bad_referer: '#f59e0b',
    not_started: '#8b5cf6',
    daily_limit: '#3b82f6',
    throttled: '#ec4899',
    expired_token: '#f97316',
    disabled: '#6b7280',
    ip_limit: '#0ea5e9',
    fraud_hold: '#b91c1c',
    early_access: '#fab219',
    started: '#64748b',
};

const secs = (s: number | null) => (s === null || s === undefined ? '—' : `${s}s`);

function UnlockMonitorContent({ filters, threshold, stats, outcomes, buckets, topUsers, topChapters, recent }: Props) {
    const { currentTheme } = useTheme();
    const fg = currentTheme.foreground;
    const bg = currentTheme.background;
    const light = currentTheme.name?.toLowerCase().includes('light') ?? false;
    const muted = `${fg}70`;
    const border = `${fg}15`;
    const cardBg = light ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)';
    const card: React.CSSProperties = { background: cardBg, border: `1px solid ${border}`, borderRadius: 14 };

    const peak = Math.max(1, ...buckets.map(b => b.count));
    const suspiciousShare = stats.granted > 0 ? Math.round((stats.suspicious / stats.granted) * 100) : 0;

    const Stat = ({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: string }) => (
        <div style={card} className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: muted }}>{label}</p>
            <p className="text-2xl font-extrabold mt-1" style={{ color: tone ?? fg }}>{value}</p>
            {hint && <p className="text-xs mt-0.5" style={{ color: muted }}>{hint}</p>}
        </div>
    );

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold" style={{ color: fg }}>Free Unlock Monitor</h1>
                <p className="text-sm mt-1" style={{ color: muted }}>
                    Every attempt to open a premium chapter through the challenge — granted or refused —
                    and how long each run took.
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {filters.ranges.map(d => (
                    <button key={d}
                        onClick={() => router.get('/admin/unlock-monitor', { days: d }, { preserveScroll: true })}
                        className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{
                            background: filters.days === d ? `${fg}12` : 'transparent',
                            color: filters.days === d ? fg : muted,
                            border: `1px solid ${filters.days === d ? `${fg}25` : border}`,
                        }}>
                        {d === 1 ? '24 hours' : `${d} days`}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat
                    label="Started"
                    value={stats.started}
                    hint={stats.abandoned > 0 ? `${stats.abandoned} walked away` : `${stats.uniqueUsers} distinct readers`}
                />
                <Stat label="Claims" value={stats.attempts} hint={`${stats.uniqueUsers} distinct readers`} />
                <Stat label="Granted" value={stats.granted} hint={`${stats.refused} refused`} tone="#22c55e" />
                <Stat
                    label="Suspiciously fast"
                    value={stats.granted > 0 ? `${suspiciousShare}%` : '—'}
                    hint={`≤ ${threshold.suspiciousCeiling}s · ${stats.suspicious} runs`}
                    tone={suspiciousShare >= 30 ? '#f59e0b' : undefined}
                />
                <Stat
                    label="Median duration"
                    value={secs(stats.median)}
                    hint={stats.fastest !== null ? `fastest ${secs(stats.fastest)} · slowest ${secs(stats.slowest)}` : undefined}
                />
            </div>

            {/* Shape over count. A healthy gate spreads runs across the minute it
                takes; a circulating bypass piles them into the first bucket. */}
            <div style={card} className="p-5">
                <div className="flex items-baseline justify-between mb-4">
                    <h2 className="font-bold" style={{ color: fg }}>Duration spread</h2>
                    <span className="text-xs" style={{ color: muted }}>threshold: {threshold.minSeconds}s</span>
                </div>

                {stats.granted === 0 ? (
                    <p className="text-sm text-center py-6" style={{ color: muted }}>No granted unlocks in this range.</p>
                ) : (
                    <div className="space-y-2">
                        {buckets.map((b, i) => (
                            <div key={b.label} className="flex items-center gap-3">
                                <span className="w-20 shrink-0 text-xs text-right" style={{ color: muted }}>{b.label}</span>
                                <div className="flex-1 h-6 rounded overflow-hidden" style={{ background: `${fg}08` }}>
                                    <div className="h-full rounded transition-all"
                                        style={{ width: `${(b.count / peak) * 100}%`, background: i <= 1 ? '#f59e0b' : '#8b5cf6', opacity: 0.75 }} />
                                </div>
                                <span className="w-8 shrink-0 text-xs tabular-nums" style={{ color: fg }}>{b.count}</span>
                            </div>
                        ))}
                    </div>
                )}

                <p className="text-xs mt-4 leading-relaxed" style={{ color: muted }}>
                    The gate takes about a minute, so most runs should land in the middle buckets. If they
                    bunch up just above the threshold instead, a way of skipping the ad is going around —
                    raise the minimum before more readers find it.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
                <div style={card} className="p-5">
                    <h2 className="font-bold mb-3" style={{ color: fg }}>Outcomes</h2>
                    <div className="space-y-2">
                        {outcomes.map(o => (
                            <div key={o.outcome} className="flex items-center justify-between text-sm">
                                <span className="inline-flex items-center gap-2" style={{ color: fg }}>
                                    <span style={{ width: 8, height: 8, borderRadius: 999, background: OUTCOME_COLOR[o.outcome] ?? muted }} />
                                    {OUTCOME_LABEL[o.outcome] ?? o.outcome}
                                </span>
                                <span className="tabular-nums font-semibold" style={{ color: o.count > 0 ? fg : muted }}>{o.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Repeat refusals from one account say more than any single fast run. */}
                <div style={card} className="p-5">
                    <h2 className="font-bold mb-3" style={{ color: fg }}>Most refusals</h2>
                    {topUsers.length === 0 ? (
                        <p className="text-sm py-4" style={{ color: muted }}>Nothing to show yet.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${border}` }}>
                                        {['Reader', 'Tries', 'OK', 'Refused', 'Fastest'].map((h, i) => (
                                            <th key={h} className="pb-2 text-xs font-bold uppercase tracking-wider"
                                                style={{ color: muted, textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {topUsers.map(u => (
                                        <tr key={u.id} style={{ borderBottom: `1px solid ${border}` }}>
                                            <td className="py-2">
                                                <div style={{ color: fg }}>{u.display_name}</div>
                                                <div className="text-xs" style={{ color: muted }}>{u.email}</div>
                                            </td>
                                            <td className="py-2 text-right tabular-nums" style={{ color: fg }}>{u.attempts}</td>
                                            <td className="py-2 text-right tabular-nums" style={{ color: '#22c55e' }}>{u.granted}</td>
                                            <td className="py-2 text-right tabular-nums" style={{ color: u.refused > 0 ? '#ef4444' : muted }}>{u.refused}</td>
                                            <td className="py-2 text-right tabular-nums" style={{ color: muted }}>{secs(u.fastest)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Which chapters the free route is actually being spent on. */}
            <div style={card} className="p-5">
                <h2 className="font-bold mb-1" style={{ color: fg }}>Most unlocked chapters</h2>
                <p className="text-xs mb-3" style={{ color: muted }}>
                    Where the free route is going. Heavy concentration on a few chapters means those are
                    the ones no longer selling.
                </p>
                {topChapters.length === 0 ? (
                    <p className="text-sm py-4" style={{ color: muted }}>Nothing to show yet.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${border}` }}>
                                    {['Chapter', 'Unlocked', 'Attempts', 'Avg time'].map((h, i) => (
                                        <th key={h} className="pb-2 text-xs font-bold uppercase tracking-wider"
                                            style={{ color: muted, textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {topChapters.map(c => (
                                    <tr key={c.id} style={{ borderBottom: `1px solid ${border}` }}>
                                        <td className="py-2" style={{ color: fg, maxWidth: 420 }}>
                                            {c.url ? <a href={c.url} className="underline">{c.chapter}</a> : c.chapter}
                                        </td>
                                        <td className="py-2 text-right tabular-nums font-semibold" style={{ color: '#22c55e' }}>{c.granted}</td>
                                        <td className="py-2 text-right tabular-nums" style={{ color: muted }}>{c.attempts}</td>
                                        <td className="py-2 text-right tabular-nums"
                                            style={{ color: c.avg !== null && c.avg <= threshold.suspiciousCeiling ? '#f59e0b' : fg }}>
                                            {secs(c.avg)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div style={card} className="overflow-hidden">
                <div className="px-5 py-4" style={{ borderBottom: `1px solid ${border}` }}>
                    <h2 className="font-bold" style={{ color: fg }}>Recent attempts</h2>
                </div>

                {recent.length === 0 ? (
                    <p className="p-8 text-center text-sm" style={{ color: muted }}>No attempts recorded in this range.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${border}` }}>
                                    {['Outcome', 'Duration', 'Reader', 'Chapter', 'IP', 'When'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                                            style={{ color: muted }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {recent.map(r => (
                                    <tr key={r.id} style={{ borderBottom: `1px solid ${border}` }}>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                                                style={{ background: `${OUTCOME_COLOR[r.outcome] ?? muted}18`, color: OUTCOME_COLOR[r.outcome] ?? muted }}>
                                                {OUTCOME_LABEL[r.outcome] ?? r.outcome}
                                            </span>
                                            {r.source === 'sandbox' && (
                                                <span className="ml-1.5 text-[10px] font-bold" style={{ color: '#f59e0b' }}>SANDBOX</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 tabular-nums whitespace-nowrap"
                                            style={{ color: r.elapsed !== null && r.elapsed <= threshold.suspiciousCeiling ? '#f59e0b' : fg }}>
                                            {secs(r.elapsed)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div style={{ color: fg }}>{r.user}</div>
                                            <div className="text-xs" style={{ color: muted }}>{r.email}</div>
                                        </td>
                                        <td className="px-4 py-3" style={{ color: fg, maxWidth: 320 }}>
                                            {r.url ? <a href={r.url} className="underline">{r.chapter}</a> : r.chapter}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-mono" style={{ color: muted }}>{r.ip ?? '—'}</td>
                                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: muted }}>
                                            {r.at ? new Date(r.at).toLocaleString() : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function UnlockMonitorIndex(props: Props) {
    return (
        <AdminLayout title="Free Unlock Monitor">
            <Head title="Free Unlock Monitor - Admin" />
            <UnlockMonitorContent {...props} />
        </AdminLayout>
    );
}
