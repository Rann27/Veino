import React, { useState, FormEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import AdminSlugCombobox, { SlugOption } from '@/Components/AdminSlugCombobox';

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

interface Genre { id: number; name: string; }

interface Item {
    id: number;
    title: string;
    cover_url: string;
    summary?: string;
    price_coins: number;
    order: number;
    has_file: boolean;
    has_pdf_file: boolean;
    has_preview: boolean;
}

interface Series {
    id: number;
    title: string;
    alternative_title?: string;
    slug: string;
    cover_url: string;
    synopsis: string;
    author?: string;
    artist?: string;
    genres: Genre[];
    free_for_premium_members?: boolean;
    is_mature?: boolean;
}

interface Props {
    series: Series;
    items: Item[];
    genres: Genre[];
    seriesOptions: SlugOption[];
}

/* ── Toggle Switch component ─────────────────────────────────── */
function Toggle({ checked, onChange, color = '#a78bfa' }: { checked: boolean; onChange: (v: boolean) => void; color?: string }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            style={{
                width: '2.75rem', height: '1.5rem', borderRadius: '9999px', padding: 0,
                background: checked ? color : 'rgba(128,128,128,0.25)',
                border: 'none', cursor: 'pointer', position: 'relative',
                transition: 'background 0.2s ease', flexShrink: 0,
            }}
        >
            <span style={{
                position: 'absolute', top: '0.1875rem',
                left: checked ? '1.375rem' : '0.1875rem',
                width: '1.125rem', height: '1.125rem', borderRadius: '50%',
                background: 'white', transition: 'left 0.2s ease',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)', display: 'block',
            }} />
        </button>
    );
}

/* ── Accordion component ─────────────────────────────────────── */
function Accordion({ title, icon, open, onToggle, badge, children }: {
    title: string; icon: React.ReactNode; open: boolean;
    onToggle: () => void; badge?: React.ReactNode; children: React.ReactNode;
    fg?: string; border?: string; cardBg?: string;
}) {
    return (
        <div style={{ borderRadius: '0.75rem', border: '1px solid', overflow: 'hidden' }} className="accordion-wrapper">
            <button
                type="button"
                onClick={onToggle}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
                    padding: '0.875rem 1.25rem', background: 'transparent', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                }}
            >
                <span style={{ opacity: 0.7, display: 'flex', alignItems: 'center' }}>{icon}</span>
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', flex: 1 }}>{title}</span>
                {badge}
                <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transition: 'transform 0.25s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.5, flexShrink: 0 }}
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {/* grid-template-rows trick: smooth 0fr ↔ 1fr animation */}
            <div style={{
                display: 'grid',
                gridTemplateRows: open ? '1fr' : '0fr',
                transition: 'grid-template-rows 0.3s ease',
            }}>
                <div style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '0 1.25rem 1.25rem' }}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Main edit component ─────────────────────────────────────── */
