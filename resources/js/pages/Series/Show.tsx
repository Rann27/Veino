import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';

interface Genre {
    id: number;
    name: string;
}

interface NativeLanguage {
    id: number;
    name: string;
}

interface Chapter {
    id: number;
    title: string;
    chapter_number: number;
    is_premium: boolean;
    coin_price: number;
    created_at: string;
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
}

interface Props {
    series: Series;
    chapters: Chapter[];
    relatedSeries: Series[];
}

export default function SeriesShow({ series, chapters, relatedSeries }: Props) {
    const [showAllChapters, setShowAllChapters] = useState(false);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const displayedChapters = showAllChapters ? chapters : chapters.slice(0, 10);
    const sortedChapters = [...displayedChapters].sort((a, b) => {
        return sortOrder === 'asc' 
            ? a.chapter_number - b.chapter_number 
            : b.chapter_number - a.chapter_number;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ongoing': return 'text-green-600 bg-green-50';
            case 'completed': return 'text-blue-600 bg-blue-50';
            case 'hiatus': return 'text-yellow-600 bg-yellow-50';
            case 'dropped': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <UserLayout>
            <Head title={series.title} />
            
            <div className="min-h-screen bg-gray-50 pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Breadcrumb */}
                    <nav className="mb-6">
                        <div className="flex items-center space-x-2 text-sm">
                            <Link href={route('home')} className="text-blue-600 hover:text-blue-800">
                                Home
                            </Link>
                            <span className="text-gray-400">{'>'}</span>
                            <Link href={route('explore')} className="text-blue-600 hover:text-blue-800">
                                Explore
                            </Link>
                            <span className="text-gray-400">{'>'}</span>
                            <span className="text-gray-600">{series.title}</span>
                        </div>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Series Info */}
                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Cover Image */}
                                    <div className="w-full md:w-48 flex-shrink-0">
                                        <div className="aspect-[3/4] relative">
                                            {series.cover_image ? (
                                                <img
                                                    src={series.cover_image}
                                                    alt={series.title}
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                                                    <span className="text-gray-400">No Cover</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Series Details */}
                                    <div className="flex-1">
                                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{series.title}</h1>
                                        <p className="text-lg text-gray-600 mb-4">by {series.author}</p>
                                        
                                        <div className="flex flex-wrap items-center gap-4 mb-4">
                                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(series.status)}`}>
                                                {series.status}
                                            </span>
                                            <div className="flex items-center">
                                                <span className="text-yellow-400 text-lg">★</span>
                                                <span className="text-gray-600 ml-1">{series.rating || 'N/A'}</span>
                                            </div>
                                            <span className="text-gray-600">{series.chapters_count} chapters</span>
                                            <span className="text-gray-600">{series.native_language.name}</span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {series.genres.map((genre) => (
                                                <span
                                                    key={genre.id}
                                                    className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-full"
                                                >
                                                    {genre.name}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="prose max-w-none">
                                            <p className="text-gray-700 leading-relaxed">{series.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Chapter List */}
                            <div className="bg-white rounded-lg shadow-sm border">
                                <div className="p-6 border-b border-gray-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <h2 className="text-xl font-semibold text-gray-900">Chapters</h2>
                                        <div className="flex items-center gap-4">
                                            <select
                                                value={sortOrder}
                                                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="asc">Oldest First</option>
                                                <option value="desc">Newest First</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="divide-y divide-gray-200">
                                    {sortedChapters.map((chapter) => (
                                        <Link
                                            key={chapter.id}
                                            href={route('chapters.show', [series.slug, chapter.chapter_number])}
                                            className="block p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm text-gray-500 font-medium">
                                                            Ch. {chapter.chapter_number}
                                                        </span>
                                                        <h3 className="font-medium text-gray-900">{chapter.title}</h3>
                                                        {chapter.is_premium && (
                                                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                </svg>
                                                                Premium
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-1">
                                                        <span className="text-sm text-gray-500">
                                                            {formatDate(chapter.created_at)}
                                                        </span>
                                                        {chapter.is_premium && (
                                                            <span className="text-sm text-yellow-600 font-medium">
                                                                {chapter.coin_price} coins
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center text-gray-400">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                {chapters.length > 10 && (
                                    <div className="p-4 border-t border-gray-200 text-center">
                                        <button
                                            onClick={() => setShowAllChapters(!showAllChapters)}
                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            {showAllChapters ? 'Show Less' : `Show All ${chapters.length} Chapters`}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Quick Actions */}
                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                                <div className="space-y-3">
                                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                        Add to Library
                                    </button>
                                    <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                        Bookmark
                                    </button>
                                    <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                        Share
                                    </button>
                                </div>
                            </div>

                            {/* Related Series */}
                            {relatedSeries.length > 0 && (
                                <div className="bg-white rounded-lg shadow-sm border p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">You Might Also Like</h3>
                                    <div className="space-y-4">
                                        {relatedSeries.map((related) => (
                                            <Link
                                                key={related.id}
                                                href={route('series.show', related.slug)}
                                                className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="w-16 h-20 flex-shrink-0">
                                                    {related.cover_image ? (
                                                        <img
                                                            src={related.cover_image}
                                                            alt={related.title}
                                                            className="w-full h-full object-cover rounded"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                                                            <span className="text-xs text-gray-400">No Cover</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                                                        {related.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-600 mb-1">by {related.author}</p>
                                                    <div className="flex items-center text-xs text-gray-500">
                                                        <span className="text-yellow-400">★</span>
                                                        <span className="ml-1">{related.rating || 'N/A'}</span>
                                                        <span className="mx-1">•</span>
                                                        <span>{related.chapters_count} ch</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
