import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme, SHINY_PURPLE } from '@/Contexts/ThemeContext';
import CoverImage from '@/Components/CoverImage';

interface Bookmark {
    id: number;
    series_title: string;
    series_slug: string;
    series_cover: string | null;
    series_author: string;
    series_status: string;
    series_rating: number;
    bookmarked_at: string;
    note?: string;
}

interface Props {
    bookmarks: Bookmark[];
}

const STATUS_COLORS: Record<string, { text: string; bg: string }> = {
    ongoing:   { text: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
    completed: { text: '#2563eb', bg: 'rgba(37,99,235,0.12)' },
    hiatus:    { text: '#ca8a04', bg: 'rgba(202,138,4,0.12)' },
    dropped:   { text: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
};

function getTimeAgo(dateString: string) {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 3600000);
    if (diff < 1) return 'Just now';
    if (diff < 24) return `${diff}h ago`;
    if (diff < 48) return 'Yesterday';
    return `${Math.floor(diff / 24)}d ago`;
}

export default function Bookmarks({ bookmarks }: Props) {
    return (
        <UserLayout>
            <BookmarksContent bookmarks={bookmarks} />
        </UserLayout>
    );
}

function BookmarksContent({ bookmarks }: Props) {
    const { currentTheme } = useTheme();
    const [sortBy, setSortBy] = useState<'bookmarked_at' | 'series_title' | 'series_rating'>('bookmarked_at');
    const [search, setSearch] = useState('');
    const fg = currentTheme.foreground;
    const bg = currentTheme.background;

    const displayed = bookmarks
        .filter(b => !search || b.series_title.toLowerCase().includes(search.toLowerCase()) || b.series_author.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'series_title') return a.series_title.localeCompare(b.series_title);
            if (sortBy === 'series_rating') return b.series_rating - a.series_rating;
            return new Date(b.bookmarked_at).getTime() - new Date(a.bookmarked_at).getTime();
        });

    return (
        <>
            <Head title="Bookmarks - Veinovel" />
            <div className="min-h-screen" style={{ backgroundColor: bg }}>
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-12">

                    {/* ── Header bar ── */}
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <h1 className="text-2xl font-bold flex-shrink-0" style={{ color: fg }}>
                            Bookmarks
                        </h1>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: `${SHINY_PURPLE}18`, color: SHINY_PURPLE }}>
                            {bookmarks.length}
                        </span>

                        {/* spacer */}
                        <div className="flex-1" />

                        {/* Search */}
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                style={{ color: `${fg}40` }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-1.5 rounded-lg text-sm focus:outline-none w-44 sm:w-56"
                                style={{
                                    backgroundColor: `${fg}08`,
                                    border: `1px solid ${fg}12`,
                                    color: fg,
                                }}
                            />
                        </div>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as any)}
                            className="py-1.5 pl-3 pr-8 rounded-lg text-sm focus:outline-none"
                            style={{
                                backgroundColor: `${fg}08`,
                                border: `1px solid ${fg}12`,
                                color: fg,
                                appearance: 'none',
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(fg)}' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 10px center',
                            }}
                        >
                            <option value="bookmarked_at" style={{ background: bg, color: fg }}>Recently Bookmarked</option>
                            <option value="series_title"  style={{ background: bg, color: fg }}>Title A–Z</option>
                            <option value="series_rating" style={{ background: bg, color: fg }}>Highest Rated</option>
                        </select>
                    </div>

                    {/* ── Grid ── */}
                    {displayed.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 sm:gap-5">
                            {displayed.map(b => {
                                const sc = STATUS_COLORS[b.series_status] ?? STATUS_COLORS.ongoing;
                                return (
                                    <Link
                                        key={b.id}
                                        href={route('series.show', b.series_slug)}
                                        className="group flex flex-col"
                                    >
                                        {/* Cover */}
                                        <div className="relative overflow-hidden rounded-xl mb-2.5 shadow-sm"
                                            style={{ aspectRatio: '2/3' }}>
                                            <CoverImage
                                                src={b.series_cover}
                                                alt={b.series_title}
                                                containerClassName="w-full h-full"
                                                hoverScale={true}
                                            />
                                            {/* Status badge */}
                                            <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
                                                style={{ backgroundColor: sc.bg, color: sc.text, backdropFilter: 'blur(4px)' }}>
                                                {b.series_status}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <p className="text-xs font-semibold line-clamp-2 leading-snug mb-1 group-hover:opacity-70 transition-opacity"
                                            style={{ color: fg }}>
                                            {b.series_title}
                                        </p>
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="flex items-center gap-0.5 text-[11px]">
                                                <span className="text-yellow-400">★</span>
                                                <span style={{ color: `${fg}70` }}>{b.series_rating || 'N/A'}</span>
                                            </span>
                                            <span className="text-[10px]" style={{ color: `${fg}45` }}>
                                                {getTimeAgo(b.bookmarked_at)}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <svg className="w-14 h-14 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: fg }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            <p className="text-base font-semibold mb-1" style={{ color: `${fg}60` }}>
                                {search ? 'No results found' : 'No bookmarks yet'}
                            </p>
                            <p className="text-sm mb-5" style={{ color: `${fg}40` }}>
                                {search ? 'Try a different keyword.' : 'Bookmark series you love to find them here.'}
                            </p>
                            {!search && (
                                <Link href={route('explore')}
                                    className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                                    style={{ background: `linear-gradient(135deg,${SHINY_PURPLE},#e879f9)` }}>
                                    Explore Series
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Result count */}
                    {displayed.length > 0 && search && (
                        <p className="mt-4 text-xs" style={{ color: `${fg}40` }}>
                            {displayed.length} of {bookmarks.length} bookmarks
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}
