import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme } from '@/Contexts/ThemeContext';

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
    is_owned?: boolean;
    coin_price: number;
    created_at: string;
}

interface Series {
    id: number;
    title: string;
    author: string;
    slug: string;
    synopsis: string;
    cover_url: string | null;
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
    isBookmarked?: boolean;
}

function SeriesShowContent({ series, chapters, relatedSeries, isBookmarked = false }: Props) {
    const { currentTheme } = useTheme();
    const [showAllChapters, setShowAllChapters] = useState(false);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [bookmarked, setBookmarked] = useState(isBookmarked);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');

    const handleBookmarkToggle = async () => {
        try {
            const url = route(bookmarked ? 'bookmarks.destroy' : 'bookmarks.store', series.slug);
            const method = bookmarked ? 'DELETE' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setBookmarked(!bookmarked);
                setNotificationMessage(data.message);
                setShowNotification(true);
                
                // Hide notification after 3 seconds
                setTimeout(() => {
                    setShowNotification(false);
                }, 3000);
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error);
            setNotificationMessage('An error occurred. Please try again.');
            setShowNotification(true);
            setTimeout(() => {
                setShowNotification(false);
            }, 3000);
        }
    };

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
        <>
            <Head title={series.title} />
            
            <div 
                className="min-h-screen pt-20"
                style={{ backgroundColor: currentTheme.background }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Breadcrumb */}
                    <nav className="mb-6">
                        <div className="flex items-center space-x-2 text-sm">
                            <Link 
                                href={route('home')} 
                                className="hover:opacity-70 transition-opacity"
                                style={{ color: currentTheme.foreground }}
                            >
                                Home
                            </Link>
                            <span style={{ color: `${currentTheme.foreground}40` }}>{'>'}</span>
                            <Link 
                                href={route('explore')} 
                                className="hover:opacity-70 transition-opacity"
                                style={{ color: currentTheme.foreground }}
                            >
                                Explore
                            </Link>
                            <span style={{ color: `${currentTheme.foreground}40` }}>{'>'}</span>
                            <span style={{ color: `${currentTheme.foreground}80` }}>{series.title}</span>
                        </div>
                    </nav>

                    {/* Main Content - Full Width */}
                    <div className="space-y-6">
                        {/* Series Info - Full Width */}
                        <div 
                            className="rounded-lg shadow-sm border p-6"
                            style={{
                                backgroundColor: currentTheme.background,
                                borderColor: `${currentTheme.foreground}20`
                            }}
                        >
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Cover Image */}
                                <div className="w-full md:w-48 flex-shrink-0">
                                    <div className="aspect-[3/4] relative">
                                        {series.cover_url ? (
                                            <img
                                                src={series.cover_url}
                                                alt={series.title}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div 
                                                className="w-full h-full rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: `${currentTheme.foreground}10` }}
                                            >
                                                <span style={{ color: `${currentTheme.foreground}50` }}>No Cover</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Series Details */}
                                <div className="flex-1">
                                    <h1 
                                        className="text-3xl font-bold mb-2"
                                        style={{ color: currentTheme.foreground }}
                                    >
                                        {series.title}
                                    </h1>
                                    <p 
                                        className="text-lg mb-4"
                                        style={{ color: `${currentTheme.foreground}80` }}
                                    >
                                        by {series.author}
                                    </p>
                                    
                                    <div className="flex flex-wrap items-center gap-4 mb-4">
                                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(series.status)}`}>
                                            {series.status}
                                        </span>
                                        <div className="flex items-center">
                                            <span className="text-yellow-400 text-lg">★</span>
                                            <span 
                                                className="ml-1"
                                                style={{ color: `${currentTheme.foreground}80` }}
                                            >
                                                {series.rating || 'N/A'}
                                            </span>
                                        </div>
                                        <span style={{ color: `${currentTheme.foreground}80` }}>
                                            {series.chapters_count} chapters
                                        </span>
                                        <span style={{ color: `${currentTheme.foreground}80` }}>
                                            {series.native_language.name}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {series.genres.map((genre) => (
                                            <span
                                                key={genre.id}
                                                className="px-3 py-1 text-sm rounded-full"
                                                style={{
                                                    backgroundColor: `${currentTheme.foreground}15`,
                                                    color: `${currentTheme.foreground}90`
                                                }}
                                            >
                                                {genre.name}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Synopsis */}
                                    <div className="mb-6">
                                        <h3 
                                            className="text-lg font-semibold mb-3"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            Synopsis
                                        </h3>
                                        <div className="prose max-w-none">
                                            <div 
                                                className="leading-relaxed"
                                                style={{ color: `${currentTheme.foreground}90` }}
                                                dangerouslySetInnerHTML={{ 
                                                    __html: series.synopsis || 'No synopsis available.' 
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Link
                                            href={route('chapters.show', [series.slug, 1])}
                                            className="px-6 py-3 rounded-lg font-medium transition-colors hover:opacity-90 text-center"
                                            style={{
                                                backgroundColor: currentTheme.foreground,
                                                color: currentTheme.background
                                            }}
                                        >
                                            Read First Chapter
                                        </Link>
                                        <button 
                                            className="px-6 py-3 border rounded-lg font-medium transition-colors hover:opacity-70 flex items-center gap-2"
                                            style={{
                                                borderColor: bookmarked ? '#3B82F6' : `${currentTheme.foreground}30`,
                                                color: bookmarked ? '#3B82F6' : currentTheme.foreground,
                                                backgroundColor: bookmarked ? '#3B82F610' : 'transparent'
                                            }}
                                            onClick={handleBookmarkToggle}
                                        >
                                            <svg className="w-5 h-5" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                            </svg>
                                            {bookmarked ? 'Bookmarked' : 'Bookmark'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Two Column Layout for Chapter List and Related Series */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Chapter List */}
                            <div className="lg:col-span-2">
                                <div 
                                    className="rounded-lg shadow-sm border"
                                    style={{
                                        backgroundColor: currentTheme.background,
                                        borderColor: `${currentTheme.foreground}20`
                                    }}
                                >
                                    <div 
                                        className="p-6 border-b"
                                        style={{ borderColor: `${currentTheme.foreground}20` }}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <h2 
                                                className="text-xl font-semibold"
                                                style={{ color: currentTheme.foreground }}
                                            >
                                                Chapters
                                            </h2>
                                            <div className="flex items-center gap-4">
                                                <select
                                                    value={sortOrder}
                                                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                                                    className="px-3 py-2 border rounded-lg focus:ring-2 transition-colors"
                                                    style={{
                                                        backgroundColor: currentTheme.background,
                                                        borderColor: `${currentTheme.foreground}30`,
                                                        color: currentTheme.foreground
                                                    }}
                                                >
                                                    <option value="asc">Oldest First</option>
                                                    <option value="desc">Newest First</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ borderTopColor: `${currentTheme.foreground}20` }} className="divide-y">
                                        {sortedChapters.map((chapter) => (
                                            <Link
                                                key={chapter.id}
                                                href={route('chapters.show', [series.slug, chapter.chapter_number])}
                                                className="block p-4 transition-colors hover:opacity-70"
                                                style={{ borderBottomColor: `${currentTheme.foreground}10` }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <span 
                                                                className="text-sm font-medium"
                                                                style={{ color: `${currentTheme.foreground}70` }}
                                                            >
                                                                {chapter.chapter_number}
                                                            </span>
                                                            <h3 
                                                                className="font-medium"
                                                                style={{ color: currentTheme.foreground }}
                                                            >
                                                                {chapter.title}
                                                            </h3>
                                                            {chapter.is_premium && (
                                                                <span 
                                                                    className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"
                                                                    style={{
                                                                        backgroundColor: '#fef3c7',
                                                                        color: '#d97706'
                                                                    }}
                                                                >
                                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                    Premium
                                                                </span>
                                                            )}
                                                            {chapter.is_owned && (
                                                                <span 
                                                                    className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"
                                                                    style={{
                                                                        backgroundColor: '#d1fae5',
                                                                        color: '#059669'
                                                                    }}
                                                                >
                                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                    </svg>
                                                                    Owned
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-1">
                                                            <span 
                                                                className="text-sm"
                                                                style={{ color: `${currentTheme.foreground}60` }}
                                                            >
                                                                {formatDate(chapter.created_at)}
                                                            </span>
                                                            {chapter.is_premium && (
                                                                <span className="text-sm font-medium" style={{ color: '#d97706' }}>
                                                                    {chapter.coin_price} coins
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center" style={{ color: `${currentTheme.foreground}40` }}>
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>

                                    {chapters.length > 10 && (
                                        <div 
                                            className="p-4 border-t text-center"
                                            style={{ borderColor: `${currentTheme.foreground}20` }}
                                        >
                                            <button
                                                onClick={() => setShowAllChapters(!showAllChapters)}
                                                className="font-medium hover:opacity-70 transition-opacity"
                                                style={{ color: currentTheme.foreground }}
                                            >
                                                {showAllChapters ? 'Show Less' : `Show All ${chapters.length} Chapters`}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Related Series Sidebar */}
                            <div className="space-y-6">
                                {relatedSeries.length > 0 && (
                                    <div 
                                        className="rounded-lg shadow-sm border p-6"
                                        style={{
                                            backgroundColor: currentTheme.background,
                                            borderColor: `${currentTheme.foreground}20`
                                        }}
                                    >
                                        <h3 
                                            className="text-lg font-semibold mb-4"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            You Might Also Like
                                        </h3>
                                        <div className="space-y-4">
                                            {relatedSeries.map((related) => (
                                                <Link
                                                    key={related.id}
                                                    href={route('series.show', related.slug)}
                                                    className="flex gap-3 p-2 rounded-lg transition-colors hover:opacity-70"
                                                >
                                                    <div className="w-16 h-20 flex-shrink-0">
                                                        {related.cover_url ? (
                                                            <img
                                                                src={related.cover_url}
                                                                alt={related.title}
                                                                className="w-full h-full object-cover rounded"
                                                            />
                                                        ) : (
                                                            <div 
                                                                className="w-full h-full rounded flex items-center justify-center"
                                                                style={{ backgroundColor: `${currentTheme.foreground}10` }}
                                                            >
                                                                <span 
                                                                    className="text-xs"
                                                                    style={{ color: `${currentTheme.foreground}50` }}
                                                                >
                                                                    No Cover
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 
                                                            className="font-medium text-sm line-clamp-2 mb-1"
                                                            style={{ color: currentTheme.foreground }}
                                                        >
                                                            {related.title}
                                                        </h4>
                                                        <p 
                                                            className="text-xs mb-1"
                                                            style={{ color: `${currentTheme.foreground}70` }}
                                                        >
                                                            by {related.author}
                                                        </p>
                                                        <div 
                                                            className="flex items-center text-xs"
                                                            style={{ color: `${currentTheme.foreground}60` }}
                                                        >
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
            </div>

            {/* Notification Modal */}
            {showNotification && (
                <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-2 duration-300">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    {notificationMessage}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowNotification(false)}
                                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default function SeriesShow(props: Props) {
    return (
        <UserLayout>
            <SeriesShowContent {...props} />
        </UserLayout>
    );
}
