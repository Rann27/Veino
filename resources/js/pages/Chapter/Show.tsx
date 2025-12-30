import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import ReaderSettingsModal from '@/Components/ReaderSettingsModal';
import { useTheme, SHINY_PURPLE } from '@/Contexts/ThemeContext';
import CommentSection from '@/Components/CommentSection';
import ReactionBar from '@/Components/ReactionBar';
import PremiumDiamond from '@/Components/PremiumDiamond';
import InTextAd from '@/Components/Ads/InTextAd';
import InterstitialAd from '@/Components/Ads/InterstitialAd';
import axios from 'axios';

// Sanitize HTML to remove conflicting color styles
const sanitizeColorStyles = (html: string): string => {
    if (!html) return '';
    
    // Remove inline color styles that conflict with theme
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
    isPremiumMember: boolean;
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
    isPremiumMember,
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
    const [inTextAds, setInTextAds] = useState<Array<{id: number; caption: string; link_url: string}>>([]);

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

    // Fetch in-text ads for non-premium users (including guests)
    useEffect(() => {
        if (!isPremiumMember) {
            axios.get('/api/ads/in-text/random', { params: { count: 5 } })
                .then(response => {
                    if (response.data && response.data.ads) {
                        setInTextAds(response.data.ads);
                        
                        // Track impressions for in-text ads
                        response.data.ads.forEach((ad: any) => {
                            axios.post(`/api/ads/${ad.id}/track-impression`).catch(() => {});
                        });
                    }
                })
                .catch(() => {
                    // No ads available
                });
        }
    }, [isPremiumMember]);

    // Handle in-text ad clicks
    useEffect(() => {
        const handleAdClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('in-text-ad-link')) {
                const adId = target.getAttribute('data-ad-id');
                if (adId) {
                    axios.post(`/api/ads/${adId}/track-click`).catch(() => {});
                }
            }
        };

        document.addEventListener('click', handleAdClick);
        return () => {
            document.removeEventListener('click', handleAdClick);
        };
    }, []);

    const jumpToChapter = (chapterNumber: number) => {
        router.get(route('chapters.show', [series.slug, chapterNumber]));
        setShowChapterList(false);
    };

    // Helper function to inject in-text ads every 40 lines
    const injectInTextAds = (content: string): string => {
        if (isPremiumMember || inTextAds.length === 0) {
            return content;
        }

        // Split content by paragraph tags
        const paragraphs = content.split(/<\/p>/gi);
        let lineCount = 0;
        let adIndex = 0;
        const result: string[] = [];

        paragraphs.forEach((para, index) => {
            if (para.trim()) {
                result.push(para + (index < paragraphs.length - 1 ? '</p>' : ''));
                lineCount++;

                // Inject ad every 40 lines
                if (lineCount % 40 === 0 && adIndex < inTextAds.length) {
                    const ad = inTextAds[adIndex];
                    const adHtml = `<p style="margin-bottom: 1.5em;">
                        <a href="${ad.link_url}" 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           data-ad-id="${ad.id}" 
                           class="in-text-ad-link"
                           style="color: #a78bfa; text-decoration: none; transition: all 0.2s;"
                           onmouseover="this.style.color='#c084fc'; this.style.textDecoration='underline'"
                           onmouseout="this.style.color='#a78bfa'; this.style.textDecoration='none'">
                            ${ad.caption} <span style="opacity: 0.7; font-size: 0.9em;">[AD]</span>
                        </a>
                    </p>`;
                    result.push(adHtml);
                    adIndex++;
                }
            }
        });

        return result.join('');
    };

    if (!canAccess && chapter.is_premium) {
        const SHINY_PURPLE = '#a78bfa';
        
        return (
            <UserLayout>
                <div 
                    className="min-h-screen pt-20 relative overflow-hidden"
                    style={{ backgroundColor: currentTheme.background }}
                >
                    {/* Premium Background Effect */}
                    <div className="absolute inset-0 opacity-10">
                        <div 
                            className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl"
                            style={{ backgroundColor: SHINY_PURPLE }}
                        />
                        <div 
                            className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl"
                            style={{ backgroundColor: '#e879f9' }}
                        />
                    </div>
                    
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                        <div 
                            className="rounded-2xl shadow-2xl border-2 p-10 text-center backdrop-blur-sm"
                            style={{
                                backgroundColor: `${currentTheme.background}F5`,
                                borderColor: SHINY_PURPLE,
                                boxShadow: `0 0 40px ${SHINY_PURPLE}30`
                            }}
                        >
                            {/* Premium Diamond Icon */}
                            <div className="mb-6 flex justify-center">
                                <svg className="w-24 h-24 animate-pulse" viewBox="0 0 24 24" fill="none">
                                    <defs>
                                        <linearGradient id="paywallDiamond" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" style={{ stopColor: '#c084fc' }} />
                                            <stop offset="50%" style={{ stopColor: '#e879f9' }} />
                                            <stop offset="100%" style={{ stopColor: '#a78bfa' }} />
                                        </linearGradient>
                                        <radialGradient id="diamondGlow" cx="50%" cy="50%" r="50%">
                                            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.8 }} />
                                            <stop offset="100%" style={{ stopColor: '#a78bfa', stopOpacity: 0 }} />
                                        </radialGradient>
                                    </defs>
                                    <circle cx="12" cy="12" r="10" fill="url(#diamondGlow)" opacity="0.3" />
                                    <path 
                                        d="M12 2L3 9L12 22L21 9L12 2Z" 
                                        fill="url(#paywallDiamond)"
                                        stroke="#fff"
                                        strokeWidth="0.5"
                                    />
                                    <path 
                                        d="M12 2L12 22M3 9L21 9M7 5.5L17 5.5M7 9L12 22M17 9L12 22" 
                                        stroke="#fff" 
                                        strokeWidth="0.3" 
                                        opacity="0.6"
                                    />
                                </svg>
                            </div>
                            
                            <h1 
                                className="text-3xl font-bold mb-3"
                                style={{ 
                                    color: SHINY_PURPLE,
                                    textShadow: `0 0 20px ${SHINY_PURPLE}50`
                                }}
                            >
                                Premium Chapter
                            </h1>
                            
                            <p 
                                className="text-lg mb-6"
                                style={{ color: `${currentTheme.foreground}90` }}
                            >
                                This chapter is available exclusively for Premium Members
                            </p>
                            
                            <div 
                                className="mb-8 p-6 rounded-xl border"
                                style={{
                                    backgroundColor: `${SHINY_PURPLE}10`,
                                    borderColor: `${SHINY_PURPLE}30`
                                }}
                            >
                                <h3 
                                    className="font-semibold text-lg mb-3"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    Unlock with Premium Membership
                                </h3>
                                <ul className="text-sm space-y-2 text-left max-w-sm mx-auto">
                                    {[
                                        'Unlimited access to all premium chapters',
                                        'Ad-free reading experience',
                                        'Early access to new chapters',
                                        'Exclusive member perks'
                                    ].map((benefit, index) => (
                                        <li 
                                            key={index}
                                            className="flex items-start gap-2"
                                            style={{ color: `${currentTheme.foreground}80` }}
                                        >
                                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill={SHINY_PURPLE}>
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            {benefit}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            <div className="space-y-4">
                                <Link
                                    href="/membership"
                                    className="inline-block px-8 py-4 font-bold text-lg rounded-xl transition-all hover:scale-105 hover:shadow-xl"
                                    style={{
                                        background: `linear-gradient(135deg, ${SHINY_PURPLE} 0%, #e879f9 100%)`,
                                        color: '#ffffff',
                                        boxShadow: `0 4px 20px ${SHINY_PURPLE}50`
                                    }}
                                >
                                    Get Premium Membership
                                </Link>
                                
                                <div className="text-sm">
                                    <Link 
                                        href={`/series/${series.slug}`}
                                        className="transition-colors hover:opacity-70"
                                        style={{ color: currentTheme.foreground }}
                                    >
                                        ← Back to Series
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
                            className="font-medium transition-all reading-bar-btn px-3 py-1.5 rounded-lg text-sm sm:text-base"
                            style={{ color: `${currentTheme.foreground}80` }}
                        >
                            <span className="hidden sm:inline">← Back to Series</span>
                            <span className="sm:hidden">← Back</span>
                        </Link>                            {/* Hide chapter title on mobile */}
                            <div 
                                className="border-l pl-4 hidden sm:block"
                                style={{ borderColor: `${currentTheme.foreground}30` }}
                            >
                                <h1 
                                    className="font-semibold truncate max-w-xs"
                                    style={{ color: `${currentTheme.foreground}90` }}
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
                                    className="p-2 rounded transition-all reading-bar-btn"
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
                                    className="p-2 rounded transition-all reading-bar-btn"
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
                                                    color: ch.chapter_number === chapter.chapter_number ? SHINY_PURPLE : currentTheme.foreground,
                                                    backgroundColor: ch.chapter_number === chapter.chapter_number ? `${currentTheme.foreground}10` : 'transparent'
                                                }}
                                            >
                                                <span className="truncate text-sm sm:text-base">
                                                    {ch.chapter_number}: {ch.title}
                                                </span>
                                                {ch.is_premium && (
                                                    <span className="ml-2 flex-shrink-0">
                                                        <PremiumDiamond size={16} />
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {nextChapter && (
                                <Link
                                    href={route('chapters.show', [series.slug, nextChapter.chapter_number])}
                                    className="p-2 rounded transition-all reading-bar-btn"
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
                                className="p-2 rounded transition-all reading-bar-btn"
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
                    className="mx-auto px-2 sm:px-6 lg:px-8 py-8 rounded-lg border-2"
                    style={{ 
                        maxWidth: `${readerSettings.contentWidth}%`,
                        width: '100%',
                        borderColor: `${currentTheme.foreground}20`
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
                            style={{ color: SHINY_PURPLE }}
                        >
                            {series.title}
                        </Link>
                        {chapter.is_premium && (
                            <div className="mt-4">
                                <span 
                                    className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full"
                                    style={{
                                        backgroundColor: `${SHINY_PURPLE}15`,
                                        color: SHINY_PURPLE,
                                        border: `1px solid ${SHINY_PURPLE}40`
                                    }}
                                >
                                    <PremiumDiamond size={16} className="mr-1.5" />
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
                                        
                                        // First, remove color styles that conflict with theme
                                        processedContent = sanitizeColorStyles(processedContent);
                                        
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
                                        
                                        // Inject in-text ads for non-premium users
                                        processedContent = injectInTextAds(processedContent);
                                        
                                        return processedContent;
                                    } else {
                                        // Legacy plain text content, use old logic
                                        let legacyContent = content
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
                                        
                                        // Inject in-text ads for non-premium users
                                        legacyContent = injectInTextAds(legacyContent);
                                        
                                        return legacyContent;
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

            {/* Self-hosted Interstitial Ad (Premium Membership Promotion) - Every 3 chapters */}
            <InterstitialAd chapterId={chapter.id} />

            {/* Clickadilla ads are handled by smart script in app.blade.php */}
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
