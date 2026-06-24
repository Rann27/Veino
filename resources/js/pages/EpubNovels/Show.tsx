import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import ShopLayout from '@/Layouts/ShopLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import CoverImage from '@/Components/CoverImage';
import PremiumDiamond from '@/Components/PremiumDiamond';

interface Genre {
    id: number;
    name: string;
}

interface EbookItem {
    id: number;
    title: string;
    cover_url: string;
    summary: string;
    price_coins: number;
    order: number;
    has_pdf_file: boolean;
    has_preview: boolean;
    is_in_cart: boolean;
    is_purchased: boolean;
    is_owned?: boolean;
    is_premium_access?: boolean;
}

interface EbookSeries {
    id: number;
    title: string;
    alternative_title?: string;
    slug: string;
    cover_url: string;
    synopsis: string;
    author?: string;
    artist?: string;
    genres: Genre[];
    show_trial_button?: boolean;
    series_slug?: string;
    free_for_premium_members?: boolean;
    has_premium_access?: boolean;
    is_mature?: boolean;
}

interface Props {
    series: EbookSeries;
    items: EbookItem[];
    chartItems?: any[];
    totalPrice?: number;
}

function ShowContent({ series, items, chartItems = [], totalPrice = 0 }: Props) {
    const { currentTheme } = useTheme();
    const { flash } = usePage<any>().props;
    const [notification, setNotification] = useState<string | null>(null);
    const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
    const [showAgeModal, setShowAgeModal] = useState(!!series.is_mature);

    // Show notification from flash or local state
    useEffect(() => {
        if (flash?.success) {
            setNotification(flash.success);
            setTimeout(() => setNotification(null), 3000);
        }
    }, [flash]);

    const addToChart = (itemId: number) => {
        router.post(route('chart.add'), { ebook_item_id: itemId }, {
            preserveScroll: true,
            onSuccess: () => {
                setNotification('Item added to chart!');
                setTimeout(() => setNotification(null), 3000);
            }
        });
    };

    const addAllToChart = () => {
        router.post(route('chart.add-all'), { ebook_series_id: series.id }, {
            preserveScroll: true,
            onSuccess: () => {
                setNotification('Items added to chart!');
                setTimeout(() => setNotification(null), 3000);
            }
        });
    };

    const downloadItem = (itemId: number) => {
        window.location.href = route('ebook.download', itemId);
    };

    const downloadPdf = (itemId: number) => {
        window.location.href = route('ebook.download.pdf', itemId);
    };

    const hasUnpurchasedItems = items.some(item => !item.is_purchased);

    return (
        <>
            <Head title={series.title} />

            {/* Adult Content Warning Modal */}
            {showAgeModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.85)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                    }}
                >
                    <div
                        style={{
                            background: currentTheme.background,
                            border: '1px solid rgba(239,68,68,0.4)',
                            borderRadius: '1rem',
                            padding: '2rem',
                            maxWidth: '24rem',
                            width: '100%',
                            textAlign: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: '3.5rem',
                                height: '3.5rem',
                                borderRadius: '50%',
                                background: 'rgba(239,68,68,0.15)',
                                border: '2px solid rgba(239,68,68,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.25rem',
                                fontSize: '1.5rem',
                                fontWeight: 900,
                                color: '#ef4444',
                                fontFamily: 'Poppins, sans-serif',
                            }}
                        >
                            18+
                        </div>
                        <h2
                            style={{
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                color: currentTheme.foreground,
                                marginBottom: '0.75rem',
                                fontFamily: 'Poppins, sans-serif',
                            }}
                        >
                            Adult Content Warning
                        </h2>
                        <p
                            style={{
                                fontSize: '0.875rem',
                                color: `${currentTheme.foreground}99`,
                                marginBottom: '1.75rem',
                                lineHeight: 1.6,
                                fontFamily: 'Poppins, sans-serif',
                            }}
                        >
                            This ebook series contains mature content intended for adults only (18+). By continuing, you confirm that you are of legal age to view such content.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button
                                onClick={() => setShowAgeModal(false)}
                                style={{
                                    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    padding: '0.75rem 1.5rem',
                                    fontWeight: 700,
                                    fontSize: '0.9375rem',
                                    cursor: 'pointer',
                                    fontFamily: 'Poppins, sans-serif',
                                }}
                            >
                                I am 18+ — Continue
                            </button>
                            <button
                                onClick={() => window.history.back()}
                                style={{
                                    background: `${currentTheme.foreground}12`,
                                    color: `${currentTheme.foreground}cc`,
                                    border: `1px solid ${currentTheme.foreground}20`,
                                    borderRadius: '0.5rem',
                                    padding: '0.625rem 1.5rem',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    fontFamily: 'Poppins, sans-serif',
                                }}
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            )}

                <div className="min-h-screen pb-24">
                    {/* Notification Toast */}
                    {notification && (
                        <div className="fixed top-20 right-4 z-50 animate-fade-in">
                            <div 
                                className="px-6 py-3 rounded-lg shadow-lg border flex items-center gap-2"
                                style={{
                                    backgroundColor: currentTheme.background,
                                    borderColor: '#f59e0b'
                                }}
                            >
                                <svg className="w-5 h-5" style={{ color: '#f59e0b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <p 
                                    className="font-medium"
                                    style={{ 
                                        fontFamily: 'Poppins, sans-serif',
                                        color: currentTheme.foreground
                                    }}
                                >
                                    {notification}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {/* Series Details Container */}
                        <div className="mb-6">
                            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                                {/* Cover & Trial Button */}
                                <div className="w-40 sm:w-48 md:w-58 flex-shrink-0 mx-auto md:mx-0">
                                    {/* Cover with corner badges */}
                                    <div className="relative mb-3">
                                        <CoverImage
                                            src={series.cover_url}
                                            alt={series.title}
                                            containerClassName="rounded-lg shadow-lg"
                                            hoverScale={false}
                                        />
                                        {/* Badge stack — top-right corner */}
                                        <div style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end', zIndex: 10 }}>
                                            {series.is_mature && (
                                                <div className="group/r18 relative">
                                                    <div
                                                        style={{ width: '1.75rem', height: '1.75rem', background: 'linear-gradient(135deg, #dc2626, #991b1b)', color: '#fff', fontSize: '0.5rem', fontWeight: 900, letterSpacing: '0.04em', fontFamily: 'Poppins, sans-serif', borderRadius: '0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 5px rgba(0,0,0,0.5)' }}
                                                    >
                                                        18+
                                                    </div>
                                                    <div className="absolute right-0 top-full mt-1 opacity-0 group-hover/r18:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap" style={{ zIndex: 30, background: 'rgba(0,0,0,0.88)', color: '#fff', fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontFamily: 'Poppins, sans-serif' }}>
                                                        Adult Content (R18)
                                                    </div>
                                                </div>
                                            )}
                                            {series.free_for_premium_members ? (
                                                <div className="group/fpm relative">
                                                    <div
                                                        style={{ width: '1.75rem', height: '1.75rem', background: 'linear-gradient(135deg, #7c3aed, #a21caf)', color: '#fff', borderRadius: '0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 5px rgba(0,0,0,0.5)' }}
                                                    >
                                                        <PremiumDiamond size={12} />
                                                    </div>
                                                    <div className="absolute right-0 top-full mt-1 opacity-0 group-hover/fpm:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap" style={{ zIndex: 30, background: 'rgba(0,0,0,0.88)', color: '#fff', fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontFamily: 'Poppins, sans-serif' }}>
                                                        Free for Premium Member
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="group/excl relative">
                                                    <div
                                                        style={{ width: '1.75rem', height: '1.75rem', background: '#fbbf24', color: '#78350f', borderRadius: '0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 5px rgba(0,0,0,0.5)' }}
                                                    >
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zM5 18h14v2H5z"/>
                                                        </svg>
                                                    </div>
                                                    <div className="absolute right-0 top-full mt-1 opacity-0 group-hover/excl:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap" style={{ zIndex: 30, background: 'rgba(0,0,0,0.88)', color: '#fff', fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontFamily: 'Poppins, sans-serif' }}>
                                                        Exclusive
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Trial Reading Button */}
                                    {series.show_trial_button && series.series_slug && (
                                        <Link
                                            href={route('series.show', series.series_slug)}
                                            className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg font-medium text-sm transition-all interactive-scale"
                                            style={{
                                                backgroundColor: currentTheme.foreground,
                                                color: currentTheme.background,
                                                fontFamily: 'Poppins, sans-serif'
                                            }}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                            Or Read Here
                                        </Link>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <h1 
                                        className="text-xl sm:text-2xl md:text-3xl font-bold mb-1"
                                        style={{ 
                                            fontFamily: 'Poppins, sans-serif',
                                            color: currentTheme.foreground
                                        }}
                                    >
                                        {series.title}
                                    </h1>

                                    {series.alternative_title && (
                                        <p 
                                            className="text-sm sm:text-base opacity-70 mb-2"
                                            style={{ 
                                                fontFamily: 'Poppins, sans-serif',
                                                color: currentTheme.foreground
                                            }}
                                        >
                                            {series.alternative_title}
                                        </p>
                                    )}

                                    {/* Meta Info */}
                                    <div className="flex flex-wrap gap-3 mb-3">
                                        {series.author && (
                                            <div>
                                                <span 
                                                    className="text-sm opacity-70"
                                                    style={{ 
                                                        fontFamily: 'Poppins, sans-serif',
                                                        color: currentTheme.foreground
                                                    }}
                                                >
                                                    Author:
                                                </span>
                                                <span 
                                                    className="text-sm font-medium ml-2"
                                                    style={{ 
                                                        fontFamily: 'Poppins, sans-serif',
                                                        color: currentTheme.foreground
                                                    }}
                                                >
                                                    {series.author}
                                                </span>
                                            </div>
                                        )}
                                        {series.artist && (
                                            <div>
                                                <span 
                                                    className="text-sm opacity-70"
                                                    style={{ 
                                                        fontFamily: 'Poppins, sans-serif',
                                                        color: currentTheme.foreground
                                                    }}
                                                >
                                                    Artist:
                                                </span>
                                                <span 
                                                    className="text-sm font-medium ml-2"
                                                    style={{ 
                                                        fontFamily: 'Poppins, sans-serif',
                                                        color: currentTheme.foreground
                                                    }}
                                                >
                                                    {series.artist}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Genres */}
                                    {series.genres.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {series.genres.map((genre) => (
                                                <span
                                                    key={genre.id}
                                                    className="px-2 py-0.5 rounded-full text-xs"
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

                                    {series.free_for_premium_members && (
                                        <div
                                            className="mb-3 rounded-lg px-3 py-2 text-sm"
                                            style={{
                                                backgroundColor: series.has_premium_access ? 'rgba(34,197,94,0.12)' : 'rgba(167,139,250,0.10)',
                                                color: series.has_premium_access ? '#22c55e' : '#a78bfa',
                                                border: `1px solid ${series.has_premium_access ? 'rgba(34,197,94,0.35)' : 'rgba(167,139,250,0.3)'}`,
                                                fontFamily: 'Poppins, sans-serif',
                                            }}
                                        >
                                            {series.has_premium_access
                                                ? 'Free with Premium. Download anytime while your membership is active.'
                                                : 'Premium members can download every volume in this series for free.'}
                                        </div>
                                    )}

                                    {/* Synopsis */}
                                    <div>
                                        <h3 
                                            className="text-base font-semibold mb-1.5"
                                            style={{ 
                                                fontFamily: 'Poppins, sans-serif',
                                                color: currentTheme.foreground
                                            }}
                                        >
                                            Synopsis
                                        </h3>
                                        <div className="relative">
                                            <p 
                                                className={`text-sm opacity-80 leading-relaxed whitespace-pre-wrap transition-all duration-300 ${!isSynopsisExpanded ? 'line-clamp-8' : ''}`}
                                                style={{ 
                                                    fontFamily: 'Poppins, sans-serif',
                                                    color: currentTheme.foreground
                                                }}
                                            >
                                                {series.synopsis || 'No synopsis available.'}
                                            </p>
                                            {(series.synopsis && (series.synopsis.split('\n').length > 8 || series.synopsis.length > 400)) && (
                                                <button
                                                    onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
                                                    className="mt-2 text-sm font-medium hover:underline transition-all"
                                                    style={{
                                                        color: currentTheme.foreground,
                                                        opacity: 0.75,
                                                        fontFamily: 'Poppins, sans-serif'
                                                    }}
                                                >
                                                    {isSynopsisExpanded ? 'Show Less ▲' : 'Show More ▼'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items List Container */}
                        <div 
                            className="border-t pt-6"
                            style={{ borderColor: `${currentTheme.foreground}20` }}
                        >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                                <h2 
                                    className="text-lg sm:text-xl font-bold"
                                    style={{ 
                                        fontFamily: 'Poppins, sans-serif',
                                        color: currentTheme.foreground
                                    }}
                                >
                                    Volumes ({items.length})
                                </h2>

                                {hasUnpurchasedItems && (
                                    <button
                                        onClick={addAllToChart}
                                        className="w-full sm:w-auto px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90"
                                        style={{
                                            backgroundColor: '#f59e0b',
                                            color: 'white',
                                            fontFamily: 'Poppins, sans-serif'
                                        }}
                                    >
                                        Add All to Chart
                                    </button>
                                )}
                            </div>

                            {/* Items Grid */}
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div 
                                        key={item.id}
                                        className="border rounded-lg p-3 flex flex-col sm:flex-row gap-3 hover:shadow-lg transition-shadow duration-200"
                                        style={{ borderColor: `${currentTheme.foreground}20` }}
                                    >
                                        {/* Item Cover */}
                                        <div className="w-20 sm:w-24 flex-shrink-0 mx-auto sm:mx-0">
                                            <CoverImage
                                                src={item.cover_url}
                                                alt={item.title}
                                                containerClassName="rounded-lg"
                                                hoverScale={false}
                                            />
                                        </div>

                                        {/* Item Info */}
                                        <div className="flex-1">
                                            <h3 
                                                className="text-base sm:text-lg font-bold mb-1.5"
                                                style={{ 
                                                    fontFamily: 'Poppins, sans-serif',
                                                    color: currentTheme.foreground
                                                }}
                                            >
                                                {item.title}
                                            </h3>

                                            <p 
                                                className="text-xs sm:text-sm opacity-70 mb-2 line-clamp-2"
                                                style={{ 
                                                    fontFamily: 'Poppins, sans-serif',
                                                    color: currentTheme.foreground
                                                }}
                                            >
                                                {item.summary || 'No summary available.'}
                                            </p>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                                <div>
                                                    <p
                                                        className="text-xl sm:text-2xl font-bold"
                                                        style={{
                                                            fontFamily: 'Poppins, sans-serif',
                                                            color: item.is_premium_access ? '#a78bfa' : '#f59e0b'
                                                        }}
                                                    >
                                                        {item.is_premium_access ? 'Free' : `¢${item.price_coins.toLocaleString()}`}
                                                    </p>
                                                    {item.is_premium_access && (
                                                        <p
                                                            className="text-xs font-medium"
                                                            style={{
                                                                fontFamily: 'Poppins, sans-serif',
                                                                color: `${currentTheme.foreground}70`,
                                                            }}
                                                        >
                                                            Limited Access
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-2 w-full sm:w-auto">
                                                    {item.has_preview && (
                                                        <Link
                                                            href={route('epub-novels.item-preview', [series.slug, item.id])}
                                                            className="w-full sm:w-auto px-4 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-80 flex items-center justify-center gap-2"
                                                            style={{
                                                                backgroundColor: currentTheme.foreground,
                                                                color: currentTheme.background,
                                                                fontFamily: 'Poppins, sans-serif',
                                                            }}
                                                        >
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                                                            </svg>
                                                            Read Preview
                                                        </Link>
                                                    )}

                                                {item.is_purchased ? (
                                                    <div className="flex gap-2 w-full sm:w-auto">
                                                        <button
                                                            onClick={() => downloadItem(item.id)}
                                                            className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90 flex items-center justify-center gap-1.5"
                                                            style={{
                                                                backgroundColor: '#8b5cf6',
                                                                color: 'white',
                                                                fontFamily: 'Poppins, sans-serif'
                                                            }}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                            EPUB
                                                        </button>
                                                        <button
                                                            onClick={() => item.has_pdf_file && downloadPdf(item.id)}
                                                            disabled={!item.has_pdf_file}
                                                            className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 disabled:cursor-not-allowed"
                                                            style={{
                                                                backgroundColor: item.has_pdf_file ? '#f59e0b' : `${currentTheme.foreground}20`,
                                                                color: item.has_pdf_file ? 'white' : `${currentTheme.foreground}55`,
                                                                fontFamily: 'Poppins, sans-serif'
                                                            }}
                                                            title={item.has_pdf_file ? 'Download PDF' : 'PDF not available'}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                            PDF
                                                        </button>
                                                    </div>
                                                ) : item.is_in_cart ? (
                                                    <button
                                                        disabled
                                                        className="w-full sm:w-auto px-4 sm:px-6 py-2 rounded-lg text-sm font-semibold opacity-50 cursor-not-allowed"
                                                        style={{
                                                            backgroundColor: `${currentTheme.foreground}20`,
                                                            color: currentTheme.foreground,
                                                            fontFamily: 'Poppins, sans-serif'
                                                        }}
                                                    >
                                                        Added to Chart
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => addToChart(item.id)}
                                                        className="w-full sm:w-auto px-4 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90"
                                                        style={{
                                                            backgroundColor: '#f59e0b',
                                                            color: 'white',
                                                            fontFamily: 'Poppins, sans-serif'
                                                        }}
                                                    >
                                                        Add to Chart
                                                    </button>
                                                )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
        </>
    );
}

export default function Show(props: Props) {
    return (
        <UserLayout>
            <ShopLayout chartItems={props.chartItems || []} totalPrice={props.totalPrice || 0}>
                <ShowContent {...props} />
            </ShopLayout>
        </UserLayout>
    );
}
