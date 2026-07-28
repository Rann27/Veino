import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Summary {
    pageviews: number;
    visitors: number;
    sessions: number;
    new_visitors: number;
    returning_visitors: number;
    pages_per_session: number;
    bounce_rate: number;
}

interface TrendPoint {
    label: string;
    date: string;
    pageviews: number;
    visitors: number;
    sessions: number;
    new_visitors: number;
}

interface TopPage { path: string; page_type: string; pageviews: number; visitors: number; }
interface TopSeries { id: number; title: string; slug: string; cover: string | null; pageviews: number; visitors: number; chapter_views: number; }
/** `value` is pageviews (non-unique); `visitors` is deduplicated. */
interface Slice { label: string; value: number; visitors?: number; }

interface Stats {
    start: string;
    end: string;
    summary: Summary;
    delta: Record<'pageviews' | 'visitors' | 'sessions' | 'new_visitors', number | null>;
    trend: TrendPoint[];
    topPages: TopPage[];
    topSeries: TopSeries[];
    referrers: { direct: number; sources: { host: string; pageviews: number; visitors: number }[] };
    devices: Slice[];
    browsers: Slice[];
    os: Slice[];
    countries: Slice[];
    pageTypes: Slice[];
    audience: Slice[];
}

interface Lifetime { pageviews: number; visitors: number; since: string | null; }

interface MonthRow {
    month: string;
    label: string;
    pageviews: number;
    visitors: number;
    sessions: number;
    new_visitors: number;
    returning_visitors: number;
    member_views: number;
    guest_views: number;
    active_days: number;
    pages_per_session: number;
    top_country: string | null;
    top_referrer: string | null;
    top_device: string | null;
}

interface Props {
    range: string;
    stats: Stats;
    lifetime: Lifetime;
    monthly: MonthRow[];
    gaMeasurementId: string | null;
    retentionDays: number;
}

// ─── Colour helpers (match the rest of the admin panel) ───────────────────────

function hexToRgb(hex: string) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function isLight(hex: string) {
    const { r, g, b } = hexToRgb(hex);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}
function wa(hex: string, a: number) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
}

const RANGES = [
    { key: 'today', label: 'Today' },
    { key: '7d', label: '7 days' },
    { key: '30d', label: '30 days' },
    { key: '90d', label: '90 days' },
];

const nf = new Intl.NumberFormat('en-US');
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

// Country names come from the browser rather than a hand-kept table of 250 rows.
const regionNames = (() => {
    try {
        return new Intl.DisplayNames(['en'], { type: 'region' });
    } catch {
        return null;
    }
})();

function countryName(code: string) {
    try {
        return regionNames?.of(code) ?? code;
    } catch {
        return code;
    }
}

/** ISO alpha-2 → regional-indicator flag emoji. */
function countryFlag(code: string) {
    if (!/^[A-Za-z]{2}$/.test(code)) return '🏳️';
    return String.fromCodePoint(
        ...[...code.toUpperCase()].map(c => 0x1f1e6 + c.charCodeAt(0) - 65),
    );
}

