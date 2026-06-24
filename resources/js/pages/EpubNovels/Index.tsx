import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import ShopLayout from '@/Layouts/ShopLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import CoverImage from '@/Components/CoverImage';
import PremiumDiamond from '@/Components/PremiumDiamond';

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
    free_for_premium_members?: boolean;
    is_mature?: boolean;
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
        type?: 'all' | 'premium' | 'exclusive';
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
    const typeFilter = (filters.type || 'all') as 'all' | 'premium' | 'exclusive';

    // Live search with debounce
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== (filters.search || '')) performSearch();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    React.useEffect(() => {
        if (
            JSON.stringify(selectedGenres) !== JSON.stringify(filters.genres || []) ||
            selectedSort !== (filters.sort || 'latest')
        ) {
            performSearch();
        }
    }, [selectedGenres, selectedSort]);

    const performSearch = () => {
        router.get(route('epub-novels.index'), {
            search: searchQuery || undefined,
            genres: selectedGenres.length > 0 ? selectedGenres : undefined,
            sort: selectedSort,
            type: typeFilter !== 'all' ? typeFilter : undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    const toggleGenre = (genreId: number) => {
        setSelectedGenres(prev =>
            prev.includes(genreId) ? prev.filter(id => id !== genreId) : [...prev, genreId]
        );
    };

    const sortOptions = [
        { value: 'latest',     label: 'Latest' },
        { value: 'title_asc',  label: 'Title: A–Z' },
        { value: 'title_desc', label: 'Title: Z–A' },
        { value: 'popular',    label: 'Popular' },
    ];

    const typeTabs: { key: 'all' | 'premium' | 'exclusive'; label: string }[] = [
        { key: 'all',       label: 'All' },
        { key: 'premium',   label: 'Free for Premium' },
        { key: 'exclusive', label: 'Exclusive' },
    ];

    const displayedSeries = series.data;

    const setTypeFilter = (type: 'all' | 'premium' | 'exclusive') => {
        router.get(route('epub-novels.index'), {
            search: searchQuery || undefined,
            genres: selectedGenres.length > 0 ? selectedGenres : undefined,
            sort: selectedSort,
            type: type !== 'all' ? type : undefined,
        }, { preserveState: false, preserveScroll: false });
    };

    const borderColor = `${currentTheme.foreground}18`;
    const mutedColor  = `${currentTheme.foreground}60`;

    return (
        <>
            <Head title="Epub Novels" />

            <div className="min-h-screen pb-24">

                {/* ── Compact header ─────────────────────────── */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
                    <h1
                        className="text-2xl sm:text-3xl font-bold"
                        style={{ fontFamily: 'Poppins, sans-serif', color: currentTheme.foreground }}
                    >
                        Epub Novels
                    </h1>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">

                    {/* ── Search + Sort + Genres row ──────────── */}
                    <div className="mb-4 space-y-2">
                        <div className="flex gap-2">
                            {/* Search */}
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search title, author…"
                                className="flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                style={{
                                    backgroundColor: currentTheme.background,
                                    color: currentTheme.foreground,
                                    borderColor,
                                    fontFamily: 'Poppins, sans-serif',
                                }}
                            />

                            {/* Sort */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => { setShowSort(!showSort); setShowGenres(false); }}
                                    className="flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium"
                                    style={{
                                        backgroundColor: currentTheme.background,
                                        color: currentTheme.foreground,
                                        borderColor,
                                        fontFamily: 'Poppins, sans-serif',
                                    }}
                                >
                                    <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                    </svg>
                                    <span className="hidden sm:inline">{sortOptions.find(o => o.value === selectedSort)?.label ?? 'Sort'}</span>
                                    <span className="sm:hidden">Sort</span>
                                    <svg className={`w-3 h-3 opacity-50 transition-transform ${showSort ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {showSort && (
                                    <div
                                        className="absolute right-0 z-20 mt-1 w-40 rounded-lg shadow-lg border overflow-hidden"
                                        style={{ backgroundColor: currentTheme.background, borderColor }}
                                    >
                                        {sortOptions.map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => { setSelectedSort(opt.value); setShowSort(false); }}
                                                className="w-full text-left px-4 py-2.5 text-sm hover:opacity-80"
                                                style={{
                                                    backgroundColor: selectedSort === opt.value ? `${currentTheme.foreground}10` : 'transparent',
                                                    color: currentTheme.foreground,
                                                    fontFamily: 'Poppins, sans-serif',
                                                    fontWeight: selectedSort === opt.value ? 600 : 400,
                                                }}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Genres */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => { setShowGenres(!showGenres); setShowSort(false); }}
                                    className="flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium"
                                    style={{
                                        backgroundColor: currentTheme.background,
                                        color: currentTheme.foreground,
                                        borderColor,
                                        fontFamily: 'Poppins, sans-serif',
                                    }}
                                >
                                    <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    <span>Genres</span>
                                    {selectedGenres.length > 0 && (
                                        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                                            {selectedGenres.length}
                                        </span>
                                    )}
                                    <svg className={`w-3 h-3 opacity-50 transition-transform ${showGenres ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Genres panel */}
                        {showGenres && (
                            <div
                                className="rounded-lg border p-3"
                                style={{ backgroundColor: currentTheme.background, borderColor }}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold" style={{ color: currentTheme.foreground, fontFamily: 'Poppins, sans-serif' }}>
                                        Genres
                                    </span>
                                    {selectedGenres.length > 0 && (
                                        <button type="button" onClick={() => setSelectedGenres([])} className="text-xs font-medium" style={{ color: '#f59e0b' }}>
                                            Clear
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                                    {genres.map(genre => (
                                        <label key={genre.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:opacity-80" style={{ backgroundColor: selectedGenres.includes(genre.id) ? `${currentTheme.foreground}10` : 'transparent' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedGenres.includes(genre.id)}
                                                onChange={() => toggleGenre(genre.id)}
                                                className="w-3.5 h-3.5 accent-amber-500"
                                            />
                                            <span className="text-xs" style={{ color: currentTheme.foreground, fontFamily: 'Poppins, sans-serif' }}>
                                                {genre.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Type filter tabs: All / Premium / Exclusive ─ */}
                    <div className="flex items-center gap-1 mb-4">
                        {typeTabs.map(tab => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setTypeFilter(tab.key)}
                                className="px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all"
                                style={{
                                    fontFamily: 'Poppins, sans-serif',
                                    backgroundColor: typeFilter === tab.key
                                        ? tab.key === 'premium'   ? 'rgba(124,58,237,0.15)'
                                        : tab.key === 'exclusive' ? 'rgba(251,191,36,0.18)'
                                        : `${currentTheme.foreground}12`
                                        : 'transparent',
                                    color: typeFilter === tab.key
                                        ? tab.key === 'premium'   ? '#a78bfa'
                                        : tab.key === 'exclusive' ? '#d97706'
                                        : currentTheme.foreground
                                        : mutedColor,
                                    border: `1px solid ${typeFilter === tab.key
                                        ? tab.key === 'premium'   ? 'rgba(167,139,250,0.4)'
                                        : tab.key === 'exclusive' ? 'rgba(251,191,36,0.4)'
                                        : `${currentTheme.foreground}25`
                                        : 'transparent'}`,
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                        <span className="ml-auto text-xs" style={{ color: mutedColor, fontFamily: 'Poppins, sans-serif' }}>
                            {displayedSeries.length} series
                        </span>
                    </div>

                    {/* ── Table-style grid ────────────────────────── */}
                    {displayedSeries.length > 0 ? (
                        /*
                         * Inner-border-only trick:
                         * Each cell has border-top + border-left.
                         * Wrapper has overflow:hidden + grid has margin:-1px
                         * → first-row top border & first-col left border are clipped.
                         * No right/bottom borders exist, so no outer borders on those sides either.
                         * Works for any item count — no gray empty cells.
                         */
                        <div style={{ overflow: 'hidden' }}>
                        <div
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
                            style={{ margin: '-1px' }}
                        >
                            {displayedSeries.map(s => (
                                <Link
                                    key={s.id}
                                    href={route('epub-novels.show', s.slug)}
                                    className="group"
                                    style={{
                                        backgroundColor: currentTheme.background,
                                        borderTop: `1px solid ${borderColor}`,
                                        borderLeft: `1px solid ${borderColor}`,
                                    }}
                                >
                                    <div className="p-2 sm:p-3">
                                        {/* Cover */}
                                        <div className="relative mb-2">
                                            <CoverImage
                                                src={s.cover_url}
                                                alt={s.title}
                                                containerClassName="rounded-md"
                                                hoverScale={true}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md pointer-events-none" />

                                            {/* Badge stack — top-right */}
                                            <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 items-end" style={{ zIndex: 10 }}>
                                                {s.is_mature && (
                                                    <div className="group/r18 relative">
                                                        <div
                                                            className="flex items-center justify-center rounded shadow-md"
                                                            style={{ width: '1.375rem', height: '1.375rem', background: 'linear-gradient(135deg, #dc2626, #991b1b)', color: '#fff', fontSize: '0.45rem', fontWeight: 900, letterSpacing: '0.04em', fontFamily: 'Poppins, sans-serif' }}
                                                        >
                                                            18+
                                                        </div>
                                                        <div className="absolute right-0 top-full mt-1 opacity-0 group-hover/r18:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap" style={{ zIndex: 30, background: 'rgba(0,0,0,0.88)', color: '#fff', fontSize: '0.6rem', fontWeight: 600, padding: '0.18rem 0.45rem', borderRadius: '0.2rem', fontFamily: 'Poppins, sans-serif' }}>
                                                            Adult Content (R18)
                                                        </div>
                                                    </div>
                                                )}
                                                {s.free_for_premium_members ? (
                                                    <div className="group/fpm relative">
                                                        <div
                                                            className="flex items-center justify-center rounded shadow-md"
                                                            style={{ width: '1.375rem', height: '1.375rem', background: 'linear-gradient(135deg, #7c3aed, #a21caf)', color: '#fff' }}
                                                        >
                                                            <PremiumDiamond size={9} />
                                                        </div>
                                                        <div className="absolute right-0 top-full mt-1 opacity-0 group-hover/fpm:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap" style={{ zIndex: 30, background: 'rgba(0,0,0,0.88)', color: '#fff', fontSize: '0.6rem', fontWeight: 600, padding: '0.18rem 0.45rem', borderRadius: '0.2rem', fontFamily: 'Poppins, sans-serif' }}>
                                                            Free for Premium Member
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="group/excl relative">
                                                        <div
                                                            className="flex items-center justify-center rounded shadow-md"
                                                            style={{ width: '1.375rem', height: '1.375rem', background: '#fbbf24', color: '#78350f' }}
                                                        >
                                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zM5 18h14v2H5z"/>
                                                            </svg>
                                                        </div>
                                                        <div className="absolute right-0 top-full mt-1 opacity-0 group-hover/excl:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap" style={{ zIndex: 30, background: 'rgba(0,0,0,0.88)', color: '#fff', fontSize: '0.6rem', fontWeight: 600, padding: '0.18rem 0.45rem', borderRadius: '0.2rem', fontFamily: 'Poppins, sans-serif' }}>
                                                            Exclusive
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <h3
                                            className="font-semibold text-xs sm:text-sm line-clamp-2 mb-1 group-hover:opacity-75 transition-opacity"
                                            style={{ fontFamily: 'Poppins, sans-serif', color: currentTheme.foreground }}
                                        >
                                            {s.title}
                                        </h3>

                                        {/* Price */}
                                        <p
                                            className="text-sm font-bold mb-1"
                                            style={{
                                                fontFamily: 'Poppins, sans-serif',
                                                color: s.free_for_premium_members ? '#a78bfa' : '#f59e0b',
                                            }}
                                        >
                                            {s.free_for_premium_members ? 'Free' : s.price_range}
                                        </p>

                                        {/* Genres */}
                                        {s.genres.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {s.genres.slice(0, 2).map(genre => (
                                                    <span
                                                        key={genre.id}
                                                        className="px-1.5 py-0.5 rounded text-[10px]"
                                                        style={{
                                                            backgroundColor: `${currentTheme.foreground}10`,
                                                            color: mutedColor,
                                                            fontFamily: 'Poppins, sans-serif',
                                                        }}
                                                    >
                                                        {genre.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <p className="opacity-50 text-sm" style={{ color: currentTheme.foreground, fontFamily: 'Poppins, sans-serif' }}>
                                No series found
                            </p>
                        </div>
                    )}

                    {/* ── Pagination ──────────────────────────────── */}
                    {series.last_page > 1 && (
                        <div className="mt-6 flex justify-center gap-1.5 flex-wrap">
                            {Array.from({ length: series.last_page }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => router.get(route('epub-novels.index'), { ...filters, page })}
                                    className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all"
                                    style={{
                                        backgroundColor: page === series.current_page ? '#f59e0b' : `${currentTheme.foreground}10`,
                                        color: page === series.current_page ? 'white' : currentTheme.foreground,
                                        fontFamily: 'Poppins, sans-serif',
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
