import React, { useState, FormEvent } from 'react';
import { Head, router } from '@inertiajs/react';
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
}

interface Props {
    series: Series;
    items: Item[];
    genres: Genre[];
}

function EditContent({ series, items, genres }: Props) {
    const { currentTheme } = useTheme();
    const light    = isLight(currentTheme.background);
    const fg       = currentTheme.foreground;
    const muted    = wa(fg, 0.45);
    const border   = wa(fg, 0.12);
    const cardBg   = light ? wa(fg, 0.03) : wa(fg, 0.06);
    const panelBg  = light ? wa(fg, 0.06) : wa(fg, 0.09);
    const inputBg  = light ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)';
    const accent   = light ? '#b45309' : '#fbbf24';

    const inputStyle = (hasError?: boolean): React.CSSProperties => ({
        width: '100%',
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        border: `1px solid ${hasError ? '#ef4444' : border}`,
        background: inputBg,
        color: fg,
        outline: 'none',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        fontSize: '0.875rem',
    });

    const TLabel = ({ children }: { children: React.ReactNode }) => (
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: fg, marginBottom: '0.5rem' }}>
            {children}
        </label>
    );

    //  state 
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

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
    });

    const [coverPreview, setCoverPreview] = useState<string>(series.cover_url);

    const [showItemForm, setShowItemForm] = useState(false);
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [itemData, setItemData] = useState({
        title: '',
        cover: null as File | null,
        summary: '',
        file: null as File | null,
        pdf_file: null as File | null,
        price_coins: '',
        order: '',
    });

    const [itemCoverPreview, setItemCoverPreview] = useState<string | null>(null);
    const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
    const [existingFileName, setExistingFileName] = useState<string | null>(null);
    const [hasExistingFile, setHasExistingFile] = useState(false);
    const [hasExistingPdfFile, setHasExistingPdfFile] = useState(false);

    //  handlers 
    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSeriesData(prev => ({ ...prev, cover: file }));
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const toggleGenre = (genreId: number) => {
        setSeriesData(prev => ({
            ...prev,
            genre_ids: prev.genre_ids.includes(genreId)
                ? prev.genre_ids.filter(id => id !== genreId)
                : [...prev.genre_ids, genreId],
        }));
    };

    const handleSeriesSubmit = (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

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
        data.append('_method', 'PUT');

        router.post(route('admin.ebookseries.update', series.id), data, {
            onError: (errors) => { setErrors(errors); setSubmitting(false); },
            onFinish: () => { setSubmitting(false); },
        });
    };

    const openItemForm = (item?: Item) => {
        if (item) {
            setEditingItemId(item.id);
            setItemData({
                title: item.title,
                cover: null,
                summary: item.summary || '',
                file: null,
                pdf_file: null,
                price_coins: item.price_coins.toString(),
                order: item.order.toString(),
            });
            setItemCoverPreview(item.cover_url);
            setHasExistingFile(item.has_file);
            setHasExistingPdfFile(item.has_pdf_file || false);
            setExistingFileName(item.has_file ? item.title : null);
        } else {
            setEditingItemId(null);
            setItemData({
                title: '',
                cover: null,
                summary: '',
                file: null,
                pdf_file: null,
                price_coins: '',
                order: (items.length + 1).toString(),
            });
            setItemCoverPreview(null);
            setHasExistingFile(false);
            setHasExistingPdfFile(false);
            setExistingFileName(null);
        }
        setShowItemForm(true);
    };

    const closeItemForm = () => {
        setShowItemForm(false);
        setEditingItemId(null);
        setItemData({ title: '', cover: null, summary: '', file: null, pdf_file: null, price_coins: '', order: '' });
        setItemCoverPreview(null);
        setHasExistingFile(false);
        setHasExistingPdfFile(false);
        setExistingFileName(null);
    };

    const handleItemCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setItemData(prev => ({ ...prev, cover: file }));
            setItemCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleItemSubmit = (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

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
                onSuccess: () => closeItemForm(),
                onFinish: () => setSubmitting(false),
            });
        } else {
            router.post(route('admin.ebookseries.items.store', series.id), data, {
                onSuccess: () => closeItemForm(),
                onFinish: () => setSubmitting(false),
            });
        }
    };

    const deleteItem = (itemId: number, title: string) => {
        if (confirm(`Delete item "${title}"?`)) {
            setDeletingItemId(itemId);
            router.delete(route('admin.ebookseries.items.destroy', [series.id, itemId]), {
                onFinish: () => setDeletingItemId(null),
            });
        }
    };

    //  JSX 
    return (
        <div style={{ color: fg, padding: '2rem 1rem', minHeight: '100vh' }}>
            <div style={{ maxWidth: '72rem', margin: '0 auto' }}>

                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: fg, marginBottom: '2rem' }}>
                    Edit: {series.title}
                </h1>

                {/* Series Form */}
                <form
                    onSubmit={handleSeriesSubmit}
                    style={{
                        background: cardBg,
                        border: `1px solid ${border}`,
                        borderRadius: '0.75rem',
                        padding: '1.75rem',
                        marginBottom: '3rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                    }}
                >
                    <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: fg, margin: 0 }}>
                        Series Information
                    </h2>

                    {/* Title */}
                    <div>
                        <TLabel>Title *</TLabel>
                        <input
                            type="text"
                            value={seriesData.title}
                            onChange={(e) => setSeriesData(prev => ({ ...prev, title: e.target.value }))}
                            style={inputStyle(!!errors.title)}
                            required
                        />
                        {errors.title && <p style={{ color: '#ef4444', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{errors.title}</p>}
                    </div>

                    {/* Alternative Title */}
                    <div>
                        <TLabel>Alternative Title</TLabel>
                        <input
                            type="text"
                            value={seriesData.alternative_title}
                            onChange={(e) => setSeriesData(prev => ({ ...prev, alternative_title: e.target.value }))}
                            style={inputStyle()}
                        />
                    </div>

                    {/* Cover */}
                    <div>
                        <TLabel>Cover Image</TLabel>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverChange}
                            style={inputStyle()}
                        />
                        <div style={{ marginTop: '0.5rem' }}>
                            <img src={coverPreview} alt="Cover" style={{ width: '8rem', borderRadius: '0.5rem' }} />
                        </div>
                    </div>

                    {/* Synopsis */}
                    <div>
                        <TLabel>Synopsis *</TLabel>
                        <textarea
                            value={seriesData.synopsis}
                            onChange={(e) => setSeriesData(prev => ({ ...prev, synopsis: e.target.value }))}
                            rows={6}
                            style={{ ...inputStyle(), resize: 'none' }}
                            required
                        />
                    </div>

                    {/* Author & Artist */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <TLabel>Author</TLabel>
                            <input
                                type="text"
                                value={seriesData.author}
                                onChange={(e) => setSeriesData(prev => ({ ...prev, author: e.target.value }))}
                                style={inputStyle()}
                            />
                        </div>
                        <div>
                            <TLabel>Artist</TLabel>
                            <input
                                type="text"
                                value={seriesData.artist}
                                onChange={(e) => setSeriesData(prev => ({ ...prev, artist: e.target.value }))}
                                style={inputStyle()}
                            />
                        </div>
                    </div>

                    {/* Genres */}
                    <div>
                        <TLabel>Genres</TLabel>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {genres.map((genre) => (
                                <button
                                    key={genre.id}
                                    type="button"
                                    onClick={() => toggleGenre(genre.id)}
                                    style={{
                                        padding: '0.375rem 1rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        border: `1px solid ${seriesData.genre_ids.includes(genre.id) ? accent : border}`,
                                        background: seriesData.genre_ids.includes(genre.id) ? accent : wa(fg, 0.05),
                                        color: seriesData.genre_ids.includes(genre.id) ? (light ? '#fff' : '#000') : fg,
                                    }}
                                >
                                    {genre.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Trial Reading Section */}
                    <div
                        style={{
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            border: `1px solid ${wa(fg, 0.15)}`,
                            background: light ? 'rgba(59,130,246,0.06)' : 'rgba(59,130,246,0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                        }}
                    >
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={seriesData.show_trial_button}
                                onChange={(e) => setSeriesData(prev => ({
                                    ...prev,
                                    show_trial_button: e.target.checked,
                                    series_slug: e.target.checked ? prev.series_slug : '',
                                }))}
                                style={{ width: '1rem', height: '1rem', accentColor: '#3b82f6' }}
                            />
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: fg }}>
                                Show Trial Reading Button
                            </span>
                        </label>

                        {seriesData.show_trial_button && (
                            <div>
                                <TLabel>Series Slug *</TLabel>
                                <input
                                    type="text"
                                    value={seriesData.series_slug}
                                    onChange={(e) => setSeriesData(prev => ({ ...prev, series_slug: e.target.value }))}
                                    placeholder="e.g., novel-series-name"
                                    style={inputStyle()}
                                    required={seriesData.show_trial_button}
                                />
                                <p style={{ fontSize: '0.75rem', color: muted, marginTop: '0.25rem' }}>
                                    The slug of the Series (on-site novel) to link to
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem' }}>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                background: accent,
                                color: light ? '#fff' : '#000',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.5rem',
                                fontWeight: 600,
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                opacity: submitting ? 0.5 : 1,
                                fontSize: '0.9375rem',
                            }}
                        >
                            {submitting ? 'Saving...' : 'Save Changes'}
                        </button>
                        <a
                            href={route('admin.ebookseries.index')}
                            style={{
                                background: wa(fg, 0.07),
                                color: fg,
                                border: `1px solid ${border}`,
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.5rem',
                                fontWeight: 600,
                                textDecoration: 'none',
                                display: 'inline-block',
                                fontSize: '0.9375rem',
                            }}
                        >
                            Back to List
                        </a>
                    </div>
                </form>

                {/* Items Section */}
                <div style={{ borderTop: `1px solid ${border}`, paddingTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: fg, margin: 0 }}>
                            Items ({items.length})
                        </h2>
                        <button
                            onClick={() => openItemForm()}
                            style={{
                                background: accent,
                                color: light ? '#fff' : '#000',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                            }}
                        >
                            + Add Item
                        </button>
                    </div>

                    {items.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    style={{
                                        background: cardBg,
                                        border: `1px solid ${border}`,
                                        borderRadius: '0.75rem',
                                        padding: '0.875rem',
                                        display: 'flex',
                                        gap: '0.875rem',
                                        alignItems: 'flex-start',
                                    }}
                                >
                                    <div style={{ width: '4rem', flexShrink: 0 }}>
                                        <img
                                            src={item.cover_url}
                                            alt={item.title}
                                            style={{ width: '100%', borderRadius: '0.375rem', display: 'block' }}
                                        />
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{ fontWeight: 700, color: fg, margin: '0 0 0.25rem 0', fontSize: '0.9375rem' }}>
                                            {item.title}
                                        </h3>
                                        <p style={{ fontSize: '0.8125rem', color: muted, margin: '0 0 0.625rem 0' }}>
                                            Order: {item.order} | Price: {item.price_coins.toLocaleString()} coins
                                        </p>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => openItemForm(item)}
                                                style={{
                                                    background: wa(fg, 0.09),
                                                    color: fg,
                                                    border: `1px solid ${border}`,
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '0.375rem',
                                                    fontWeight: 600,
                                                    fontSize: '0.75rem',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => deleteItem(item.id, item.title)}
                                                disabled={deletingItemId === item.id}
                                                style={{
                                                    background: 'rgba(239,68,68,0.1)',
                                                    color: '#ef4444',
                                                    border: '1px solid rgba(239,68,68,0.3)',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '0.375rem',
                                                    fontWeight: 600,
                                                    fontSize: '0.75rem',
                                                    cursor: deletingItemId === item.id ? 'not-allowed' : 'pointer',
                                                    opacity: deletingItemId === item.id ? 0.5 : 1,
                                                }}
                                            >
                                                {deletingItemId === item.id ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '3rem 2rem',
                                background: cardBg,
                                border: `1px solid ${border}`,
                                borderRadius: '0.75rem',
                                color: muted,
                            }}
                        >
                            No items yet. Add your first item!
                        </div>
                    )}
                </div>

                {/* Item Modal */}
                {showItemForm && (
                    <div
                        onClick={closeItemForm}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 50,
                            padding: '1rem',
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: currentTheme.background,
                                border: `1px solid ${border}`,
                                borderRadius: '0.75rem',
                                padding: '1.75rem',
                                width: '100%',
                                maxWidth: '42rem',
                                maxHeight: '90vh',
                                overflowY: 'auto',
                            }}
                        >
                            <h3 style={{ fontSize: '1.375rem', fontWeight: 700, color: fg, marginBottom: '1.5rem' }}>
                                {editingItemId ? 'Edit Item' : 'Add New Item'}
                            </h3>

                            <form onSubmit={handleItemSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {/* Title */}
                                <div>
                                    <TLabel>Title *</TLabel>
                                    <input
                                        type="text"
                                        value={itemData.title}
                                        onChange={(e) => setItemData(prev => ({ ...prev, title: e.target.value }))}
                                        style={inputStyle()}
                                        required
                                    />
                                </div>

                                {/* Cover */}
                                <div>
                                    <TLabel>Cover Image {!editingItemId && '*'}</TLabel>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleItemCoverChange}
                                        style={inputStyle()}
                                        required={!editingItemId}
                                    />
                                    {itemCoverPreview && (
                                        <div style={{ marginTop: '0.5rem' }}>
                                            <img src={itemCoverPreview} alt="Cover" style={{ width: '6rem', borderRadius: '0.375rem' }} />
                                        </div>
                                    )}
                                </div>

                                {/* Summary */}
                                <div>
                                    <TLabel>Summary</TLabel>
                                    <textarea
                                        value={itemData.summary}
                                        onChange={(e) => setItemData(prev => ({ ...prev, summary: e.target.value }))}
                                        rows={4}
                                        style={{ ...inputStyle(), resize: 'none' }}
                                    />
                                </div>

                                {/* Ebook File */}
                                <div>
                                    <TLabel>Ebook File (.epub) {!editingItemId && '*'}</TLabel>
                                    {hasExistingFile && existingFileName && (
                                        <div style={{
                                            marginBottom: '0.5rem',
                                            padding: '0.75rem',
                                            background: 'rgba(34,197,94,0.1)',
                                            border: '1px solid rgba(34,197,94,0.35)',
                                            borderRadius: '0.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                        }}>
                                            <svg style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span style={{ fontSize: '0.875rem', color: '#16a34a', fontWeight: 500 }}>
                                                Current file: {existingFileName}.epub
                                            </span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept=".epub"
                                        onChange={(e) => setItemData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                                        style={inputStyle()}
                                        required={!editingItemId}
                                    />
                                    {hasExistingFile && (
                                        <p style={{ fontSize: '0.75rem', color: muted, marginTop: '0.25rem' }}>
                                            Leave empty to keep current file, or choose a new file to replace it
                                        </p>
                                    )}
                                </div>

                                {/* PDF File */}
                                <div>
                                    <TLabel>PDF File (.pdf)  Optional</TLabel>
                                    {hasExistingPdfFile && existingFileName && (
                                        <div style={{
                                            marginBottom: '0.5rem',
                                            padding: '0.75rem',
                                            background: 'rgba(34,197,94,0.1)',
                                            border: '1px solid rgba(34,197,94,0.35)',
                                            borderRadius: '0.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                        }}>
                                            <svg style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span style={{ fontSize: '0.875rem', color: '#16a34a', fontWeight: 500 }}>
                                                Current file: {existingFileName}.pdf
                                            </span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => setItemData(prev => ({ ...prev, pdf_file: e.target.files?.[0] || null }))}
                                        style={inputStyle()}
                                    />
                                    {hasExistingPdfFile && (
                                        <p style={{ fontSize: '0.75rem', color: muted, marginTop: '0.25rem' }}>
                                            Leave empty to keep current PDF, or choose a new file to replace it
                                        </p>
                                    )}
                                </div>

                                {/* Price & Order */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <TLabel>Price (Coins) *</TLabel>
                                        <input
                                            type="number"
                                            value={itemData.price_coins}
                                            onChange={(e) => setItemData(prev => ({ ...prev, price_coins: e.target.value }))}
                                            style={inputStyle()}
                                            min="0"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <TLabel>Order *</TLabel>
                                        <input
                                            type="number"
                                            value={itemData.order}
                                            onChange={(e) => setItemData(prev => ({ ...prev, order: e.target.value }))}
                                            style={inputStyle()}
                                            min="1"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Modal Submit */}
                                <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem' }}>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        style={{
                                            background: accent,
                                            color: light ? '#fff' : '#000',
                                            border: 'none',
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '0.5rem',
                                            fontWeight: 600,
                                            cursor: submitting ? 'not-allowed' : 'pointer',
                                            opacity: submitting ? 0.5 : 1,
                                            fontSize: '0.9375rem',
                                        }}
                                    >
                                        {submitting ? 'Saving...' : editingItemId ? 'Update Item' : 'Add Item'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeItemForm}
                                        style={{
                                            background: wa(fg, 0.07),
                                            color: fg,
                                            border: `1px solid ${border}`,
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '0.5rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            fontSize: '0.9375rem',
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default function Edit({ series, items, genres }: Props) {
    return (
        <AdminLayout title={`Edit ${series.title}`}>
            <Head title={`Edit ${series.title}`} />
            <EditContent series={series} items={items} genres={genres} />
        </AdminLayout>
    );
}
