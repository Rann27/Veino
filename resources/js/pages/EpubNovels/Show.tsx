import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import ShopLayout from '@/Layouts/ShopLayout';
import { useTheme } from '@/Contexts/ThemeContext';

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
    is_in_cart: boolean;
    is_purchased: boolean;
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

    // Show notification from flash or local state
    React.useEffect(() => {
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
                                    <img
                                        src={series.cover_url}
                                        alt={series.title}
                                        className="w-full rounded-lg shadow-lg mb-3"
                                        onError={(e) => {
                                            e.currentTarget.src = '/images/default-cover.jpg';
                                        }}
                                    />
                                    
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
                                            Trial Reading
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
                                            <img
                                                src={item.cover_url}
                                                alt={item.title}
                                                className="w-full rounded-lg"
                                                onError={(e) => {
                                                    e.currentTarget.src = '/images/default-cover.jpg';
                                                }}
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
                                                <p 
                                                    className="text-xl sm:text-2xl font-bold"
                                                    style={{ 
                                                        fontFamily: 'Poppins, sans-serif',
                                                        color: '#f59e0b'
                                                    }}
                                                >
                                                    ¢{item.price_coins.toLocaleString()}
                                                </p>

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
                                                            onClick={() => downloadPdf(item.id)}
                                                            className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90 flex items-center justify-center gap-1.5"
                                                            style={{
                                                                backgroundColor: '#f59e0b',
                                                                color: 'white',
                                                                fontFamily: 'Poppins, sans-serif'
                                                            }}
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
