import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';

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
    prevChapter: NavigationChapter | null;
    nextChapter: NavigationChapter | null;
    allChapters: ChapterOption[];
}

export default function ChapterShow({ 
    series, 
    chapter, 
    canAccess, 
    prevChapter, 
    nextChapter, 
    allChapters 
}: Props) {
    const [showNavbar, setShowNavbar] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [fontSize, setFontSize] = useState(16);
    const [darkMode, setDarkMode] = useState(false);
    const [showChapterList, setShowChapterList] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setShowNavbar(false);
            } else {
                setShowNavbar(true);
            }
            
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

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

    if (!canAccess) {
        return (
            <UserLayout>
                <Head title={`${chapter.title} - ${series.title}`} />
                
                <div className="min-h-screen bg-gray-50 pt-20">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                            <div className="mb-6">
                                <svg className="w-16 h-16 text-yellow-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">Premium Chapter</h1>
                                <p className="text-gray-600 mb-4">
                                    This chapter requires {chapter.coin_price} coins to unlock
                                </p>
                            </div>
                            
                            <div className="space-y-4">
                                <button
                                    onClick={handlePurchase}
                                    className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors"
                                >
                                    Unlock for {chapter.coin_price} Coins
                                </button>
                                
                                <div className="text-sm text-gray-500">
                                    <Link href="/buy-coins" className="text-blue-600 hover:text-blue-800">
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
        <UserLayout>
            <Head title={`${chapter.title} - ${series.title}`} />
            
            {/* Sticky Navigation Bar */}
            <div className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 transition-transform duration-300 ${
                showNavbar ? 'translate-y-0' : '-translate-y-full'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Left Section */}
                        <div className="flex items-center space-x-4">
                            <Link
                                href={route('series.show', series.slug)}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                                ← Back to Series
                            </Link>
                            
                            <div className="border-l border-gray-300 pl-4">
                                <h1 className="font-semibold text-gray-900 truncate max-w-xs">
                                    {series.title}
                                </h1>
                                <p className="text-sm text-gray-600 truncate max-w-xs">
                                    Chapter {chapter.chapter_number}: {chapter.title}
                                </p>
                            </div>
                        </div>

                        {/* Center Section - Chapter Navigation */}
                        <div className="flex items-center space-x-2">
                            {prevChapter && (
                                <Link
                                    href={route('chapters.show', [series.slug, prevChapter.chapter_number])}
                                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                                    title={`Previous: ${prevChapter.title}`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </Link>
                            )}
                            
                            <div className="relative">
                                <button
                                    onClick={() => setShowChapterList(!showChapterList)}
                                    className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center space-x-1"
                                >
                                    <span>Ch. {chapter.chapter_number}</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                
                                {showChapterList && (
                                    <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-10">
                                        {allChapters.map((ch) => (
                                            <button
                                                key={ch.chapter_number}
                                                onClick={() => jumpToChapter(ch.chapter_number)}
                                                className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between ${
                                                    ch.chapter_number === chapter.chapter_number ? 'bg-blue-50 text-blue-600' : ''
                                                }`}
                                            >
                                                <span className="truncate">
                                                    Ch. {ch.chapter_number}: {ch.title}
                                                </span>
                                                {ch.is_premium && (
                                                    <span className="text-xs text-yellow-600 ml-2">Premium</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {nextChapter && (
                                <Link
                                    href={route('chapters.show', [series.slug, nextChapter.chapter_number])}
                                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                                    title={`Next: ${nextChapter.title}`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            )}
                        </div>

                        {/* Right Section - Reading Settings */}
                        <div className="flex items-center space-x-2">
                            {/* Font Size */}
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                                    title="Decrease font size"
                                >
                                    <span className="text-sm font-bold">A</span>
                                </button>
                                <button
                                    onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                                    title="Increase font size"
                                >
                                    <span className="text-lg font-bold">A</span>
                                </button>
                            </div>
                            
                            {/* Dark Mode Toggle */}
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                                title="Toggle dark mode"
                            >
                                {darkMode ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chapter Content */}
            <div className={`min-h-screen pt-16 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Chapter Header */}
                    <div className="mb-8 text-center">
                        <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {chapter.title}
                        </h1>
                        <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Chapter {chapter.chapter_number}
                        </p>
                        {chapter.is_premium && (
                            <div className="mt-4">
                                <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
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
                        className={`prose max-w-none leading-relaxed ${darkMode ? 'prose-invert' : ''}`}
                        style={{ fontSize: `${fontSize}px` }}
                    >
                        <div
                            className={darkMode ? 'text-gray-200' : 'text-gray-800'}
                            dangerouslySetInnerHTML={{ __html: chapter.content }}
                        />
                    </div>

                    {/* Chapter Navigation Footer */}
                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            {prevChapter ? (
                                <Link
                                    href={route('chapters.show', [series.slug, prevChapter.chapter_number])}
                                    className="w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center"
                                >
                                    ← Previous Chapter
                                </Link>
                            ) : (
                                <div className="w-full sm:w-auto"></div>
                            )}
                            
                            <Link
                                href={route('series.show', series.slug)}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Back to Series
                            </Link>
                            
                            {nextChapter ? (
                                <Link
                                    href={route('chapters.show', [series.slug, nextChapter.chapter_number])}
                                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
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
        </UserLayout>
    );
}
