import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme, SHINY_PURPLE } from '@/Contexts/ThemeContext';
import CoverImage from '@/Components/CoverImage';
import CommentSectionSkeleton from '@/Components/CommentSectionSkeleton';
const CommentSection = lazy(() => import('@/Components/CommentSection'));
const ReactionBar = lazy(() => import('@/Components/ReactionBar'));
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
    chapter_link: string;
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
    alternative_title?: string;
    author: string;
    artist?: string;
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
    is_mature?: boolean;
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
    
    // Age verification modal state
    const [showAgeModal, setShowAgeModal] = useState(false);
    const [ageVerified, setAgeVerified] = useState(false);
    
    // New states for enhanced chapter management
    const [viewMode, setViewMode] = useState<'detailed' | 'simple'>('detailed');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check age verification on mount
    useEffect(() => {
        if (series.is_mature) {
            const verified = localStorage.getItem(`age_verified_${series.id}`);
            if (verified === 'true') {
                setAgeVerified(true);
            } else {
                setShowAgeModal(true);
            }
        } else {
            setAgeVerified(true);
        }
    }, [series.id, series.is_mature]);

    // Handle age verification
    const handleAgeVerification = (confirmed: boolean) => {
        if (confirmed) {
            localStorage.setItem(`age_verified_${series.id}`, 'true');
            setAgeVerified(true);
            setShowAgeModal(false);
        } else {
            // Redirect to home page if user clicks "No"
            router.visit('/');
        }
    };

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
            ? `Volume ${chapter.volume}`
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

    // Build meta description from synopsis (strip HTML, truncate to 160 chars)
    const metaDescription = (() => {
        const stripped = series.synopsis
            ? series.synopsis.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
            : '';
        return stripped.length > 160 ? stripped.substring(0, 157) + '...' : stripped;
    })();

    const ogTitle = `${series.title} - VeiNovel`;
    const ogImage = series.cover_url || 'https://veinovel.com/images/og-default.jpg';

    return (
        <>
            <Head title={series.title}>
                <meta name="description" content={metaDescription} />
                <meta property="og:title" content={ogTitle} />
                <meta property="og:description" content={metaDescription} />
                <meta property="og:image" content={ogImage} />
                <meta property="og:type" content="book" />
                <meta property="og:url" content={route('series.show', series.slug)} />
                <meta property="og:site_name" content="VeiNovel" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={ogTitle} />
                <meta name="twitter:description" content={metaDescription} />
                <meta name="twitter:image" content={ogImage} />
            </Head>

            {/* Age Verification Modal */}
            {showAgeModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ 
                        backdropFilter: 'blur(8px)',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)'
                    }}
                >
                    <div 
                        className="rounded-lg shadow-2xl max-w-md w-full p-8 text-center"
                        style={{ 
                            backgroundColor: currentTheme.background,
                            borderColor: '#dc2626',
                            borderWidth: '2px'
                        }}
                    >
                        <div className="mb-6">
                            {/* Age Restriction Icon */}
                            <div className="mb-4 flex justify-center">
                                <svg 
                                    width="80" 
                                    height="80" 
                                    viewBox="0 0 24 28" 
                                    fill="none" 
                                    stroke="#dc2626"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    {/* Shield outline */}
                                    <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
                                    {/* Warning exclamation mark */}
                                    <line x1="12" y1="8" x2="12" y2="13" strokeWidth="2.5"/>
                                    <circle cx="12" cy="16" r="1" fill="#dc2626"/>
                                </svg>
                            </div>
                            <h2 
                                className="text-2xl font-bold mb-3"
                                style={{ color: currentTheme.foreground }}
                            >
                                Age-Restricted Content
                            </h2>
                            <p 
                                className="text-sm mb-4"
                                style={{ color: `${currentTheme.foreground}90` }}
                            >
                                This series may contain strong language, violence, or mature themes. It is not suitable for individuals under 18.
                            </p>
                            <p 
                                className="text-lg font-semibold"
                                style={{ color: currentTheme.foreground }}
                            >
                                Are you over 18?
                            </p>
                        </div>
                        
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => handleAgeVerification(false)}
                                className="px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
                                style={{ 
                                    backgroundColor: currentTheme.foreground,
                                    color: currentTheme.background,
                                }}
                            >
                                No
                            </button>
                            <button
                                onClick={() => handleAgeVerification(true)}
                                className="px-8 py-3 rounded-lg font-semibold border-2 transition-all transform hover:scale-105"
                                style={{ 
                                    borderColor: currentTheme.foreground,
                                    color: currentTheme.foreground,
                                    backgroundColor: 'transparent'
                                }}
                            >
                                Yes, I am
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content - only show if age verified */}
            {ageVerified && (
            <div 
                className="min-h-screen"
                style={{ backgroundColor: currentTheme.background }}
            >
                {/* ─── Cinematic Hero Banner ─── */}
                <div className="relative w-full overflow-hidden">
                    {/* Blurred background cover */}
                    {series.cover_url && (
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                                backgroundImage: `url(${series.cover_url})`,
                                transform: 'scale(1.2)',
                                filter: 'blur(3px)',
                            }}
                        />
                    )}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: isMobile
                                ? `linear-gradient(to top, ${currentTheme.background} 0%, ${currentTheme.background}CC 30%, ${currentTheme.background}55 70%, transparent 100%)`
                                : `linear-gradient(90deg, ${currentTheme.background} 0%, ${currentTheme.background}E6 30%, ${currentTheme.background}99 60%, ${currentTheme.background}66 100%)`,
                        }}
                    />
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `linear-gradient(to top, ${currentTheme.background} 0%, transparent 50%)`,
                        }}
                    />

                    <div className="relative z-10 w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8 sm:py-12">
                        {/* Breadcrumb */}
                        <nav className="mb-6">
                            <div className="flex items-center space-x-2 text-sm">
                                <Link 
                                    href={route('home')} 
                                    className="hover:opacity-70 transition-opacity"
                                    style={{ color: `${currentTheme.foreground}90` }}
                                >
                                    Home
                                </Link>
                                <span style={{ color: `${currentTheme.foreground}40` }}>›</span>
                                <Link 
                                    href={route('explore')} 
                                    className="hover:opacity-70 transition-opacity"
                                    style={{ color: `${currentTheme.foreground}90` }}
                                >
                                    Explore
                                </Link>
                                <span style={{ color: `${currentTheme.foreground}40` }}>›</span>
                                <span className="truncate max-w-[200px] sm:max-w-none" style={{ color: `${currentTheme.foreground}60` }}>{series.title}</span>
                            </div>
                        </nav>

                        {/* Series Info Hero */}
                        <div className="flex flex-col md:flex-row gap-6 lg:gap-10">
                            {/* Cover Image + Action Buttons (below cover) */}
                            <div className="flex-shrink-0 flex flex-col items-center md:items-start w-full md:w-auto">
                                <div className="w-full sm:w-52 md:w-56 relative">
                                    <div
                                        className="relative rounded-2xl overflow-hidden shadow-2xl"
                                        style={{ boxShadow: `0 25px 60px ${currentTheme.foreground}20` }}
                                    >
                                        <CoverImage
                                            src={series.cover_url}
                                            alt={series.title}
                                            hoverScale={false}
                                        />
                                        {/* Shine overlay */}
                                        <div
                                            className="absolute inset-0 opacity-20 pointer-events-none"
                                            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 40%)' }}
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons - Below Cover */}
                                <div className="w-full sm:w-52 md:w-56 mt-4 flex flex-col gap-2.5">
                                    <Link
                                        href={route('chapters.show', [series.slug, '1'])}
                                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all hover:opacity-90 hover:shadow-lg text-sm"
                                        style={{
                                            backgroundColor: currentTheme.foreground,
                                            color: currentTheme.background,
                                        }}
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
                                        </svg>
                                        Read First Chapter
                                    </Link>

                                    {series.show_epub_button && series.epub_series_slug && (
                                        <Link
                                            href={route('epub-novels.show', series.epub_series_slug)}
                                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                                            style={{
                                                borderColor: `${currentTheme.foreground}30`,
                                                color: currentTheme.foreground,
                                                backgroundColor: `${currentTheme.foreground}06`,
                                            }}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Download Epub
                                        </Link>
                                    )}

                                    <button 
                                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border rounded-xl font-semibold transition-all hover:opacity-80 text-sm"
                                        style={{
                                            borderColor: bookmarked ? currentTheme.foreground : `${currentTheme.foreground}30`,
                                            color: currentTheme.foreground,
                                            backgroundColor: bookmarked ? `${currentTheme.foreground}10` : `${currentTheme.foreground}06`,
                                        }}
                                        onClick={handleBookmarkToggle}
                                    >
                                        <svg className="w-4 h-4" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                        </svg>
                                        {bookmarked ? 'Bookmarked' : 'Bookmark'}
                                    </button>

                                    {/* Stat counters */}
                                    <div 
                                        className="flex items-center justify-center gap-3 text-xs mt-1"
                                        style={{ color: `${currentTheme.foreground}55` }}
                                    >
                                        <div className="flex items-center gap-1">
                                            <BookmarkIcon className="w-3.5 h-3.5" />
                                            <span className="font-medium">{formatNumber(series.bookmarks_count)}</span>
                                        </div>
                                        <span>•</span>
                                        <div className="flex items-center gap-1">
                                            <EyeIcon className="w-3.5 h-3.5" />
                                            <span className="font-medium">{formatNumber(series.views)}</span>
                                        </div>
                                        <span>•</span>
                                        <div className="flex items-center gap-1">
                                            <CommentIcon className="w-3.5 h-3.5" />
                                            <span className="font-medium">{formatNumber(series.comments_count)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Series Details + Synopsis */}
                            <div className="flex-1 min-w-0">
                                <h1 
                                    className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2 leading-tight"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    {series.title}
                                </h1>
                                {series.alternative_title && (
                                    <p 
                                        className="text-base sm:text-lg mb-3"
                                        style={{ color: `${currentTheme.foreground}70` }}
                                    >
                                        {series.alternative_title}
                                    </p>
                                )}
                                <p 
                                    className="text-sm sm:text-base mb-4"
                                    style={{ color: `${currentTheme.foreground}70` }}
                                >
                                    Author: {series.author}
                                    {series.artist && (
                                        <>
                                            <span className="mx-3 opacity-30">|</span>
                                            Artist: {series.artist}
                                        </>
                                    )}
                                </p>
                                
                                {/* Status / Rating / Chapters / Language */}
                                <div className="flex flex-wrap items-center gap-3 mb-5">
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${getStatusColor(series.status)}`}>
                                        {series.status}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-yellow-400 text-lg">★</span>
                                        <span className="font-semibold" style={{ color: currentTheme.foreground }}>
                                            {series.rating || 'N/A'}
                                        </span>
                                    </div>
                                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: `${currentTheme.foreground}30` }} />
                                    <span className="text-sm" style={{ color: `${currentTheme.foreground}70` }}>
                                        {series.chapters_count} chapters
                                    </span>
                                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: `${currentTheme.foreground}30` }} />
                                    <span className="text-sm" style={{ color: `${currentTheme.foreground}70` }}>
                                        {series.native_language.name}
                                    </span>
                                </div>

                                {/* Genre Pills */}
                                <div className="flex flex-wrap gap-2 mb-5">
                                    {series.genres.map((genre) => (
                                        <span
                                            key={genre.id}
                                            className="px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider"
                                            style={{
                                                backgroundColor: `${currentTheme.foreground}10`,
                                                color: `${currentTheme.foreground}80`,
                                                border: `1px solid ${currentTheme.foreground}12`,
                                            }}
                                        >
                                            {genre.name}
                                        </span>
                                    ))}
                                </div>

                                {/* ─── Synopsis (inline) ─── */}
                                <div 
                                    className="pt-4 mt-1"
                                    style={{ borderTop: `1px solid ${currentTheme.foreground}10` }}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-1 h-5 rounded-full" style={{ backgroundColor: currentTheme.foreground }} />
                                        <h3 className="text-base font-bold" style={{ color: currentTheme.foreground }}>
                                            Synopsis
                                        </h3>
                                    </div>
                                    <div className="prose max-w-none relative">
                                        <div 
                                            className={`leading-relaxed text-sm sm:text-base transition-all duration-300 ${
                                                isExpanded ? '' : (series.show_epub_button ? 'line-clamp-8' : 'line-clamp-4') + ' overflow-hidden'
                                            }`}
                                            style={{ color: `${currentTheme.foreground}80` }}
                                            dangerouslySetInnerHTML={{
                                                __html: sanitizeContent(series.synopsis) || 'No synopsis available.'
                                            }}
                                        />
                                        
                                        {(series.synopsis && series.synopsis.length > (series.show_epub_button ? 400 : 200)) && (
                                            <div className="relative">
                                                {!isExpanded && (
                                                    <div 
                                                        className="absolute bottom-8 left-0 right-0 h-16 pointer-events-none"
                                                        style={{
                                                            background: `linear-gradient(to bottom, transparent, ${currentTheme.background}00)`
                                                        }}
                                                    />
                                                )}
                                                <button
                                                    onClick={() => setIsExpanded(!isExpanded)}
                                                    className="mt-2 py-1.5 px-4 rounded-lg transition-all duration-200 flex items-center gap-2"
                                                    style={{ color: `${currentTheme.foreground}70` }}
                                                >
                                                    <span className="text-sm font-medium">
                                                        {isExpanded ? 'Show Less' : 'Show More'}
                                                    </span>
                                                    <svg 
                                                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                                                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
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
                </div>

                {/* ─── Two Column: Chapters + Related ─── */}
                <section className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 pb-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* ── Chapter List ── */}
                        <div className="lg:col-span-2 flex flex-col">
                            <div
                                className="rounded-2xl overflow-hidden flex flex-col"
                                style={{
                                    height: isMobile ? 'auto' : '680px',
                                    backgroundColor: `${currentTheme.foreground}04`,
                                    border: `1px solid ${currentTheme.foreground}08`,
                                }}
                            >
                                {/* Header */}
                                <div
                                    className="flex-shrink-0 px-5 py-4"
                                    style={{
                                        background: `linear-gradient(135deg, ${currentTheme.foreground}06 0%, ${currentTheme.foreground}02 100%)`,
                                        borderBottom: `1px solid ${currentTheme.foreground}08`,
                                    }}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <div
                                                className="w-1 h-6 rounded-full"
                                                style={{ background: `linear-gradient(to bottom, ${SHINY_PURPLE}, ${SHINY_PURPLE}60)` }}
                                            />
                                            <h2 className="text-lg font-bold" style={{ color: currentTheme.foreground }}>
                                                Chapters
                                            </h2>
                                            <span
                                                className="px-2 py-0.5 rounded-full text-xs font-bold"
                                                style={{ backgroundColor: `${SHINY_PURPLE}18`, color: SHINY_PURPLE }}
                                            >
                                                {filteredChapters.length}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Search */}
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Search chapter..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="px-3 py-1.5 pr-8 rounded-lg text-xs w-36 focus:outline-none"
                                                    style={{
                                                        backgroundColor: `${currentTheme.foreground}06`,
                                                        border: `1px solid ${currentTheme.foreground}10`,
                                                        color: currentTheme.foreground,
                                                    }}
                                                />
                                                <div className="absolute right-2 top-1.5 opacity-35">
                                                    <SearchIcon size={14} color={currentTheme.foreground} />
                                                </div>
                                            </div>
                                            {/* View Mode — desktop only */}
                                            {!isMobile && (
                                                <div
                                                    className="flex rounded-lg overflow-hidden"
                                                    style={{ border: `1px solid ${currentTheme.foreground}10` }}
                                                >
                                                    {(['detailed', 'simple'] as const).map((mode) => (
                                                        <button
                                                            key={mode}
                                                            onClick={() => updateViewMode(mode)}
                                                            className="px-2.5 py-1.5 text-xs transition-colors flex items-center gap-1.5"
                                                            style={{
                                                                backgroundColor: viewMode === mode ? currentTheme.foreground : 'transparent',
                                                                color: viewMode === mode ? currentTheme.background : `${currentTheme.foreground}60`,
                                                            }}
                                                        >
                                                            {mode === 'detailed'
                                                                ? <ListIcon size={12} color={viewMode === mode ? currentTheme.background : `${currentTheme.foreground}60`} />
                                                                : <GridIcon size={12} color={viewMode === mode ? currentTheme.background : `${currentTheme.foreground}60`} />
                                                            }
                                                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Sort */}
                                            <select
                                                value={sortOrder}
                                                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                                                className="rounded-lg text-xs"
                                                style={{
                                                    backgroundColor: `${currentTheme.foreground}06`,
                                                    border: `1px solid ${currentTheme.foreground}10`,
                                                    color: currentTheme.foreground,
                                                    padding: '6px 2rem 6px 10px',
                                                    appearance: 'none' as any,
                                                    colorScheme: (() => { try { const h = currentTheme.background.replace(/^#/, ''); return (parseInt(h.slice(0,2),16)*.299+parseInt(h.slice(2,4),16)*.587+parseInt(h.slice(4,6),16)*.114) > 128 ? 'light' : 'dark'; } catch { return 'dark'; } })() as any,
                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(currentTheme.foreground)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
                                                    backgroundRepeat: 'no-repeat',
                                                    backgroundPosition: 'right 8px center',
                                                }}
                                            >
                                                <option value="asc" style={{ background: currentTheme.background, color: currentTheme.foreground }}>Oldest First</option>
                                                <option value="desc" style={{ background: currentTheme.background, color: currentTheme.foreground }}>Newest First</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Chapter Content */}
                                {viewMode === 'detailed' ? (
                                    <div
                                        className="flex-1 overflow-y-auto themed-scrollbar"
                                        style={{
                                            maxHeight: isMobile ? '70vh' : undefined,
                                            '--scrollbar-thumb': `${currentTheme.foreground}20`,
                                            '--scrollbar-thumb-hover': `${currentTheme.foreground}35`,
                                            '--scrollbar-track': 'transparent',
                                        } as React.CSSProperties}
                                    >
                                        {displayedChapters.map((chapter) => (
                                            <Link
                                                key={chapter.id}
                                                href={route('chapters.show', [series.slug, chapter.chapter_link])}
                                                className="flex items-center gap-0 transition-all duration-150 group"
                                                style={{ borderBottom: `1px solid ${currentTheme.foreground}06` }}
                                            >
                                                {/* Premium left border indicator */}
                                                <div
                                                    className="w-0.5 self-stretch flex-shrink-0 transition-all duration-150"
                                                    style={{
                                                        backgroundColor: chapter.is_premium ? `${SHINY_PURPLE}60` : 'transparent',
                                                    }}
                                                />
                                                <div
                                                    className="flex-1 flex items-center gap-3 px-4 py-3.5 transition-colors duration-150"
                                                    style={{
                                                        backgroundColor: chapter.is_premium
                                                            ? `${SHINY_PURPLE}04`
                                                            : 'transparent',
                                                    }}
                                                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = `${SHINY_PURPLE}08`; }}
                                                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = chapter.is_premium ? `${SHINY_PURPLE}04` : 'transparent'; }}
                                                >
                                                    {/* Chapter number chip */}
                                                    <span
                                                        className="text-xs font-bold w-9 text-center flex-shrink-0 py-1 rounded-md"
                                                        style={{
                                                            backgroundColor: chapter.is_premium ? `${SHINY_PURPLE}15` : `${currentTheme.foreground}08`,
                                                            color: chapter.is_premium ? SHINY_PURPLE : `${currentTheme.foreground}60`,
                                                        }}
                                                    >
                                                        {chapter.volume ? `V${chapter.volume}` : `${chapter.chapter_number}`}
                                                    </span>
                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <p className="text-sm font-medium truncate" style={{ color: currentTheme.foreground }}>
                                                                {chapter.title || (chapter.volume ? `Volume ${chapter.volume}` : `Chapter ${chapter.chapter_number}`)}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-xs flex items-center gap-1" style={{ color: `${currentTheme.foreground}45` }}>
                                                                <CalendarIcon size={11} color={`${currentTheme.foreground}45`} />
                                                                {formatDate(chapter.created_at)}
                                                            </span>
                                                            <span className="text-xs flex items-center gap-1" style={{ color: `${currentTheme.foreground}45` }}>
                                                                <EyeIcon className="w-3 h-3" />
                                                                {formatNumber(chapter.views)}
                                                            </span>
                                                            {chapter.is_premium && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full" style={{ backgroundColor: `${SHINY_PURPLE}18`, color: SHINY_PURPLE }}>
                                                                    <PremiumDiamond size={10} />
                                                                    Premium
                                                                </span>
                                                            )}
                                                            {chapter.is_owned && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full" style={{ backgroundColor: 'rgba(234,179,8,0.12)', color: '#eab308' }}>
                                                                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                                    Owned
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <ChevronRightIcon size={15} color={`${currentTheme.foreground}25`} />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div
                                        className={`flex-1 overflow-y-auto themed-scrollbar grid gap-2.5 p-4 content-start ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}
                                        style={{
                                            maxHeight: isMobile ? '70vh' : undefined,
                                            '--scrollbar-thumb': `${currentTheme.foreground}20`,
                                            '--scrollbar-thumb-hover': `${currentTheme.foreground}35`,
                                            '--scrollbar-track': 'transparent',
                                        } as React.CSSProperties}
                                    >
                                        {displayedChapters.map((chapter) => (
                                            <Link
                                                key={chapter.id}
                                                href={route('chapters.show', [series.slug, chapter.chapter_link])}
                                                className="flex items-center gap-3 p-3 rounded-xl transition-all duration-150 hover:shadow-sm group"
                                                style={{
                                                    border: `1px solid ${chapter.is_premium ? `${SHINY_PURPLE}20` : `${currentTheme.foreground}08`}`,
                                                    backgroundColor: chapter.is_premium ? `${SHINY_PURPLE}04` : `${currentTheme.foreground}03`,
                                                }}
                                            >
                                                {/* Number badge */}
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                                                    style={{
                                                        backgroundColor: chapter.is_premium ? `${SHINY_PURPLE}18` : `${currentTheme.foreground}08`,
                                                        color: chapter.is_premium ? SHINY_PURPLE : `${currentTheme.foreground}70`,
                                                    }}
                                                >
                                                    {chapter.volume ? `V${chapter.volume}` : chapter.chapter_number}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-xs font-semibold truncate" style={{ color: currentTheme.foreground }}>
                                                            {chapter.title || (chapter.volume ? `Vol ${chapter.volume}` : `Ch ${chapter.chapter_number}`)}
                                                        </p>
                                                        {chapter.is_premium && <PremiumDiamond size={12} />}
                                                        {chapter.is_owned && (
                                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px]" style={{ color: `${currentTheme.foreground}45` }}>
                                                        <span className="flex items-center gap-0.5">
                                                            <CalendarIcon size={10} color={`${currentTheme.foreground}45`} />
                                                            {formatDate(chapter.created_at)}
                                                        </span>
                                                        <span className="flex items-center gap-0.5">
                                                            <EyeIcon className="w-2.5 h-2.5" />
                                                            {formatNumber(chapter.views)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                {/* No Results */}
                                {filteredChapters.length === 0 && (
                                    <div className="flex-1 flex flex-col items-center justify-center py-12">
                                        <BookIcon size={40} color={`${currentTheme.foreground}25`} />
                                        <p className="mt-3 text-sm font-medium" style={{ color: `${currentTheme.foreground}50` }}>
                                            {searchQuery ? 'No chapters match your search' : 'No chapters available'}
                                        </p>
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="mt-2 text-xs underline"
                                                style={{ color: SHINY_PURPLE }}
                                            >
                                                Clear search
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── You Might Also Like ── */}
                        <div className="flex flex-col">
                            {relatedSeries.length > 0 && (
                                <div
                                    className="rounded-2xl overflow-hidden flex flex-col"
                                    style={{
                                        height: isMobile ? 'auto' : '680px',
                                        backgroundColor: `${currentTheme.foreground}04`,
                                        border: `1px solid ${currentTheme.foreground}08`,
                                    }}
                                >
                                    {/* Header */}
                                    <div
                                        className="flex-shrink-0 px-5 py-4"
                                        style={{
                                            background: `linear-gradient(135deg, ${SHINY_PURPLE}08 0%, ${currentTheme.foreground}02 100%)`,
                                            borderBottom: `1px solid ${currentTheme.foreground}08`,
                                        }}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div
                                                className="w-1 h-6 rounded-full"
                                                style={{ background: `linear-gradient(to bottom, ${SHINY_PURPLE}, #e879f9)` }}
                                            />
                                            <h3 className="text-base font-bold" style={{ color: currentTheme.foreground }}>
                                                You Might Also Like
                                            </h3>
                                        </div>
                                    </div>

                                    {/* List */}
                                    <div
                                        className="flex-1 overflow-y-auto themed-scrollbar p-3 space-y-2"
                                        style={{
                                            '--scrollbar-thumb': `${currentTheme.foreground}20`,
                                            '--scrollbar-thumb-hover': `${currentTheme.foreground}35`,
                                            '--scrollbar-track': 'transparent',
                                        } as React.CSSProperties}
                                    >
                                        {relatedSeries.map((related) => (
                                            <Link
                                                key={related.id}
                                                href={route('series.show', related.slug)}
                                                className="flex gap-3 p-2.5 rounded-xl transition-all duration-200 group hover:-translate-y-0.5 hover:shadow-md"
                                                style={{
                                                    backgroundColor: `${currentTheme.foreground}03`,
                                                    border: `1px solid ${currentTheme.foreground}07`,
                                                }}
                                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${SHINY_PURPLE}25`; (e.currentTarget as HTMLElement).style.backgroundColor = `${SHINY_PURPLE}05`; }}
                                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${currentTheme.foreground}07`; (e.currentTarget as HTMLElement).style.backgroundColor = `${currentTheme.foreground}03`; }}
                                            >
                                                <CoverImage
                                                    src={related.cover_url}
                                                    alt={related.title}
                                                    aspectClass=""
                                                    containerClassName="w-14 h-[84px] flex-shrink-0 rounded-lg"
                                                    hoverScale={false}
                                                />
                                                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                                    <div>
                                                        <h4
                                                            className="font-semibold text-sm line-clamp-2 leading-snug mb-1 transition-colors duration-150"
                                                            style={{ color: currentTheme.foreground }}
                                                        >
                                                            {related.title}
                                                        </h4>
                                                        <p className="text-xs truncate" style={{ color: `${currentTheme.foreground}55` }}>
                                                            {related.author}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className="flex items-center gap-0.5 text-xs">
                                                            <span className="text-yellow-400 text-sm leading-none">★</span>
                                                            <span className="font-semibold" style={{ color: currentTheme.foreground }}>{related.rating || 'N/A'}</span>
                                                        </span>
                                                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: `${currentTheme.foreground}25` }} />
                                                        <span className="text-xs" style={{ color: `${currentTheme.foreground}50` }}>
                                                            {related.chapters_count} ch
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </section>

                {/* ─── Reactions Section ─── */}
                <section className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 pb-6">
                    <div
                        className="rounded-2xl p-8 text-center"
                        style={{
                            backgroundColor: `${currentTheme.foreground}04`,
                            border: `1px solid ${currentTheme.foreground}08`,
                        }}
                    >
                        <h3 
                            className="text-xl sm:text-2xl font-bold mb-6"
                            style={{ color: currentTheme.foreground }}
                        >
                            How do you feel about this series?
                        </h3>
                        <Suspense fallback={null}>
                            <ReactionBar
                                reactableType="series"
                                reactableId={series.id}
                                isAuthenticated={!!auth?.user}
                                size="large"
                            />
                        </Suspense>
                    </div>
                </section>

                {/* ─── Comment Section ─── */}
                <section className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 pb-10">
                    <Suspense fallback={<CommentSectionSkeleton />}>
                        <CommentSection
                            commentableType="series"
                            commentableId={series.id}
                            isAuthenticated={!!auth?.user}
                            currentUserId={auth?.user?.id}
                        />
                    </Suspense>
                </section>
            </div>
            )}

            {/* Notification Toast */}
            {showNotification && (
                <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-2 duration-300">
                    <div 
                        className="rounded-xl shadow-2xl p-4 max-w-sm flex items-center gap-3"
                        style={{
                            backgroundColor: currentTheme.background,
                            border: `1px solid ${currentTheme.foreground}15`,
                            boxShadow: `0 10px 30px ${currentTheme.foreground}12`,
                        }}
                    >
                        <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium flex-1" style={{ color: currentTheme.foreground }}>
                            {notificationMessage}
                        </p>
                        <button
                            onClick={() => setShowNotification(false)}
                            className="flex-shrink-0 opacity-40 hover:opacity-70 transition-opacity"
                            style={{ color: currentTheme.foreground }}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
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
