import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTheme } from '@/Contexts/ThemeContext';

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

interface Series {
    id: number;
    title: string;
    alternative_title?: string;
    slug: string;
    cover_url: string;
    author?: string;
    artist?: string;
    items_count: number;
    price_range: string;
    free_for_premium_members?: boolean;
    is_mature?: boolean;
}

interface Stats {
    total_series: number;
    premium_count: number;
    exclusive_count: number;
    total_volumes: number;
}

interface Props {
    series: {
        data: Series[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: Stats;
}

function IndexContent({ series, stats }: Props) {
    const { currentTheme } = useTheme();
    const light  = isLight(currentTheme.background);
    const fg     = currentTheme.foreground;
    const muted  = wa(fg, 0.45);
    const border = wa(fg, 0.12);
    const cardBg = light ? wa(fg, 0.03) : wa(fg, 0.06);
    const accent = light ? '#b45309' : '#fbbf24';

    const [isCleaning, setIsCleaning] = React.useState(false);

    const handleCleanup = () => {
        if (confirm('WARNING: This permanently deletes all .epub files not referenced in the database.\n\nCannot be undone. Continue?')) {
            setIsCleaning(true);
            router.post(route('admin.ebookseries.cleanup'), {}, { onFinish: () => setIsCleaning(false) });
        }
    };

    const statCards = [
        { label: 'Total Series',    value: stats.total_series,   color: fg },
        { label: 'Total Volumes',   value: stats.total_volumes,  color: fg },
        { label: 'Free for Premium',value: stats.premium_count,  color: '#a78bfa' },
        { label: 'Exclusive',       value: stats.exclusive_count, color: accent },
    ];

    return (
        <div style={{ color: fg, padding: '2rem 1rem', minHeight: '100vh' }}>
            <div style={{ maxWidth: '80rem', margin: '0 auto' }}>

                {/* ── Header ─────────────────────────────────── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: fg, margin: 0 }}>
                        Ebook Series
                    </h1>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={handleCleanup}
                            disabled={isCleaning}
                            style={{
                                background: 'rgba(239,68,68,0.10)',
                                color: '#ef4444',
                                border: '1px solid rgba(239,68,68,0.30)',
                                padding: '0.45rem 0.875rem',
                                borderRadius: '0.5rem',
                                fontWeight: 600,
                                fontSize: '0.8125rem',
                                cursor: isCleaning ? 'not-allowed' : 'pointer',
                                opacity: isCleaning ? 0.5 : 1,
                            }}
                        >
                            {isCleaning ? 'Cleaning…' : 'Cleanup Files'}
                        </button>
                        <Link
                            href={route('admin.ebookseries.create')}
                            style={{
                                background: accent,
                                color: light ? '#fff' : '#000',
                                padding: '0.45rem 0.875rem',
                                borderRadius: '0.5rem',
                                fontWeight: 600,
                                fontSize: '0.8125rem',
                                textDecoration: 'none',
                            }}
                        >
                            + Add Series
                        </Link>
                    </div>
                </div>

                {/* ── Stats row ──────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {statCards.map(({ label, value, color }) => (
                        <div
                            key={label}
                            style={{
                                background: cardBg,
                                border: `1px solid ${border}`,
                                borderRadius: '0.625rem',
                                padding: '0.875rem 1rem',
                            }}
                        >
                            <p style={{ fontSize: '0.7rem', color: muted, margin: '0 0 0.2rem 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color, margin: 0 }}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* ── 2-col card grid ────────────────────────── */}
                {series.data.length > 0 ? (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.625rem' }}>
                            {series.data.map(item => (
                                <Link
                                    key={item.id}
                                    href={route('admin.ebookseries.edit', item.id)}
                                    style={{
                                        display: 'flex',
                                        gap: '0.75rem',
                                        background: cardBg,
                                        border: `1px solid ${border}`,
                                        borderRadius: '0.625rem',
                                        padding: '0.75rem',
                                        textDecoration: 'none',
                                        transition: 'border-color 0.15s, background 0.15s',
                                        cursor: 'pointer',
                                        minWidth: 0,      /* allow grid to shrink this cell */
                                        overflow: 'hidden',
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.borderColor = wa(fg, 0.28);
                                        (e.currentTarget as HTMLElement).style.background = light ? wa(fg, 0.06) : wa(fg, 0.10);
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.borderColor = border;
                                        (e.currentTarget as HTMLElement).style.background = cardBg;
                                    }}
                                >
                                    {/* Cover */}
                                    <div style={{ width: '3.25rem', flexShrink: 0 }}>
                                        <img
                                            src={item.cover_url}
                                            alt={item.title}
                                            style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '0.375rem', display: 'block' }}
                                            onError={e => { e.currentTarget.src = '/images/default-cover.jpg'; }}
                                        />
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0, width: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.2rem' }}>
                                        {/* Badges row */}
                                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.15rem' }}>
                                            {item.free_for_premium_members && (
                                                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '999px', padding: '0.1rem 0.4rem' }}>
                                                    Premium
                                                </span>
                                            )}
                                            {item.is_mature && (
                                                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#f87171', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '999px', padding: '0.1rem 0.4rem' }}>
                                                    R18
                                                </span>
                                            )}
                                        </div>

                                        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: fg, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {item.title}
                                        </h3>

                                        {item.alternative_title && (
                                            <p style={{ fontSize: '0.75rem', color: muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {item.alternative_title}
                                            </p>
                                        )}

                                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                                            {item.author && (
                                                <span style={{ fontSize: '0.7rem', color: muted }}>{item.author}</span>
                                            )}
                                            <span style={{ fontSize: '0.7rem', color: muted }}>{item.items_count} vol</span>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: item.free_for_premium_members ? '#a78bfa' : accent }}>
                                                {item.free_for_premium_members ? 'Free' : item.price_range}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Arrow indicator */}
                                    <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '0.25rem' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 18l6-6-6-6"/>
                                        </svg>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Pagination */}
                        {series.last_page > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                                {Array.from({ length: series.last_page }, (_, i) => i + 1).map(page => (
                                    <Link
                                        key={page}
                                        href={route('admin.ebookseries.index', { page })}
                                        style={{
                                            padding: '0.4rem 0.875rem',
                                            borderRadius: '0.375rem',
                                            fontWeight: 600,
                                            fontSize: '0.875rem',
                                            textDecoration: 'none',
                                            background: page === series.current_page ? accent : wa(fg, 0.07),
                                            color: page === series.current_page ? (light ? '#fff' : '#000') : fg,
                                            border: `1px solid ${page === series.current_page ? accent : border}`,
                                        }}
                                    >
                                        {page}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: cardBg, borderRadius: '0.75rem', border: `1px solid ${border}` }}>
                        <p style={{ fontSize: '1rem', color: muted, margin: 0 }}>No series yet. Create one!</p>
                    </div>
                )}

            </div>
        </div>
    );
}

export default function Index({ series, stats }: Props) {
    return (
        <AdminLayout title="Ebook Series">
            <Head title="Ebook Series" />
            <IndexContent series={series} stats={stats} />
        </AdminLayout>
    );
}
