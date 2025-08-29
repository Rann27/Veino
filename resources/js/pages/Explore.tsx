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

export default function Explore({ series, genres, languages, filters }: Props) {
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
        <UserLayout>
            <Head title="Explore Series" />
            
            <div className="min-h-screen bg-gray-50 pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Series</h1>
                        <p className="text-gray-600">Discover amazing stories from talented authors</p>
                    </div>

                    {/* Search and Filter Bar */}
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
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
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                    className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                Filters
                            </button>

                            {/* Search Button */}
                            <button
                                onClick={handleSearch}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Search
                            </button>
                        </div>

                        {/* Expanded Filters */}
                        {showFilters && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Genres Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Genres</label>
                                        <div className="max-h-32 overflow-y-auto space-y-2">
                                            {genres.map((genre) => (
                                                <label key={genre.id} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedGenres.includes(genre.id)}
                                                        onChange={() => handleGenreToggle(genre.id)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-600">{genre.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Language Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                                        <select
                                            value={selectedLanguage}
                                            onChange={(e) => setSelectedLanguage(e.target.value)}
                                            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">All Languages</option>
                                            {languages.map((language) => (
                                                <option key={language.id} value={language.id}>{language.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Status Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                    >
                                        Clear All Filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results */}
                    <div className="mb-6">
                        <p className="text-gray-600">
                            Showing {series.data.length} of {series.total} series
                        </p>
                    </div>

                    {/* Series Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                        {series.data.map((item) => (
                            <Link
                                key={item.id}
                                href={route('series.show', item.slug)}
                                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                            >
                                <div className="aspect-[3/4] relative">
                                    {item.cover_image ? (
                                        <img
                                            src={item.cover_image}
                                            alt={item.title}
                                            className="w-full h-full object-cover rounded-t-lg"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 rounded-t-lg flex items-center justify-center">
                                            <span className="text-gray-400">No Cover</span>
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{item.title}</h3>
                                    <p className="text-sm text-gray-600 mb-2">by {item.author}</p>
                                    
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex items-center">
                                            <span className="text-yellow-400">★</span>
                                            <span className="text-sm text-gray-600 ml-1">{item.rating || 'N/A'}</span>
                                        </div>
                                        <span className="text-gray-300">•</span>
                                        <span className="text-sm text-gray-600">{item.chapters_count} chapters</span>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-1">
                                        {item.genres.slice(0, 2).map((genre) => (
                                            <span
                                                key={genre.id}
                                                className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded"
                                            >
                                                {genre.name}
                                            </span>
                                        ))}
                                        {item.genres.length > 2 && (
                                            <span className="px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded">
                                                +{item.genres.length - 2} more
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
                                        className={`px-3 py-2 text-sm rounded-md ${
                                            link.active
                                                ? 'bg-blue-600 text-white'
                                                : link.url
                                                ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                                : 'text-gray-300 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </nav>
                        </div>
                    )}
                </div>
            </div>
        </UserLayout>
    );
}
