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
                        <div className="mb-8">
                            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                                {/* Cover */}
                                <div className="w-full md:w-64 flex-shrink-0">
                                    <img
                                        src={series.cover_url}
                                        alt={series.title}
                                        className="w-full rounded-lg shadow-lg"
                                        onError={(e) => {
                                            e.currentTarget.src = '/images/default-cover.jpg';
                                        }}
                                    />
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <h1 
                                        className="text-3xl md:text-4xl font-bold mb-2"
                                        style={{ 
                                            fontFamily: 'Poppins, sans-serif',
                                            color: currentTheme.foreground
                                        }}
                                    >
                                        {series.title}
                                    </h1>

                                    {series.alternative_title && (
                                        <p 
                                            className="text-lg opacity-70 mb-4"
                                            style={{ 
                                                fontFamily: 'Poppins, sans-serif',
                                                color: currentTheme.foreground
                                            }}
                                        >
                                            {series.alternative_title}
                                        </p>
                                    )}

                                    {/* Meta Info */}
                                    <div className="flex flex-wrap gap-4 mb-4">
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
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {series.genres.map((genre) => (
                                                <span
                                                    key={genre.id}
                                                    className="px-3 py-1 rounded-full text-sm"
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
                                            className="text-lg font-semibold mb-2"
                                            style={{ 
                                                fontFamily: 'Poppins, sans-serif',
                                                color: currentTheme.foreground
                                            }}
                                        >
                                            Synopsis
                                        </h3>
                                        <p 
                                            className="text-base opacity-80 leading-relaxed whitespace-pre-wrap"
                                            style={{ 
                                                fontFamily: 'Poppins, sans-serif',
                                                color: currentTheme.foreground
                                            }}
                                        >
                                            {series.synopsis || 'No synopsis available.'}
                                        </p>
                                    </div>

                                    {/* Trial Reading Button */}
                                    {series.show_trial_button && series.series_slug && (
                                        <div className="mt-6">
                                            <Link
                                                href={route('series.show', series.series_slug)}
                                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all interactive-scale"
                                                style={{
                                                    backgroundColor: currentTheme.foreground,
                                                    color: currentTheme.background,
                                                    fontFamily: 'Poppins, sans-serif'
                                                }}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                                Try Reading for Free
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Items List Container */}
                        <div 
                            className="border-t pt-8"
                            style={{ borderColor: `${currentTheme.foreground}20` }}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 
                                    className="text-2xl font-bold"
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
                                        className="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90"
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
                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div 
                                        key={item.id}
                                        className="border rounded-lg p-4 flex flex-col sm:flex-row gap-4 hover:shadow-lg transition-shadow duration-200"
                                        style={{ borderColor: `${currentTheme.foreground}20` }}
                                    >
                                        {/* Item Cover */}
                                        <div className="w-full sm:w-32 flex-shrink-0">
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
                                                className="text-xl font-bold mb-2"
                                                style={{ 
                                                    fontFamily: 'Poppins, sans-serif',
                                                    color: currentTheme.foreground
                                                }}
                                            >
                                                {item.title}
                                            </h3>

                                            <p 
                                                className="text-sm opacity-70 mb-3 line-clamp-3"
                                                style={{ 
                                                    fontFamily: 'Poppins, sans-serif',
                                                    color: currentTheme.foreground
                                                }}
                                            >
                                                {item.summary || 'No summary available.'}
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <p 
                                                    className="text-2xl font-bold"
                                                    style={{ 
                                                        fontFamily: 'Poppins, sans-serif',
                                                        color: '#f59e0b'
                                                    }}
                                                >
                                                    ¢{item.price_coins.toLocaleString()}
                                                </p>

                                                {item.is_purchased ? (
                                                    <button
                                                        onClick={() => downloadItem(item.id)}
                                                        className="px-6 py-2 rounded-lg font-semibold transition-all duration-200 hover:opacity-90"
                                                        style={{
                                                            backgroundColor: '#10b981',
                                                            color: 'white',
                                                            fontFamily: 'Poppins, sans-serif'
                                                        }}
                                                    >
                                                        Download Epub
                                                    </button>
                                                ) : item.is_in_cart ? (
                                                    <button
                                                        disabled
                                                        className="px-6 py-2 rounded-lg font-semibold opacity-50 cursor-not-allowed"
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
                                                        className="px-6 py-2 rounded-lg font-semibold transition-all duration-200 hover:opacity-90"
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
