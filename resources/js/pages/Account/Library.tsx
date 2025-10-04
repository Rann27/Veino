import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';

interface Genre {
    id: number;
    name: string;
}

interface NativeLanguage {
    id: number;
    name: string;
}

interface Series {
    id: number;
    title: string;
    author: string;
    slug: string;
    description: string;
    cover_image: string | null;
    rating: number;
    status: string;
    chapters_count: number;
    genres: Genre[];
    native_language: NativeLanguage;
    followed_at?: string;
    last_read_chapter?: number;
    total_chapters_read?: number;
}

interface Props {
    followedSeries: Series[];
}

export default function Library({ followedSeries }: Props) {
    const [sortBy, setSortBy] = useState<'title' | 'followed_at' | 'last_read' | 'progress'>('followed_at');
    const [filterStatus, setFilterStatus] = useState<string>('');

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ongoing': return 'text-green-600 bg-green-50';
            case 'completed': return 'text-blue-600 bg-blue-50';
            case 'hiatus': return 'text-yellow-600 bg-yellow-50';
            case 'dropped': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getProgressPercentage = (series: Series) => {
        if (!series.total_chapters_read || !series.chapters_count) return 0;
        return Math.round((series.total_chapters_read / series.chapters_count) * 100);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Unknown';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const filteredAndSortedSeries = followedSeries
        .filter(series => {
            if (!filterStatus) return true;
            return series.status === filterStatus;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'followed_at':
                    return new Date(b.followed_at || 0).getTime() - new Date(a.followed_at || 0).getTime();
                case 'last_read':
                    return (b.last_read_chapter || 0) - (a.last_read_chapter || 0);
                case 'progress':
                    return getProgressPercentage(b) - getProgressPercentage(a);
                default:
                    return 0;
            }
        });

    return (
        <UserLayout>
            <Head title="My Library - Veinovel" />
            
            <div className="min-h-screen bg-gray-50 pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Library</h1>
                        <p className="text-gray-600">Keep track of your favorite series and reading progress</p>
                    </div>

                    {/* Controls */}
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Sort Dropdown */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="followed_at">Recently Added</option>
                                        <option value="title">Title A-Z</option>
                                        <option value="last_read">Last Read Chapter</option>
                                        <option value="progress">Reading Progress</option>
                                    </select>
                                </div>

                                {/* Status Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All Status</option>
                                        <option value="ongoing">Ongoing</option>
                                        <option value="completed">Completed</option>
                                        <option value="hiatus">Hiatus</option>
                                        <option value="dropped">Dropped</option>
                                    </select>
                                </div>
                            </div>

                            <div className="text-sm text-gray-600">
                                {filteredAndSortedSeries.length} of {followedSeries.length} series
                            </div>
                        </div>
                    </div>

                    {/* Series Grid */}
                    {filteredAndSortedSeries.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAndSortedSeries.map((series) => (
                                <div key={series.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                                    <div className="p-4">
                                        <div className="flex gap-4">
                                            {/* Cover Image */}
                                            <div className="w-20 h-28 flex-shrink-0">
                                                {series.cover_image ? (
                                                    <img
                                                        src={series.cover_image}
                                                        alt={series.title}
                                                        className="w-full h-full object-cover rounded"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                                                        <span className="text-xs text-gray-400">No Cover</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Series Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm">
                                                        {series.title}
                                                    </h3>
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ml-2 ${getStatusColor(series.status)}`}>
                                                        {series.status}
                                                    </span>
                                                </div>
                                                
                                                <p className="text-xs text-gray-600 mb-2">by {series.author}</p>
                                                
                                                <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                                                    <span className="text-yellow-400">★</span>
                                                    <span>{series.rating || 'N/A'}</span>
                                                    <span>•</span>
                                                    <span>{series.chapters_count} chapters</span>
                                                </div>

                                                {/* Reading Progress */}
                                                <div className="mb-3">
                                                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                        <span>Progress</span>
                                                        <span>{getProgressPercentage(series)}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-blue-600 h-2 rounded-full" 
                                                            style={{ width: `${getProgressPercentage(series)}%` }}
                                                        ></div>
                                                    </div>
                                                    {series.last_read_chapter && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Last read: Chapter {series.last_read_chapter}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Genres */}
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {series.genres.slice(0, 2).map((genre) => (
                                                        <span
                                                            key={genre.id}
                                                            className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded"
                                                        >
                                                            {genre.name}
                                                        </span>
                                                    ))}
                                                    {series.genres.length > 2 && (
                                                        <span className="px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded">
                                                            +{series.genres.length - 2}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-2">
                                                    <Link
                                                        href={route('series.show', series.slug)}
                                                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors text-center"
                                                    >
                                                        Continue Reading
                                                    </Link>
                                                    <button className="px-3 py-2 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50 transition-colors">
                                                        Unfollow
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                                            Added {formatDate(series.followed_at)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="bg-white rounded-lg shadow-sm border p-12">
                                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <h3 className="text-xl font-medium text-gray-900 mb-2">Your library is empty</h3>
                                <p className="text-gray-600 mb-6">
                                    Start following series to keep track of your reading progress!
                                </p>
                                <Link
                                    href={route('explore')}
                                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Explore Series
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </UserLayout>
    );
}
