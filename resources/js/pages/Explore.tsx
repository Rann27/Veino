import React, { useState, useEffect, useRef, useCallback } from 'react';
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
        type?: string;
        sort: string;
    };
}

interface SelectOption {
    value: string;
    label: string;
}

function ThemedDropdown({
    value,
    onChange,
    options,
    className = '',
}: {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    className?: string;
}) {
    const { currentTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find((option) => option.value === value) || options[0];

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="w-full py-2.5 px-3 rounded-xl text-sm transition-colors flex items-center justify-between"
                style={{
                    backgroundColor: `${currentTheme.foreground}06`,
                    border: `1px solid ${currentTheme.foreground}12`,
                    color: currentTheme.foreground,
                }}
            >
                <span className="truncate">{selectedOption?.label}</span>
                <svg
                    className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: `${currentTheme.foreground}70` }}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div
                    className="absolute top-full mt-1 w-full rounded-xl overflow-hidden z-30 max-h-64 overflow-y-auto themed-scrollbar"
                    style={{
                        backgroundColor: currentTheme.background,
                        border: `1px solid ${currentTheme.foreground}18`,
                        boxShadow: `0 8px 24px ${currentTheme.foreground}1A`,
                    }}
                >
                    {options.map((option) => {
                        const isSelected = option.value === value;
                        return (
                            <button
                                key={option.value || '__all__'}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm transition-colors"
                                style={{
                                    backgroundColor: isSelected ? `${currentTheme.foreground}12` : 'transparent',
                                    color: isSelected ? currentTheme.foreground : `${currentTheme.foreground}85`,
                                }}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function ExploreContent({ series, genres, languages, filters }: Props) {
    const { currentTheme } = useTheme();
    
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedGenres, setSelectedGenres] = useState<number[]>(filters.genres || []);
    const [selectedLanguage, setSelectedLanguage] = useState(filters.language ? String(filters.language) : '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedType, setSelectedType] = useState(filters.type || '');
    const [sortBy, setSortBy] = useState(filters.sort);
    const [showFilters, setShowFilters] = useState(
        !!(filters.genres?.length || filters.language || filters.status || filters.type)
    );
    const [isSearching, setIsSearching] = useState(false);

    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const isFirstRender = useRef(true);

    // Build params helper
    const buildParams = useCallback((overrides?: Record<string, any>) => {
        const params: Record<string, any> = {
            search: overrides?.search !== undefined ? overrides.search : (searchTerm || undefined),
            genres: overrides?.genres !== undefined ? overrides.genres : (selectedGenres.length > 0 ? selectedGenres : undefined),
            language: overrides?.language !== undefined ? overrides.language : (selectedLanguage || undefined),
            status: overrides?.status !== undefined ? overrides.status : (selectedStatus || undefined),
            type: overrides?.type !== undefined ? overrides.type : (selectedType || undefined),
            sort: overrides?.sort !== undefined ? overrides.sort : sortBy,
        };

        // Clean undefined / empty
        Object.keys(params).forEach(key => {
            if (params[key] === undefined || params[key] === '') {
                delete params[key];
            }
        });

        return params;
    }, [searchTerm, selectedGenres, selectedLanguage, selectedStatus, selectedType, sortBy]);

    // Navigate with params
    const applyFilters = useCallback((overrides?: Record<string, any>) => {
        const params = buildParams(overrides);
        setIsSearching(true);
        router.get(route('explore'), params, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsSearching(false),
        });
    }, [buildParams]);

    // Debounced search term (400ms)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            applyFilters({ search: searchTerm || undefined });
        }, 400);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchTerm]);

    // Instant-apply handlers
    const handleSortChange = (value: string) => {
        setSortBy(value);
        applyFilters({ sort: value });
    };

    const handleTypeChange = (value: string) => {
        setSelectedType(value);
        applyFilters({ type: value || undefined });
    };

    const handleLanguageChange = (value: string) => {
        setSelectedLanguage(value);
        applyFilters({ language: value || undefined });
    };

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value);
        applyFilters({ status: value || undefined });
    };

    const handleGenreToggle = (genreId: number) => {
        const newGenres = selectedGenres.includes(genreId) 
            ? selectedGenres.filter(id => id !== genreId)
            : [...selectedGenres, genreId];
        setSelectedGenres(newGenres);
        applyFilters({ genres: newGenres.length > 0 ? newGenres : undefined });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedGenres([]);
        setSelectedLanguage('');
        setSelectedStatus('');
        setSelectedType('');
        setSortBy('latest');
        setIsSearching(true);
        router.get(route('explore'), { sort: 'latest' }, {
            preserveState: true,
            onFinish: () => setIsSearching(false),
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ongoing': return { bg: '#22c55e', text: '#ffffff' };
            case 'completed': return { bg: '#3b82f6', text: '#ffffff' };
            case 'hiatus': return { bg: '#eab308', text: '#000000' };
            case 'dropped': return { bg: '#ef4444', text: '#ffffff' };
            default: return { bg: `${currentTheme.foreground}20`, text: currentTheme.foreground };
        }
    };

    const activeFilterCount = [
        selectedGenres.length > 0,
        !!selectedLanguage,
        !!selectedStatus,
        !!selectedType,
    ].filter(Boolean).length;

    return (
        <>
            <Head title="Explore Series" />
            
            <div 
                className="min-h-screen"
                style={{ backgroundColor: currentTheme.background }}
            >
                <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 
                            className="text-2xl sm:text-3xl font-extrabold mb-1"
                            style={{ color: currentTheme.foreground }}
                        >
                            Explore Series
                        </h1>
                        <p className="text-sm sm:text-base" style={{ color: `${currentTheme.foreground}60` }}>
                            Discover amazing stories from talented authors
                        </p>
                    </div>

                    {/* ─── Search & Controls Bar ─── */}
                    <div 
                        className="rounded-2xl p-4 sm:p-5 mb-6"
                        style={{
                            backgroundColor: `${currentTheme.foreground}04`,
                            border: `1px solid ${currentTheme.foreground}08`,
                        }}
                    >
                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Search Input */}
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Search by title or author..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 rounded-xl focus:ring-2 transition-colors text-sm"
                                    style={{
                                        backgroundColor: `${currentTheme.foreground}06`,
                                        border: `1px solid ${currentTheme.foreground}12`,
                                        color: currentTheme.foreground,
                                    }}
                                />
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    {isSearching ? (
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" style={{ color: `${currentTheme.foreground}40` }}>
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : (
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `${currentTheme.foreground}40` }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    )}
                                </div>
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70"
                                        style={{ color: `${currentTheme.foreground}40` }}
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Sort Dropdown */}
                            <ThemedDropdown
                                value={sortBy}
                                onChange={handleSortChange}
                                className="w-full sm:w-44"
                                options={[
                                    { value: 'latest', label: 'Latest' },
                                    { value: 'title', label: 'Title A-Z' },
                                    { value: 'popular', label: 'Most Popular' },
                                    { value: 'rating', label: 'Highest Rated' },
                                ]}
                            />

                            {/* Filter Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="relative px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all"
                                style={{
                                    backgroundColor: showFilters ? currentTheme.foreground : `${currentTheme.foreground}06`,
                                    border: `1px solid ${showFilters ? currentTheme.foreground : `${currentTheme.foreground}12`}`,
                                    color: showFilters ? currentTheme.background : currentTheme.foreground,
                                }}
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                Filters
                                {activeFilterCount > 0 && (
                                    <span 
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full"
                                        style={{
                                            backgroundColor: '#ef4444',
                                            color: '#ffffff',
                                        }}
                                    >
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Expanded Filters */}
                        {showFilters && (
                            <div 
                                className="mt-4 pt-4"
                                style={{ borderTop: `1px solid ${currentTheme.foreground}08` }}
                            >
                                {/* Row 1: Type, Language, Status */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                    {/* Type */}
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: `${currentTheme.foreground}50` }}>
                                            Type
                                        </label>
                                        <ThemedDropdown
                                            value={selectedType}
                                            onChange={handleTypeChange}
                                            options={[
                                                { value: '', label: 'All Types' },
                                                { value: 'web-novel', label: 'Web Novel' },
                                                { value: 'light-novel', label: 'Light Novel' },
                                            ]}
                                        />
                                    </div>

                                    {/* Language */}
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: `${currentTheme.foreground}50` }}>
                                            Language
                                        </label>
                                        <ThemedDropdown
                                            value={selectedLanguage}
                                            onChange={handleLanguageChange}
                                            options={[
                                                { value: '', label: 'All Languages' },
                                                ...languages.map((language) => ({
                                                    value: String(language.id),
                                                    label: language.name,
                                                })),
                                            ]}
                                        />
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: `${currentTheme.foreground}50` }}>
                                            Status
                                        </label>
                                        <ThemedDropdown
                                            value={selectedStatus}
                                            onChange={handleStatusChange}
                                            options={[
                                                { value: '', label: 'All Status' },
                                                { value: 'ongoing', label: 'Ongoing' },
                                                { value: 'completed', label: 'Completed' },
                                                { value: 'hiatus', label: 'Hiatus' },
                                                { value: 'dropped', label: 'Dropped' },
                                            ]}
                                        />
                                    </div>
                                </div>

                                {/* Genres - pill buttons instead of checkboxes */}
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: `${currentTheme.foreground}50` }}>
                                        Genres
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {genres.map((genre) => {
                                            const isActive = selectedGenres.includes(genre.id);
                                            return (
                                                <button
                                                    key={genre.id}
                                                    onClick={() => handleGenreToggle(genre.id)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                                    style={{
                                                        backgroundColor: isActive ? currentTheme.foreground : `${currentTheme.foreground}06`,
                                                        color: isActive ? currentTheme.background : `${currentTheme.foreground}70`,
                                                        border: `1px solid ${isActive ? currentTheme.foreground : `${currentTheme.foreground}10`}`,
                                                    }}
                                                >
                                                    {genre.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Clear */}
                                {activeFilterCount > 0 && (
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            onClick={clearFilters}
                                            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-70"
                                            style={{ 
                                                color: `${currentTheme.foreground}60`,
                                                backgroundColor: `${currentTheme.foreground}05`,
                                            }}
                                        >
                                            Clear All Filters
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Results count */}
                    <div className="mb-5 flex items-center justify-between">
                        <p className="text-sm" style={{ color: `${currentTheme.foreground}50` }}>
                            Showing <span className="font-semibold" style={{ color: `${currentTheme.foreground}90` }}>{series.data.length}</span> of <span className="font-semibold" style={{ color: `${currentTheme.foreground}90` }}>{series.total}</span> series
                        </p>
                        {isSearching && (
                            <span className="text-xs animate-pulse" style={{ color: `${currentTheme.foreground}40` }}>Updating...</span>
                        )}
                    </div>

                    {/* ─── Series Grid ─── */}
                    {series.data.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 mb-8">
                            {series.data.map((item) => (
                                <Link
                                    key={item.id}
                                    href={route('series.show', item.slug)}
                                    className="group"
                                >
                                    <div 
                                        className="rounded-2xl overflow-hidden transition-all duration-300 h-full flex flex-col group-hover:shadow-lg group-hover:-translate-y-1"
                                        style={{
                                            backgroundColor: `${currentTheme.foreground}04`,
                                            border: `1px solid ${currentTheme.foreground}08`,
                                        }}
                                    >
                                        {/* Cover */}
                                        <div className="relative aspect-[2/3] overflow-hidden">
                                            {item.cover_url ? (
                                                <img
                                                    src={item.cover_url}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div 
                                                    className="w-full h-full flex items-center justify-center text-xs"
                                                    style={{ backgroundColor: `${currentTheme.foreground}08`, color: `${currentTheme.foreground}40` }}
                                                >
                                                    No Cover
                                                </div>
                                            )}
                                            {/* Gradient overlay at bottom */}
                                            <div 
                                                className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                                                style={{
                                                    background: `linear-gradient(to top, ${currentTheme.foreground}30, transparent)`,
                                                }}
                                            />
                                            {/* Status badge */}
                                            <div className="absolute top-2.5 left-2.5">
                                                <span
                                                    className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider"
                                                    style={{
                                                        backgroundColor: getStatusColor(item.status).bg,
                                                        color: getStatusColor(item.status).text,
                                                    }}
                                                >
                                                    {item.status}
                                                </span>
                                            </div>
                                            {/* Rating badge bottom-right */}
                                            <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-semibold"
                                                style={{
                                                    backgroundColor: `${currentTheme.background}CC`,
                                                    color: currentTheme.foreground,
                                                    backdropFilter: 'blur(4px)',
                                                }}
                                            >
                                                <span className="text-yellow-400 text-xs">★</span>
                                                <span>{item.rating || 'N/A'}</span>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="p-3 flex-1 flex flex-col">
                                            <h3 
                                                className="font-semibold text-sm leading-snug line-clamp-2 mb-1.5 group-hover:opacity-80 transition-opacity"
                                                style={{ color: currentTheme.foreground }}
                                            >
                                                {item.title}
                                            </h3>
                                            
                                            <p className="text-xs mb-2 truncate" style={{ color: `${currentTheme.foreground}55` }}>
                                                by {item.author}
                                            </p>
                                            
                                            <div className="flex items-center gap-2 mb-2.5 text-xs" style={{ color: `${currentTheme.foreground}50` }}>
                                                <span>{item.chapters_count} ch</span>
                                                <span style={{ color: `${currentTheme.foreground}20` }}>•</span>
                                                <span>{item.native_language?.name}</span>
                                            </div>

                                            {/* Genres */}
                                            <div className="flex flex-wrap gap-1 mt-auto">
                                                {item.genres.slice(0, 2).map((genre) => (
                                                    <span
                                                        key={genre.id}
                                                        className="px-2 py-0.5 text-[10px] font-medium rounded-md"
                                                        style={{
                                                            backgroundColor: `${currentTheme.foreground}08`,
                                                            color: `${currentTheme.foreground}65`,
                                                        }}
                                                    >
                                                        {genre.name}
                                                    </span>
                                                ))}
                                                {item.genres.length > 2 && (
                                                    <span 
                                                        className="px-1.5 py-0.5 text-[10px] rounded-md"
                                                        style={{
                                                            backgroundColor: `${currentTheme.foreground}05`,
                                                            color: `${currentTheme.foreground}40`,
                                                        }}
                                                    >
                                                        +{item.genres.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="text-center py-20">
                            <svg className="mx-auto w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `${currentTheme.foreground}25` }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <h3 className="text-lg font-semibold mb-2" style={{ color: currentTheme.foreground }}>
                                No series found
                            </h3>
                            <p className="text-sm mb-4" style={{ color: `${currentTheme.foreground}50` }}>
                                Try adjusting your search or filters
                            </p>
                            <button
                                onClick={clearFilters}
                                className="px-5 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                                style={{
                                    backgroundColor: currentTheme.foreground,
                                    color: currentTheme.background,
                                }}
                            >
                                Clear All Filters
                            </button>
                        </div>
                    )}

                    {/* ─── Pagination ─── */}
                    {series.last_page > 1 && (
                        <div className="flex justify-center mt-4">
                            <nav className="flex items-center gap-1.5">
                                {series.links.map((link, index) => {
                                    const isArrow = index === 0 || index === series.links.length - 1;
                                    return (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`flex items-center justify-center text-sm font-medium transition-all ${
                                                isArrow ? 'px-3 py-2' : 'w-9 h-9'
                                            } rounded-lg ${
                                                link.active
                                                    ? ''
                                                    : link.url
                                                    ? 'hover:opacity-70'
                                                    : 'cursor-not-allowed opacity-30'
                                            }`}
                                            style={{
                                                backgroundColor: link.active 
                                                    ? currentTheme.foreground 
                                                    : `${currentTheme.foreground}06`,
                                                color: link.active 
                                                    ? currentTheme.background 
                                                    : link.url 
                                                    ? `${currentTheme.foreground}80`
                                                    : `${currentTheme.foreground}30`,
                                                border: `1px solid ${link.active ? currentTheme.foreground : `${currentTheme.foreground}08`}`,
                                            }}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            preserveState
                                        />
                                    );
                                })}
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