function EditContent({ series, items, genres, seriesOptions }: Props) {
    const { currentTheme } = useTheme();
    const light   = isLight(currentTheme.background);
    const fg      = currentTheme.foreground;
    const muted   = wa(fg, 0.45);
    const border  = wa(fg, 0.12);
    const cardBg  = light ? wa(fg, 0.03) : wa(fg, 0.06);
    const inputBg = light ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)';
    const accent  = light ? '#b45309' : '#fbbf24';

    const inputStyle = (hasError?: boolean): React.CSSProperties => ({
        width: '100%', padding: '0.5rem 0.875rem', borderRadius: '0.5rem',
        border: `1px solid ${hasError ? '#ef4444' : border}`,
        background: inputBg, color: fg, outline: 'none',
        boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '0.875rem',
    });

    const TLabel = ({ children }: { children: React.ReactNode }) => (
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: fg, marginBottom: '0.4rem' }}>
            {children}
        </label>
    );

    /* ── State ── */
    const [submitting, setSubmitting]       = useState(false);
    const [errors, setErrors]               = useState<Record<string, string>>({});
    const [itemErrors, setItemErrors]       = useState<Record<string, string>>({});
    const [deletingSeries, setDeletingSeries] = useState(false);
    const [infoOpen, setInfoOpen]           = useState(true);
    const [settingsOpen, setSettingsOpen]   = useState(false);

    const [seriesData, setSeriesData] = useState({
        title: series.title,
        alternative_title: series.alternative_title || '',
        cover: null as File | null,
        synopsis: series.synopsis,
        author: series.author || '',
        artist: series.artist || '',
        genre_ids: series.genres.map(g => g.id),
        show_trial_button: (series as any).show_trial_button || false,
        series_slug: (series as any).series_slug || '',
        free_for_premium_members: !!series.free_for_premium_members,
        is_mature: !!series.is_mature,
    });

    const [coverPreview, setCoverPreview]       = useState<string>(series.cover_url);
    const [showItemForm, setShowItemForm]       = useState(false);
    const [editingItemId, setEditingItemId]     = useState<number | null>(null);
    const [itemData, setItemData] = useState({
        title: '', cover: null as File | null, summary: '',
        file: null as File | null, pdf_file: null as File | null,
        price_coins: '', order: '',
    });
    const [itemCoverPreview, setItemCoverPreview] = useState<string | null>(null);
    const [deletingItemId, setDeletingItemId]     = useState<number | null>(null);
    const [existingFileName, setExistingFileName] = useState<string | null>(null);
    const [hasExistingFile, setHasExistingFile]   = useState(false);
    const [hasExistingPdfFile, setHasExistingPdfFile] = useState(false);
    const [removingPreviewId, setRemovingPreviewId] = useState<number | null>(null);
    const [confirmRemovePreview, setConfirmRemovePreview] = useState<{ id: number; title: string } | null>(null);

    /* ── Handlers ── */
    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { setSeriesData(p => ({ ...p, cover: file })); setCoverPreview(URL.createObjectURL(file)); }
    };

    const toggleGenre = (id: number) =>
        setSeriesData(p => ({ ...p, genre_ids: p.genre_ids.includes(id) ? p.genre_ids.filter(g => g !== id) : [...p.genre_ids, id] }));

    const handleSeriesSubmit = (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true); setErrors({});
        const data = new FormData();
        data.append('title', seriesData.title);
        data.append('alternative_title', seriesData.alternative_title);
        if (seriesData.cover) data.append('cover', seriesData.cover);
        data.append('synopsis', seriesData.synopsis);
        data.append('author', seriesData.author);
        data.append('artist', seriesData.artist);
        seriesData.genre_ids.forEach(id => data.append('genre_ids[]', id.toString()));
        data.append('show_trial_button', seriesData.show_trial_button ? '1' : '0');
        data.append('series_slug', seriesData.series_slug);
        data.append('free_for_premium_members', seriesData.free_for_premium_members ? '1' : '0');
        data.append('is_mature', seriesData.is_mature ? '1' : '0');
        data.append('_method', 'PUT');
        router.post(route('admin.ebookseries.update', series.id), data, {
            onError: (err) => { setErrors(err); setSubmitting(false); },
            onFinish: () => setSubmitting(false),
        });
    };

    const openItemForm = (item?: Item) => {
        setItemErrors({});
        if (item) {
            setEditingItemId(item.id);
            setItemData({ title: item.title, cover: null, summary: item.summary || '', file: null, pdf_file: null, price_coins: item.price_coins.toString(), order: item.order.toString() });
            setItemCoverPreview(item.cover_url);
            setHasExistingFile(item.has_file);
            setHasExistingPdfFile(item.has_pdf_file || false);
            setExistingFileName(item.has_file ? item.title : null);
        } else {
            setEditingItemId(null);
            setItemData({ title: '', cover: null, summary: '', file: null, pdf_file: null, price_coins: '', order: (items.length + 1).toString() });
            setItemCoverPreview(null); setHasExistingFile(false); setHasExistingPdfFile(false); setExistingFileName(null);
        }
        setShowItemForm(true);
    };

    const closeItemForm = () => {
        setShowItemForm(false); setEditingItemId(null); setItemErrors({});
        setItemData({ title: '', cover: null, summary: '', file: null, pdf_file: null, price_coins: '', order: '' });
        setItemCoverPreview(null); setHasExistingFile(false); setHasExistingPdfFile(false); setExistingFileName(null);
    };

    const handleItemCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { setItemData(p => ({ ...p, cover: file })); setItemCoverPreview(URL.createObjectURL(file)); }
    };

    const handleItemSubmit = (e: FormEvent) => {
        e.preventDefault(); setSubmitting(true); setItemErrors({});
        const data = new FormData();
        data.append('title', itemData.title);
        if (itemData.cover) data.append('cover', itemData.cover);
        data.append('summary', itemData.summary);
        if (itemData.file) data.append('file', itemData.file);
        if (itemData.pdf_file) data.append('pdf_file', itemData.pdf_file);
        data.append('price_coins', itemData.price_coins);
        data.append('order', itemData.order);
        if (editingItemId) {
            data.append('_method', 'PUT');
            router.post(route('admin.ebookseries.items.update', [series.id, editingItemId]), data, {
                preserveScroll: true, preserveState: false,
                onSuccess: () => closeItemForm(), onError: e => setItemErrors(e), onFinish: () => setSubmitting(false),
            });
        } else {
            router.post(route('admin.ebookseries.items.store', series.id), data, {
                preserveScroll: true, preserveState: false,
                onSuccess: () => closeItemForm(), onError: e => setItemErrors(e), onFinish: () => setSubmitting(false),
            });
        }
    };

    const handleDeleteSeries = () => {
        if (confirm(`Delete "${series.title}" and ALL its volumes/files? This cannot be undone.`)) {
            setDeletingSeries(true);
            router.delete(route('admin.ebookseries.destroy', series.id), { onFinish: () => setDeletingSeries(false) });
        }
    };

    const deleteItem = (itemId: number, title: string) => {
        if (confirm(`Delete volume "${title}"?`)) {
            setDeletingItemId(itemId);
            router.delete(route('admin.ebookseries.items.destroy', [series.id, itemId]), { onFinish: () => setDeletingItemId(null) });
        }
    };

    const handleRemovePreview = (itemId: number) => {
        setRemovingPreviewId(itemId);
        router.delete(route('admin.ebookseries.items.preview.destroy', [series.id, itemId]), {
            onFinish: () => { setRemovingPreviewId(null); setConfirmRemovePreview(null); },
        });
    };

    const activeSettingsCount = [seriesData.free_for_premium_members, seriesData.is_mature, seriesData.show_trial_button].filter(Boolean).length;

    /* ── JSX ── */
    return (
        <div style={{ color: fg, minHeight: '100vh', paddingBottom: '4rem' }}>

            {/* ── Sticky top bar ────────────────────────────────────── */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 40,
                background: currentTheme.background,
                borderBottom: `1px solid ${border}`,
                padding: '0.625rem 1.5rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
                <Link
                    href={route('admin.ebookseries.index')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: muted, textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 500 }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6"/>
                    </svg>
                    Ebook Series
                </Link>
                <span style={{ color: muted, fontSize: '0.75rem' }}>/</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '24rem' }}>
                    {seriesData.title || series.title}
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                        form="series-form"
                        type="submit"
                        disabled={submitting}
                        style={{
                            background: accent, color: light ? '#fff' : '#000',
                            border: 'none', padding: '0.45rem 1.125rem', borderRadius: '0.5rem',
                            fontWeight: 700, fontSize: '0.8125rem', cursor: submitting ? 'not-allowed' : 'pointer',
                            opacity: submitting ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '0.375rem',
                        }}
                    >
                        {submitting ? (
                            <>
                                <svg style={{ width: '0.875rem', height: '0.875rem', animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }}/>
                                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                </svg>
                                Saving…
                            </>
                        ) : '✓ Save Changes'}
                    </button>
                </div>
            </div>

            <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '1.5rem 1rem 0' }}>

                {/* ── Quick info card ───────────────────────────────── */}
                <div style={{
                    display: 'flex', gap: '1rem', alignItems: 'flex-start',
                    background: cardBg, border: `1px solid ${border}`,
                    borderRadius: '0.875rem', padding: '1rem', marginBottom: '1.25rem',
                }}>
                    <img
                        src={coverPreview}
                        alt={series.title}
                        style={{ width: '3.5rem', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '0.375rem', flexShrink: 0 }}
                        onError={e => { e.currentTarget.src = '/images/default-cover.jpg'; }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                            {seriesData.free_for_premium_members && (
                                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.14)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '9999px', padding: '0.1rem 0.5rem' }}>Free for Premium</span>
                            )}
                            {seriesData.is_mature && (
                                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#f87171', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '9999px', padding: '0.1rem 0.5rem' }}>R18</span>
                            )}
                            {!seriesData.free_for_premium_members && (
                                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: accent, background: `${wa(fg, 0.06)}`, border: `1px solid ${wa(fg, 0.12)}`, borderRadius: '9999px', padding: '0.1rem 0.5rem' }}>Exclusive</span>
                            )}
                        </div>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: fg, margin: '0 0 0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {seriesData.title || '—'}
                        </h2>
                        {seriesData.alternative_title && (
                            <p style={{ fontSize: '0.75rem', color: muted, margin: '0 0 0.375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {seriesData.alternative_title}
                            </p>
                        )}
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {seriesData.author && <span style={{ fontSize: '0.7rem', color: muted }}>by {seriesData.author}</span>}
                            <span style={{ fontSize: '0.7rem', color: muted }}>{items.length} volume{items.length !== 1 ? 's' : ''}</span>
                            <span style={{ fontSize: '0.7rem', color: muted }}>/{series.slug}</span>
                        </div>
                    </div>
                    <a
                        href={route('epub-novels.show', series.slug)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: muted, textDecoration: 'none', fontSize: '0.75rem', fontWeight: 500, flexShrink: 0, padding: '0.35rem 0.625rem', borderRadius: '0.375rem', border: `1px solid ${border}` }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        View
                    </a>
                </div>

                {/* ── FORM ─────────────────────────────────────────── */}
                <form id="series-form" onSubmit={handleSeriesSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>

                    {/* Error banner */}
                    {Object.keys(errors).length > 0 && (
                        <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#f87171', fontSize: '0.875rem' }}>
                            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Please fix the following errors:</strong>
                            <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                                {Object.entries(errors).map(([k, v]) => <li key={k}>{v}</li>)}
                            </ul>
                        </div>
                    )}

                    {/* ── Accordion 1: Series Information ──────────── */}
                    <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '0.875rem', overflow: 'hidden' }}>
                        <button
                            type="button"
                            onClick={() => setInfoOpen(o => !o)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.9rem 1.25rem', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                            </svg>
                            <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: fg, flex: 1, textAlign: 'left' }}>Series Information</span>
                            {seriesData.genre_ids.length > 0 && (
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: muted, background: wa(fg, 0.08), borderRadius: '9999px', padding: '0.1rem 0.5rem' }}>
                                    {seriesData.genre_ids.length} genre{seriesData.genre_ids.length !== 1 ? 's' : ''}
                                </span>
                            )}
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                style={{ transition: 'transform 0.25s ease', transform: infoOpen ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.45, flexShrink: 0 }}>
                                <path d="M6 9l6 6 6-6"/>
                            </svg>
                        </button>

                        <div style={{ display: 'grid', gridTemplateRows: infoOpen ? '1fr' : '0fr', transition: 'grid-template-rows 0.3s ease' }}>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ padding: '0 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

                                    {/* Title + Alt Title */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                                        <div>
                                            <TLabel>Title *</TLabel>
                                            <input type="text" value={seriesData.title} onChange={e => setSeriesData(p => ({ ...p, title: e.target.value }))} style={inputStyle(!!errors.title)} required />
                                            {errors.title && <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: '0.2rem 0 0' }}>{errors.title}</p>}
                                        </div>
                                        <div>
                                            <TLabel>Alternative Title</TLabel>
                                            <input type="text" value={seriesData.alternative_title} onChange={e => setSeriesData(p => ({ ...p, alternative_title: e.target.value }))} style={inputStyle()} />
                                        </div>
                                    </div>

                                    {/* Cover */}
                                    <div>
                                        <TLabel>Cover Image</TLabel>
                                        <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                                            <img src={coverPreview} alt="Cover" style={{ width: '3.5rem', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '0.375rem', flexShrink: 0, border: `1px solid ${border}` }} onError={e => { e.currentTarget.src = '/images/default-cover.jpg'; }} />
                                            <div style={{ flex: 1 }}>
                                                <input type="file" accept="image/*" onChange={handleCoverChange} style={inputStyle()} />
                                                <p style={{ fontSize: '0.7rem', color: muted, marginTop: '0.3rem' }}>Leave empty to keep current cover.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Synopsis */}
                                    <div>
                                        <TLabel>Synopsis</TLabel>
                                        <textarea value={seriesData.synopsis} onChange={e => setSeriesData(p => ({ ...p, synopsis: e.target.value }))} rows={5} style={{ ...inputStyle(), resize: 'vertical' }} required />
                                    </div>

                                    {/* Author + Artist */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                                        <div>
                                            <TLabel>Author</TLabel>
                                            <input type="text" value={seriesData.author} onChange={e => setSeriesData(p => ({ ...p, author: e.target.value }))} style={inputStyle()} />
                                        </div>
                                        <div>
                                            <TLabel>Artist</TLabel>
                                            <input type="text" value={seriesData.artist} onChange={e => setSeriesData(p => ({ ...p, artist: e.target.value }))} style={inputStyle()} />
                                        </div>
                                    </div>

                                    {/* Genres */}
                                    <div>
                                        <TLabel>Genres</TLabel>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                            {genres.map(genre => {
                                                const active = seriesData.genre_ids.includes(genre.id);
                                                return (
                                                    <button key={genre.id} type="button" onClick={() => toggleGenre(genre.id)} style={{
                                                        padding: '0.3rem 0.875rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 600,
                                                        cursor: 'pointer', transition: 'all 0.15s',
                                                        border: `1px solid ${active ? accent : border}`,
                                                        background: active ? accent : wa(fg, 0.05),
                                                        color: active ? (light ? '#fff' : '#000') : fg,
                                                    }}>
                                                        {genre.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Accordion 2: Access & Settings ───────────── */}
                    <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '0.875rem', overflow: 'hidden' }}>
                        <button
                            type="button"
                            onClick={() => setSettingsOpen(o => !o)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.9rem 1.25rem', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                                <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2m0 16v2M2 12h2m16 0h2M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41"/>
                            </svg>
                            <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: fg, flex: 1, textAlign: 'left' }}>Access & Settings</span>
                            {activeSettingsCount > 0 && (
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.14)', borderRadius: '9999px', padding: '0.1rem 0.5rem', border: '1px solid rgba(167,139,250,0.25)' }}>
                                    {activeSettingsCount} active
                                </span>
                            )}
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                style={{ transition: 'transform 0.25s ease', transform: settingsOpen ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.45, flexShrink: 0 }}>
                                <path d="M6 9l6 6 6-6"/>
                            </svg>
                        </button>

                        <div style={{ display: 'grid', gridTemplateRows: settingsOpen ? '1fr' : '0fr', transition: 'grid-template-rows 0.3s ease' }}>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ padding: '0 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>

                                    {/* Free for Premium */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderRadius: '0.625rem', border: `1px solid ${seriesData.free_for_premium_members ? 'rgba(167,139,250,0.4)' : border}`, background: seriesData.free_for_premium_members ? 'rgba(167,139,250,0.08)' : wa(fg, 0.03) }}>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: seriesData.free_for_premium_members ? '#a78bfa' : fg, margin: '0 0 0.15rem' }}>Free for Premium Membership</p>
                                            <p style={{ fontSize: '0.7rem', color: muted, margin: 0 }}>Premium users can download all volumes without purchasing.</p>
                                        </div>
                                        <Toggle checked={seriesData.free_for_premium_members} onChange={v => setSeriesData(p => ({ ...p, free_for_premium_members: v }))} color="#a78bfa" />
                                    </div>

                                    {/* R18 */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderRadius: '0.625rem', border: `1px solid ${seriesData.is_mature ? 'rgba(239,68,68,0.4)' : border}`, background: seriesData.is_mature ? 'rgba(239,68,68,0.07)' : wa(fg, 0.03) }}>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: seriesData.is_mature ? '#f87171' : fg, margin: '0 0 0.15rem' }}>R18 — Adult Content</p>
                                            <p style={{ fontSize: '0.7rem', color: muted, margin: 0 }}>Shows an age verification modal before users can view this series.</p>
                                        </div>
                                        <Toggle checked={seriesData.is_mature} onChange={v => setSeriesData(p => ({ ...p, is_mature: v }))} color="#ef4444" />
                                    </div>

                                    {/* Trial Reading */}
                                    <div style={{ padding: '0.875rem 1rem', borderRadius: '0.625rem', border: `1px solid ${seriesData.show_trial_button ? 'rgba(59,130,246,0.4)' : border}`, background: seriesData.show_trial_button ? 'rgba(59,130,246,0.07)' : wa(fg, 0.03) }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: seriesData.show_trial_button ? '0.875rem' : 0 }}>
                                            <div>
                                                <p style={{ fontWeight: 700, fontSize: '0.875rem', color: seriesData.show_trial_button ? '#60a5fa' : fg, margin: '0 0 0.15rem' }}>Trial Reading Button</p>
                                                <p style={{ fontSize: '0.7rem', color: muted, margin: 0 }}>Link to an on-site novel for readers to sample before buying.</p>
                                            </div>
                                            <Toggle checked={seriesData.show_trial_button} onChange={v => setSeriesData(p => ({ ...p, show_trial_button: v, series_slug: v ? p.series_slug : '' }))} color="#3b82f6" />
                                        </div>
                                        {seriesData.show_trial_button && (
                                            <div>
                                                <TLabel>Link to Series Slug</TLabel>
                                                <AdminSlugCombobox
                                                    value={seriesData.series_slug}
                                                    onChange={v => setSeriesData(p => ({ ...p, series_slug: v }))}
                                                    options={seriesOptions}
                                                    placeholder="e.g., novel-series-name"
                                                    required={seriesData.show_trial_button}
                                                    fg={fg} muted={muted} border={border} inputBg={inputBg} panelBg={cardBg} accent="#60a5fa"
                                                />
                                                {errors.series_slug && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.2rem' }}>{errors.series_slug}</p>}
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                </form>

                {/* ── Volumes section ───────────────────────────────── */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: fg, margin: '0 0 0.1rem' }}>
                                Volumes
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: muted }}>({items.length})</span>
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => openItemForm()}
                            style={{ background: accent, color: light ? '#fff' : '#000', border: 'none', padding: '0.45rem 0.875rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                            Add Volume
                        </button>
                    </div>

                    {items.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                            {items.map(item => (
                                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: cardBg, border: `1px solid ${border}`, borderRadius: '0.625rem', padding: '0.75rem' }}>
                                    {/* Top row: cover + info + edit/del */}
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <img src={item.cover_url} alt={item.title} style={{ width: '2.75rem', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '0.25rem', flexShrink: 0 }} onError={e => { e.currentTarget.src = '/images/default-cover.jpg'; }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontWeight: 700, fontSize: '0.8125rem', color: fg, margin: '0 0 0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '0.7rem', color: muted }}>#{item.order}</span>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: accent }}>¢{item.price_coins.toLocaleString()}</span>
                                                {item.has_file && <span style={{ fontSize: '0.6rem', color: '#22c55e', background: 'rgba(34,197,94,0.12)', borderRadius: '9999px', padding: '0.05rem 0.4rem', fontWeight: 700 }}>EPUB</span>}
                                                {item.has_pdf_file && <span style={{ fontSize: '0.6rem', color: '#f87171', background: 'rgba(248,113,113,0.12)', borderRadius: '9999px', padding: '0.05rem 0.4rem', fontWeight: 700 }}>PDF</span>}
                                                {item.has_preview && <span style={{ fontSize: '0.6rem', color: '#fbbf24', background: 'rgba(251,191,36,0.12)', borderRadius: '9999px', padding: '0.05rem 0.4rem', fontWeight: 700 }}>Preview</span>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                                            <button type="button" onClick={() => openItemForm(item)} style={{ background: wa(fg, 0.08), color: fg, border: `1px solid ${border}`, padding: '0.3rem 0.625rem', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.7rem', cursor: 'pointer' }}>Edit</button>
                                            <button type="button" onClick={() => deleteItem(item.id, item.title)} disabled={deletingItemId === item.id} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', padding: '0.3rem 0.625rem', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.7rem', cursor: deletingItemId === item.id ? 'not-allowed' : 'pointer', opacity: deletingItemId === item.id ? 0.5 : 1 }}>
                                                {deletingItemId === item.id ? '…' : 'Del'}
                                            </button>
                                        </div>
                                    </div>
                                    {/* Bottom row: preview actions */}
                                    <div style={{ display: 'flex', gap: '0.375rem', paddingTop: '0.375rem', borderTop: `1px solid ${border}` }}>
                                        <Link
                                            href={route('admin.ebookseries.items.preview.edit', [series.id, item.id])}
                                            style={{
                                                flex: 1, textAlign: 'center', textDecoration: 'none',
                                                background: item.has_preview ? 'rgba(251,191,36,0.10)' : wa(fg, 0.06),
                                                color: item.has_preview ? '#fbbf24' : muted,
                                                border: `1px solid ${item.has_preview ? 'rgba(251,191,36,0.3)' : border}`,
                                                padding: '0.25rem 0.5rem', borderRadius: '0.375rem',
                                                fontWeight: 600, fontSize: '0.675rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                                            }}
                                        >
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                {item.has_preview
                                                    ? <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                    : <path d="M12 5v14M5 12h14"/>
                                                }
                                            </svg>
                                            {item.has_preview ? 'Edit Preview' : 'Add Preview'}
                                        </Link>
                                        {item.has_preview && (
                                            <button
                                                type="button"
                                                onClick={() => setConfirmRemovePreview({ id: item.id, title: item.title })}
                                                disabled={removingPreviewId === item.id}
                                                style={{
                                                    background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                                                    border: '1px solid rgba(239,68,68,0.22)',
                                                    padding: '0.25rem 0.5rem', borderRadius: '0.375rem',
                                                    fontWeight: 600, fontSize: '0.675rem', cursor: removingPreviewId === item.id ? 'not-allowed' : 'pointer',
                                                    opacity: removingPreviewId === item.id ? 0.5 : 1,
                                                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                                                }}
                                            >
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M18 6L6 18M6 6l12 12"/>
                                                </svg>
                                                {removingPreviewId === item.id ? '…' : 'Remove Preview'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', background: cardBg, border: `1px dashed ${border}`, borderRadius: '0.75rem', color: muted, fontSize: '0.875rem' }}>
                            No volumes yet. Add the first one!
                        </div>
                    )}
                </div>

                {/* ── Danger Zone ───────────────────────────────────── */}
                <div style={{ borderTop: `1px solid rgba(239,68,68,0.2)`, paddingTop: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#ef4444', margin: '0 0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Danger Zone</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: '0.625rem', padding: '0.875rem 1rem' }}>
                        <div>
                            <p style={{ fontWeight: 600, color: fg, margin: '0 0 0.15rem', fontSize: '0.875rem' }}>Delete this series</p>
                            <p style={{ fontSize: '0.7rem', color: muted, margin: 0 }}>Permanently deletes all volumes, covers, and EPUB/PDF files. Cannot be undone.</p>
                        </div>
                        <button type="button" onClick={handleDeleteSeries} disabled={deletingSeries} style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.38)', padding: '0.5rem 1.125rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.8125rem', cursor: deletingSeries ? 'not-allowed' : 'pointer', opacity: deletingSeries ? 0.5 : 1, flexShrink: 0 }}>
                            {deletingSeries ? 'Deleting…' : 'Delete Series'}
                        </button>
                    </div>
                </div>

            </div>

            {/* ── Remove Preview Confirmation Modal ──────────────────── */}
            {confirmRemovePreview && (
                <div
                    onClick={() => setConfirmRemovePreview(null)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{ background: currentTheme.background, border: `1px solid ${border}`, borderRadius: '0.875rem', padding: '1.5rem', width: '100%', maxWidth: '26rem' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', marginBottom: '1.25rem' }}>
                            <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: fg, margin: '0 0 0.35rem' }}>Remove Preview?</h3>
                                <p style={{ fontSize: '0.8125rem', color: muted, margin: 0 }}>
                                    This will permanently remove the preview content for <strong style={{ color: fg }}>{confirmRemovePreview.title}</strong>. The preview page will no longer be accessible.
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => setConfirmRemovePreview(null)}
                                style={{ background: wa(fg, 0.07), color: fg, border: `1px solid ${border}`, padding: '0.45rem 1rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleRemovePreview(confirmRemovePreview.id)}
                                disabled={removingPreviewId === confirmRemovePreview.id}
                                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)', padding: '0.45rem 1rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.8125rem', cursor: removingPreviewId === confirmRemovePreview.id ? 'not-allowed' : 'pointer', opacity: removingPreviewId === confirmRemovePreview.id ? 0.5 : 1 }}
                            >
                                {removingPreviewId === confirmRemovePreview.id ? 'Removing…' : 'Remove Preview'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Item Modal ────────────────────────────────────────── */}
            {showItemForm && (
                <div onClick={closeItemForm} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                    <div onClick={e => e.stopPropagation()} style={{ background: currentTheme.background, border: `1px solid ${border}`, borderRadius: '0.875rem', padding: '1.5rem', width: '100%', maxWidth: '38rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: fg, margin: 0 }}>
                                {editingItemId ? 'Edit Volume' : 'Add New Volume'}
                            </h3>
                            <button type="button" onClick={closeItemForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, padding: '0.25rem' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                        </div>

                        <form onSubmit={handleItemSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {Object.keys(itemErrors).length > 0 && (
                                <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171', fontSize: '0.8125rem' }}>
                                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Could not save volume:</strong>
                                    <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>{Object.entries(itemErrors).map(([k, v]) => <li key={k}>{v}</li>)}</ul>
                                </div>
                            )}

                            <div>
                                <TLabel>Title *</TLabel>
                                <input type="text" value={itemData.title} onChange={e => setItemData(p => ({ ...p, title: e.target.value }))} style={inputStyle(!!itemErrors.title)} required />
                            </div>

                            <div>
                                <TLabel>Cover Image {!editingItemId && '*'}</TLabel>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                    {itemCoverPreview && <img src={itemCoverPreview} alt="Cover" style={{ width: '3rem', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '0.25rem', flexShrink: 0, border: `1px solid ${border}` }} />}
                                    <input type="file" accept="image/*" onChange={handleItemCoverChange} style={inputStyle(!!itemErrors.cover)} required={!editingItemId} />
                                </div>
                            </div>

                            <div>
                                <TLabel>Summary</TLabel>
                                <textarea value={itemData.summary} onChange={e => setItemData(p => ({ ...p, summary: e.target.value }))} rows={3} style={{ ...inputStyle(), resize: 'none' }} />
                            </div>

                            <div>
                                <TLabel>EPUB File {!editingItemId && '*'}</TLabel>
                                {hasExistingFile && <p style={{ fontSize: '0.7rem', color: '#22c55e', margin: '0 0 0.35rem', fontWeight: 600 }}>✓ File exists — upload to replace</p>}
                                <input type="file" accept=".epub" onChange={e => setItemData(p => ({ ...p, file: e.target.files?.[0] || null }))} style={inputStyle(!!itemErrors.file)} required={!editingItemId} />
                            </div>

                            <div>
                                <TLabel>PDF File <span style={{ color: muted, fontWeight: 400 }}>(optional)</span></TLabel>
                                {hasExistingPdfFile && <p style={{ fontSize: '0.7rem', color: '#22c55e', margin: '0 0 0.35rem', fontWeight: 600 }}>✓ PDF exists — upload to replace</p>}
                                <input type="file" accept=".pdf" onChange={e => setItemData(p => ({ ...p, pdf_file: e.target.files?.[0] || null }))} style={inputStyle()} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <TLabel>Price (Coins) *</TLabel>
                                    <input type="number" value={itemData.price_coins} onChange={e => setItemData(p => ({ ...p, price_coins: e.target.value }))} style={inputStyle(!!itemErrors.price_coins)} min="0" required />
                                </div>
                                <div>
                                    <TLabel>Order *</TLabel>
                                    <input type="number" value={itemData.order} onChange={e => setItemData(p => ({ ...p, order: e.target.value }))} style={inputStyle(!!itemErrors.order)} min="1" required />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
                                <button type="submit" disabled={submitting} style={{ flex: 1, background: accent, color: light ? '#fff' : '#000', border: 'none', padding: '0.625rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.875rem', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
                                    {submitting ? 'Saving…' : editingItemId ? 'Update Volume' : 'Add Volume'}
                                </button>
                                <button type="button" onClick={closeItemForm} style={{ background: wa(fg, 0.07), color: fg, border: `1px solid ${border}`, padding: '0.625rem 1.125rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Edit({ series, items, genres, seriesOptions }: Props) {
    return (
        <AdminLayout>
            <Head title={`Edit — ${series.title}`} />
            <EditContent series={series} items={items} genres={genres} seriesOptions={seriesOptions} />
        </AdminLayout>
    );
}
