import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTheme } from '@/Contexts/ThemeContext';

//  colour helpers 
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
}

interface Props {
    series: {
        data: Series[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

function IndexContent({ series }: Props) {
    const { currentTheme } = useTheme();
    const light    = isLight(currentTheme.background);
    const fg       = currentTheme.foreground;
    const muted    = wa(fg, 0.45);
    const border   = wa(fg, 0.12);
    const cardBg   = light ? wa(fg, 0.03) : wa(fg, 0.06);
    const panelBg  = light ? wa(fg, 0.06) : wa(fg, 0.09);
    const accent   = light ? '#b45309' : '#fbbf24';

    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isCleaning, setIsCleaning] = useState(false);

    const deleteSeries = (seriesId: number, title: string) => {
        if (confirm(`Are you sure you want to delete "${title}"? This will also delete all items in this series.`)) {
            setDeletingId(seriesId);
            router.delete(route('admin.ebookseries.destroy', seriesId), {
                onFinish: () => setDeletingId(null),
            });
        }
    };

    const handleCleanupOrphanedFiles = () => {
        if (confirm(
            'WARNING: This will permanently delete all .epub files that are not referenced in the database.\n\nThis action cannot be undone!\n\nAre you sure you want to continue?'
        )) {
            setIsCleaning(true);
            router.post(route('admin.ebookseries.cleanup'), {}, {
                onFinish: () => setIsCleaning(false),
            });
        }
    };

    return (
        <div style={{ color: fg, padding: '2rem 1rem', minHeight: '100vh' }}>
            <div style={{ maxWidth: '80rem', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: fg, margin: 0 }}>
                        Manage Ebook Series
                    </h1>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleCleanupOrphanedFiles}
                            disabled={isCleaning}
                            style={{
                                background: 'rgba(239,68,68,0.12)',
                                color: '#ef4444',
                                border: '1px solid rgba(239,68,68,0.35)',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                cursor: isCleaning ? 'not-allowed' : 'pointer',
                                opacity: isCleaning ? 0.5 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                            }}
                        >
                            {isCleaning ? (
                                <>
                                    <svg style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                                        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Cleaning...
                                </>
                            ) : (
                                <> Cleanup Orphaned Files</>
                            )}
                        </button>
                        <Link
                            href={route('admin.ebookseries.create')}
                            style={{
                                background: accent,
                                color: light ? '#fff' : '#000',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                            }}
                        >
                            + Add New Series
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Series', value: series.total },
                        { label: 'Current Page', value: `${series.current_page} / ${series.last_page}` },
                        { label: 'Per Page', value: series.per_page },
                    ].map(({ label, value }) => (
                        <div key={label} style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: '0.75rem', padding: '1.25rem' }}>
                            <p style={{ fontSize: '0.8rem', color: muted, margin: '0 0 0.25rem 0' }}>{label}</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 700, color: fg, margin: 0 }}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* Series List */}
                {series.data.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {series.data.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    background: cardBg,
                                    border: `1px solid ${border}`,
                                    borderRadius: '0.75rem',
                                    padding: '1rem',
                                    display: 'flex',
                                    gap: '1rem',
                                }}
                            >
                                {/* Cover */}
                                <div style={{ width: '5rem', flexShrink: 0 }}>
                                    <img
                                        src={item.cover_url}
                                        alt={item.title}
                                        style={{ width: '100%', borderRadius: '0.5rem', display: 'block' }}
                                        onError={(e) => { e.currentTarget.src = '/images/default-cover.jpg'; }}
                                    />
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: fg, margin: '0 0 0.25rem 0' }}>
                                        {item.title}
                                    </h3>
                                    {item.alternative_title && (
                                        <p style={{ fontSize: '0.875rem', color: muted, margin: '0 0 0.5rem 0' }}>
                                            {item.alternative_title}
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem 1rem', marginBottom: '0.75rem' }}>
                                        {item.author && (
                                            <span style={{ fontSize: '0.875rem', color: muted }}>Author: {item.author}</span>
                                        )}
                                        {item.artist && (
                                            <span style={{ fontSize: '0.875rem', color: muted }}>Artist: {item.artist}</span>
                                        )}
                                        <span style={{ fontSize: '0.875rem', color: muted }}>{item.items_count} items</span>
                                        <span style={{ fontSize: '0.875rem', color: accent, fontWeight: 600 }}>
                                            {item.price_range}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Link
                                            href={route('admin.ebookseries.edit', item.id)}
                                            style={{
                                                background: wa(fg, 0.09),
                                                color: fg,
                                                border: `1px solid ${border}`,
                                                padding: '0.35rem 1rem',
                                                borderRadius: '0.5rem',
                                                fontWeight: 600,
                                                fontSize: '0.8125rem',
                                                textDecoration: 'none',
                                                display: 'inline-block',
                                            }}
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => deleteSeries(item.id, item.title)}
                                            disabled={deletingId === item.id}
                                            style={{
                                                background: 'rgba(239,68,68,0.1)',
                                                color: '#ef4444',
                                                border: '1px solid rgba(239,68,68,0.3)',
                                                padding: '0.35rem 1rem',
                                                borderRadius: '0.5rem',
                                                fontWeight: 600,
                                                fontSize: '0.8125rem',
                                                cursor: deletingId === item.id ? 'not-allowed' : 'pointer',
                                                opacity: deletingId === item.id ? 0.5 : 1,
                                            }}
                                        >
                                            {deletingId === item.id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Pagination */}
                        {series.last_page > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                                {Array.from({ length: series.last_page }, (_, i) => i + 1).map((page) => (
                                    <Link
                                        key={page}
                                        href={route('admin.ebookseries.index', { page })}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '0.5rem',
                                            fontWeight: 600,
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
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: cardBg, borderRadius: '0.75rem', border: `1px solid ${border}` }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: fg, marginBottom: '0.5rem' }}>
                            No series yet
                        </h2>
                        <p style={{ color: muted, margin: 0 }}>
                            Create your first ebook series
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}

export default function Index({ series }: Props) {
    return (
        <AdminLayout title="Manage Ebook Series">
            <Head title="Manage Ebook Series" />
            <IndexContent series={series} />
        </AdminLayout>
    );
}