const PAGE_TYPE_LABELS: Record<string, string> = {
    home: 'Homepage',
    series: 'Series page',
    chapter: 'Chapter reader',
    ebook: 'Ebook',
    explore: 'Explore',
    search: 'Search',
    blog: 'Blog',
    account: 'Account',
    membership: 'Membership',
    shop: 'Shop',
    auth: 'Login / Register',
    other: 'Other',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Analytics(props: Props) {
    return (
        <AdminLayout title="Analytics">
            <Head title="Analytics - Admin" />
            <AnalyticsContent {...props} />
        </AdminLayout>
    );
}

function AnalyticsContent({ range: initialRange, stats: initialStats, lifetime: initialLifetime, monthly: initialMonthly, gaMeasurementId, retentionDays }: Props) {
    const { currentTheme } = useTheme();
    const light = isLight(currentTheme.background);
    const fg = currentTheme.foreground;

    const ink = {
        primary: fg,
        secondary: wa(fg, 0.62),
        muted: wa(fg, 0.42),
        grid: wa(fg, 0.08),
        axis: wa(fg, 0.18),
        border: wa(fg, 0.12),
        card: light ? wa(fg, 0.03) : wa(fg, 0.06),
        panel: light ? wa(fg, 0.06) : wa(fg, 0.09),
        surface: currentTheme.background,
    };

    // Validated categorical slots 1–3 (see dataviz palette). Never cycled.
    const series = light
        ? { s1: '#2a78d6', s2: '#eb6834', s3: '#1baf7a' }
        : { s1: '#3987e5', s2: '#d95926', s3: '#199e70' };

    const good = light ? '#006300' : '#0ca30c';
    const bad = '#d03b3b';

    const [range, setRange] = useState(initialRange);
    const [stats, setStats] = useState<Stats>(initialStats);
    const [lifetime, setLifetime] = useState<Lifetime>(initialLifetime);
    const [monthly, setMonthly] = useState<MonthRow[]>(initialMonthly ?? []);
    const [loading, setLoading] = useState(false);

    const [realtime, setRealtime] = useState<{ active: number; pages: { path: string; views: number }[]; pulse: { minute: string; views: number }[] } | null>(null);

    const loadRange = useCallback(async (key: string) => {
        setRange(key);
        setLoading(true);
        try {
            const res = await fetch(route('admin.analytics.data', { range: key }), {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!res.ok) throw new Error('Request failed');
            const json = await res.json();
            setStats(json.stats);
            setLifetime(json.lifetime);
            if (json.monthly) setMonthly(json.monthly);
        } catch {
            /* keep the previous data on screen rather than blanking the page */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        const poll = async () => {
            try {
                const res = await fetch(route('admin.analytics.realtime'), {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                });
                if (!res.ok) return;
                const json = await res.json();
                if (!cancelled) setRealtime(json);
            } catch {
                /* transient — the next tick retries */
            }
        };

        poll();
        const id = setInterval(poll, 20000);
        return () => { cancelled = true; clearInterval(id); };
    }, []);

    const s = stats.summary;
    const hasData = s.pageviews > 0;
    const isToday = range === 'today';

    const card: React.CSSProperties = {
        background: ink.card,
        border: `1px solid ${ink.border}`,
        borderRadius: 12,
        padding: 18,
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, opacity: loading ? 0.6 : 1, transition: 'opacity .15s' }}>

            {/* ── Header: range filters in one row above the charts ── */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: ink.primary, margin: 0 }}>Analytics</h1>
                    <p style={{ fontSize: 12, color: ink.muted, margin: '4px 0 0' }}>
                        {stats.start === stats.end ? stats.start : `${stats.start} → ${stats.end}`}
                        {' · '}admin traffic excluded
                    </p>
                </div>

                <div style={{ flex: 1 }} />

                <RealtimePill active={realtime?.active ?? 0} ink={ink} accent={series.s3} />

                <ExportButton
                    href={route('admin.analytics.export', { range })}
                    label="Export XLSX"
                    ink={ink}
                    accent={series.s1}
                />

                <div style={{ display: 'flex', gap: 4, background: ink.panel, padding: 4, borderRadius: 10, border: `1px solid ${ink.border}` }}>
                    {RANGES.map(r => (
                        <button
                            key={r.key}
                            onClick={() => loadRange(r.key)}
                            style={{
                                padding: '6px 12px',
                                fontSize: 12.5,
                                fontWeight: range === r.key ? 700 : 500,
                                borderRadius: 7,
                                border: 'none',
                                cursor: 'pointer',
                                color: range === r.key ? '#fff' : ink.secondary,
                                background: range === r.key ? series.s1 : 'transparent',
                            }}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {!hasData && <EmptyNotice ink={ink} accent={series.s1} />}

            {/* ── Stat tiles ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
                <StatTile label="Pageviews" note="every page opened" value={s.pageviews} delta={stats.delta.pageviews} ink={ink} good={good} bad={bad} accent={series.s1} isToday={isToday} />
                <StatTile label="Unique Visitors" note="each person counted once" value={s.visitors} delta={stats.delta.visitors} ink={ink} good={good} bad={bad} accent={series.s2} isToday={isToday} />
                <StatTile label="Visits" note="non-unique · one per session" value={s.sessions} delta={stats.delta.sessions} ink={ink} good={good} bad={bad} accent={series.s3} isToday={isToday} />
                <StatTile label="New Visitors" note="first time on the site" value={s.new_visitors} delta={stats.delta.new_visitors} ink={ink} good={good} bad={bad} accent={series.s1} isToday={isToday} />
            </div>

            {/* ── Secondary metrics ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
                <MiniStat label="Pages / session" value={s.pages_per_session.toFixed(2)} ink={ink} />
                <MiniStat label="Bounce rate" value={`${s.bounce_rate}%`} hint="sessions with a single page" ink={ink} />
                <MiniStat label="Returning visitors" value={nf.format(s.returning_visitors)} ink={ink} />
                <MiniStat label="All-time pageviews" value={nf.format(lifetime.pageviews)} ink={ink} />
                <MiniStat label="All-time visitors" value={nf.format(lifetime.visitors)} ink={ink} />
            </div>

            {/* ── Trend ── */}
            <div style={card}>
                <ChartHeader
                    title={isToday ? 'Traffic by hour' : 'Traffic over time'}
                    legend={[
                        { label: 'Pageviews', color: series.s1 },
                        { label: 'Unique visitors', color: series.s2 },
                    ]}
                    ink={ink}
                />
                <div style={{ height: 300, marginTop: 12 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                            <defs>
                                <linearGradient id="pvFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={series.s1} stopOpacity={0.28} />
                                    <stop offset="100%" stopColor={series.s1} stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke={ink.grid} vertical={false} />
                            <XAxis
                                dataKey="label"
                                tick={{ fill: ink.muted, fontSize: 11 }}
                                tickLine={false}
                                axisLine={{ stroke: ink.axis }}
                                minTickGap={18}
                            />
                            <YAxis
                                tick={{ fill: ink.muted, fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                                width={52}
                                tickFormatter={(v: number) => compact.format(v)}
                            />
                            <Tooltip content={<ThemedTooltip ink={ink} />} cursor={{ stroke: ink.axis, strokeWidth: 1 }} />
                            <Area
                                type="monotone"
                                dataKey="pageviews"
                                name="Pageviews"
                                stroke={series.s1}
                                strokeWidth={2}
                                fill="url(#pvFill)"
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 2, stroke: ink.surface }}
                            />
                            <Line
                                type="monotone"
                                dataKey="visitors"
                                name="Unique visitors"
                                stroke={series.s2}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 2, stroke: ink.surface }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Monthly archive ── */}
            <div style={card}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: ink.primary }}>Monthly archive</h2>
                        <p style={{ margin: '3px 0 0', fontSize: 11.5, color: ink.muted }}>
                            Permanent record — kept forever, unaffected by the {retentionDays}-day raw retention window.
                        </p>
                    </div>
                    <div style={{ flex: 1 }} />
                    {monthly.length > 0 && (
                        <>
                            <div style={{ display: 'flex', gap: 14 }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: ink.secondary }}>
                                    <span style={{ width: 9, height: 9, borderRadius: 3, background: series.s1 }} />Pageviews
                                </span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: ink.secondary }}>
                                    <span style={{ width: 9, height: 9, borderRadius: 3, background: series.s2 }} />Unique visitors
                                </span>
                            </div>
                            <ExportButton
                                href={route('admin.analytics.export', { scope: 'monthly' })}
                                label="Export archive"
                                ink={ink}
                                accent={series.s1}
                            />
                        </>
                    )}
                </div>

                {monthly.length === 0 ? (
                    <p style={{ margin: '18px 0', fontSize: 12, color: ink.muted, textAlign: 'center', lineHeight: 1.6 }}>
                        No months archived yet.<br />
                        The archive is written by <code style={{ fontSize: 11.5 }}>analytics:rollup</code>, which the scheduler runs hourly.
                    </p>
                ) : (
                    <>
                        <div style={{ height: 220, marginTop: 12 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={[...monthly].reverse()}
                                    margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                                    barGap={2}
                                >
                                    <CartesianGrid stroke={ink.grid} vertical={false} />
                                    <XAxis dataKey="label" tick={{ fill: ink.muted, fontSize: 11 }} tickLine={false} axisLine={{ stroke: ink.axis }} minTickGap={8} />
                                    <YAxis tick={{ fill: ink.muted, fontSize: 11 }} tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => compact.format(v)} />
                                    <Tooltip content={<ThemedTooltip ink={ink} />} cursor={{ fill: wa(fg, 0.05) }} />
                                    <Bar dataKey="pageviews" name="Pageviews" fill={series.s1} radius={[4, 4, 0, 0]} maxBarSize={26} />
                                    <Bar dataKey="visitors" name="Unique visitors" fill={series.s2} radius={[4, 4, 0, 0]} maxBarSize={26} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div style={{ marginTop: 14, overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 720 }}>
                                <thead>
                                    <tr>
                                        {['Month', 'Pageviews', 'Unique visitors', 'Visits', 'New', 'Returning', 'Active days', 'Top country'].map((c, i) => (
                                            <th key={c} style={{
                                                textAlign: i === 0 || i === 7 ? 'left' : 'right',
                                                padding: '0 12px 8px 0',
                                                fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase',
                                                letterSpacing: '.04em', color: ink.muted,
                                                borderBottom: `1px solid ${ink.border}`, whiteSpace: 'nowrap',
                                            }}>{c}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthly.map(m => (
                                        <tr key={m.month}>
                                            <td style={{ padding: '9px 12px 9px 0', borderBottom: `1px solid ${ink.grid}`, color: ink.primary, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                {m.label}
                                            </td>
                                            {[m.pageviews, m.visitors, m.sessions, m.new_visitors, m.returning_visitors, m.active_days].map((v, i) => (
                                                <td key={i} style={{
                                                    padding: '9px 12px 9px 0', textAlign: 'right',
                                                    borderBottom: `1px solid ${ink.grid}`,
                                                    color: i === 0 ? ink.primary : ink.secondary,
                                                    fontWeight: i === 0 ? 600 : 400,
                                                    fontVariantNumeric: 'tabular-nums',
                                                }}>{nf.format(v)}</td>
                                            ))}
                                            <td style={{ padding: '9px 0', borderBottom: `1px solid ${ink.grid}`, color: ink.secondary, whiteSpace: 'nowrap' }}>
                                                {m.top_country
                                                    ? <><span style={{ marginRight: 6 }} aria-hidden>{countryFlag(m.top_country)}</span>{countryName(m.top_country)}</>
                                                    : <span style={{ color: ink.muted }}>—</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* ── Realtime ── */}
            <div style={{ ...card }}>
                <ChartHeader title="Right now" subtitle="Last 30 minutes · refreshes every 20s" ink={ink} />
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 20, marginTop: 12 }} className="analytics-realtime-grid">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 30, fontWeight: 700, color: ink.primary, lineHeight: 1 }}>
                                {realtime?.active ?? 0}
                            </span>
                            <span style={{ fontSize: 12.5, color: ink.secondary }}>
                                visitor{(realtime?.active ?? 0) === 1 ? '' : 's'} in the last 5 minutes
                            </span>
                        </div>
                        <div style={{ height: 110 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={realtime?.pulse ?? []} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                                    <CartesianGrid stroke={ink.grid} vertical={false} />
                                    <XAxis dataKey="minute" tick={{ fill: ink.muted, fontSize: 10 }} tickLine={false} axisLine={{ stroke: ink.axis }} minTickGap={40} />
                                    <YAxis tick={{ fill: ink.muted, fontSize: 10 }} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
                                    <Tooltip content={<ThemedTooltip ink={ink} />} cursor={{ fill: wa(fg, 0.05) }} />
                                    <Bar dataKey="views" name="Pageviews" fill={series.s3} radius={[4, 4, 0, 0]} maxBarSize={14} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div>
                        <p style={{ fontSize: 11.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', color: ink.muted, margin: '0 0 8px' }}>
                            Active pages
                        </p>
                        {realtime?.pages?.length ? (
                            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {realtime.pages.map(p => (
                                    <li key={p.path} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12 }}>
                                        <span style={{ flex: 1, color: ink.secondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.path}>
                                            {p.path}
                                        </span>
                                        <span style={{ color: ink.primary, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{p.views}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p style={{ fontSize: 12, color: ink.muted, margin: 0 }}>No activity in the last 5 minutes.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Top pages + top series ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 12 }}>
                <div style={card}>
                    <ChartHeader title="Top pages" ink={ink} />
                    <Table
                        ink={ink}
                        accent={series.s1}
                        columns={['Path', 'Views', 'Visitors']}
                        rows={stats.topPages.map(p => ({
                            key: p.path,
                            label: p.path,
                            hint: PAGE_TYPE_LABELS[p.page_type] ?? p.page_type,
                            value: p.pageviews,
                            secondary: p.visitors,
                        }))}
                    />
                </div>

                <div style={card}>
                    <ChartHeader title="Most-read series" ink={ink} />
                    {stats.topSeries.length === 0 ? (
                        <Empty ink={ink} />
                    ) : (
                        <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {stats.topSeries.map((sr, i) => {
                                const max = stats.topSeries[0].pageviews || 1;
                                return (
                                    <li key={sr.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ width: 16, fontSize: 11, color: ink.muted, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                                        <div style={{ width: 30, height: 44, borderRadius: 5, overflow: 'hidden', flexShrink: 0, background: ink.panel }}>
                                            {sr.cover && <img src={sr.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: ink.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sr.title}>
                                                {sr.title}
                                            </p>
                                            <div style={{ height: 5, background: ink.panel, borderRadius: 3, marginTop: 5, overflow: 'hidden' }}>
                                                <div style={{ width: `${(sr.pageviews / max) * 100}%`, height: '100%', background: series.s1, borderRadius: 3 }} />
                                            </div>
                                            <p style={{ margin: '5px 0 0', fontSize: 11, color: ink.muted }}>
                                                {nf.format(sr.visitors)} visitors · {nf.format(sr.chapter_views)} chapter views
                                            </p>
                                        </div>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: ink.primary, fontVariantNumeric: 'tabular-nums' }}>
                                            {nf.format(sr.pageviews)}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {/* ── Sources + breakdowns ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 12 }}>
                <div style={card}>
                    <ChartHeader title="Traffic sources" subtitle={`${nf.format(stats.referrers.direct)} direct / bookmarked`} ink={ink} />
                    {stats.referrers.sources.length === 0 ? (
                        <Empty ink={ink} />
                    ) : (
                        <BarList
                            items={stats.referrers.sources.map(r => ({ label: r.host, value: r.pageviews, visitors: r.visitors }))}
                            color={series.s2}
                            ink={ink}
                        />
                    )}
                </div>

                <div style={card}>
                    <ChartHeader title="Page categories" ink={ink} />
                    <BarList
                        items={stats.pageTypes.map(p => ({ ...p, label: PAGE_TYPE_LABELS[p.label] ?? p.label }))}
                        color={series.s1}
                        ink={ink}
                    />
                </div>

                <div style={card}>
                    <ChartHeader title="Audience" subtitle="pageviews by account state" ink={ink} />
                    <BarList items={stats.audience} color={series.s3} ink={ink} />
                </div>

                <div style={card}>
                    <ChartHeader title="Devices" ink={ink} />
                    <BarList items={stats.devices} color={series.s1} ink={ink} />
                </div>

                <div style={card}>
                    <ChartHeader title="Browsers" ink={ink} />
                    <BarList items={stats.browsers} color={series.s2} ink={ink} />
                </div>

                <div style={card}>
                    <ChartHeader title="Operating systems" ink={ink} />
                    <BarList items={stats.os} color={series.s3} ink={ink} />
                </div>

                <div style={card}>
                    <ChartHeader
                        title="Countries"
                        subtitle={stats.countries.length ? `${stats.countries.length} countries in this period` : undefined}
                        ink={ink}
                    />
                    {stats.countries.length > 0
                        ? <BarList items={stats.countries} color={series.s1} ink={ink} flags />
                        : <GeoHint ink={ink} />}
                </div>
            </div>

            {/* ── Footer notes ── */}
            <div style={{ ...card, padding: 14 }}>
                <p style={{ margin: 0, fontSize: 11.5, color: ink.muted, lineHeight: 1.6 }}>
                    Visitors are identified by a salted hash of IP + user agent — no raw IP addresses are stored.
                    Bots, admin sessions and asset requests are excluded. Raw pageviews are kept for {retentionDays} days
                    and then condensed into permanent daily totals.
                    {gaMeasurementId
                        ? ` Google Analytics is also active (${gaMeasurementId}) — use analytics.google.com for demographics and acquisition reports.`
                        : ' Google Analytics is not configured. Set GA_MEASUREMENT_ID in .env to enable it alongside this dashboard.'}
                </p>
            </div>

            <style>{`
                @media (max-width: 720px) {
                    .analytics-realtime-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
}

// ─── Pieces ───────────────────────────────────────────────────────────────────

type Ink = Record<string, string>;

function ChartHeader({ title, subtitle, legend, ink }: { title: string; subtitle?: string; legend?: { label: string; color: string }[]; ink: Ink }) {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <div>
                <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: ink.primary }}>{title}</h2>
                {subtitle && <p style={{ margin: '3px 0 0', fontSize: 11.5, color: ink.muted }}>{subtitle}</p>}
            </div>
            {legend && (
                <>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', gap: 14 }}>
                        {legend.map(l => (
                            <span key={l.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: ink.secondary }}>
                                <span style={{ width: 9, height: 9, borderRadius: 3, background: l.color, flexShrink: 0 }} />
                                {l.label}
                            </span>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function StatTile({ label, note, value, delta, ink, good, bad, accent, isToday }: {
    label: string; note?: string; value: number; delta: number | null; ink: Ink; good: string; bad: string; accent: string; isToday: boolean;
}) {
    const up = delta !== null && delta > 0;
    const down = delta !== null && delta < 0;
    const color = up ? good : down ? bad : ink.muted;

    return (
        <div style={{ background: ink.card, border: `1px solid ${ink.border}`, borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden' }}>
            <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accent }} />
            <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', color: ink.muted }}>{label}</p>
            {note && <p style={{ margin: '3px 0 0', fontSize: 10.5, color: ink.muted }}>{note}</p>}
            <p style={{ margin: '8px 0 0', fontSize: 27, fontWeight: 700, color: ink.primary, lineHeight: 1.1 }}>{nf.format(value)}</p>
            <p style={{ margin: '6px 0 0', fontSize: 11.5, color, display: 'flex', alignItems: 'center', gap: 4 }}>
                {delta === null ? (
                    <span style={{ color: ink.muted }}>no prior data</span>
                ) : (
                    <>
                        <span aria-hidden>{up ? '▲' : down ? '▼' : '—'}</span>
                        <span>{Math.abs(delta)}%</span>
                        <span style={{ color: ink.muted }}>vs previous {isToday ? 'day' : 'period'}</span>
                    </>
                )}
            </p>
        </div>
    );
}

function MiniStat({ label, value, hint, ink }: { label: string; value: string; hint?: string; ink: Ink }) {
    return (
        <div style={{ background: ink.card, border: `1px solid ${ink.border}`, borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ margin: 0, fontSize: 11, color: ink.muted }}>{label}</p>
            <p style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 700, color: ink.primary }}>{value}</p>
            {hint && <p style={{ margin: '2px 0 0', fontSize: 10.5, color: ink.muted }}>{hint}</p>}
        </div>
    );
}

function ExportButton({ href, label, ink, accent }: { href: string; label: string; ink: Ink; accent: string }) {
    return (
        <a
            href={href}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 13px',
                borderRadius: 9, border: `1px solid ${ink.border}`, background: ink.card,
                fontSize: 12.5, fontWeight: 600, color: ink.primary, textDecoration: 'none', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = ink.border; }}
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {label}
        </a>
    );
}

function RealtimePill({ active, ink, accent }: { active: number; ink: Ink; accent: string }) {
    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 13px',
            borderRadius: 999, border: `1px solid ${ink.border}`, background: ink.card, fontSize: 12.5,
        }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: accent, boxShadow: `0 0 0 3px ${accent}33` }} />
            <span style={{ color: ink.primary, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{active}</span>
            <span style={{ color: ink.secondary }}>online now</span>
        </div>
    );
}

/** Horizontal bar list — every row carries a visible label and value, so
 *  identity never rests on colour alone.
 *
 *  Bars are scaled by pageviews; when the data carries a deduplicated count the
 *  row shows both, because "500 views" and "500 people" are very different news.
 */
function BarList({ items, color, ink, flags = false }: { items: Slice[]; color: string; ink: Ink; flags?: boolean }) {
    if (!items.length) return <Empty ink={ink} />;

    const total = items.reduce((a, b) => a + b.value, 0) || 1;
    const max = items[0].value || 1;
    const showVisitors = items.some(i => typeof i.visitors === 'number');

    return (
        <>
            {showVisitors && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', color: ink.muted }}>
                    <span style={{ flex: 1 }} />
                    <span style={{ width: 62, textAlign: 'right' }}>Views</span>
                    <span style={{ width: 62, textAlign: 'right' }}>Visitors</span>
                    <span style={{ width: 44, textAlign: 'right' }}>Share</span>
                </div>
            )}
            <ul style={{ listStyle: 'none', margin: showVisitors ? '6px 0 0' : '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {items.map(it => (
                    <li key={it.label}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                            <span style={{ flex: 1, fontSize: 12.5, color: ink.secondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}
                                title={flags ? countryName(it.label) : it.label}>
                                {flags && (
                                    <span style={{ marginRight: 7, fontSize: 14 }} aria-hidden>{countryFlag(it.label)}</span>
                                )}
                                {flags ? countryName(it.label) : it.label}
                            </span>
                            <span style={{ width: 62, textAlign: 'right', fontSize: 12.5, fontWeight: 700, color: ink.primary, fontVariantNumeric: 'tabular-nums' }}>
                                {nf.format(it.value)}
                            </span>
                            {showVisitors && (
                                <span style={{ width: 62, textAlign: 'right', fontSize: 12.5, color: ink.secondary, fontVariantNumeric: 'tabular-nums' }}>
                                    {typeof it.visitors === 'number' ? nf.format(it.visitors) : '—'}
                                </span>
                            )}
                            <span style={{ fontSize: 11, color: ink.muted, width: 44, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                {((it.value / total) * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div style={{ height: 6, background: ink.panel, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${(it.value / max) * 100}%`, height: '100%', background: color, borderRadius: 3 }} />
                        </div>
                    </li>
                ))}
            </ul>
        </>
    );
}

function Table({ columns, rows, ink, accent }: {
    columns: string[];
    rows: { key: string; label: string; hint?: string; value: number; secondary: number }[];
    ink: Ink;
    accent: string;
}) {
    if (!rows.length) return <Empty ink={ink} />;

    const max = rows[0].value || 1;

    return (
        <div style={{ marginTop: 12, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                    <tr>
                        {columns.map((c, i) => (
                            <th key={c} style={{
                                textAlign: i === 0 ? 'left' : 'right',
                                padding: '0 0 8px',
                                fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase',
                                letterSpacing: '.04em', color: ink.muted,
                                borderBottom: `1px solid ${ink.border}`,
                                whiteSpace: 'nowrap',
                            }}>{c}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map(r => (
                        <tr key={r.key}>
                            <td style={{ padding: '9px 12px 9px 0', borderBottom: `1px solid ${ink.grid}`, maxWidth: 260 }}>
                                <div style={{ color: ink.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.label}>
                                    {r.label}
                                </div>
                                {r.hint && <div style={{ fontSize: 10.5, color: ink.muted, marginTop: 2 }}>{r.hint}</div>}
                                <div style={{ height: 4, background: ink.panel, borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                                    <div style={{ width: `${(r.value / max) * 100}%`, height: '100%', background: accent, borderRadius: 2 }} />
                                </div>
                            </td>
                            <td style={{ padding: '9px 0', textAlign: 'right', color: ink.primary, fontWeight: 600, borderBottom: `1px solid ${ink.grid}`, fontVariantNumeric: 'tabular-nums' }}>
                                {nf.format(r.value)}
                            </td>
                            <td style={{ padding: '9px 0 9px 12px', textAlign: 'right', color: ink.secondary, borderBottom: `1px solid ${ink.grid}`, fontVariantNumeric: 'tabular-nums' }}>
                                {nf.format(r.secondary)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ThemedTooltip({ active, payload, label, ink }: any) {
    if (!active || !payload?.length) return null;

    return (
        <div style={{
            background: ink.surface,
            border: `1px solid ${ink.border}`,
            borderRadius: 8,
            padding: '9px 11px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
            fontSize: 12,
        }}>
            <p style={{ margin: '0 0 6px', fontWeight: 700, color: ink.primary }}>{label}</p>
            {payload.map((p: any) => (
                <p key={p.dataKey} style={{ margin: '2px 0', color: ink.secondary, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: p.stroke || p.fill, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{p.name}</span>
                    <span style={{ fontWeight: 700, color: ink.primary, fontVariantNumeric: 'tabular-nums' }}>{nf.format(p.value)}</span>
                </p>
            ))}
        </div>
    );
}

function GeoHint({ ink }: { ink: Ink }) {
    return (
        <div style={{ margin: '14px 0 2px' }}>
            <p style={{ margin: 0, fontSize: 12, color: ink.muted, textAlign: 'center' }}>
                No country data for this period.
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: ink.muted, textAlign: 'center', lineHeight: 1.55 }}>
                Countries are read from a CDN header when present, otherwise resolved from the IP once per
                visitor. Local traffic has no country — this fills in once real visitors arrive.
            </p>
        </div>
    );
}

function Empty({ ink }: { ink: Ink }) {
    return <p style={{ margin: '16px 0', fontSize: 12, color: ink.muted, textAlign: 'center' }}>No data for this period.</p>;
}

function EmptyNotice({ ink, accent }: { ink: Ink; accent: string }) {
    return (
        <div style={{ background: `${accent}12`, border: `1px solid ${accent}33`, borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ margin: 0, fontSize: 12.5, color: ink.primary, fontWeight: 600 }}>No traffic recorded yet for this period.</p>
            <p style={{ margin: '4px 0 0', fontSize: 11.5, color: ink.secondary }}>
                Tracking starts the moment a non-admin visitor loads a public page. Open the site in a private window to confirm it's working.
            </p>
        </div>
    );
}
