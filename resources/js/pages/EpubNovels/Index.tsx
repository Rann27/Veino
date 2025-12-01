import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import ShopLayout from '@/Layouts/ShopLayout';
import { useTheme } from '@/Contexts/ThemeContext';

interface Genre {
    id: number;
    name: string;
}

interface EbookSeries {
    id: number;
    title: string;
    slug: string;
    cover_url: string;
    price_range: string;
    genres: Genre[];
}

interface Props {
    series: {
        data: EbookSeries[];
        current_page: number;
        last_page: number;
    };
    genres: Genre[];
    filters: {
        search?: string;
        genres?: number[];
        sort?: string;
    };
    chartItems?: any[];
    totalPrice?: number;
}

function IndexContent({ series, genres, filters, chartItems = [], totalPrice = 0 }: Props) {
    const { currentTheme } = useTheme();
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedGenres, setSelectedGenres] = useState<number[]>(filters.genres || []);
    const [selectedSort, setSelectedSort] = useState(filters.sort || 'latest');
    const [showGenres, setShowGenres] = useState(false);
    const [showSort, setShowSort] = useState(false);

    // Live search with debounce
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== (filters.search || '')) {
                performSearch();
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Live filter when genres or sort changes
    React.useEffect(() => {
        if (JSON.stringify(selectedGenres) !== JSON.stringify(filters.genres || []) || 
            selectedSort !== (filters.sort || 'latest')) {
            performSearch();
        }
    }, [selectedGenres, selectedSort]);

    const performSearch = () => {
        router.get(route('epub-novels.index'), {
            search: searchQuery || undefined,
            genres: selectedGenres.length > 0 ? selectedGenres : undefined,
            sort: selectedSort
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        performSearch();
    };

    const toggleGenre = (genreId: number) => {
        setSelectedGenres(prev => 
            prev.includes(genreId) 
                ? prev.filter(id => id !== genreId)
                : [...prev, genreId]
        );
    };

    const clearGenres = () => {
        setSelectedGenres([]);
    };

    const sortOptions = [
        { value: 'latest', label: 'Latest' },
        { value: 'title_asc', label: 'Title: A-Z' },
        { value: 'title_desc', label: 'Title: Z-A' },
        { value: 'popular', label: 'Popular' }
    ];

    return (
        <>
            <Head title="Epub Novels" />

                <div className="min-h-screen pb-24"> {/* pb-24 for bottom bar space */}
                    {/* Header */}
                    <div 
                        className="border-b"
                        style={{ borderColor: `${currentTheme.foreground}20` }}
                    >
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                            <h1 
                                className="text-3xl md:text-4xl font-bold mb-2"
                                style={{ 
                                    fontFamily: 'Poppins, sans-serif',
                                    color: currentTheme.foreground
                                }}
                            >
                                Epub Novels
                            </h1>
                            <p 
                                className="text-base opacity-70"
                                style={{ 
                                    fontFamily: 'Poppins, sans-serif',
                                    color: currentTheme.foreground
                                }}
                            >
                                Purchase and download your favorite light novels in EPUB format
                            </p>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Search & Filters - Responsive Layout */}
                    <div className="mb-8">
                        <form onSubmit={handleSearch} className="space-y-3">
                            {/* Search Input - Full Width on Mobile */}
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by title, author..."
                                className="w-full px-4 py-2.5 sm:py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm sm:text-base"
                                style={{
                                    backgroundColor: currentTheme.background,
                                    color: currentTheme.foreground,
                                    borderColor: `${currentTheme.foreground}20`,
                                    fontFamily: 'Poppins, sans-serif'
                                }}
                            />

                            {/* Buttons Row - 50:50 on all screens */}
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                {/* Sort Dropdown */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowSort(!showSort)}
                                        className="w-full px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all duration-200 hover:opacity-90 flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
                                        style={{
                                            backgroundColor: `${currentTheme.foreground}10`,
                                            color: currentTheme.foreground,
                                            fontFamily: 'Poppins, sans-serif'
                                        }}
                                    >
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                        </svg>
                                        <span>Sort</span>
                                        <svg 
                                            className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${showSort ? 'rotate-180' : ''}`} 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {showSort && (
                                        <div 
                                            className="absolute left-0 sm:right-0 z-10 mt-2 w-40 sm:w-48 rounded-lg shadow-lg border overflow-hidden"
                                            style={{
                                                backgroundColor: currentTheme.background,
                                                borderColor: `${currentTheme.foreground}20`
                                            }}
                                        >
                                            {sortOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedSort(option.value);
                                                        setShowSort(false);
                                                    }}
                                                    className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 transition-all duration-200 hover:opacity-80 text-xs sm:text-base"
                                                    style={{
                                                        backgroundColor: selectedSort === option.value ? `${currentTheme.foreground}10` : 'transparent',
                                                        color: currentTheme.foreground,
                                                        fontFamily: 'Poppins, sans-serif'
                                                    }}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Genres Button */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowGenres(!showGenres)}
                                        className="w-full px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all duration-200 hover:opacity-90 flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
                                        style={{
                                            backgroundColor: `${currentTheme.foreground}10`,
                                            color: currentTheme.foreground,
                                            fontFamily: 'Poppins, sans-serif'
                                        }}
                                    >
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        <span>Genres</span>
                                        {selectedGenres.length > 0 && (
                                            <span className="ml-0.5 sm:ml-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs bg-amber-500 text-white">
                                                {selectedGenres.length}
                                            </span>
                                        )}
                                        <svg 
                                            className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${showGenres ? 'rotate-180' : ''}`} 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* Genre Dropdown with Checkboxes */}
                        {showGenres && (
                            <div 
                                className="rounded-lg shadow-lg border p-4 mb-4"
                                style={{
                                    backgroundColor: currentTheme.background,
                                    borderColor: `${currentTheme.foreground}20`
                                }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h3 
                                        className="font-semibold"
                                        style={{ 
                                            color: currentTheme.foreground,
                                            fontFamily: 'Poppins, sans-serif'
                                        }}
                                    >
                                        Select Genres
                                    </h3>
                                    {selectedGenres.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={clearGenres}
                                            className="text-sm font-medium hover:underline"
                                            style={{ color: '#f59e0b' }}
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
                                    {genres.map((genre) => (
                                        <label
                                            key={genre.id}
                                            className="flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-all hover:opacity-80"
                                            style={{
                                                backgroundColor: selectedGenres.includes(genre.id) ? `${currentTheme.foreground}10` : 'transparent',
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedGenres.includes(genre.id)}
                                                onChange={() => toggleGenre(genre.id)}
                                                className="w-4 h-4 rounded accent-amber-500"
                                            />
                                            <span 
                                                className="text-sm"
                                                style={{ 
                                                    color: currentTheme.foreground,
                                                    fontFamily: 'Poppins, sans-serif'
                                                }}
                                            >
                                                {genre.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>                        {/* Series Grid - 2 columns on mobile, 6 on desktop */}
                        {series.data.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
                                {series.data.map((s) => (
                                    <Link
                                        key={s.id}
                                        href={route('epub-novels.show', s.slug)}
                                        className="group"
                                    >
                                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 sm:mb-3 transition-transform duration-300 group-hover:scale-105">
                                            <img
                                                src={s.cover_url}
                                                alt={s.title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.src = '/images/default-cover.jpg';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </div>

                                        <h3 
                                            className="font-semibold text-xs sm:text-sm md:text-base mb-1 sm:mb-2 line-clamp-2 group-hover:opacity-80 transition-opacity"
                                            style={{ 
                                                fontFamily: 'Poppins, sans-serif',
                                                color: currentTheme.foreground
                                            }}
                                        >
                                            {s.title}
                                        </h3>

                                        <p 
                                            className="text-sm sm:text-base md:text-lg font-bold"
                                            style={{ 
                                                fontFamily: 'Poppins, sans-serif',
                                                color: '#f59e0b'
                                            }}
                                        >
                                            {s.price_range}
                                        </p>

                                        {/* Genres */}
                                        {s.genres.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1 sm:mt-2">
                                                {s.genres.slice(0, 2).map((genre) => (
                                                    <span
                                                        key={genre.id}
                                                        className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs"
                                                        style={{
                                                            backgroundColor: `${currentTheme.foreground}10`,
                                                            color: currentTheme.foreground,
                                                            fontFamily: 'Poppins, sans-serif'
                                                        }}
                                                    >
                                                        {genre.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p 
                                    className="text-lg opacity-70"
                                    style={{ 
                                        fontFamily: 'Poppins, sans-serif',
                                        color: currentTheme.foreground
                                    }}
                                >
                                    No series found
                                </p>
                            </div>
                        )}

                        {/* Pagination */}
                        {series.last_page > 1 && (
                            <div className="mt-6 sm:mt-8 flex justify-center gap-1.5 sm:gap-2 flex-wrap">
                                {Array.from({ length: series.last_page }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => router.get(route('epub-novels.index'), { ...filters, page })}
                                        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base"
                                        style={{
                                            backgroundColor: page === series.current_page ? '#f59e0b' : `${currentTheme.foreground}10`,
                                            color: page === series.current_page ? 'white' : currentTheme.foreground,
                                            fontFamily: 'Poppins, sans-serif'
                                        }}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
        </>
    );
}

export default function Index(props: Props) {
    return (
        <UserLayout>
            <ShopLayout chartItems={props.chartItems || []} totalPrice={props.totalPrice || 0}>
                <IndexContent {...props} />
            </ShopLayout>
        </UserLayout>
    );
}
