import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';
import { useState, type JSX } from 'react';
import {
    AreaChart, Area, LineChart, Line, BarChart, Bar,
    PieChart, Pie, Cell, ComposedChart, Tooltip,
    XAxis, YAxis, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

// ── helpers ───────────────────────────────────────────────────────────────────
function hexToRgb(hex: string) {
    const h = hex.replace('#', '');
    return { r: parseInt(h.substring(0, 2), 16), g: parseInt(h.substring(2, 4), 16), b: parseInt(h.substring(4, 6), 16) };
}
function isLight(hex: string) {
    const { r, g, b } = hexToRgb(hex);
    return (r * 0.299 + g * 0.587 + b * 0.114) / 255 > 0.5;
}
function withAlpha(hex: string, alpha: number) {
    try { const { r, g, b } = hexToRgb(hex); return `rgba(${r},${g},${b},${alpha})`; }
    catch { return `rgba(0,0,0,${alpha})`; }
}
const fmt      = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
const fmtCoins = (n: number) => '¢' + n.toLocaleString();
const fmtUsd   = (n: number) => '$' + n.toFixed(2);
const fmtDate  = (s: string) => new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
function trendPct(curr: number, prev: number) {
    if (prev === 0) return curr > 0 ? '+∞%' : '—';
    const pct = ((curr - prev) / prev) * 100;
    return (pct >= 0 ? '+' : '') + pct.toFixed(0) + '%';
}
function trendUp(curr: number, prev: number) { return curr >= prev; }

// ── SVG icons ─────────────────────────────────────────────────────────────────
const Icons = {
    Users: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
    ),
    UserPlus: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
        </svg>
    ),
    Star: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    ),
    BookOpen: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
        </svg>
    ),
    BookMarked: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20l-7-4-7 4V2z" />
        </svg>
    ),
    FileText: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
        </svg>
    ),
    Diamond: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.7 10.3l8.956 8.944a.5.5 0 00.688 0L21.3 10.3a.5.5 0 000-.7l-4-4.3H6.7l-4 4.3a.5.5 0 000 .7z" />
        </svg>
    ),
    Inbox: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
        </svg>
    ),
    Coin: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v2m0 8v2M9.5 9.5c0-1.1.9-2 2.5-2s2.5.9 2.5 2-1.12 1.85-2.5 2.5C10.62 12.65 9.5 13.4 9.5 14.5c0 1.1.9 2 2.5 2s2.5-.9 2.5-2" />
        </svg>
    ),
    CreditCard: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
    ),
    TrendingUp: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    ),
    PlusCircle: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
        </svg>
    ),
    Edit: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    ),
    Tag: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
    ),
    Monitor: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
        </svg>
    ),
    Settings: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
            <circle cx="12" cy="12" r="3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
    ),
    ChevronLeft:  () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><polyline points="15 18 9 12 15 6" /></svg>),
    ChevronRight: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><polyline points="9 18 15 12 9 6" /></svg>),
};

// ── types ─────────────────────────────────────────────────────────────────────
interface ChartPoint {
    month: string; coin_sales: number; membership_usd: number; total_usd: number;
    new_users: number; new_chapters: number; ebook_coins: number; member_coins: number; total_coins: number;
}
interface PieEntry { name: string; value: number; }
interface RecentSeries  { id: number; title: string; status: string; native_language: { name: string }; created_at: string; }
interface RecentChapter { id: number; title: string; chapter_number: number; is_premium: boolean; series: { title: string }; created_at: string; }
interface RecentUser    { id: number; display_name: string; email: string; membership_tier: string; created_at: string; }
interface RecentTransaction { id: number; user_name: string; amount_usd: number; coin_price: number; tier: string; payment_method: string; created_at: string; }

interface Stats {
    total_users: number; new_users_this_month: number; new_users_last_month: number;
    active_memberships: number; pending_requests: number;
    total_series: number; total_chapters: number; premium_chapters: number; total_ebook_series: number;
    monthly_coin_sales_usd: number; last_month_coin_sales_usd: number; total_coin_sales_usd: number;
    monthly_membership_usd: number; last_month_membership_usd: number; total_membership_usd: number;
    monthly_usd_total: number; last_month_usd_total: number; total_usd: number;
    monthly_membership_coins: number; total_membership_coins: number;
    monthly_ebook_coins: number; total_ebook_coins: number;
    chart_data: ChartPoint[]; revenue_pie: PieEntry[];
    recent_series: RecentSeries[]; recent_chapters: RecentChapter[];
    recent_users: RecentUser[]; recent_transactions: RecentTransaction[];
}

