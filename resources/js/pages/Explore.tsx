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
    genres: Genre[];
    languages: NativeLanguage[];
    filters: {
        search?: string;
        genres?: number[];
        language?: number;
        status?: string;
        sort: string;
    };
}

function ExploreContent({ series, genres, languages, filters }: Props) {
    const { currentTheme } = useTheme();
    
    // Remove the fallback as we now use theme context
    
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedGenres, setSelectedGenres] = useState<number[]>(filters.genres || []);
    const [selectedLanguage, setSelectedLanguage] = useState(filters.language || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [sortBy, setSortBy] = useState(filters.sort);
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = () => {
        const params = {
            search: searchTerm || undefined,
            genres: selectedGenres.length > 0 ? selectedGenres : undefined,
            language: selectedLanguage || undefined,
            status: selectedStatus || undefined,
            sort: sortBy,
        };

        router.get(route('explore'), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleGenreToggle = (genreId: number) => {
        setSelectedGenres(prev => 
            prev.includes(genreId) 
                ? prev.filter(id => id !== genreId)
                : [...prev, genreId]
        );
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedGenres([]);
        setSelectedLanguage('');
        setSelectedStatus('');
        setSortBy('latest');
        
        router.get(route('explore'), { sort: 'latest' });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ongoing': return 'text-green-600 bg-green-50';
            case 'completed': return 'text-blue-600 bg-blue-50';
            case 'hiatus': return 'text-yellow-600 bg-yellow-50';
            case 'dropped': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <>
            <Head title="Explore Series" />
            
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
                            Explore Series
                        </h1>
                        <p style={{ color: `${currentTheme.foreground}80` }}>
                            Discover amazing stories from talented authors
                        </p>
                    </div>

                    {/* Search and Filter Bar */}
                    <div 
                        className="rounded-lg shadow-sm border p-6 mb-8"
                        style={{
                            backgroundColor: currentTheme.background,
                            borderColor: `${currentTheme.foreground}20`
                        }}
                    >
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search Input */}
                            <div className="flex-1">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search by title or author..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors"
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
                                            style={{ color: `${currentTheme.foreground}60` }}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Sort Dropdown */}
                            <div className="w-full lg:w-48">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full py-2 px-3 border rounded-lg focus:ring-2 transition-colors"
                                    style={{
                                        backgroundColor: currentTheme.background,
                                        borderColor: `${currentTheme.foreground}30`,
                                        color: currentTheme.foreground
                                    }}
                                >
                                    <option value="latest">Latest</option>
                                    <option value="title">Title A-Z</option>
                                    <option value="popular">Most Popular</option>
                                    <option value="rating">Highest Rated</option>
                                </select>
                            </div>

                            {/* Filter Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="btn-ripple interactive-scale px-4 py-2 border rounded-lg focus-ring flex items-center gap-2"
                                style={{
                                    backgroundColor: showFilters ? currentTheme.foreground : 'transparent',
                                    borderColor: `${currentTheme.foreground}30`,
                                    color: showFilters ? currentTheme.background : currentTheme.foreground
                                }}
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                Filters
                            </button>

                            {/* Search Button */}
                            <button
                                onClick={handleSearch}
                                className="btn-ripple interactive-scale px-6 py-2 rounded-lg focus-ring"
                                style={{
                                    backgroundColor: currentTheme.foreground,
                                    color: currentTheme.background
                                }}
                            >
                                Search
                            </button>
                        </div>

                        {/* Expanded Filters */}
                        {showFilters && (
                            <div 
                                className="animate-in fade-in-up mt-6 pt-6 border-t"
                                style={{ borderColor: `${currentTheme.foreground}20` }}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Genres Filter */}
                                    <div>
                                        <label 
                                            className="block text-sm font-medium mb-2"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            Genres
                                        </label>
                                        <div className="max-h-32 overflow-y-auto space-y-2">
                                            {genres.map((genre) => (
                                                <label key={genre.id} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedGenres.includes(genre.id)}
                                                        onChange={() => handleGenreToggle(genre.id)}
                                                        className="rounded border focus:ring-2"
                                                        style={{
                                                            borderColor: `${currentTheme.foreground}40`,
                                                            color: currentTheme.foreground
                                                        }}
                                                    />
                                                    <span 
                                                        className="ml-2 text-sm"
                                                        style={{ color: `${currentTheme.foreground}80` }}
                                                    >
                                                        {genre.name}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Language Filter */}
                                    <div>
                                        <label 
                                            className="block text-sm font-medium mb-2"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            Language
                                        </label>
                                        <select
                                            value={selectedLanguage}
                                            onChange={(e) => setSelectedLanguage(e.target.value)}
                                            className="w-full py-2 px-3 border rounded-lg focus:ring-2 transition-colors"
                                            style={{
                                                backgroundColor: currentTheme.background,
                                                borderColor: `${currentTheme.foreground}30`,
                                                color: currentTheme.foreground
                                            }}
                                        >
                                            <option value="">All Languages</option>
                                            {languages.map((language) => (
                                                <option key={language.id} value={language.id}>{language.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Status Filter */}
                                    <div>
                                        <label 
                                            className="block text-sm font-medium mb-2"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            Status
                                        </label>
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                            className="w-full py-2 px-3 border rounded-lg focus:ring-2 transition-colors"
                                            style={{
                                                backgroundColor: currentTheme.background,
                                                borderColor: `${currentTheme.foreground}30`,
                                                color: currentTheme.foreground
                                            }}
                                        >
                                            <option value="">All Status</option>
                                            <option value="ongoing">Ongoing</option>
                                            <option value="completed">Completed</option>
                                            <option value="hiatus">Hiatus</option>
                                            <option value="dropped">Dropped</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={clearFilters}
                                        className="px-4 py-2 transition-colors hover:opacity-70"
                                        style={{ color: `${currentTheme.foreground}80` }}
                                    >
                                        Clear All Filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results */}
                    <div className="mb-6">
                        <p style={{ color: `${currentTheme.foreground}80` }}>
                            Showing {series.data.length} of {series.total} series
                        </p>
                    </div>

                    {/* Series Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5 mb-8">
                        {series.data.map((item, index) => (
                            <Link
                                key={item.id}
                                href={route('series.show', item.slug)}
                                className={`group animate-in fade-in-up stagger-${Math.min(index + 1, 6)}`}
                            >
                                <div 
                                    className="card-hover rounded-lg p-4 sm:p-5 h-full flex flex-col min-h-[280px]"
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
                                        border: `1px solid ${currentTheme.foreground}10`,
                                        boxShadow: `0 1px 3px ${currentTheme.foreground}10`
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
                                            <span className="star-icon text-yellow-400 inline-block">★</span>
                                            <span 
                                                className="text-xs ml-1 font-medium"
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
                                                    backgroundColor: `${currentTheme.foreground}10`,
                                                    color: `${currentTheme.foreground}70`
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
                            <nav className="flex items-center space-x-1">
                                {series.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`px-3 py-2 text-sm rounded-md transition-colors ${
                                            link.active
                                                ? ''
                                                : link.url
                                                ? 'hover:opacity-70'
                                                : 'cursor-not-allowed opacity-50'
                                        }`}
                                        style={{
                                            backgroundColor: link.active 
                                                ? currentTheme.foreground 
                                                : link.url 
                                                ? 'transparent' 
                                                : 'transparent',
                                            color: link.active 
                                                ? currentTheme.background 
                                                : link.url 
                                                ? currentTheme.foreground 
                                                : `${currentTheme.foreground}50`,
                                            border: link.active 
                                                ? 'none' 
                                                : `1px solid ${currentTheme.foreground}20`
                                        }}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </nav>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default function Explore(props: Props) {
    return (
        <UserLayout>
            <ExploreContent {...props} />
        </UserLayout>
    );
}
