import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme, SHINY_PURPLE } from '@/Contexts/ThemeContext';
import CommentSection from '@/Components/CommentSection';
import ReactionBar from '@/Components/ReactionBar';
import EyeIcon from '@/Components/Icons/EyeIcon';
import BookmarkIcon from '@/Components/Icons/BookmarkIcon';
import CommentIcon from '@/Components/Icons/CommentIcon';
import PremiumDiamond from '@/Components/PremiumDiamond';

// SVG Icons
const GridIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
    </svg>
);

const ListIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <line x1="8" y1="6" x2="21" y2="6"/>
        <line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/>
        <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
);

const SearchIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
    </svg>
);

const BookIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
);

const LockIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <circle cx="12" cy="16" r="1"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
);

const CalendarIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);

const CheckIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M20 6L9 17l-5-5"/>
    </svg>
);

const ChevronRightIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M9 18l6-6-6-6"/>
    </svg>
);

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
    volume?: number;
    is_premium: boolean;
    is_owned?: boolean;
    coin_price: number;
    created_at: string;
    views: number;
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
    views: number;
    bookmarks_count: number;
    comments_count: number;
    show_epub_button?: boolean;
    epub_series_slug?: string;
}

interface Props {
    series: Series;
    chapters: Chapter[];
    relatedSeries: Series[];
    isBookmarked?: boolean;
    auth?: {
        user?: {
            id: number;
            display_name: string;
        };
    };
}

// Format number helper
const formatNumber = (num: number): string => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toString();
};

