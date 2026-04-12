import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import CoverImage from '@/Components/CoverImage';
import EmptyState from '@/Components/EmptyState';
import { getStatusColor, getCardBg } from '@/constants/colors';

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

export default function Bookmarks({ bookmarks }: Props) {
    const [sortBy, setSortBy] = useState<'bookmarked_at' | 'series_title' | 'series_rating'>('bookmarked_at');
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <UserLayout>
            <BookmarkContent bookmarks={bookmarks} sortBy={sortBy} setSortBy={setSortBy} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </UserLayout>
    );
}

function BookmarkContent({ bookmarks, sortBy, setSortBy, searchTerm, setSearchTerm }: {
    bookmarks: Bookmark[];
    sortBy: 'bookmarked_at' | 'series_title' | 'series_rating';
    setSortBy: (value: 'bookmarked_at' | 'series_title' | 'series_rating') => void;
    searchTerm: string;
    setSearchTerm: (value: string) => void;
}) {
    const { currentTheme } = useTheme();

    const getTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        if (diffInHours < 48) return 'Yesterday';
        return Math.floor(diffInHours / 24) + ' days ago';
    };

    const filteredAndSortedBookmarks = bookmarks
        .filter(bookmark => {
            if (!searchTerm) return true;
            return bookmark.series_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   bookmark.series_author.toLowerCase().includes(searchTerm.toLowerCase());
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'series_title':
                    return a.series_title.localeCompare(b.series_title);
                case 'series_rating':
                    return b.series_rating - a.series_rating;
                case 'bookmarked_at':
                default:
                    return new Date(b.bookmarked_at).getTime() - new Date(a.bookmarked_at).getTime();
            }
        });

    return (
        <>
            <Head title="My Bookmarks - Veinovel" />
            
            <div 
                className="min-h-screen pt-20"
                style={{ backgroundColor: currentTheme.background }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 
                            className="text-3xl font-bold mb-2 page-title"
                            style={{ color: currentTheme.foreground }}
                        >
                            My Bookmarks
                        </h1>
                        <p style={{ color: `${currentTheme.foreground}70` }}>
                            Keep track of your favorite series
                        </p>
                    </div>

                    {/* Controls */}
                    <div 
                        className="rounded-lg shadow-sm border p-6 mb-8"
                        style={{
                            backgroundColor: currentTheme.background,
                            borderColor: `${currentTheme.foreground}20`
                        }}
                    >
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                            {/* Search */}
                            <div className="flex-1 max-w-md">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search bookmarks..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        style={{
                                            backgroundColor: currentTheme.background,
                                            borderColor: `${currentTheme.foreground}30`,
                                            color: currentTheme.foreground
                                        }}
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                        <svg 
                                            className="h-5 w-5" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                            style={{ color: `${currentTheme.foreground}40` }}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 items-center">
                                {/* Sort Dropdown */}
                                <div>
                                    <label 
                                        className="block text-sm font-medium mb-1"
                                        style={{ color: currentTheme.foreground }}
                                    >
                                        Sort by
                                    </label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        style={{
                                            backgroundColor: currentTheme.background,
                                            borderColor: `${currentTheme.foreground}30`,
                                            color: currentTheme.foreground
                                        }}
                                    >
                                        <option value="bookmarked_at">Recently Bookmarked</option>
                                        <option value="series_title">Series Title</option>
                                        <option value="series_rating">Rating</option>
                                    </select>
                                </div>

                                <div 
                                    className="text-sm"
                                    style={{ color: `${currentTheme.foreground}60` }}
                                >
                                    {filteredAndSortedBookmarks.length} of {bookmarks.length} bookmarks
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bookmark Cards Grid */}
                    {filteredAndSortedBookmarks.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5">
                            {filteredAndSortedBookmarks.map((bookmark) => {
                                const statusColor = getStatusColor(bookmark.series_status);
                                return (
                                    <Link
                                        key={bookmark.id}
                                        href={route('series.show', bookmark.series_slug)}
                                        className="group"
                                    >
                                        <div
                                            className="series-card rounded-lg p-3 h-full flex flex-col"
                                            style={{
                                                backgroundColor: getCardBg(currentTheme.name),
                                                border: `1px solid ${currentTheme.foreground}10`,
                                            }}
                                        >
                                            <div className="mb-3 overflow-hidden rounded-lg">
                                                <CoverImage
                                                    src={bookmark.series_cover}
                                                    alt={bookmark.series_title}
                                                    containerClassName="cover-zoom"
                                                    hoverScale={false}
                                                />
                                            </div>

                                            <h3
                                                className="series-card-title font-semibold text-sm line-clamp-2 mb-1.5 leading-snug transition-colors duration-200"
                                                style={{ color: currentTheme.foreground }}
                                            >
                                                {bookmark.series_title}
                                            </h3>

                                            <p
                                                className="text-xs mb-2"
                                                style={{ color: `${currentTheme.foreground}55` }}
                                            >
                                                by {bookmark.series_author}
                                            </p>

                                            <div className="flex items-center gap-1.5 mb-2">
                                                <span className="text-yellow-400 text-xs">★</span>
                                                <span className="text-xs" style={{ color: `${currentTheme.foreground}70` }}>
                                                    {bookmark.series_rating || 'N/A'}
                                                </span>
                                            </div>

                                            <div className="mb-2">
                                                <span
                                                    className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                                                    style={{ backgroundColor: statusColor.dim, color: statusColor.bg }}
                                                >
                                                    {bookmark.series_status}
                                                </span>
                                            </div>

                                            <p
                                                className="text-xs mt-auto"
                                                style={{ color: `${currentTheme.foreground}45` }}
                                            >
                                                {getTimeAgo(bookmark.bookmarked_at)}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState
                            icon={
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                            }
                            title={searchTerm ? 'No bookmarks found' : 'No bookmarks yet'}
                            description={searchTerm ? 'Try adjusting your search terms.' : 'Start bookmarking your favorite series to save them for later!'}
                            action={!searchTerm ? { label: 'Explore Series', href: route('explore'), variant: 'primary' } : undefined}
                        />
                    )}
                </div>
            </div>
        </>
    );
}
