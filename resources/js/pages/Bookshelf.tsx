import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme } from '@/Contexts/ThemeContext';

interface PurchasedItem {
    id: number;
    title: string;
    cover_url: string;
    purchased_at: string;
}

interface SeriesGroup {
    series_id: number;
    series_title: string;
    series_slug: string;
    series_cover: string;
    items: PurchasedItem[];
}

interface Props {
    seriesGroups: SeriesGroup[];
}

function BookshelfContent({ seriesGroups }: Props) {
    const { currentTheme } = useTheme();
    const [downloadingIds, setDownloadingIds] = useState<number[]>([]);

    const downloadItem = (itemId: number) => {
        setDownloadingIds(prev => [...prev, itemId]);

        // Create temporary link to trigger download
        const link = document.createElement('a');
        link.href = route('ebook.download', itemId);
        link.download = 'ebook.epub';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Remove from downloading state after 2 seconds
        setTimeout(() => {
            setDownloadingIds(prev => prev.filter(id => id !== itemId));
        }, 2000);
    };

    return (
        <>
            <Head title="My Bookshelf" />

            <div className="min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <h1 
                        className="text-3xl md:text-4xl font-bold mb-8"
                        style={{ 
                            fontFamily: 'Poppins, sans-serif',
                            color: currentTheme.foreground
                        }}
                    >
                        My Bookshelf
                    </h1>

                    {seriesGroups.length > 0 ? (
                        <div className="space-y-6">
                            {seriesGroups.map((group) => (
                                <div 
                                    key={group.series_id}
                                    className="border rounded-lg overflow-hidden"
                                    style={{ borderColor: `${currentTheme.foreground}20` }}
                                >
                                    {/* Series Header */}
                                    <div 
                                        className="p-4 border-b flex items-center gap-4"
                                        style={{ 
                                            backgroundColor: `${currentTheme.foreground}05`,
                                            borderColor: `${currentTheme.foreground}20`
                                        }}
                                    >
                                        <img
                                            src={group.series_cover}
                                            alt={group.series_title}
                                            className="w-16 h-16 rounded-lg object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = '/images/default-cover.jpg';
                                            }}
                                        />
                                        <div className="flex-1">
                                            <h2 
                                                className="text-xl font-bold"
                                                style={{ 
                                                    fontFamily: 'Poppins, sans-serif',
                                                    color: currentTheme.foreground
                                                }}
                                            >
                                                {group.series_title}
                                            </h2>
                                            <p 
                                                className="text-sm opacity-70"
                                                style={{ 
                                                    fontFamily: 'Poppins, sans-serif',
                                                    color: currentTheme.foreground
                                                }}
                                            >
                                                {group.items.length} {group.items.length === 1 ? 'item' : 'items'} owned
                                            </p>
                                        </div>
                                    </div>

                                    {/* Items Grid */}
                                    <div className="p-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {group.items.map((item) => (
                                                <div 
                                                    key={item.id}
                                                    className="border rounded-lg p-3 flex gap-3 hover:shadow-lg transition-all duration-200"
                                                    style={{ borderColor: `${currentTheme.foreground}15` }}
                                                >
                                                    {/* Cover */}
                                                    <div className="w-16 flex-shrink-0">
                                                        <img
                                                            src={item.cover_url}
                                                            alt={item.title}
                                                            className="w-full rounded"
                                                            onError={(e) => {
                                                                e.currentTarget.src = '/images/default-cover.jpg';
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0 flex flex-col">
                                                        <h3 
                                                            className="text-sm font-bold mb-1 line-clamp-2"
                                                            style={{ 
                                                                fontFamily: 'Poppins, sans-serif',
                                                                color: currentTheme.foreground
                                                            }}
                                                        >
                                                            {item.title}
                                                        </h3>

                                                        <p 
                                                            className="text-xs opacity-60 mb-2"
                                                            style={{ 
                                                                fontFamily: 'Poppins, sans-serif',
                                                                color: currentTheme.foreground
                                                            }}
                                                        >
                                                            Purchased: {new Date(item.purchased_at).toLocaleDateString()}
                                                        </p>

                                                        <button
                                                            onClick={() => downloadItem(item.id)}
                                                            disabled={downloadingIds.includes(item.id)}
                                                            className="mt-auto px-3 py-1.5 rounded font-semibold text-xs transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                                                            style={{
                                                                backgroundColor: '#f59e0b',
                                                                color: 'white',
                                                                fontFamily: 'Poppins, sans-serif'
                                                            }}
                                                        >
                                                            {downloadingIds.includes(item.id) ? (
                                                                <span className="flex items-center justify-center gap-2">
                                                                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                    </svg>
                                                                    Downloading...
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center justify-center gap-1">
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                    </svg>
                                                                    Download
                                                                </span>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <svg 
                                className="w-24 h-24 mx-auto mb-4 opacity-30"
                                style={{ color: currentTheme.foreground }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>

                            <h2 
                                className="text-2xl font-bold mb-2"
                                style={{ 
                                    fontFamily: 'Poppins, sans-serif',
                                    color: currentTheme.foreground
                                }}
                            >
                                Your bookshelf is empty
                            </h2>

                            <p 
                                className="text-base opacity-70 mb-6"
                                style={{ 
                                    fontFamily: 'Poppins, sans-serif',
                                    color: currentTheme.foreground
                                }}
                            >
                                Purchase some ebooks to start your collection!
                            </p>

                            <a
                                href={route('epub-novels.index')}
                                className="inline-block px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:opacity-90"
                                style={{
                                    backgroundColor: '#f59e0b',
                                    color: 'white',
                                    fontFamily: 'Poppins, sans-serif'
                                }}
                            >
                                Browse Epub Novels
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default function Bookshelf(props: Props) {
    return (
        <UserLayout>
            <BookshelfContent {...props} />
        </UserLayout>
    );
}
