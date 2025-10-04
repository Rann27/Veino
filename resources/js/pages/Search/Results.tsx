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

interface PaginatedSeries {
    data: Series[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface Props {
    series: PaginatedSeries;
    query: string;
}

function SearchResultsContent({ series, query }: Props) {
    const { currentTheme } = useTheme();

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

    return (
        <>
            <Head title={`Search Results for "${query}" - Veinovel`} />
            
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
                            Search Results
                        </h1>
                        <p style={{ color: `${currentTheme.foreground}70` }}>
                            Found {series.total} results for "{query}"
                        </p>
                    </div>

                    {/* Results */}
                    {series.data.length > 0 ? (
                        <>
                            <div className="mb-6">
                                <p style={{ color: `${currentTheme.foreground}80` }}>
                                    Showing {series.data.length} of {series.total} series
                                </p>
                            </div>

                            {/* Series Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5 mb-8">
                                {series.data.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={route('series.show', item.slug)}
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
                                                {item.cover_url ? (
                                                    <img
                                                        src={item.cover_url}
                                                        alt={item.title}
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
                                                {item.title}
                                            </h3>
                                            
                                            <p 
                                                className="text-xs mb-2"
                                                style={{ color: `${currentTheme.foreground}70` }}
                                            >
                                                by {item.author}
                                            </p>
                                            
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="flex items-center">
                                                    <span className="text-yellow-400">★</span>
                                                    <span 
                                                        className="text-xs ml-1"
                                                        style={{ color: `${currentTheme.foreground}80` }}
                                                    >
                                                        {item.rating || 'N/A'}
                                                    </span>
                                                </div>
                                                <span style={{ color: `${currentTheme.foreground}30` }}>•</span>
                                                <span 
                                                    className="text-xs"
                                                    style={{ color: `${currentTheme.foreground}80` }}
                                                >
                                                    {item.chapters_count} ch
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-1 mb-2">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-1 mt-auto">
                                                {item.genres.slice(0, 2).map((genre) => (
                                                    <span
                                                        key={genre.id}
                                                        className="px-2 py-1 text-xs rounded"
                                                        style={{
                                                            backgroundColor: `${currentTheme.foreground}15`,
                                                            color: `${currentTheme.foreground}90`
                                                        }}
                                                    >
                                                        {genre.name}
                                                    </span>
                                                ))}
                                                {item.genres.length > 2 && (
                                                    <span 
                                                        className="px-2 py-1 text-xs rounded"
                                                        style={{
                                                            backgroundColor: `${currentTheme.foreground}15`,
                                                            color: `${currentTheme.foreground}90`
                                                        }}
                                                    >
                                                        +{item.genres.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* Pagination */}
                            {series.last_page > 1 && (
                                <div className="flex justify-center">
                                    <nav className="flex space-x-2">
                                        {series.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    if (link.url) {
                                                        const url = new URL(link.url);
                                                        const page = url.searchParams.get('page');
                                                        router.get(route('search', { q: query, page: page }));
                                                    }
                                                }}
                                                disabled={!link.url}
                                                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                                                    link.active
                                                        ? 'bg-blue-600 text-white'
                                                        : 'border border-gray-300 hover:bg-gray-50'
                                                }`}
                                                style={{
                                                    backgroundColor: link.active ? '#3B82F6' : currentTheme.background,
                                                    borderColor: link.active ? '#3B82F6' : `${currentTheme.foreground}30`,
                                                    color: link.active ? 'white' : currentTheme.foreground
                                                }}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </nav>
                                </div>
                            )}
                        </>
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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <h3 
                                    className="text-xl font-medium mb-2"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    No results found for "{query}"
                                </h3>
                                <p 
                                    className="mb-6"
                                    style={{ color: `${currentTheme.foreground}60` }}
                                >
                                    Try adjusting your search terms or browse our series collection
                                </p>
                                <Link
                                    href={route('explore')}
                                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Explore All Series
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default function SearchResults(props: Props) {
    return (
        <UserLayout>
            <SearchResultsContent {...props} />
        </UserLayout>
    );
}
