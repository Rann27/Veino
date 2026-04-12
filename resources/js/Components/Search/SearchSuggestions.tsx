import React from 'react';
import { Link } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';
import CoverImage from '@/Components/CoverImage';
import { getStatusColor, SHINY_PURPLE } from '@/constants/colors';

interface Genre {
    id: number;
    name: string;
}

interface NativeLanguage {
    id: number;
    name: string;
}

interface SearchSuggestion {
    id: number;
    title: string;
    author: string;
    slug: string;
    cover_url: string | null;
    chapters_count: number;
    status: string;
    rating: number;
    genres: Genre[];
    native_language: NativeLanguage;
}

interface Props {
    suggestions: SearchSuggestion[];
    query: string;
    onSuggestionClick: () => void;
    isVisible: boolean;
}

export default function SearchSuggestions({ suggestions, query, onSuggestionClick, isVisible }: Props) {
    const { currentTheme } = useTheme();

    if (!isVisible || !query.trim()) {
        return null;
    }

    return (
        <div
            className="absolute top-full left-0 right-0 z-[9999] mt-1 rounded-lg shadow-lg border max-h-96 overflow-y-auto"
            style={{
                backgroundColor: currentTheme.background,
                borderColor: `${currentTheme.foreground}20`,
                pointerEvents: 'auto'
            }}
        >
            {suggestions.length > 0 ? (
                <>
                    {suggestions.map((series) => {
                        const statusColor = getStatusColor(series.status);
                        return (
                            <Link
                                key={series.id}
                                href={`/series/${series.slug}`}
                                onClick={() => onSuggestionClick()}
                                className="flex items-center gap-3 p-3 transition-colors border-b cursor-pointer"
                                style={{
                                    borderBottomColor: `${currentTheme.foreground}10`,
                                    pointerEvents: 'auto'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = `${currentTheme.foreground}08`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                {/* Cover thumbnail */}
                                <div className="w-12 h-16 flex-shrink-0">
                                    <CoverImage
                                        src={series.cover_url}
                                        alt={series.title}
                                        aspectClass=""
                                        containerClassName="w-12 h-16"
                                        hoverScale={false}
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4
                                        className="font-medium text-sm line-clamp-1"
                                        style={{ color: currentTheme.foreground }}
                                    >
                                        {series.title}
                                    </h4>
                                    <p
                                        className="text-xs line-clamp-1"
                                        style={{ color: `${currentTheme.foreground}70` }}
                                    >
                                        by {series.author}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex items-center">
                                            <span className="text-yellow-400 text-xs">★</span>
                                            <span
                                                className="text-xs ml-1"
                                                style={{ color: `${currentTheme.foreground}80` }}
                                            >
                                                {series.rating || 'N/A'}
                                            </span>
                                        </div>
                                        <span style={{ color: `${currentTheme.foreground}30` }}>•</span>
                                        <span
                                            className="text-xs"
                                            style={{ color: `${currentTheme.foreground}80` }}
                                        >
                                            {series.chapters_count} chapters
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-shrink-0">
                                    <span
                                        className="px-2 py-1 text-xs font-medium rounded-full"
                                        style={{
                                            backgroundColor: statusColor.dim,
                                            color: statusColor.bg,
                                        }}
                                    >
                                        {series.status}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}

                    {/* View all results link */}
                    <Link
                        href={`/search?q=${encodeURIComponent(query)}`}
                        onClick={() => onSuggestionClick()}
                        className="block p-3 text-center text-sm font-medium transition-colors cursor-pointer"
                        style={{
                            color: SHINY_PURPLE,
                            pointerEvents: 'auto'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `${currentTheme.foreground}08`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        View all results for &ldquo;{query}&rdquo;
                    </Link>
                </>
            ) : (
                <div
                    className="p-4 text-center"
                    style={{ color: `${currentTheme.foreground}60` }}
                >
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-sm">No suggestions found for &ldquo;{query}&rdquo;</p>
                    <Link
                        href={`/search?q=${encodeURIComponent(query)}`}
                        onClick={() => onSuggestionClick()}
                        className="text-sm hover:underline mt-1 inline-block cursor-pointer"
                        style={{ color: SHINY_PURPLE, pointerEvents: 'auto' }}
                    >
                        Search anyway
                    </Link>
                </div>
            )}
        </div>
    );
}
