import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import RichTextEditor from '@/Components/RichTextEditor';

function hexToRgb(hex: string) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function isLight(hex: string) { const { r, g, b } = hexToRgb(hex); return (r * 299 + g * 587 + b * 114) / 1000 > 128; }
function wa(hex: string, a: number) { const { r, g, b } = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }

function CreateContent() {
    const { currentTheme } = useTheme();
    const light   = isLight(currentTheme.background);
    const fg      = currentTheme.foreground;
    const muted   = wa(fg, 0.45);
    const border  = wa(fg, 0.12);
    const cardBg  = light ? wa(fg, 0.03) : wa(fg, 0.06);
    const inputBg = light ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)';
    const accent  = light ? '#b45309' : '#fbbf24';

    const inputStyle = (hasError?: boolean): React.CSSProperties => ({
        width: '100%', padding: '0.5rem 1rem', borderRadius: '0.5rem',
        border: `1px solid ${hasError ? '#ef4444' : border}`,
        background: inputBg, color: fg, outline: 'none',
        boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '0.875rem',
    });

    const [formData, setFormData] = useState({ title: '', content: '', show_in_homepage: true });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});
        router.post(route('admin.blog.store'), formData, {
            onError: (errors) => { setErrors(errors); setIsSubmitting(false); },
            onFinish: () => { setIsSubmitting(false); },
        });
    };

    return (
        <div style={{ color: fg, padding: '2rem 1rem', minHeight: '100vh' }}>
            <div style={{ maxWidth: '56rem', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button
                        type="button"
                        onClick={() => router.visit(route('admin.blog.index'))}
                        style={{ background: 'none', border: 'none', color: muted, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}
                    >
                        <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Blog Management
                    </button>
                    <span style={{ color: muted }}>/</span>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: fg, margin: 0 }}>Create New Blog</h1>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '0.75rem', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Title */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: fg, marginBottom: '0.5rem' }}>Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                style={inputStyle(!!errors.title)}
                                placeholder="Enter blog title..."
                                required
                            />
                            {errors.title && <p style={{ color: '#ef4444', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{errors.title}</p>}
                        </div>

                        {/* Content */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: fg, marginBottom: '0.5rem' }}>Content *</label>
                            <RichTextEditor
                                value={formData.content}
                                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                                placeholder="Write your blog content here..."
                                height={450}
                                uploadUrl={route('admin.blog.upload-image')}
                            />
                            {errors.content && <p style={{ color: '#ef4444', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{errors.content}</p>}
                        </div>

                        {/* Show in homepage */}
                        <div style={{ padding: '1rem', background: light ? 'rgba(59,130,246,0.06)' : 'rgba(59,130,246,0.1)', border: `1px solid ${wa(fg, 0.12)}`, borderRadius: '0.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.show_in_homepage}
                                    onChange={(e) => setFormData(prev => ({ ...prev, show_in_homepage: e.target.checked }))}
                                    style={{ marginTop: '0.1rem', width: '1rem', height: '1rem', accentColor: '#3b82f6', flexShrink: 0 }}
                                />
                                <div>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: fg }}>Show in Homepage (as Announcement)</span>
                                    <p style={{ fontSize: '0.75rem', color: muted, marginTop: '0.25rem', marginBottom: 0 }}>
                                        If enabled, this blog will appear on the homepage as an announcement. If disabled, it will be accessible only via direct link.
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={() => router.visit(route('admin.blog.index'))}
                                disabled={isSubmitting}
                                style={{ background: wa(fg, 0.07), color: fg, border: `1px solid ${border}`, padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                style={{
                                    background: accent, color: light ? '#fff' : '#000', border: 'none',
                                    padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontWeight: 600,
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                    opacity: isSubmitting ? 0.6 : 1, fontSize: '0.875rem',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                }}
                            >
                                {isSubmitting && (
                                    <svg style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                                        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                )}
                                {isSubmitting ? 'Creating...' : 'Create Blog'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function BlogCreate() {
    return (
        <AdminLayout title="Create Blog">
            <Head title="Create Blog" />
            <CreateContent />
        </AdminLayout>
    );
}
