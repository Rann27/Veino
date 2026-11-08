import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { NativeAd } from '@/Components/Ads/NetworkAds';
import CoverImage from '@/Components/CoverImage';
import { getStatusColor, getCardBg, SHINY_PURPLE } from '@/constants/colors';
import { formatRating } from '@/lib/rating';

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
    rating: number | string | null;
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
                                            className="rounded-lg p-4 sm:p-5 transition-opacity hover:opacity-90 h-full flex flex-col min-h-[280px]"
                                            style={{
                                                backgroundColor: `${currentTheme.foreground}08`,
                                                border: `1px solid ${currentTheme.foreground}15`
                                            }}
                                        >
                                            <CoverImage
                                                src={item.cover_url}
                                                alt={item.title}
                                                containerClassName="mb-3"
                                                hoverScale={false}
                                            />
                                            
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
                                                        {formatRating(item.rating)}
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
                                                <span
                                                    className="px-2 py-1 text-xs font-medium rounded-full"
                                                    style={{
                                                        backgroundColor: getStatusColor(item.status).dim,
                                                        color: getStatusColor(item.status).bg,
                                                    }}
                                                >
                                                    {item.status}
                                                </span>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-1 mt-auto">
                                                {item.genres.slice(0, 2).map((genre) => (
                                                    <span
                                                        key={genre.id}
                                                        className="px-2 py-1 text-xs rounded-md"
                                                        style={{
                                                            backgroundColor: `${currentTheme.foreground}08`,
                                                            color: `${currentTheme.foreground}80`
                                                        }}
                                                    >
                                                        {genre.name}
                                                    </span>
                                                ))}
                                                {item.genres.length > 2 && (
                                                    <span 
                                                        className="px-2 py-1 text-xs rounded-md"
                                                        style={{
                                                            backgroundColor: `${currentTheme.foreground}08`,
                                                            color: `${currentTheme.foreground}80`
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

                            <NativeAd className="my-6" />

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
                                                className="px-3 py-2 text-sm rounded-lg transition-colors"
                                                style={{
                                                    backgroundColor: link.active ? currentTheme.foreground : `${currentTheme.foreground}06`,
                                                    border: `1px solid ${link.active ? currentTheme.foreground : `${currentTheme.foreground}15`}`,
                                                    color: link.active ? currentTheme.background : `${currentTheme.foreground}80`
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
                                className="rounded-lg border p-12"
                                style={{
                                    backgroundColor: `${currentTheme.foreground}08`,
                                    borderColor: `${currentTheme.foreground}15`
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
                                    className="inline-flex items-center px-6 py-3 rounded-lg transition-opacity hover:opacity-90 font-medium text-sm"
                                    style={{ backgroundColor: currentTheme.foreground, color: currentTheme.background }}
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
