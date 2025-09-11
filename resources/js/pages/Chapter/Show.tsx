import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import ReaderSettingsModal from '@/Components/ReaderSettingsModal';
import { useTheme } from '@/Contexts/ThemeContext';

interface Series {
    id: number;
    title: string;
    slug: string;
}

interface Chapter {
    id: number;
    title: string;
    chapter_number: number;
    content: string;
    is_premium: boolean;
    coin_price: number;
}

interface NavigationChapter {
    chapter_number: number;
    title: string;
}

interface ChapterOption {
    chapter_number: number;
    title: string;
    is_premium: boolean;
}

interface Props {
    series: Series;
    chapter: Chapter;
    canAccess: boolean;
    hasPurchased: boolean;
    userCoins: number;
    prevChapter: NavigationChapter | null;
    nextChapter: NavigationChapter | null;
    allChapters: ChapterOption[];
}

function ChapterShowContent({ 
    series, 
    chapter, 
    canAccess, 
    hasPurchased,
    userCoins,
    prevChapter, 
    nextChapter, 
    allChapters
}: Props) {
    const { currentTheme, readerSettings } = useTheme();
    const [showNavbar, setShowNavbar] = useState(true);
    const [showChapterList, setShowChapterList] = useState(false);
    const [showReaderSettings, setShowReaderSettings] = useState(false);
    const readerSettingsButtonRef = useRef<HTMLButtonElement>(null);
    const hideDelayTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        let lastY = 0;
        
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY < 10) {
                // Always show reading bar at the top
                if (hideDelayTimerRef.current) {
                    clearTimeout(hideDelayTimerRef.current);
                    hideDelayTimerRef.current = null;
                }
                setShowNavbar(true);
            } else if (currentScrollY > lastY && currentScrollY > 100) {
                // Scrolling down & past 100px - hide reading bar after 1 second delay
                if (hideDelayTimerRef.current) {
                    clearTimeout(hideDelayTimerRef.current);
                }
                hideDelayTimerRef.current = setTimeout(() => {
                    setShowNavbar(false);
                }, 1000);
            } else if (currentScrollY < lastY) {
                // Scrolling up - show reading bar immediately
                if (hideDelayTimerRef.current) {
                    clearTimeout(hideDelayTimerRef.current);
                    hideDelayTimerRef.current = null;
                }
                setShowNavbar(true);
            }
            
            lastY = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            // Clean up the timer when component unmounts
            if (hideDelayTimerRef.current) {
                clearTimeout(hideDelayTimerRef.current);
            }
        };
    }, []);

    const handlePurchase = () => {
        router.post(route('chapters.purchase', [series.slug, chapter.chapter_number]), {}, {
            onSuccess: () => {
                // Reload the page to update the access status
                router.reload();
            },
            onError: (errors) => {
                console.error('Purchase failed:', errors);
                alert('Purchase failed. Please try again.');
            }
        });
    };

    const jumpToChapter = (chapterNumber: number) => {
        router.get(route('chapters.show', [series.slug, chapterNumber]));
        setShowChapterList(false);
    };

    if (!canAccess && chapter.is_premium) {
        return (
            <UserLayout>
                <Head>
                    <title>{chapter.title} - {series.title} | VeiNovel</title>
                    <meta name="description" content={`Read ${chapter.title} from ${series.title} on VeiNovel. Chapter ${chapter.chapter_number} available with premium access.`} />
                    <meta name="keywords" content={`${chapter.title}, ${series.title}, chapter ${chapter.chapter_number}, english novel, premium chapter`} />
                    
                    <meta property="og:title" content={`${chapter.title} - ${series.title}`} />
                    <meta property="og:description" content={`Read Chapter ${chapter.chapter_number}: ${chapter.title} from ${series.title}`} />
                    <meta property="og:type" content="article" />
                    
                    <link rel="canonical" href={`https://veinovel.com/series/${series.slug}/chapter/${chapter.chapter_number}`} />
                </Head>
                
                <div 
                    className="min-h-screen pt-20"
                    style={{ backgroundColor: currentTheme.background }}
                >
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div 
                            className="rounded-lg shadow-sm border p-8 text-center"
                            style={{
                                backgroundColor: currentTheme.background,
                                borderColor: `${currentTheme.foreground}20`
                            }}
                        >
                            <div className="mb-6">
                                <svg 
                                    className="w-16 h-16 mx-auto mb-4" 
                                    fill="none" 
                                    stroke="#f59e0b" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <h1 
                                    className="text-2xl font-bold mb-2"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    Premium Chapter
                                </h1>
                                <p 
                                    className="mb-2"
                                    style={{ color: `${currentTheme.foreground}80` }}
                                >
                                    This chapter requires {chapter.coin_price} coins to unlock
                                </p>
                                <p 
                                    className="text-sm"
                                    style={{ color: `${currentTheme.foreground}60` }}
                                >
                                    Your balance: {userCoins} coins
                                </p>
                            </div>
                            
                            <div className="space-y-4">
                                {userCoins >= chapter.coin_price ? (
                                    <button
                                        onClick={handlePurchase}
                                        className="px-6 py-3 font-semibold rounded-lg transition-colors"
                                        style={{
                                            backgroundColor: '#f59e0b',
                                            color: '#ffffff'
                                        }}
                                    >
                                        Unlock for {chapter.coin_price} Coins
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="font-medium" style={{ color: '#ef4444' }}>
                                            Insufficient coins! You need {chapter.coin_price - userCoins} more coins.
                                        </p>
                                        <Link
                                            href="/buy-coins"
                                            className="inline-block px-6 py-3 font-semibold rounded-lg transition-colors"
                                            style={{
                                                backgroundColor: currentTheme.foreground,
                                                color: currentTheme.background
                                            }}
                                        >
                                            Buy More Coins
                                        </Link>
                                    </div>
                                )}
                                
                                <div className="text-sm">
                                    <Link 
                                        href="/buy-coins" 
                                        className="transition-colors hover:opacity-70"
                                        style={{ color: '#3b82f6' }}
                                    >
                                        Get more coins
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </UserLayout>
        );
    }

    return (
        <>
            <Head title={`${chapter.title} - ${series.title}`} />
            
            {/* Sticky Navigation Bar */}
            <div 
                className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-500 ease-in-out ${
                    showNavbar ? 'translate-y-0' : '-translate-y-full'
                }`}
                style={{
                    backgroundColor: currentTheme.background,
                    borderColor: `${currentTheme.foreground}20`
                }}
            >
                <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Left Section */}
                        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                            <Link
                                href={route('series.show', series.slug)}
                                className="font-medium transition-colors hover:opacity-70 text-sm sm:text-base"
                                style={{ color: '#3b82f6' }}
                            >
                                <span className="hidden sm:inline">← Back to Series</span>
                                <span className="sm:hidden">← Back</span>
                            </Link>
                            
                            {/* Hide chapter title on mobile */}
                            <div 
                                className="border-l pl-4 hidden sm:block"
                                style={{ borderColor: `${currentTheme.foreground}30` }}
                            >
                                <h1 
                                    className="font-semibold truncate max-w-xs"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    {series.title}
                                </h1>
                                <p 
                                    className="text-sm truncate max-w-xs"
                                    style={{ color: `${currentTheme.foreground}70` }}
                                >
                                    {chapter.chapter_number}: {chapter.title}
                                </p>
                            </div>
                        </div>

                        {/* Center Section - Chapter Navigation */}
                        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                            {prevChapter && (
                                <Link
                                    href={route('chapters.show', [series.slug, prevChapter.chapter_number])}
                                    className="p-2 rounded transition-colors hover:opacity-70"
                                    style={{ color: currentTheme.foreground }}
                                    title={`Previous: ${prevChapter.title}`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </Link>
                            )}
                            
                            <div className="relative">
                                {/* Mobile: Simple chapter number display */}
                                <div className="sm:hidden">
                                    <button
                                        onClick={() => setShowChapterList(!showChapterList)}
                                        className="px-3 py-2 text-sm border rounded transition-colors hover:opacity-70 flex items-center space-x-1"
                                        style={{
                                            color: currentTheme.foreground,
                                            borderColor: `${currentTheme.foreground}30`
                                        }}
                                    >
                                        <span>Ch.{chapter.chapter_number}</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Desktop: Series title link + chapter dropdown */}
                                <div className="hidden sm:flex items-center space-x-2">
                                    <Link
                                        href={route('series.show', series.slug)}
                                        className="px-2 sm:px-3 py-2 text-sm border rounded transition-colors hover:opacity-70 truncate max-w-32 sm:max-w-48"
                                        style={{
                                            color: '#3b82f6',
                                            borderColor: `${currentTheme.foreground}30`
                                        }}
                                        title={series.title}
                                    >
                                        {series.title}
                                    </Link>
                                    <button
                                        onClick={() => setShowChapterList(!showChapterList)}
                                        className="px-2 py-2 text-sm border rounded transition-colors hover:opacity-70 flex items-center"
                                        style={{
                                            color: currentTheme.foreground,
                                            borderColor: `${currentTheme.foreground}30`
                                        }}
                                        title="Chapter list"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>
                                
                                {showChapterList && (
                                    <div 
                                        className="absolute top-full left-1/2 transform -translate-x-1/2 sm:left-0 sm:transform-none mt-1 w-72 sm:w-80 border rounded-lg shadow-lg max-h-96 overflow-y-auto z-10"
                                        style={{
                                            backgroundColor: currentTheme.background,
                                            borderColor: `${currentTheme.foreground}20`
                                        }}
                                    >
                                        {allChapters.map((ch) => (
                                            <button
                                                key={ch.chapter_number}
                                                onClick={() => jumpToChapter(ch.chapter_number)}
                                                className={`w-full text-left px-3 sm:px-4 py-2 transition-colors hover:opacity-70 flex items-center justify-between ${
                                                    ch.chapter_number === chapter.chapter_number ? 'opacity-80' : ''
                                                }`}
                                                style={{
                                                    color: ch.chapter_number === chapter.chapter_number ? '#3b82f6' : currentTheme.foreground,
                                                    backgroundColor: ch.chapter_number === chapter.chapter_number ? `${currentTheme.foreground}10` : 'transparent'
                                                }}
                                            >
                                                <span className="truncate text-sm sm:text-base">
                                                    {ch.chapter_number}: {ch.title}
                                                </span>
                                                {ch.is_premium && (
                                                    <span className="text-xs ml-2 flex-shrink-0" style={{ color: '#f59e0b' }}>Premium</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {nextChapter && (
                                <Link
                                    href={route('chapters.show', [series.slug, nextChapter.chapter_number])}
                                    className="p-2 rounded transition-colors hover:opacity-70"
                                    style={{ color: currentTheme.foreground }}
                                    title={`Next: ${nextChapter.title}`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            )}
                        </div>

                        {/* Right Section - Reading Settings */}
                        <div className="flex items-center flex-shrink-0">
                            {/* Reader Settings Button */}
                            <button
                                ref={readerSettingsButtonRef}
                                onClick={() => setShowReaderSettings(true)}
                                className="p-2 rounded transition-colors hover:opacity-70"
                                style={{ color: currentTheme.foreground }}
                                title="Reader settings"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chapter Content */}
            <div 
                className="min-h-screen pt-16"
                style={{ backgroundColor: currentTheme.background }}
            >
                <div 
                    className="mx-auto px-2 sm:px-6 lg:px-8 py-8"
                    style={{ 
                        maxWidth: `${readerSettings.contentWidth}%`,
                        width: '100%'
                    }}
                >
                    {/* Chapter Header */}
                    <div className="mb-8 text-center">
                        <h1 
                            className="text-3xl font-bold mb-2"
                            style={{ color: currentTheme.foreground }}
                        >
                            {chapter.title}
                        </h1>
                        <Link
                            href={route('series.show', series.slug)}
                            className="text-lg transition-colors hover:opacity-70"
                            style={{ color: '#3b82f6' }}
                        >
                            {series.title}
                        </Link>
                        {chapter.is_premium && (
                            <div className="mt-4">
                                <span 
                                    className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full"
                                    style={{
                                        backgroundColor: '#fef3c7',
                                        color: '#92400e'
                                    }}
                                >
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Premium Chapter
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Chapter Content */}
                    <div
                        className="max-w-none reader-content"
                        style={{ 
                            fontSize: `${readerSettings.fontSize}px`,
                            fontFamily: readerSettings.fontFamily,
                            color: currentTheme.foreground,
                            '--reader-line-height': readerSettings.lineHeight
                        } as React.CSSProperties & { '--reader-line-height': number }}
                        data-line-height={readerSettings.lineHeight}
                    >
                        <div
                            style={{ 
                                whiteSpace: 'normal',
                                lineHeight: readerSettings.lineHeight,
                                fontSize: 'inherit',
                                fontFamily: 'inherit',
                                color: 'inherit'
                            }}
                            dangerouslySetInnerHTML={{ 
                                __html: chapter.content
                                    // Split by double newlines to identify paragraphs
                                    .split(/\n\s*\n/)
                                    // Clean up each paragraph
                                    .map(paragraph => paragraph.trim())
                                    // Remove empty paragraphs
                                    .filter(paragraph => paragraph.length > 0)
                                    // Convert each paragraph to HTML with proper spacing
                                    .map((paragraph, index) => {
                                        // Handle single line breaks within paragraphs
                                        const formattedParagraph = paragraph.replace(/\n/g, '<br>');
                                        return `<p style="
                                            margin-bottom: ${readerSettings.paragraphSpacing}em; 
                                            margin-top: 0; 
                                            text-align: ${readerSettings.textAlign}; 
                                            ${readerSettings.hyphenation ? 'hyphens: auto;' : 'hyphens: none;'}
                                            ${index > 0 && readerSettings.textIndent > 0 ? `text-indent: ${readerSettings.textIndent}em;` : ''}
                                        ">${formattedParagraph}</p>`;
                                    })
                                    .join('')
                            }}
                        />
                    </div>

                    {/* Chapter Navigation Footer */}
                    <div 
                        className="mt-12 pt-8 border-t"
                        style={{ borderColor: `${currentTheme.foreground}20` }}
                    >
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            {prevChapter ? (
                                <Link
                                    href={route('chapters.show', [series.slug, prevChapter.chapter_number])}
                                    className="w-full sm:w-auto px-6 py-3 rounded-lg transition-colors text-center"
                                    style={{
                                        backgroundColor: `${currentTheme.foreground}10`,
                                        color: currentTheme.foreground
                                    }}
                                >
                                    ← Previous Chapter
                                </Link>
                            ) : (
                                <div className="w-full sm:w-auto"></div>
                            )}
                            
                            <Link
                                href={route('series.show', series.slug)}
                                className="px-6 py-3 border rounded-lg transition-colors"
                                style={{
                                    borderColor: `${currentTheme.foreground}30`,
                                    color: currentTheme.foreground
                                }}
                            >
                                Back to Series
                            </Link>
                            
                            {nextChapter ? (
                                <Link
                                    href={route('chapters.show', [series.slug, nextChapter.chapter_number])}
                                    className="w-full sm:w-auto px-6 py-3 rounded-lg transition-colors text-center"
                                    style={{
                                        backgroundColor: currentTheme.foreground,
                                        color: currentTheme.background
                                    }}
                                >
                                    Next Chapter →
                                </Link>
                            ) : (
                                <div className="w-full sm:w-auto"></div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Reader Settings Modal */}
            <ReaderSettingsModal
                isOpen={showReaderSettings}
                onClose={() => setShowReaderSettings(false)}
                triggerElement={readerSettingsButtonRef.current}
            />
        </>
    );
}

export default function ChapterShow(props: Props) {
    return (
        <UserLayout>
            <ChapterShowContent {...props} />
        </UserLayout>
    );
}
