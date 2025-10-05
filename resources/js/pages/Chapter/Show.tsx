import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import ReaderSettingsModal from '@/Components/ReaderSettingsModal';
import { useTheme } from '@/Contexts/ThemeContext';
import CommentSection from '@/Components/CommentSection';
import ReactionBar from '@/Components/ReactionBar';

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
    auth?: {
        user?: {
            id: number;
            display_name: string;
        };
    };
}

function ChapterShowContent({ 
    series, 
    chapter, 
    canAccess, 
    hasPurchased,
    userCoins,
    prevChapter, 
    nextChapter, 
    allChapters,
    auth
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

    // Ensure numeric values for calculations to prevent type coercion issues
    const userCoinsNum = parseInt(String(userCoins)) || 0;
    const coinPriceNum = parseInt(String(chapter.coin_price)) || 0;
    const hasEnoughCoins = userCoinsNum >= coinPriceNum;
    const coinsNeeded = Math.max(0, coinPriceNum - userCoinsNum);

    const handlePurchase = () => {
        // Double check with our pre-calculated values
        if (!hasEnoughCoins) {
            alert(`Insufficient coins! You need ${coinsNeeded} more coins.`);
            return;
        }
        
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
                                    This chapter requires {coinPriceNum} coins to unlock
                                </p>
                                <p 
                                    className="text-sm"
                                    style={{ color: `${currentTheme.foreground}60` }}
                                >
                                    Your balance: {userCoinsNum} coins
                                </p>
                            </div>
                            
                            <div className="space-y-4">
                                {hasEnoughCoins ? (
                                    <button
                                        onClick={handlePurchase}
                                        className="px-6 py-3 font-semibold rounded-lg transition-colors"
                                        style={{
                                            backgroundColor: '#f59e0b',
                                            color: '#ffffff'
                                        }}
                                    >
                                        Unlock for {coinPriceNum} Coins
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="font-medium" style={{ color: '#ef4444' }}>
                                            Insufficient coins! You need {coinsNeeded} more coins.
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
                                {/* Both Mobile and Desktop: Simple burger menu for chapter list */}
                                <button
                                    onClick={() => setShowChapterList(!showChapterList)}
                                    className="p-2 rounded transition-colors hover:opacity-70"
                                    style={{
                                        color: currentTheme.foreground
                                    }}
                                    title="Chapter list"
                                >
                                    {/* Burger icon */}
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                                
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
                        <style>{`
                            .reader-content * {
                                font-family: ${readerSettings.fontFamily} !important;
                                font-size: inherit !important;
                            }
                            .reader-content img {
                                max-width: 100%;
                                height: auto;
                            }
                            .reader-content strong,
                            .reader-content b {
                                font-weight: bold !important;
                            }
                            .reader-content em,
                            .reader-content i {
                                font-style: italic !important;
                            }
                            .reader-content u {
                                text-decoration: underline !important;
                            }
                            .reader-content s,
                            .reader-content strike,
                            .reader-content del {
                                text-decoration: line-through !important;
                            }
                        `}</style>
                        <div
                            style={{ 
                                whiteSpace: 'normal',
                                lineHeight: readerSettings.lineHeight,
                                fontSize: 'inherit',
                                fontFamily: 'inherit',
                                color: 'inherit'
                            }}
                            dangerouslySetInnerHTML={{ 
                                __html: (() => {
                                    const content = chapter.content;
                                    
                                    // Check if content already has HTML tags (from CKEditor)
                                    const hasHtmlTags = /<(p|div|h[1-6]|ul|ol|blockquote|figure)\b/i.test(content);
                                    
                                    if (hasHtmlTags) {
                                        // Content already has HTML structure, apply reader settings
                                        let processedContent = content;
                                        
                                        // Remove font-family and font-size from inline styles to allow reader settings
                                        processedContent = processedContent.replace(
                                            /style\s*=\s*["']([^"']*)["']/gi,
                                            (match, styleContent) => {
                                                // Remove font-family and font-size from inline styles
                                                const cleanedStyle = styleContent
                                                    .replace(/font-family\s*:[^;]+;?/gi, '')
                                                    .replace(/font-size\s*:[^;]+;?/gi, '')
                                                    .trim();
                                                return cleanedStyle ? `style="${cleanedStyle}"` : '';
                                            }
                                        );
                                        
                                        // Apply reader settings to paragraph elements
                                        processedContent = processedContent.replace(
                                            /<(p|h[1-6]|li|blockquote|figcaption)(\s[^>]*)?>/gi,
                                            (match, tag, attrs) => {
                                                // Build style attribute
                                                const styles = [
                                                    `margin-bottom: ${readerSettings.paragraphSpacing}em`,
                                                    'margin-top: 0',
                                                    `text-align: ${readerSettings.textAlign}`,
                                                    readerSettings.hyphenation ? 'hyphens: auto' : 'hyphens: none',
                                                    tag === 'p' && readerSettings.textIndent > 0 ? `text-indent: ${readerSettings.textIndent}em` : ''
                                                ].filter(Boolean).join('; ');
                                                
                                                // Merge with existing attributes
                                                const existingAttrs = attrs || '';
                                                const hasStyle = /style\s*=/i.test(existingAttrs);
                                                
                                                if (hasStyle) {
                                                    // Merge styles
                                                    return `<${tag}${existingAttrs.replace(/style\s*=\s*["']([^"']*)["']/i, `style="${styles}; $1"`)}`;
                                                } else {
                                                    // Add new style attribute
                                                    return `<${tag}${existingAttrs} style="${styles}">`;
                                                }
                                            }
                                        );
                                        
                                        return processedContent;
                                    } else {
                                        // Legacy plain text content, use old logic
                                        return content
                                            .split(/\n\s*\n/)
                                            .map(paragraph => paragraph.trim())
                                            .filter(paragraph => paragraph.length > 0)
                                            .map((paragraph, index) => {
                                                const formattedParagraph = paragraph.replace(/\n/g, '<br>');
                                                return `<p style="
                                                    margin-bottom: ${readerSettings.paragraphSpacing}em; 
                                                    margin-top: 0; 
                                                    text-align: ${readerSettings.textAlign}; 
                                                    ${readerSettings.hyphenation ? 'hyphens: auto;' : 'hyphens: none;'}
                                                    ${index > 0 && readerSettings.textIndent > 0 ? `text-indent: ${readerSettings.textIndent}em;` : ''}
                                                ">${formattedParagraph}</p>`;
                                            })
                                            .join('');
                                    }
                                })()
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
                                    How was this chapter?
                                </h3>
                                <ReactionBar
                                    reactableType="chapter"
                                    reactableId={chapter.id}
                                    isAuthenticated={!!auth?.user}
                                    size="large"
                                />
                            </div>
                        </div>

                        {/* Comment Section */}
                        <div className="mt-8">
                            <CommentSection
                                commentableType="chapter"
                                commentableId={chapter.id}
                                isAuthenticated={!!auth?.user}
                                currentUserId={auth?.user?.id}
                            />
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