// ── Stat card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
    label: string; value: string | number;
    Icon: () => JSX.Element; iconBg: string; iconColor: string;
    trend?: string; trendPositive?: boolean;
    cardBg: string; border: string; fg: string; muted: string; href?: string;
}
function StatCard({ label, value, Icon, iconBg, iconColor, trend, trendPositive, cardBg, border, fg, muted, href }: StatCardProps) {
    const inner = (
        <div className="rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-md"
            style={{ backgroundColor: cardBg, borderColor: border }}>
            <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: iconBg, color: iconColor }}>
                    <Icon />
                </div>
                {trend && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ color: trendPositive ? '#16a34a' : '#dc2626', backgroundColor: trendPositive ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)' }}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-2xl font-bold" style={{ color: fg }}>{value}</p>
                <p className="text-xs mt-0.5 font-medium" style={{ color: muted }}>{label}</p>
            </div>
        </div>
    );
    return href ? <Link href={href}>{inner}</Link> : <>{inner}</>;
}

// ── Revenue breakdown card ────────────────────────────────────────────────────
function RevenueCard({ stats, cardBg, border, fg, muted }: { stats: Stats; cardBg: string; border: string; fg: string; muted: string }) {
    const monthTrend   = trendPct(stats.monthly_usd_total, stats.last_month_usd_total);
    const monthTrendUp = trendUp(stats.monthly_usd_total, stats.last_month_usd_total);
    const cols = [
        { label: 'Coin Packages', sublabel: 'PayPal / OxaPay', monthValue: fmtUsd(stats.monthly_coin_sales_usd), totalValue: fmtUsd(stats.total_coin_sales_usd), trend: trendPct(stats.monthly_coin_sales_usd, stats.last_month_coin_sales_usd), trendUp: trendUp(stats.monthly_coin_sales_usd, stats.last_month_coin_sales_usd), color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', Icon: Icons.Coin },
        { label: 'Membership',    sublabel: 'PayPal / OxaPay', monthValue: fmtUsd(stats.monthly_membership_usd), totalValue: fmtUsd(stats.total_membership_usd), trend: trendPct(stats.monthly_membership_usd, stats.last_month_membership_usd), trendUp: trendUp(stats.monthly_membership_usd, stats.last_month_membership_usd), color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', Icon: Icons.Star },
        { label: 'Membership',    sublabel: 'via Coins',        monthValue: fmtCoins(stats.monthly_membership_coins), totalValue: fmtCoins(stats.total_membership_coins), trend: undefined, trendUp: true, color: '#e879f9', bg: 'rgba(232,121,249,0.1)', Icon: Icons.Diamond },
        { label: 'Epub Sales',    sublabel: 'coins spent',      monthValue: fmtCoins(stats.monthly_ebook_coins),      totalValue: fmtCoins(stats.total_ebook_coins),      trend: undefined, trendUp: true, color: '#0d9488', bg: 'rgba(13,148,136,0.1)',   Icon: Icons.BookMarked },
    ];
    return (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: border }}>
            <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: border }}>
                <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: fg }}>Revenue Overview</h2>
                    <p className="text-xs mt-0.5" style={{ color: muted }}>This month vs. last month</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold" style={{ color: fg }}>{fmtUsd(stats.monthly_usd_total)}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ color: monthTrendUp ? '#16a34a' : '#dc2626', backgroundColor: monthTrendUp ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)' }}>{monthTrend}</span>
                    <span className="text-xs" style={{ color: muted }}>total USD this month</span>
                </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0" style={{ borderColor: border }}>
                {cols.map((col) => (
                    <div key={col.label + col.sublabel} className="p-5 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: col.bg, color: col.color }}><col.Icon /></div>
                            <div>
                                <p className="text-xs font-semibold leading-tight" style={{ color: fg }}>{col.label}</p>
                                <p className="text-[10px] leading-tight" style={{ color: muted }}>{col.sublabel}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xl font-bold" style={{ color: col.color }}>{col.monthValue}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: muted }}>this month</p>
                        </div>
                        <div className="pt-2 border-t" style={{ borderColor: border }}>
                            <p className="text-xs font-semibold" style={{ color: fg }}>{col.totalValue}</p>
                            <p className="text-[10px]" style={{ color: muted }}>all time</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Chart carousel ────────────────────────────────────────────────────────────
const PIE_COLORS = ['#f59e0b', '#a78bfa', '#e879f9', '#0d9488'];

function ChartTooltip({ active, payload, label, usd = false }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border px-3 py-2 text-xs shadow-xl"
            style={{ backgroundColor: '#1e1e2e', borderColor: 'rgba(255,255,255,0.1)', color: '#e5e7eb' }}>
            {label && <p className="font-semibold mb-1 opacity-60">{label}</p>}
            {payload.map((p: any) => (
                <p key={p.name} style={{ color: p.color ?? p.fill }}>
                    {p.name}: <strong>{usd ? fmtUsd(p.value) : p.value.toLocaleString()}</strong>
                </p>
            ))}
        </div>
    );
}

function ChartCarousel({ data, pie, border, cardBg, fg, muted, light }: {
    data: ChartPoint[]; pie: PieEntry[];
    border: string; cardBg: string; fg: string; muted: string; light: boolean;
}) {
    const [active, setActive] = useState(0);
    const gridColor = withAlpha(fg, 0.07);
    const axisColor = withAlpha(fg, 0.35);

    const charts = [
        {
            id: 'revenue-area',
            title: 'USD Revenue',
            subtitle: '12-month trend — Coin Sales vs. Membership',
            render: () => (
                <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gradCoin" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradMem" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => '$' + v} />
                        <Tooltip content={<ChartTooltip usd />} />
                        <Legend wrapperStyle={{ fontSize: 11, color: axisColor }} />
                        <Area type="monotone" dataKey="coin_sales"     name="Coin Sales"  stroke="#f59e0b" fill="url(#gradCoin)" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="membership_usd" name="Membership"  stroke="#a78bfa" fill="url(#gradMem)"  strokeWidth={2} dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            ),
        },
        {
            id: 'users-line',
            title: 'User Growth',
            subtitle: 'New registrations per month over 12 months',
            render: () => (
                <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11, color: axisColor }} />
                        <Bar dataKey="new_users"    name="New Users"    fill="#3b82f6" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="new_users" name="" stroke="#93c5fd" strokeWidth={2} dot={{ r: 3, fill: '#93c5fd' }} strokeDasharray="4 2" />
                    </ComposedChart>
                </ResponsiveContainer>
            ),
        },
        {
            id: 'chapters-bar',
            title: 'Chapter Uploads',
            subtitle: 'Chapters published per month',
            render: () => (
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gradChap" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%"   stopColor="#34d399" stopOpacity={1} />
                                <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="new_chapters" name="Chapters" fill="url(#gradChap)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            ),
        },
        {
            id: 'coins-line',
            title: 'Coin Activity',
            subtitle: 'Coins spent — Membership vs. Epub purchases per month',
            render: () => (
                <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => '¢' + v} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11, color: axisColor }} />
                        <Line type="monotone" dataKey="member_coins" name="Membership (¢)" stroke="#e879f9" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="ebook_coins"  name="Epub (¢)"       stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                </ResponsiveContainer>
            ),
        },
        {
            id: 'revenue-pie',
            title: 'Revenue Split',
            subtitle: 'All-time revenue distribution across categories',
            render: () => {
                const total = pie.reduce((s, p) => s + p.value, 0);
                return (
                    <div className="flex items-center gap-6">
                        <ResponsiveContainer width="55%" height={260}>
                            <PieChart>
                                <Pie data={pie} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                                    paddingAngle={3} dataKey="value" stroke="none">
                                    {pie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    const p = payload[0];
                                    return (
                                        <div className="rounded-xl border px-3 py-2 text-xs shadow-xl"
                                            style={{ backgroundColor: '#1e1e2e', borderColor: 'rgba(255,255,255,0.1)', color: '#e5e7eb' }}>
                                            <p style={{ color: p.payload.fill }}>{p.name}</p>
                                            <p><strong>{p.value != null ? Number(p.value).toLocaleString() : '—'}</strong></p>
                                        </div>
                                    );
                                }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-col gap-3 flex-1">
                            {pie.map((p, i) => {
                                const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0.0';
                                return (
                                    <div key={p.name} className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                                        <span className="text-xs flex-1 truncate" style={{ color: fg }}>{p.name}</span>
                                        <span className="text-xs font-bold" style={{ color: PIE_COLORS[i] }}>{pct}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: border }}>
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: border }}>
                <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: fg }}>Analytics</h2>
                    <p className="text-xs mt-0.5" style={{ color: muted }}>{charts[active].title} — {charts[active].subtitle}</p>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setActive(a => (a - 1 + charts.length) % charts.length)}
                        className="w-7 h-7 rounded-lg border flex items-center justify-center transition hover:opacity-70"
                        style={{ borderColor: border, color: fg }}>
                        <Icons.ChevronLeft />
                    </button>
                    <div className="flex gap-1 px-2">
                        {charts.map((_, i) => (
                            <button key={i} onClick={() => setActive(i)}
                                className="w-1.5 h-1.5 rounded-full transition-all duration-200"
                                style={{ backgroundColor: i === active ? fg : withAlpha(fg, 0.25) }} />
                        ))}
                    </div>
                    <button onClick={() => setActive(a => (a + 1) % charts.length)}
                        className="w-7 h-7 rounded-lg border flex items-center justify-center transition hover:opacity-70"
                        style={{ borderColor: border, color: fg }}>
                        <Icons.ChevronRight />
                    </button>
                </div>
            </div>

            {/* Chart tabs */}
            <div className="flex gap-0 border-b overflow-x-auto" style={{ borderColor: border }}>
                {charts.map((c, i) => (
                    <button key={c.id} onClick={() => setActive(i)}
                        className="px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2"
                        style={{
                            color: i === active ? fg : muted,
                            borderBottomColor: i === active ? fg : 'transparent',
                            backgroundColor: i === active ? withAlpha(fg, 0.04) : 'transparent',
                        }}>
                        {c.title}
                    </button>
                ))}
            </div>

            {/* Chart body */}
            <div className="p-6">
                {charts[active].render()}
            </div>
        </div>
    );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, href, fg, muted, accent }: { title: string; href?: string; fg: string; muted: string; accent: string }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: fg }}>{title}</h2>
            {href && <Link href={href} className="text-xs font-semibold hover:underline" style={{ color: accent }}>View all →</Link>}
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function DashboardContent({ stats }: { stats: Stats }) {
    const { currentTheme } = useTheme();
    const light    = isLight(currentTheme.background);
    const fg       = currentTheme.foreground;
    const muted    = withAlpha(fg, 0.45);
    const border   = withAlpha(fg, 0.1);
    const cardBg   = light ? withAlpha(fg, 0.03) : withAlpha(fg, 0.06);
    const accent   = light ? '#b45309' : '#fbbf24';
    const accentBg = light ? 'rgba(217,119,6,0.1)' : 'rgba(251,191,36,0.15)';

    const statCards = [
        { label: 'Total Users',       value: fmt(stats.total_users),         Icon: Icons.Users,     iconBg: 'rgba(59,130,246,0.15)',  iconColor: '#3b82f6', trend: trendPct(stats.new_users_this_month, stats.new_users_last_month), trendPositive: trendUp(stats.new_users_this_month, stats.new_users_last_month), href: '/admin/user-management' },
        { label: 'New Users (Month)', value: fmt(stats.new_users_this_month), Icon: Icons.UserPlus,  iconBg: 'rgba(168,85,247,0.15)', iconColor: '#a855f7', href: '/admin/user-management' },
        { label: 'Active Members',    value: fmt(stats.active_memberships),   Icon: Icons.Star,      iconBg: 'rgba(234,179,8,0.15)',  iconColor: '#ca8a04' },
        { label: 'Total Series',      value: fmt(stats.total_series),         Icon: Icons.BookOpen,  iconBg: 'rgba(34,197,94,0.15)',  iconColor: '#16a34a', href: '/admin/series' },
        { label: 'Ebook Series',      value: fmt(stats.total_ebook_series),   Icon: Icons.BookMarked,iconBg: 'rgba(20,184,166,0.15)', iconColor: '#0d9488', href: '/admin/ebookseries' },
        { label: 'Total Chapters',    value: fmt(stats.total_chapters),       Icon: Icons.FileText,  iconBg: 'rgba(249,115,22,0.15)', iconColor: '#ea580c' },
        { label: 'Premium Chapters',  value: fmt(stats.premium_chapters),     Icon: Icons.Diamond,   iconBg: 'rgba(217,70,239,0.15)', iconColor: '#c026d3' },
        { label: 'Pending Requests',  value: stats.pending_requests,          Icon: Icons.Inbox,     iconBg: 'rgba(239,68,68,0.15)',  iconColor: '#ef4444', href: '/admin/request-commission' },
    ];

    const statusColor = (s: string) => {
        if (s === 'ongoing')   return { color: '#16a34a', bg: 'rgba(22,163,74,0.1)' };
        if (s === 'completed') return { color: '#2563eb', bg: 'rgba(37,99,235,0.1)' };
        return { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' };
    };
    const tierColor = (tier: string) =>
        tier === 'premium' ? { color: '#ca8a04', bg: 'rgba(202,138,4,0.1)' } : { color: muted, bg: withAlpha(fg, 0.06) };
    const methodLabel = (m: string) => {
        if (m === 'paypal')  return { label: 'PayPal',  color: '#3b82f6' };
        if (m === 'oxapay') return { label: 'OxaPay',  color: '#10b981' };
        if (m === 'coins')  return { label: 'Coins',   color: '#f59e0b' };
        return { label: m, color: muted };
    };

    return (
        <div className="space-y-6">
            {/* ── Stat grid: 4×2 ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {statCards.map(c => (
                    <StatCard key={c.label} {...c} cardBg={cardBg} border={border} fg={fg} muted={muted} />
                ))}
            </div>

            {/* ── Revenue overview ──────────────────────────────────────── */}
            <RevenueCard stats={stats} cardBg={cardBg} border={border} fg={fg} muted={muted} />

            {/* ── Analytics carousel ────────────────────────────────────── */}
            <ChartCarousel data={stats.chart_data} pie={stats.revenue_pie} border={border} cardBg={cardBg} fg={fg} muted={muted} light={light} />

            {/* ── Quick Actions ─────────────────────────────────────────── */}
            <div>
                <SectionHeader title="Quick Actions" fg={fg} muted={muted} accent={accent} />
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {[
                        { label: 'Add Series',    Icon: Icons.PlusCircle, href: '/admin/series/create' },
                        { label: 'Add Blog',      Icon: Icons.Edit,       href: '/admin/blog/create' },
                        { label: 'Add Voucher',   Icon: Icons.Tag,        href: '/admin/voucher/create' },
                        { label: 'Manage Users',  Icon: Icons.Users,      href: '/admin/user-management' },
                        { label: 'Monitoring',    Icon: Icons.Monitor,    href: '/admin/monitoring' },
                        { label: 'Misc Settings', Icon: Icons.Settings,   href: '/admin/misc' },
                    ].map(a => (
                        <Link key={a.href} href={a.href}
                            className="flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all duration-150 hover:scale-105 hover:shadow-md"
                            style={{ backgroundColor: cardBg, borderColor: border }}>
                            <span style={{ color: fg }}><a.Icon /></span>
                            <span className="text-xs font-semibold" style={{ color: fg }}>{a.label}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── Recent: Series + Chapters ─────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: border }}>
                    <div className="px-5 pt-5 pb-3"><SectionHeader title="Recent Series" href="/admin/series" fg={fg} muted={muted} accent={accent} /></div>
                    <div className="divide-y" style={{ borderColor: border }}>
                        {stats.recent_series.length === 0
                            ? <p className="px-5 py-4 text-sm" style={{ color: muted }}>No series yet.</p>
                            : stats.recent_series.map(s => {
                                const sc = statusColor(s.status);
                                return (
                                    <div key={s.id} className="flex items-center gap-3 px-5 py-3.5">
                                        <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold"
                                            style={{ backgroundColor: accentBg, color: accent }}>{s.title.charAt(0)}</div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold truncate" style={{ color: fg }}>{s.title}</p>
                                            <p className="text-xs" style={{ color: muted }}>{s.native_language.name}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full capitalize" style={{ color: sc.color, backgroundColor: sc.bg }}>{s.status}</span>
                                            <span className="text-[10px]" style={{ color: muted }}>{fmtDate(s.created_at)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>

                <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: border }}>
                    <div className="px-5 pt-5 pb-3"><SectionHeader title="Recent Chapters" fg={fg} muted={muted} accent={accent} /></div>
                    <div className="divide-y" style={{ borderColor: border }}>
                        {stats.recent_chapters.length === 0
                            ? <p className="px-5 py-4 text-sm" style={{ color: muted }}>No chapters yet.</p>
                            : stats.recent_chapters.map(c => (
                                <div key={c.id} className="flex items-center gap-3 px-5 py-3.5">
                                    <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold"
                                        style={{ backgroundColor: c.is_premium ? 'rgba(202,138,4,0.15)' : withAlpha(fg, 0.06), color: c.is_premium ? '#ca8a04' : muted }}>
                                        {c.chapter_number}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold truncate" style={{ color: fg }}>{c.series.title}</p>
                                        <p className="text-xs truncate" style={{ color: muted }}>{c.title || `Chapter ${c.chapter_number}`}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        {c.is_premium && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ color: '#ca8a04', backgroundColor: 'rgba(202,138,4,0.1)' }}>Premium</span>}
                                        <span className="text-[10px]" style={{ color: muted }}>{fmtDate(c.created_at)}</span>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            {/* ── Recent: Users + Transactions ──────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: border }}>
                    <div className="px-5 pt-5 pb-3"><SectionHeader title="New Users" href="/admin/user-management" fg={fg} muted={muted} accent={accent} /></div>
                    <div className="divide-y" style={{ borderColor: border }}>
                        {stats.recent_users.length === 0
                            ? <p className="px-5 py-4 text-sm" style={{ color: muted }}>No users yet.</p>
                            : stats.recent_users.map(u => {
                                const tc = tierColor(u.membership_tier);
                                const initials = u.display_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                                return (
                                    <div key={u.id} className="flex items-center gap-3 px-5 py-3.5">
                                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                                            style={{ backgroundColor: accentBg, color: accent }}>{initials}</div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold truncate" style={{ color: fg }}>{u.display_name}</p>
                                            <p className="text-xs truncate" style={{ color: muted }}>{u.email}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full capitalize" style={{ color: tc.color, backgroundColor: tc.bg }}>{u.membership_tier}</span>
                                            <span className="text-[10px]" style={{ color: muted }}>{fmtDate(u.created_at)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>

                <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: border }}>
                    <div className="px-5 pt-5 pb-3"><SectionHeader title="Recent Transactions" href="/admin/transaction-history" fg={fg} muted={muted} accent={accent} /></div>
                    <div className="divide-y" style={{ borderColor: border }}>
                        {stats.recent_transactions.length === 0
                            ? <p className="px-5 py-4 text-sm" style={{ color: muted }}>No transactions yet.</p>
                            : stats.recent_transactions.map(t => {
                                const ml = methodLabel(t.payment_method);
                                const isCoins = t.payment_method === 'coins';
                                return (
                                    <div key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                                        <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                                            style={{ backgroundColor: `${ml.color}18`, color: ml.color }}>
                                            {isCoins ? <Icons.Coin /> : <Icons.CreditCard />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold truncate" style={{ color: fg }}>{t.user_name}</p>
                                            <p className="text-xs" style={{ color: muted }}>{t.tier} · <span style={{ color: ml.color }}>{ml.label}</span></p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                            <span className="text-sm font-bold" style={{ color: isCoins ? '#f59e0b' : '#059669' }}>
                                                {isCoins ? fmtCoins(t.coin_price) : fmtUsd(t.amount_usd)}
                                            </span>
                                            <span className="text-[10px]" style={{ color: muted }}>{fmtDate(t.created_at)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Dashboard({ stats }: { stats: Stats }) {
    return (
        <AdminLayout title="Dashboard">
            <Head title="Admin Dashboard" />
            <DashboardContent stats={stats} />
        </AdminLayout>
    );
}
