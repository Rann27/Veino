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

interface Genre {
    id: number;
    name: string;
}

interface Props {
    genres: Genre[];
}

function CreateContent({ genres }: Props) {
    const { currentTheme } = useTheme();
    const light    = isLight(currentTheme.background);
    const fg       = currentTheme.foreground;
    const muted    = wa(fg, 0.45);
    const border   = wa(fg, 0.12);
    const cardBg   = light ? wa(fg, 0.03) : wa(fg, 0.06);
    const inputBg  = light ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)';
    const accent   = light ? '#b45309' : '#fbbf24';

    //  themed helpers 
    const TLabel = ({ children }: { children: React.ReactNode }) => (
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: fg, marginBottom: '0.5rem' }}>
            {children}
        </label>
    );

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

    //  state 
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        title: '',
        alternative_title: '',
        cover: null as File | null,
        synopsis: '',
        author: '',
        artist: '',
        genre_ids: [] as number[],
    });

    const [coverPreview, setCoverPreview] = useState<string | null>(null);

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, cover: file }));
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const toggleGenre = (genreId: number) => {
        setFormData(prev => ({
            ...prev,
            genre_ids: prev.genre_ids.includes(genreId)
                ? prev.genre_ids.filter(id => id !== genreId)
                : [...prev.genre_ids, genreId],
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        const data = new FormData();
        data.append('title', formData.title);
        data.append('alternative_title', formData.alternative_title);
        if (formData.cover) data.append('cover', formData.cover);
        data.append('synopsis', formData.synopsis);
        data.append('author', formData.author);
        data.append('artist', formData.artist);
        formData.genre_ids.forEach(id => data.append('genre_ids[]', id.toString()));

        router.post(route('admin.ebookseries.store'), data, {
            onError: (errors) => { setErrors(errors); setSubmitting(false); },
            onFinish: () => { setSubmitting(false); },
        });
    };

    return (
        <div style={{ color: fg, padding: '2rem 1rem', minHeight: '100vh' }}>
            <div style={{ maxWidth: '56rem', margin: '0 auto' }}>

                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: fg, marginBottom: '2rem' }}>
                    Create New Ebook Series
                </h1>

                <form
                    onSubmit={handleSubmit}
                    style={{
                        background: cardBg,
                        border: `1px solid ${border}`,
                        borderRadius: '0.75rem',
                        padding: '1.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                    }}
                >
                    {/* Title */}
                    <div>
                        <TLabel>Title *</TLabel>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
                            value={formData.alternative_title}
                            onChange={(e) => setFormData(prev => ({ ...prev, alternative_title: e.target.value }))}
                            style={inputStyle()}
                        />
                    </div>

                    {/* Cover */}
                    <div>
                        <TLabel>Cover Image *</TLabel>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverChange}
                            style={inputStyle(!!errors.cover)}
                            required
                        />
                        {coverPreview && (
                            <div style={{ marginTop: '0.5rem' }}>
                                <img src={coverPreview} alt="Cover preview" style={{ width: '8rem', borderRadius: '0.5rem' }} />
                            </div>
                        )}
                        {errors.cover && <p style={{ color: '#ef4444', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{errors.cover}</p>}
                    </div>

                    {/* Synopsis */}
                    <div>
                        <TLabel>Synopsis *</TLabel>
                        <textarea
                            value={formData.synopsis}
                            onChange={(e) => setFormData(prev => ({ ...prev, synopsis: e.target.value }))}
                            rows={6}
                            style={{ ...inputStyle(!!errors.synopsis), resize: 'none' }}
                            required
                        />
                        {errors.synopsis && <p style={{ color: '#ef4444', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{errors.synopsis}</p>}
                    </div>

                    {/* Author & Artist */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <TLabel>Author</TLabel>
                            <input
                                type="text"
                                value={formData.author}
                                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                                style={inputStyle()}
                            />
                        </div>
                        <div>
                            <TLabel>Artist</TLabel>
                            <input
                                type="text"
                                value={formData.artist}
                                onChange={(e) => setFormData(prev => ({ ...prev, artist: e.target.value }))}
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
                                        border: `1px solid ${formData.genre_ids.includes(genre.id) ? accent : border}`,
                                        background: formData.genre_ids.includes(genre.id) ? accent : wa(fg, 0.05),
                                        color: formData.genre_ids.includes(genre.id) ? (light ? '#fff' : '#000') : fg,
                                    }}
                                >
                                    {genre.name}
                                </button>
                            ))}
                        </div>
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
                            {submitting ? 'Creating...' : 'Create Series'}
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
                            Cancel
                        </a>
                    </div>
                </form>

            </div>
        </div>
    );
}

export default function Create({ genres }: Props) {
    return (
        <AdminLayout title="Create Ebook Series">
            <Head title="Create Ebook Series" />
            <CreateContent genres={genres} />
        </AdminLayout>
    );
}
