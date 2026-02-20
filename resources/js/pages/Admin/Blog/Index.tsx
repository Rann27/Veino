import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTheme } from '@/Contexts/ThemeContext';

function hexToRgb(hex: string) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function isLight(hex: string) { const { r, g, b } = hexToRgb(hex); return (r * 299 + g * 587 + b * 114) / 1000 > 128; }
function wa(hex: string, a: number) { const { r, g, b } = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }

interface Blog { id: number; title: string; created_at: string; updated_at: string; }
interface Props { blogs: Blog[]; }

function IndexContent({ blogs }: Props) {
    const { currentTheme } = useTheme();
    const light   = isLight(currentTheme.background);
    const fg      = currentTheme.foreground;
    const muted   = wa(fg, 0.45);
    const border  = wa(fg, 0.12);
    const cardBg  = light ? wa(fg, 0.03) : wa(fg, 0.06);
    const panelBg = light ? wa(fg, 0.05) : wa(fg, 0.08);
    const accent  = light ? '#b45309' : '#fbbf24';

    const [deletingId, setDeletingId] = useState<number | null>(null);

    const deleteBlog = (blogId: number, title: string) => {
        if (confirm(`Are you sure you want to delete "${title}"?`)) {
            setDeletingId(blogId);
            router.delete(route('admin.blog.destroy', blogId), {
                onFinish: () => setDeletingId(null),
            });
        }
    };

    const fmt = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
        <div style={{ color: fg, padding: '2rem 1rem', minHeight: '100vh' }}>
            <div style={{ maxWidth: '72rem', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: fg, margin: 0 }}>
                        Blog Management
                    </h1>
                    <Link
                        href={route('admin.blog.create')}
                        style={{
                            background: accent,
                            color: light ? '#fff' : '#000',
                            padding: '0.5rem 1.25rem',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                        }}
                    >
                        + Create Blog
                    </Link>
                </div>

                {/* Table / List */}
                {blogs.length > 0 ? (
                    <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '0.75rem', overflow: 'hidden' }}>
                        {/* Table header */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 10rem 9rem',
                            padding: '0.75rem 1.5rem',
                            background: panelBg,
                            borderBottom: `1px solid ${border}`,
                        }}>
                            {['TITLE', 'CREATED AT', 'ACTIONS'].map(h => (
                                <span key={h} style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.07em', color: muted }}>
                                    {h}
                                </span>
                            ))}
                        </div>

                        {/* Rows */}
                        {blogs.map((blog, idx) => (
                            <div
                                key={blog.id}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 10rem 9rem',
                                    padding: '1rem 1.5rem',
                                    borderBottom: idx < blogs.length - 1 ? `1px solid ${border}` : 'none',
                                    alignItems: 'center',
                                    transition: 'background 0.1s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = wa(fg, 0.03))}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                {/* Title */}
                                <Link
                                    href={route('admin.blog.edit', blog.id)}
                                    style={{ color: accent, fontWeight: 600, textDecoration: 'none', fontSize: '0.9375rem' }}
                                >
                                    {blog.title}
                                </Link>

                                {/* Date */}
                                <span style={{ fontSize: '0.875rem', color: muted }}>
                                    {fmt(blog.created_at)}
                                </span>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <Link
                                        href={route('admin.blog.edit', blog.id)}
                                        style={{ color: accent, fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => deleteBlog(blog.id, blog.title)}
                                        disabled={deletingId === blog.id}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            padding: 0,
                                            color: '#ef4444',
                                            fontWeight: 600,
                                            fontSize: '0.875rem',
                                            cursor: deletingId === blog.id ? 'not-allowed' : 'pointer',
                                            opacity: deletingId === blog.id ? 0.5 : 1,
                                        }}
                                    >
                                        {deletingId === blog.id ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '5rem 2rem', background: cardBg, border: `1px solid ${border}`, borderRadius: '0.75rem' }}>
                        <svg style={{ width: '3rem', height: '3rem', color: muted, margin: '0 auto 1rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: fg, marginBottom: '0.5rem' }}>No blogs yet</h3>
                        <p style={{ color: muted, marginBottom: '1.5rem' }}>Get started by creating a new blog post.</p>
                        <Link
                            href={route('admin.blog.create')}
                            style={{
                                background: accent,
                                color: light ? '#fff' : '#000',
                                padding: '0.625rem 1.5rem',
                                borderRadius: '0.5rem',
                                fontWeight: 600,
                                textDecoration: 'none',
                                display: 'inline-block',
                            }}
                        >
                            Create Blog
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function BlogIndex({ blogs }: Props) {
    return (
        <AdminLayout title="Blog Management">
            <Head title="Blog Management" />
            <IndexContent blogs={blogs} />
        </AdminLayout>
    );
}
