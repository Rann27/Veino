import React, { useState, lazy, Suspense } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTheme } from '@/Contexts/ThemeContext';

const RichTextEditor = lazy(() => import('@/Components/RichTextEditor'));

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
    slug: string;
}

interface Item {
    id: number;
    title: string;
    order: number;
    preview_content: string;
}

interface Props {
    series: Series;
    item: Item;
}

function PreviewEditContent({ series, item }: Props) {
    const { currentTheme } = useTheme();
    const light  = isLight(currentTheme.background);
    const fg     = currentTheme.foreground;
    const muted  = wa(fg, 0.45);
    const border = wa(fg, 0.12);
    const cardBg = light ? wa(fg, 0.03) : wa(fg, 0.06);
    const accent = light ? '#b45309' : '#fbbf24';

    const [content, setContent] = useState(item.preview_content ?? '');
    const [submitting, setSubmitting] = useState(false);

    const handleSave = () => {
        setSubmitting(true);
        router.put(
            route('admin.ebookseries.items.preview.save', [series.id, item.id]),
            { preview_content: content },
            { onFinish: () => setSubmitting(false) }
        );
    };

    return (
        <div style={{ color: fg, minHeight: '100vh' }}>

            {/* ── Sticky top bar ─────────────────────────────── */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 30,
                background: currentTheme.background + 'f0',
                backdropFilter: 'blur(10px)',
                borderBottom: `1px solid ${border}`,
                padding: '0.625rem 1.25rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
            }}>
                {/* Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: muted, minWidth: 0 }}>
                    <Link href={route('admin.ebookseries.index')} style={{ color: muted, textDecoration: 'none' }}>
                        ← Ebook Series
                    </Link>
                    <span>/</span>
                    <Link href={route('admin.ebookseries.edit', series.id)} style={{ color: muted, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '14rem' }}>
                        {series.title}
                    </Link>
                    <span>/</span>
                    <span style={{ color: fg, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Vol {item.order} Preview
                    </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <Link
                        href={route('admin.ebookseries.edit', series.id)}
                        style={{
                            background: wa(fg, 0.07), color: fg, border: `1px solid ${border}`,
                            padding: '0.45rem 0.875rem', borderRadius: '0.5rem',
                            fontWeight: 600, fontSize: '0.8125rem', textDecoration: 'none',
                        }}
                    >
                        Cancel
                    </Link>
                    <button
                        onClick={handleSave}
                        disabled={submitting}
                        style={{
                            background: accent, color: light ? '#fff' : '#000',
                            border: 'none', padding: '0.45rem 0.875rem', borderRadius: '0.5rem',
                            fontWeight: 700, fontSize: '0.8125rem', cursor: submitting ? 'not-allowed' : 'pointer',
                            opacity: submitting ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '0.35rem',
                        }}
                    >
                        {submitting ? (
                            <>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                                    <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" opacity="0.3"/>
                                    <path d="M21 12a9 9 0 0 0-9-9"/>
                                </svg>
                                Saving…
                            </>
                        ) : (
                            <>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M5 13l4 4L19 7"/>
                                </svg>
                                Save Preview
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Content ────────────────────────────────────── */}
            <div style={{ maxWidth: '52rem', margin: '0 auto', padding: '1.5rem 1rem' }}>

                {/* Header */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: fg, margin: '0 0 0.25rem' }}>
                        Edit Preview — {item.title}
                    </h1>
                    <p style={{ fontSize: '0.8125rem', color: muted, margin: 0 }}>
                        Preview content readers see before purchasing. Supports rich text and images.
                    </p>
                </div>

                {/* Preview badge info */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    padding: '0.75rem 1rem', borderRadius: '0.625rem', marginBottom: '1.25rem',
                    background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
                }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                    </svg>
                    <p style={{ fontSize: '0.775rem', color: muted, margin: 0 }}>
                        The preview will be publicly accessible at{' '}
                        <code style={{ fontSize: '0.725rem', color: fg, background: wa(fg, 0.07), padding: '0.1rem 0.35rem', borderRadius: '0.25rem' }}>
                            /ebookseries/{series.slug}/{item.id}/preview
                        </code>
                    </p>
                </div>

                {/* Editor */}
                <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '0.75rem', overflow: 'hidden' }}>
                    <div style={{ padding: '0.875rem 1rem', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: fg }}>Preview Content</span>
                    </div>
                    <div style={{ padding: '1rem' }}>
                        <Suspense fallback={
                            <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: muted, fontSize: '0.875rem' }}>
                                Loading editor…
                            </div>
                        }>
                            <RichTextEditor
                                value={content}
                                onChange={setContent}
                                placeholder="Write the preview content here. You can include text, images, and formatting…"
                                height={500}
                                uploadUrl={route('admin.ebookseries.preview.upload-image')}
                            />
                        </Suspense>
                    </div>
                </div>

                {/* Save button (bottom duplicate for convenience) */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', gap: '0.5rem' }}>
                    <Link
                        href={route('admin.ebookseries.edit', series.id)}
                        style={{
                            background: wa(fg, 0.07), color: fg, border: `1px solid ${border}`,
                            padding: '0.5rem 1rem', borderRadius: '0.5rem',
                            fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none',
                        }}
                    >
                        Cancel
                    </Link>
                    <button
                        onClick={handleSave}
                        disabled={submitting}
                        style={{
                            background: accent, color: light ? '#fff' : '#000',
                            border: 'none', padding: '0.5rem 1.25rem', borderRadius: '0.5rem',
                            fontWeight: 700, fontSize: '0.875rem', cursor: submitting ? 'not-allowed' : 'pointer',
                            opacity: submitting ? 0.6 : 1,
                        }}
                    >
                        {submitting ? 'Saving…' : 'Save Preview'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function PreviewEdit({ series, item }: Props) {
    return (
        <AdminLayout>
            <Head title={`Preview — ${item.title}`} />
            <PreviewEditContent series={series} item={item} />
        </AdminLayout>
    );
}
