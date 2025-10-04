import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme } from '@/Contexts/ThemeContext';

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
    const { currentTheme } = useTheme();
    const [sortBy, setSortBy] = useState<'bookmarked_at' | 'series_title' | 'series_rating'>('bookmarked_at');
    const [searchTerm, setSearchTerm] = useState('');

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'ongoing':
                return 'bg-green-100 text-green-800';
            case 'completed':
                return 'bg-blue-100 text-blue-800';
            case 'hiatus':
                return 'bg-yellow-100 text-yellow-800';
            case 'dropped':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

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
        <UserLayout>
            <Head title="My Bookmarks - Veinovel" />
            
            <div 
                className="min-h-screen pt-20"
                style={{ backgroundColor: currentTheme.background }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 
                            className="text-3xl font-bold mb-2"
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
                            {filteredAndSortedBookmarks.map((bookmark) => (
                                <Link
                                    key={bookmark.id}
                                    href={route('series.show', bookmark.series_slug)}
                                    className="group"
                                >
                                    <div 
                                        className="rounded-lg p-4 sm:p-5 transition-all duration-300 hover:scale-105 hover:shadow-lg h-full flex flex-col min-h-[280px]"
                                        style={{
                                            backgroundColor: currentTheme.name === 'Light' 
                                                ? 'rgba(248, 250, 252, 0.8)' 
                                                : currentTheme.name === 'Dark'
                                                ? 'rgba(30, 41, 59, 0.6)'
                                                : currentTheme.name === 'Sepia'
                                                ? 'rgba(244, 236, 216, 0.6)'
                                                : currentTheme.name === 'Cool Dark'
                                                ? 'rgba(49, 50, 68, 0.6)'
                                                : currentTheme.name === 'Frost'
                                                ? 'rgba(205, 220, 237, 0.6)'
                                                : currentTheme.name === 'Solarized'
                                                ? 'rgba(253, 246, 227, 0.6)'
                                                : 'rgba(30, 41, 59, 0.6)',
                                            border: `1px solid ${currentTheme.foreground}10`
                                        }}
                                    >
                                        <div className="aspect-[2/3] bg-gray-200 rounded-md mb-3 overflow-hidden">
                                            {bookmark.series_cover ? (
                                                <img
                                                    src={bookmark.series_cover}
                                                    alt={bookmark.series_title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div 
                                                    className="w-full h-full flex items-center justify-center text-xs"
                                                    style={{ color: `${currentTheme.foreground}60` }}
                                                >
                                                    No Cover
                                                </div>
                                            )}
                                        </div>
                                        
                                        <h3 
                                            className="font-semibold text-sm md:text-base line-clamp-2 mb-3 leading-tight"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            {bookmark.series_title}
                                        </h3>
                                        
                                        <p 
                                            className="text-xs mb-2"
                                            style={{ color: `${currentTheme.foreground}70` }}
                                        >
                                            by {bookmark.series_author}
                                        </p>
                                        
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex items-center">
                                                <span className="text-yellow-400">★</span>
                                                <span 
                                                    className="text-xs ml-1"
                                                    style={{ color: `${currentTheme.foreground}80` }}
                                                >
                                                    {bookmark.series_rating || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-1 mb-2">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(bookmark.series_status)}`}>
                                                {bookmark.series_status}
                                            </span>
                                        </div>
                                        
                                        <div className="mt-auto">
                                            <p 
                                                className="text-xs"
                                                style={{ color: `${currentTheme.foreground}60` }}
                                            >
                                                Bookmarked {getTimeAgo(bookmark.bookmarked_at)}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div 
                                className="rounded-lg shadow-sm border p-12"
                                style={{
                                    backgroundColor: currentTheme.background,
                                    borderColor: `${currentTheme.foreground}20`
                                }}
                            >
                                <svg 
                                    className="w-16 h-16 mx-auto mb-4" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                    style={{ color: `${currentTheme.foreground}40` }}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                                <h3 
                                    className="text-xl font-medium mb-2"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    {searchTerm ? 'No bookmarks found' : 'No bookmarks yet'}
                                </h3>
                                <p 
                                    className="mb-6"
                                    style={{ color: `${currentTheme.foreground}60` }}
                                >
                                    {searchTerm 
                                        ? 'Try adjusting your search terms'
                                        : 'Start bookmarking your favorite series to save them for later!'
                                    }
                                </p>
                                {!searchTerm && (
                                    <Link
                                        href={route('explore')}
                                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        Explore Series
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </UserLayout>
    );
}
