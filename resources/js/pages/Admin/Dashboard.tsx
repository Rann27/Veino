import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';

// ── colour helpers (same as AdminLayout) ──────────────────────────────────────
function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}
function isLight(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return (r * 0.299 + g * 0.587 + b * 0.114) / 255 > 0.5;
}
function withAlpha(hex: string, alpha: number) {
  try {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${alpha})`;
  } catch { return `rgba(0,0,0,${alpha})`; }
}

// ── types ─────────────────────────────────────────────────────────────────────
interface RecentSeries {
  id: number; title: string; status: string;
  native_language: { name: string };
  created_at: string; cover_url?: string;
}
interface RecentChapter {
  id: number; title: string; chapter_number: number;
  is_premium: boolean;
  series: { title: string };
  created_at: string;
}
interface RecentUser {
  id: number; display_name: string; email: string;
  membership_tier: string; created_at: string; avatar_url?: string;
}
interface RecentTransaction {
  id: number; user_name: string; amount_usd: number;
  tier: string; payment_method: string; created_at: string;
}
interface Stats {
  total_users: number; new_users_this_month: number; new_users_last_month: number;
  total_series: number; total_chapters: number; premium_chapters: number;
  total_ebook_series: number; active_memberships: number;
  monthly_income: number; last_month_income: number; total_income: number;
  recent_series: RecentSeries[]; recent_chapters: RecentChapter[];
  recent_users: RecentUser[]; recent_transactions: RecentTransaction[];
}

// ── tiny format helpers ───────────────────────────────────────────────────────
const fmt = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtUsd = (n: number) => '$' + n.toFixed(2);

function trendPct(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? '+∞' : '—';
  const pct = ((curr - prev) / prev) * 100;
  return (pct >= 0 ? '+' : '') + pct.toFixed(0) + '%';
}
function trendUp(curr: number, prev: number) { return curr >= prev; }

// ── stat card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string; value: string | number;
  icon: string; iconBg: string; iconColor: string;
  trend?: string; trendPositive?: boolean;
  cardBg: string; border: string; fg: string; muted: string;
  href?: string;
}
function StatCard({ label, value, icon, iconBg, iconColor, trend, trendPositive, cardBg, border, fg, muted, href }: StatCardProps) {
  const inner = (
    <div
      className="rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-200"
      style={{ backgroundColor: cardBg, borderColor: border }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          {icon}
        </div>
        {trend && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              color: trendPositive ? '#16a34a' : '#dc2626',
              backgroundColor: trendPositive ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
            }}
          >
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
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}

// ── section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, href, fg, muted, accent }: { title: string; href?: string; fg: string; muted: string; accent: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: fg }}>{title}</h2>
      {href && (
        <Link href={href} className="text-xs font-semibold hover:underline" style={{ color: accent }}>
          View all →
        </Link>
      )}
    </div>
  );
}

// ── main dashboard ────────────────────────────────────────────────────────────
function DashboardContent({ stats }: { stats: Stats }) {
  const { currentTheme } = useTheme();
  const light = isLight(currentTheme.background);

  const fg       = currentTheme.foreground;
  const muted    = withAlpha(fg, 0.45);
  const border   = withAlpha(fg, 0.1);
  const cardBg   = light ? withAlpha(fg, 0.03) : withAlpha(fg, 0.06);
  const accent   = light ? '#b45309' : '#fbbf24';
  const accentBg = light ? 'rgba(217,119,6,0.1)' : 'rgba(251,191,36,0.15)';

  const statCards = [
    {
      label: 'Total Users', value: fmt(stats.total_users), icon: '👥',
      iconBg: 'rgba(59,130,246,0.15)', iconColor: '#3b82f6',
      trend: trendPct(stats.new_users_this_month, stats.new_users_last_month),
      trendPositive: trendUp(stats.new_users_this_month, stats.new_users_last_month),
      href: '/admin/user-management',
    },
    {
      label: 'New Users (Month)', value: fmt(stats.new_users_this_month), icon: '✨',
      iconBg: 'rgba(168,85,247,0.15)', iconColor: '#a855f7',
      href: '/admin/user-management',
    },
    {
      label: 'Active Members', value: fmt(stats.active_memberships), icon: '⭐',
      iconBg: 'rgba(234,179,8,0.15)', iconColor: '#ca8a04',
    },
    {
      label: 'Total Series', value: fmt(stats.total_series), icon: '📚',
      iconBg: 'rgba(34,197,94,0.15)', iconColor: '#16a34a',
      href: '/admin/series',
    },
    {
      label: 'Ebook Series', value: fmt(stats.total_ebook_series), icon: '📖',
      iconBg: 'rgba(20,184,166,0.15)', iconColor: '#0d9488',
      href: '/admin/ebookseries',
    },
    {
      label: 'Total Chapters', value: fmt(stats.total_chapters), icon: '📄',
      iconBg: 'rgba(249,115,22,0.15)', iconColor: '#ea580c',
    },
    {
      label: 'Premium Chapters', value: fmt(stats.premium_chapters), icon: '💎',
      iconBg: 'rgba(217,70,239,0.15)', iconColor: '#c026d3',
    },
    {
      label: 'Monthly Income', value: fmtUsd(stats.monthly_income), icon: '💰',
      iconBg: 'rgba(16,185,129,0.15)', iconColor: '#059669',
      trend: trendPct(stats.monthly_income, stats.last_month_income),
      trendPositive: trendUp(stats.monthly_income, stats.last_month_income),
    },
    {
      label: 'Total Income', value: fmtUsd(stats.total_income), icon: '🏦',
      iconBg: 'rgba(14,165,233,0.15)', iconColor: '#0284c7',
    },
  ];

  const statusColor = (status: string) => {
    if (status === 'ongoing') return { color: '#16a34a', bg: 'rgba(22,163,74,0.1)' };
    if (status === 'completed') return { color: '#2563eb', bg: 'rgba(37,99,235,0.1)' };
    return { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' };
  };
  const tierColor = (tier: string) => {
    if (tier === 'premium') return { color: '#ca8a04', bg: 'rgba(202,138,4,0.1)' };
    return { color: withAlpha(fg, 0.45), bg: withAlpha(fg, 0.06) };
  };

  return (
    <div className="space-y-8">
      {/* ── Stat Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {statCards.map(c => (
          <StatCard
            key={c.label}
            label={c.label} value={c.value}
            icon={c.icon} iconBg={c.iconBg} iconColor={c.iconColor}
            trend={c.trend} trendPositive={c.trendPositive}
            cardBg={cardBg} border={border} fg={fg} muted={muted}
            href={c.href}
          />
        ))}
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────── */}
      <div>
        <SectionHeader title="Quick Actions" fg={fg} muted={muted} accent={accent} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Add Series', icon: '📚', href: '/admin/series/create' },
            { label: 'Add Blog', icon: '📝', href: '/admin/blog/create' },
            { label: 'Add Voucher', icon: '🎟️', href: '/admin/voucher/create' },
            { label: 'Manage Users', icon: '👥', href: '/admin/user-management' },
            { label: 'Monitoring', icon: '📈', href: '/admin/monitoring' },
            { label: 'Misc Settings', icon: '⚙️', href: '/admin/misc' },
          ].map(a => (
            <Link
              key={a.href} href={a.href}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all duration-150 hover:scale-105"
              style={{ backgroundColor: cardBg, borderColor: border }}
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="text-xs font-semibold" style={{ color: fg }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Row: Recent Series + Recent Chapters ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Series */}
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: border }}>
          <div className="px-5 pt-5 pb-3">
            <SectionHeader title="Recent Series" href="/admin/series" fg={fg} muted={muted} accent={accent} />
          </div>
          <div className="divide-y" style={{ borderColor: border }}>
            {stats.recent_series.length === 0 ? (
              <p className="px-5 py-4 text-sm" style={{ color: muted }}>No series yet.</p>
            ) : stats.recent_series.map(s => {
              const sc = statusColor(s.status);
              return (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div
                    className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: accentBg, color: accent }}
                  >
                    {s.title.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: fg }}>{s.title}</p>
                    <p className="text-xs" style={{ color: muted }}>{s.native_language.name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full capitalize"
                      style={{ color: sc.color, backgroundColor: sc.bg }}>
                      {s.status}
                    </span>
                    <span className="text-[10px]" style={{ color: muted }}>{fmtDate(s.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Chapters */}
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: border }}>
          <div className="px-5 pt-5 pb-3">
            <SectionHeader title="Recent Chapters" fg={fg} muted={muted} accent={accent} />
          </div>
          <div className="divide-y" style={{ borderColor: border }}>
            {stats.recent_chapters.length === 0 ? (
              <p className="px-5 py-4 text-sm" style={{ color: muted }}>No chapters yet.</p>
            ) : stats.recent_chapters.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3.5">
                <div
                  className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: c.is_premium ? 'rgba(202,138,4,0.15)' : withAlpha(fg, 0.06), color: c.is_premium ? '#ca8a04' : muted }}
                >
                  {c.chapter_number}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: fg }}>{c.series.title}</p>
                  <p className="text-xs truncate" style={{ color: muted }}>{c.title || `Chapter ${c.chapter_number}`}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {c.is_premium && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ color: '#ca8a04', backgroundColor: 'rgba(202,138,4,0.1)' }}>
                      Premium
                    </span>
                  )}
                  <span className="text-[10px]" style={{ color: muted }}>{fmtDate(c.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row: Recent Users + Recent Transactions ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: border }}>
          <div className="px-5 pt-5 pb-3">
            <SectionHeader title="New Users" href="/admin/user-management" fg={fg} muted={muted} accent={accent} />
          </div>
          <div className="divide-y" style={{ borderColor: border }}>
            {stats.recent_users.length === 0 ? (
              <p className="px-5 py-4 text-sm" style={{ color: muted }}>No users yet.</p>
            ) : stats.recent_users.map(u => {
              const tc = tierColor(u.membership_tier);
              const initials = u.display_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
              return (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: accentBg, color: accent }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: fg }}>{u.display_name}</p>
                    <p className="text-xs truncate" style={{ color: muted }}>{u.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full capitalize"
                      style={{ color: tc.color, backgroundColor: tc.bg }}>
                      {u.membership_tier}
                    </span>
                    <span className="text-[10px]" style={{ color: muted }}>{fmtDate(u.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: border }}>
          <div className="px-5 pt-5 pb-3">
            <SectionHeader title="Recent Transactions" href="/admin/transaction-history" fg={fg} muted={muted} accent={accent} />
          </div>
          <div className="divide-y" style={{ borderColor: border }}>
            {stats.recent_transactions.length === 0 ? (
              <p className="px-5 py-4 text-sm" style={{ color: muted }}>No transactions yet.</p>
            ) : stats.recent_transactions.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                <div
                  className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm"
                  style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#059669' }}
                >
                  💳
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: fg }}>{t.user_name}</p>
                  <p className="text-xs truncate" style={{ color: muted }}>{t.tier} · {t.payment_method}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-sm font-bold" style={{ color: '#059669' }}>{fmtUsd(t.amount_usd)}</span>
                  <span className="text-[10px]" style={{ color: muted }}>{fmtDate(t.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page component ───────────────────────────────────────────────────────────
export default function Dashboard({ stats }: { stats: Stats }) {
  return (
    <AdminLayout title="Dashboard">
      <Head title="Admin Dashboard" />
      <DashboardContent stats={stats} />
    </AdminLayout>
  );
}