// Sanitize HTML content to remove conflicting inline styles and preserve line breaks
const sanitizeContent = (html: string): string => {
    if (!html) return '';
    
    // Check if content has HTML tags
    const hasHTMLTags = /<[^>]+>/.test(html);
    
    if (!hasHTMLTags) {
        // For plain text content (old entries), convert line breaks to <br> tags
        return html
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('<br><br>');
    }
    
    // For HTML content, remove inline color styles that conflict with theme
    return html
        .replace(/style="[^"]*color:\s*[^;"]+;?[^"]*"/gi, (match) => {
            // Remove only color property, keep other styles
            const styleContent = match.match(/style="([^"]*)"/i)?.[1] || '';
            const filteredStyles = styleContent
                .split(';')
                .filter(style => !style.trim().startsWith('color'))
                .filter(style => style.trim().length > 0)
                .join(';');
            return filteredStyles ? `style="${filteredStyles}"` : '';
        })
        .replace(/color:\s*[^;"]+;?/gi, ''); // Remove any remaining color declarations
};

function SeriesShowContent({ series, chapters, relatedSeries, isBookmarked = false, auth }: Props) {
    const { currentTheme } = useTheme();
    const [showAllChapters, setShowAllChapters] = useState(false);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [bookmarked, setBookmarked] = useState(isBookmarked);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    
    // New states for enhanced chapter management
    const [viewMode, setViewMode] = useState<'detailed' | 'simple'>('detailed');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Load preferences from localStorage
    useEffect(() => {
        const savedViewMode = localStorage.getItem('series-view-mode') as 'detailed' | 'simple';
        
        if (savedViewMode && ['detailed', 'simple'].includes(savedViewMode)) {
            setViewMode(savedViewMode);
        }
    }, []);

    // Save preferences to localStorage
    const updateViewMode = (mode: 'detailed' | 'simple') => {
        setViewMode(mode);
        localStorage.setItem('series-view-mode', mode);
    };

    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            const isMobileSize = window.innerWidth < 768;
            setIsMobile(isMobileSize);
            if (isMobileSize) {
                setViewMode('simple');
            }
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Filter chapters by search query
    const filteredChapters = chapters.filter(chapter => {
        if (!searchQuery) return true;
        const chapterDisplay = chapter.volume 
            ? `Vol ${chapter.volume} Ch ${chapter.chapter_number}`
            : `Chapter ${chapter.chapter_number}`;
        return chapterDisplay.toLowerCase().includes(searchQuery.toLowerCase()) ||
               chapter.chapter_number.toString().includes(searchQuery);
    });

    // Sort chapters
    const sortedChapters = [...filteredChapters].sort((a, b) => {
        // Sort by volume first (if exists), then by chapter number
        if (a.volume && b.volume) {
            const volumeDiff = a.volume - b.volume;
            if (volumeDiff !== 0) {
                return sortOrder === 'asc' ? volumeDiff : -volumeDiff;
            }
        } else if (a.volume && !b.volume) {
            return sortOrder === 'asc' ? -1 : 1;
        } else if (!a.volume && b.volume) {
            return sortOrder === 'asc' ? 1 : -1;
        }
        
        const chapterDiff = a.chapter_number - b.chapter_number;
        return sortOrder === 'asc' ? chapterDiff : -chapterDiff;
    });

    // Display all sorted chapters (no pagination)
    const displayedChapters = sortedChapters;

    const handleBookmarkToggle = async () => {
        // Check if user is logged in first - Show message instead of redirect
        if (!auth?.user) {
            setNotificationMessage('Please log in to bookmark this series');
            setShowNotification(true);
            setTimeout(() => {
                setShowNotification(false);
            }, 3000);
            return;
        }

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
            } else {
                // Handle error responses from server
                const errorData = await response.json().catch(() => ({}));
                setNotificationMessage(errorData.message || 'An error occurred. Please try again.');
                setShowNotification(true);
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
            
            <div 
                className="min-h-screen"
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
                                    <div className="aspect-[3/4] relative mb-4">
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
                                    
                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-3">
                                        <Link
                                            href={route('chapters.show', [series.slug, 1])}
                                            className="px-6 py-3 rounded-lg font-medium transition-all interactive-scale text-center"
                                            style={{
                                                backgroundColor: currentTheme.foreground,
                                                color: currentTheme.background
                                            }}
                                        >
                                            Read First Chapter
                                        </Link>
                                        
                                        {/* Epub Download Button */}
                                        {series.show_epub_button && series.epub_series_slug && (
                                            <Link
                                                href={route('epub-novels.show', series.epub_series_slug)}
                                                className="px-6 py-3 border rounded-lg text-sm font-medium transition-all interactive-scale flex items-center justify-center gap-2"
                                                style={{
                                                    borderColor: currentTheme.foreground,
                                                    color: currentTheme.foreground,
                                                    backgroundColor: `${currentTheme.foreground}05`
                                                }}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                Download Epub
                                            </Link>
                                        )}
                                        
                                        <button 
                                            className="px-6 py-3 border rounded-lg font-medium transition-all interactive-scale flex items-center justify-center gap-2"
                                            style={{
                                                borderColor: bookmarked ? currentTheme.foreground : `${currentTheme.foreground}30`,
                                                color: currentTheme.foreground,
                                                backgroundColor: bookmarked ? `${currentTheme.foreground}10` : 'transparent'
                                            }}
                                            onClick={handleBookmarkToggle}
                                        >
                                            <svg className="w-5 h-5" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                            </svg>
                                            {bookmarked ? 'Bookmarked' : 'Bookmark'}
                                        </button>
                                        
                                        {/* Counters */}
                                        <div 
                                            className="flex items-center justify-center gap-3 px-4 py-2"
                                            style={{
                                                color: `${currentTheme.foreground}60`
                                            }}
                                        >
                                            {/* Bookmark Counter */}
                                            <div className="flex items-center gap-1.5">
                                                <BookmarkIcon className="w-4 h-4" />
                                                <span className="text-sm font-medium">{formatNumber(series.bookmarks_count)}</span>
                                            </div>
                                            
                                            <span className="text-xs">•</span>
                                            
                                            {/* View Counter */}
                                            <div className="flex items-center gap-1.5">
                                                <EyeIcon className="w-4 h-4" />
                                                <span className="text-sm font-medium">{formatNumber(series.views)}</span>
                                            </div>
                                            
                                            <span className="text-xs">•</span>
                                            
                                            {/* Comment Counter */}
                                            <div className="flex items-center gap-1.5">
                                                <CommentIcon className="w-4 h-4" />
                                                <span className="text-sm font-medium">{formatNumber(series.comments_count)}</span>
                                            </div>
                                        </div>
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
                                        <div className="prose max-w-none relative">
                                            <div 
                                                className={`leading-relaxed transition-all duration-300 ${
                                                    isExpanded ? '' : (series.show_epub_button ? 'line-clamp-8' : 'line-clamp-4') + ' overflow-hidden'
                                                }`}
                                                style={{ 
                                                    color: `${currentTheme.foreground}90`
                                                }}
                                                dangerouslySetInnerHTML={{
                                                    __html: sanitizeContent(series.synopsis) || 'No synopsis available.'
                                                }}
                                            />
                                            
                                            {/* Expand/Collapse Button with Gradient */}
                                            {(series.synopsis && series.synopsis.length > (series.show_epub_button ? 400 : 200)) && (
                                                <div className="relative">
                                                    {!isExpanded && (
                                                        <div 
                                                            className="absolute bottom-8 left-0 right-0 h-16 pointer-events-none"
                                                            style={{
                                                                background: `linear-gradient(to bottom, transparent, ${currentTheme.background})`
                                                            }}
                                                        />
                                                    )}
                                                    <button
                                                        onClick={() => setIsExpanded(!isExpanded)}
                                                        className="w-full mt-2 py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                                                        style={{
                                                            background: `linear-gradient(to bottom, transparent, ${currentTheme.background})`,
                                                            color: `${currentTheme.foreground}80`,
                                                            border: 'none'
                                                        }}
                                                    >
                                                        <span className="text-sm font-medium">
                                                            {isExpanded ? 'Show Less' : 'Show More'}
                                                        </span>
                                                        <svg 
                                                            className={`w-4 h-4 transition-transform duration-200 ${
                                                                isExpanded ? 'rotate-180' : ''
                                                            }`} 
                                                            fill="none" 
                                                            stroke="currentColor" 
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
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
                                                Chapters ({filteredChapters.length})
                                            </h2>
                                            <div className="flex items-center gap-3">
                                                {/* Search Bar */}
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Search chapter..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="px-3 py-2 pr-8 border rounded-lg focus:ring-2 transition-colors text-sm w-40"
                                                        style={{
                                                            backgroundColor: currentTheme.background,
                                                            borderColor: `${currentTheme.foreground}30`,
                                                            color: currentTheme.foreground
                                                        }}
                                                    />
                                                    <div className="absolute right-2 top-2.5 opacity-40">
                                                        <SearchIcon size={16} color={currentTheme.foreground} />
                                                    </div>
                                                </div>

                                                {/* View Mode Toggle - Hidden on Mobile */}
                                                {!isMobile && (
                                                    <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: `${currentTheme.foreground}30` }}>
                                                        <button
                                                            onClick={() => updateViewMode('detailed')}
                                                            className={`px-3 py-2 text-sm transition-colors flex items-center gap-2 ${viewMode === 'detailed' ? 'font-medium' : ''}`}
                                                            style={{
                                                                backgroundColor: viewMode === 'detailed' ? currentTheme.foreground : 'transparent',
                                                                color: viewMode === 'detailed' ? currentTheme.background : currentTheme.foreground
                                                            }}
                                                        >
                                                            <ListIcon size={14} color={viewMode === 'detailed' ? currentTheme.background : currentTheme.foreground} />
                                                            Detailed
                                                        </button>
                                                        <button
                                                            onClick={() => updateViewMode('simple')}
                                                            className={`px-3 py-2 text-sm transition-colors flex items-center gap-2 ${viewMode === 'simple' ? 'font-medium' : ''}`}
                                                            style={{
                                                                backgroundColor: viewMode === 'simple' ? currentTheme.foreground : 'transparent',
                                                                color: viewMode === 'simple' ? currentTheme.background : currentTheme.foreground
                                                            }}
                                                        >
                                                            <GridIcon size={14} color={viewMode === 'simple' ? currentTheme.background : currentTheme.foreground} />
                                                            Simple
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Sort Dropdown */}
                                                <select
                                                    value={sortOrder}
                                                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                                                    className="px-3 py-2 border rounded-lg focus:ring-2 transition-colors text-sm"
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

                                    {/* Chapter Content - Conditional Based on View Mode */}
                                    {viewMode === 'detailed' ? (
                                        /* Detailed Mode - List View with Scrolling */
                                        <div 
                                            style={{ 
                                                borderTopColor: `${currentTheme.foreground}20`,
                                                maxHeight: 'calc(100vh - 300px)',
                                                minHeight: '600px'
                                            }} 
                                            className="divide-y overflow-y-auto"
                                        >
                                            {displayedChapters.map((chapter) => (
                                                <Link
                                                    key={chapter.id}
                                                    href={route('chapters.show', [series.slug, chapter.chapter_number])}
                                                    className="block p-4 transition-all chapter-item rounded-lg"
                                                    style={{ borderBottomColor: `${currentTheme.foreground}10` }}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <span 
                                                                    className="text-sm font-medium"
                                                                    style={{ color: `${currentTheme.foreground}70` }}
                                                                >
                                                                    {chapter.volume 
                                                                        ? `Vol ${chapter.volume} Ch ${chapter.chapter_number}`
                                                                        : `Chapter ${chapter.chapter_number}`
                                                                    }
                                                                </span>
                                                                <h3 
                                                                    className="font-medium flex-1"
                                                                    style={{ color: currentTheme.foreground }}
                                                                >
                                                                    {chapter.title}
                                                                </h3>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex items-center gap-1">
                                                                        <CalendarIcon size={12} color={`${currentTheme.foreground}60`} />
                                                                        <span 
                                                                            className="text-sm"
                                                                            style={{ color: `${currentTheme.foreground}60` }}
                                                                        >
                                                                            {formatDate(chapter.created_at)}
                                                                        </span>
                                                                    </div>
                                                                    {chapter.is_premium && (
                                                                        <span 
                                                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full"
                                                                            style={{
                                                                                backgroundColor: `${SHINY_PURPLE}15`,
                                                                                color: SHINY_PURPLE
                                                                            }}
                                                                        >
                                                                            <PremiumDiamond size={14} />
                                                                            <span className="font-semibold">Premium</span>
                                                                        </span>
                                                                    )}
                                                                    {chapter.is_owned && (
                                                                        <span 
                                                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full"
                                                                            style={{
                                                                                backgroundColor: '#d1fae5',
                                                                                color: '#059669'
                                                                            }}
                                                                        >
                                                                            <CheckIcon size={12} color="#059669" />
                                                                            Owned
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {/* View Counter - Aligned Right */}
                                                                <div className="flex items-center gap-1" style={{ color: `${currentTheme.foreground}60` }}>
                                                                    <EyeIcon className="w-3 h-3" />
                                                                    <span className="text-xs">{formatNumber(chapter.views)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center" style={{ color: `${currentTheme.foreground}40` }}>
                                                            <ChevronRightIcon size={20} color={`${currentTheme.foreground}40`} />
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        /* Simple Mode - Card Grid with Scrolling */
                                        <div 
                                            className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} overflow-y-auto`}
                                            style={{
                                                maxHeight: 'calc(100vh - 300px)',
                                                minHeight: '600px'
                                            }}
                                        >
                                            {displayedChapters.map((chapter) => (
                                                <Link
                                                    key={chapter.id}
                                                    href={route('chapters.show', [series.slug, chapter.chapter_number])}
                                                    className="block p-4 border rounded-lg transition-all hover:shadow-md hover:border-opacity-60"
                                                    style={{ 
                                                        borderColor: `${currentTheme.foreground}20`,
                                                        backgroundColor: currentTheme.background 
                                                    }}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            {/* Chapter Number and Premium Badge in same row */}
                                                            <div className="flex items-center justify-between mb-3">
                                                                <h3 
                                                                    className="font-semibold text-sm"
                                                                    style={{ color: currentTheme.foreground }}
                                                                >
                                                                    {chapter.volume 
                                                                        ? `Vol ${chapter.volume} Ch ${chapter.chapter_number}`
                                                                        : `Chapter ${chapter.chapter_number}`
                                                                    }
                                                                </h3>
                                                                {chapter.is_premium && (
                                                                    <span 
                                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full"
                                                                        style={{
                                                                            backgroundColor: `${SHINY_PURPLE}15`,
                                                                            color: SHINY_PURPLE
                                                                        }}
                                                                    >
                                                                        <PremiumDiamond size={14} />
                                                                        <span className="font-semibold">Premium</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Date, View Counter, and Owned Badge */}
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex items-center gap-1 text-xs" style={{ color: `${currentTheme.foreground}60` }}>
                                                                        <CalendarIcon size={12} color={`${currentTheme.foreground}60`} />
                                                                        {formatDate(chapter.created_at)}
                                                                    </div>
                                                                    {chapter.is_owned && (
                                                                        <span 
                                                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full"
                                                                            style={{
                                                                                backgroundColor: '#d1fae5',
                                                                                color: '#059669'
                                                                            }}
                                                                        >
                                                                            <CheckIcon size={12} color="#059669" />
                                                                            Owned
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {/* View Counter - Aligned Right */}
                                                                <div className="flex items-center gap-1 text-xs" style={{ color: `${currentTheme.foreground}60` }}>
                                                                    <EyeIcon className="w-3 h-3" />
                                                                    {formatNumber(chapter.views)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center ml-3" style={{ color: `${currentTheme.foreground}40` }}>
                                                            <ChevronRightIcon size={16} color={`${currentTheme.foreground}40`} />
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    {/* No Results */}
                                    {filteredChapters.length === 0 && (
                                        <div className="text-center py-12">
                                            <div className="mb-4 flex justify-center">
                                                <BookIcon size={48} color={`${currentTheme.foreground}60`} />
                                            </div>
                                            <p className="text-lg" style={{ color: currentTheme.foreground }}>
                                                {searchQuery ? 'No chapters found' : 'No chapters available'}
                                            </p>
                                            {searchQuery && (
                                                <p className="text-sm mt-2" style={{ color: `${currentTheme.foreground}60` }}>
                                                    Try adjusting your search terms
                                                </p>
                                            )}
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
                                                    className="flex gap-3 p-2 rounded-lg transition-all recommendation-card"
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

                        {/* Reactions Section */}
                        <div className="mt-8">
                            <div 
                                className="rounded-lg border p-8 text-center"
                                style={{
                                    backgroundColor: currentTheme.background,
                                    borderColor: `${currentTheme.foreground}20`
                                }}
                            >
                                <h3 
                                    className="text-2xl font-bold mb-6"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    How do you feel about this series?
                                </h3>
                                <ReactionBar
                                    reactableType="series"
                                    reactableId={series.id}
                                    isAuthenticated={!!auth?.user}
                                    size="large"
                                />
                            </div>
                        </div>

                        {/* Comment Section */}
                        <div className="mt-8">
                            <CommentSection
                                commentableType="series"
                                commentableId={series.id}
                                isAuthenticated={!!auth?.user}
                                currentUserId={auth?.user?.id}
                            />
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
