import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import CoverImage from '@/Components/CoverImage';
import EmptyState from '@/Components/EmptyState';
import { getStatusColor, getCardBg, SHINY_PURPLE, SHINY_PURPLE_DIM } from '@/constants/colors';

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
    const { currentTheme } = useTheme();
    const [sortBy, setSortBy] = useState<'title' | 'followed_at' | 'last_read' | 'progress'>('followed_at');
    const [filterStatus, setFilterStatus] = useState<string>('');

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

    const selectStyle: React.CSSProperties = {
        backgroundColor: currentTheme.background,
        color: currentTheme.foreground,
        border: `1px solid ${currentTheme.foreground}25`,
        borderRadius: '0.5rem',
        padding: '0.5rem 0.75rem',
        outline: 'none',
    };

    return (
        <UserLayout>
            <Head title="My Library - Veinovel" />

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
                            My Library
                        </h1>
                        <p style={{ color: `${currentTheme.foreground}60` }}>
                            Keep track of your favorite series and reading progress
                        </p>
                    </div>

                    {/* Controls */}
                    <div
                        className="rounded-xl p-5 mb-8"
                        style={{
                            backgroundColor: getCardBg(currentTheme.name),
                            border: `1px solid ${currentTheme.foreground}10`,
                        }}
                    >
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Sort */}
                                <div>
                                    <label
                                        className="block text-xs font-medium mb-1"
                                        style={{ color: `${currentTheme.foreground}70` }}
                                    >
                                        Sort by
                                    </label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        style={selectStyle}
                                    >
                                        <option value="followed_at">Recently Added</option>
                                        <option value="title">Title A-Z</option>
                                        <option value="last_read">Last Read Chapter</option>
                                        <option value="progress">Reading Progress</option>
                                    </select>
                                </div>

                                {/* Filter */}
                                <div>
                                    <label
                                        className="block text-xs font-medium mb-1"
                                        style={{ color: `${currentTheme.foreground}70` }}
                                    >
                                        Filter by Status
                                    </label>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        style={selectStyle}
                                    >
                                        <option value="">All Status</option>
                                        <option value="ongoing">Ongoing</option>
                                        <option value="completed">Completed</option>
                                        <option value="hiatus">Hiatus</option>
                                        <option value="dropped">Dropped</option>
                                    </select>
                                </div>
                            </div>

                            <div
                                className="text-sm"
                                style={{ color: `${currentTheme.foreground}55` }}
                            >
                                {filteredAndSortedSeries.length} of {followedSeries.length} series
                            </div>
                        </div>
                    </div>

                    {/* Series Grid */}
                    {filteredAndSortedSeries.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredAndSortedSeries.map((series) => {
                                const statusColor = getStatusColor(series.status);
                                const progress = getProgressPercentage(series);
                                return (
                                    <div
                                        key={series.id}
                                        className="rounded-xl transition-shadow hover:shadow-lg"
                                        style={{
                                            backgroundColor: getCardBg(currentTheme.name),
                                            border: `1px solid ${currentTheme.foreground}10`,
                                        }}
                                    >
                                        <div className="p-4">
                                            <div className="flex gap-4">
                                                {/* Cover */}
                                                <div className="w-20 flex-shrink-0">
                                                    <CoverImage
                                                        src={series.cover_image}
                                                        alt={series.title}
                                                        aspectClass=""
                                                        containerClassName="w-20 h-28"
                                                        hoverScale={false}
                                                    />
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between mb-2 gap-2">
                                                        <h3
                                                            className="font-semibold text-sm line-clamp-2"
                                                            style={{ color: currentTheme.foreground }}
                                                        >
                                                            {series.title}
                                                        </h3>
                                                        <span
                                                            className="px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0"
                                                            style={{
                                                                backgroundColor: statusColor.dim,
                                                                color: statusColor.bg,
                                                            }}
                                                        >
                                                            {series.status}
                                                        </span>
                                                    </div>

                                                    <p
                                                        className="text-xs mb-2"
                                                        style={{ color: `${currentTheme.foreground}60` }}
                                                    >
                                                        by {series.author}
                                                    </p>

                                                    <div
                                                        className="flex items-center gap-2 mb-2 text-xs"
                                                        style={{ color: `${currentTheme.foreground}55` }}
                                                    >
                                                        <span className="text-yellow-400">★</span>
                                                        <span>{series.rating || 'N/A'}</span>
                                                        <span>•</span>
                                                        <span>{series.chapters_count} chapters</span>
                                                    </div>

                                                    {/* Reading Progress */}
                                                    <div className="mb-3">
                                                        <div
                                                            className="flex justify-between text-xs mb-1"
                                                            style={{ color: `${currentTheme.foreground}55` }}
                                                        >
                                                            <span>Progress</span>
                                                            <span>{progress}%</span>
                                                        </div>
                                                        <div
                                                            className="w-full rounded-full h-1.5"
                                                            style={{ backgroundColor: `${currentTheme.foreground}12` }}
                                                        >
                                                            <div
                                                                className="h-1.5 rounded-full transition-all"
                                                                style={{
                                                                    width: `${progress}%`,
                                                                    backgroundColor: SHINY_PURPLE,
                                                                }}
                                                            />
                                                        </div>
                                                        {series.last_read_chapter && (
                                                            <p
                                                                className="text-xs mt-1"
                                                                style={{ color: `${currentTheme.foreground}45` }}
                                                            >
                                                                Last read: Chapter {series.last_read_chapter}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Genres */}
                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                        {series.genres.slice(0, 2).map((genre) => (
                                                            <span
                                                                key={genre.id}
                                                                className="px-2 py-0.5 text-xs rounded-full"
                                                                style={{
                                                                    backgroundColor: SHINY_PURPLE_DIM,
                                                                    color: SHINY_PURPLE,
                                                                }}
                                                            >
                                                                {genre.name}
                                                            </span>
                                                        ))}
                                                        {series.genres.length > 2 && (
                                                            <span
                                                                className="px-2 py-0.5 text-xs rounded-full"
                                                                style={{
                                                                    backgroundColor: `${currentTheme.foreground}08`,
                                                                    color: `${currentTheme.foreground}55`,
                                                                }}
                                                            >
                                                                +{series.genres.length - 2}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex gap-2">
                                                        <Link
                                                            href={route('series.show', series.slug)}
                                                            className="flex-1 px-3 py-1.5 text-xs rounded-lg text-center font-medium transition-opacity hover:opacity-85"
                                                            style={{ backgroundColor: SHINY_PURPLE, color: '#ffffff' }}
                                                        >
                                                            Continue Reading
                                                        </Link>
                                                        <button
                                                            className="px-3 py-1.5 text-xs rounded-lg transition-colors"
                                                            style={{
                                                                border: `1px solid ${currentTheme.foreground}20`,
                                                                color: `${currentTheme.foreground}70`,
                                                                backgroundColor: 'transparent',
                                                            }}
                                                        >
                                                            Unfollow
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div
                                                className="mt-4 pt-3 border-t text-xs"
                                                style={{
                                                    borderColor: `${currentTheme.foreground}08`,
                                                    color: `${currentTheme.foreground}40`,
                                                }}
                                            >
                                                Added {formatDate(series.followed_at)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState
                            icon={
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            }
                            title={filterStatus || '' ? 'No series match this filter' : 'Your library is empty'}
                            description={filterStatus || '' ? 'Try clearing the status filter.' : 'Follow series to keep track of your reading progress!'}
                            action={!filterStatus ? { label: 'Explore Series', href: route('explore'), variant: 'primary' } : undefined}
                        />
                    )}
                </div>
            </div>
        </UserLayout>
    );
}
