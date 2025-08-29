import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';

interface Bookmark {
    id: number;
    series_title: string;
    series_slug: string;
    series_cover: string | null;
    chapter_number: number;
    chapter_title: string;
    bookmarked_at: string;
    note?: string;
}

interface Props {
    bookmarks: Bookmark[];
}

export default function Bookmarks({ bookmarks }: Props) {
    const [sortBy, setSortBy] = useState<'bookmarked_at' | 'series_title' | 'chapter_number'>('bookmarked_at');
    const [searchTerm, setSearchTerm] = useState('');

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
                   bookmark.chapter_title.toLowerCase().includes(searchTerm.toLowerCase());
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'series_title':
                    return a.series_title.localeCompare(b.series_title);
                case 'chapter_number':
                    return b.chapter_number - a.chapter_number;
                case 'bookmarked_at':
                default:
                    return new Date(b.bookmarked_at).getTime() - new Date(a.bookmarked_at).getTime();
            }
        });

    return (
        <UserLayout>
            <Head title="My Bookmarks - Veinovel" />
            
            <div className="min-h-screen bg-gray-50 pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookmarks</h1>
                        <p className="text-gray-600">Keep track of important chapters and moments</p>
                    </div>

                    {/* Controls */}
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                            {/* Search */}
                            <div className="flex-1 max-w-md">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search bookmarks..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 items-center">
                                {/* Sort Dropdown */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="bookmarked_at">Recently Bookmarked</option>
                                        <option value="series_title">Series Title</option>
                                        <option value="chapter_number">Chapter Number</option>
                                    </select>
                                </div>

                                <div className="text-sm text-gray-600">
                                    {filteredAndSortedBookmarks.length} of {bookmarks.length} bookmarks
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bookmarks List */}
                    {filteredAndSortedBookmarks.length > 0 ? (
                        <div className="space-y-4">
                            {filteredAndSortedBookmarks.map((bookmark) => (
                                <div key={bookmark.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                                    <div className="p-6">
                                        <div className="flex gap-4">
                                            {/* Cover Image */}
                                            <div className="w-16 h-20 flex-shrink-0">
                                                {bookmark.series_cover ? (
                                                    <img
                                                        src={bookmark.series_cover}
                                                        alt={bookmark.series_title}
                                                        className="w-full h-full object-cover rounded"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                                                        <span className="text-xs text-gray-400">No Cover</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                            {bookmark.series_title}
                                                        </h3>
                                                        <p className="text-gray-600 mb-2">
                                                            Chapter {bookmark.chapter_number}: {bookmark.chapter_title}
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-500">
                                                            {getTimeAgo(bookmark.bookmarked_at)}
                                                        </span>
                                                        <button className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Note */}
                                                {bookmark.note && (
                                                    <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                                                        <p className="text-sm text-blue-800">
                                                            <span className="font-medium">Note:</span> {bookmark.note}
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm text-gray-500">
                                                        Bookmarked on {formatDate(bookmark.bookmarked_at)}
                                                    </div>
                                                    
                                                    <div className="flex gap-2">
                                                        <Link
                                                            href={route('chapters.show', [bookmark.series_slug, bookmark.chapter_number])}
                                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                                        >
                                                            Read Chapter
                                                        </Link>
                                                        <Link
                                                            href={route('series.show', bookmark.series_slug)}
                                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                                                        >
                                                            View Series
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="bg-white rounded-lg shadow-sm border p-12">
                                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                                <h3 className="text-xl font-medium text-gray-900 mb-2">
                                    {searchTerm ? 'No bookmarks found' : 'No bookmarks yet'}
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    {searchTerm 
                                        ? 'Try adjusting your search terms'
                                        : 'Start bookmarking your favorite chapters to save them for later!'
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
