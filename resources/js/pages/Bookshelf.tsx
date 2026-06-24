import React, { useState, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import CoverImage from '@/Components/CoverImage';

function useDragScroll() {
    const ref = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const moved = useRef(false);
    const onMouseDown = (e: React.MouseEvent) => {
        dragging.current = true; moved.current = false;
        startX.current = e.pageX - (ref.current?.offsetLeft ?? 0);
        scrollLeft.current = ref.current?.scrollLeft ?? 0;
        if (ref.current) ref.current.style.cursor = 'grabbing';
    };
    const onMouseMove = (e: React.MouseEvent) => {
        if (!dragging.current) return;
        const walk = e.pageX - (ref.current?.offsetLeft ?? 0) - startX.current;
        if (Math.abs(walk) > 4) moved.current = true;
        if (ref.current) ref.current.scrollLeft = scrollLeft.current - walk;
    };
    const onMouseUp = () => { dragging.current = false; if (ref.current) ref.current.style.cursor = 'grab'; };
    const onClickCapture = (e: React.MouseEvent) => { if (moved.current) e.preventDefault(); };
    return { ref, onMouseDown, onMouseMove, onMouseUp, onMouseLeave: onMouseUp, onClickCapture };
}

interface PurchasedItem {
    id: number;
    title: string;
    cover_url: string;
    purchased_at: string;
    can_download: boolean;
    can_download_pdf: boolean;
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

function DownloadIcon() {
    return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
    );
}

function SpinIcon() {
    return (
        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    );
}

function ItemsRow({ items, downloadingIds, onDownload, onDownloadPdf }: {
    items: PurchasedItem[];
    downloadingIds: number[];
    onDownload: (id: number) => void;
    onDownloadPdf: (id: number) => void;
}) {
    const { currentTheme } = useTheme();
    const drag = useDragScroll();

    return (
        <div className="p-4">
            <div
                ref={drag.ref}
                className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide select-none"
                style={{ scrollbarWidth: 'none', cursor: items.length > 1 ? 'grab' : 'default' }}
                onMouseDown={drag.onMouseDown}
                onMouseMove={drag.onMouseMove}
                onMouseUp={drag.onMouseUp}
                onMouseLeave={drag.onMouseLeave}
                onClickCapture={drag.onClickCapture}
            >
                {items.map(item => (
                    <div
                        key={item.id}
                        className="flex-shrink-0 w-96 border rounded-lg p-3 flex gap-3 hover:shadow-lg transition-all duration-200"
                        style={{ borderColor: `${currentTheme.foreground}15` }}
                    >
                        {/* Cover */}
                        <div className="w-16 flex-shrink-0">
                            <CoverImage
                                src={item.cover_url}
                                alt={item.title}
                                containerClassName="rounded"
                                hoverScale={false}
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col">
                            <h3
                                className="text-sm font-bold mb-1 line-clamp-2"
                                style={{ fontFamily: 'Poppins, sans-serif', color: currentTheme.foreground }}
                            >
                                {item.title}
                            </h3>
                            <p className="text-xs opacity-60 mb-2" style={{ fontFamily: 'Poppins, sans-serif', color: currentTheme.foreground }}>
                                Purchased: {new Date(item.purchased_at).toLocaleDateString()}
                            </p>
                            <div className="flex gap-2 mt-auto">
                                {item.can_download && (
                                    <button
                                        onClick={() => onDownload(item.id)}
                                        disabled={downloadingIds.includes(item.id)}
                                        className="flex-1 px-3 py-1.5 rounded font-semibold text-xs transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1"
                                        style={{ backgroundColor: '#8b5cf6', color: 'white', fontFamily: 'Poppins, sans-serif' }}
                                    >
                                        {downloadingIds.includes(item.id) ? <SpinIcon /> : <DownloadIcon />}
                                        EPUB
                                    </button>
                                )}
                                {item.can_download_pdf && (
                                    <button
                                        onClick={() => onDownloadPdf(item.id)}
                                        disabled={downloadingIds.includes(item.id)}
                                        className="flex-1 px-3 py-1.5 rounded font-semibold text-xs transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1"
                                        style={{ backgroundColor: '#f59e0b', color: 'white', fontFamily: 'Poppins, sans-serif' }}
                                    >
                                        {downloadingIds.includes(item.id) ? <SpinIcon /> : <DownloadIcon />}
                                        PDF
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function BookshelfContent({ seriesGroups }: Props) {
    const { currentTheme } = useTheme();
    const [downloadingIds, setDownloadingIds] = useState<number[]>([]);
    const [query, setQuery] = useState('');

    const filtered = query.length >= 3
        ? seriesGroups.filter(g => g.series_title.toLowerCase().includes(query.toLowerCase()))
        : seriesGroups;

    const triggerDownload = (href: string, filename: string, itemId: number) => {
        setDownloadingIds(prev => [...prev, itemId]);
        const link = document.createElement('a');
        link.href = href;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => setDownloadingIds(prev => prev.filter(id => id !== itemId)), 2000);
    };

    const downloadItem = (itemId: number) => triggerDownload(route('ebook.download', itemId), 'ebook.epub', itemId);
    const downloadPdf = (itemId: number) => triggerDownload(route('ebook.download.pdf', itemId), 'ebook.pdf', itemId);

    return (
        <>
            <Head title="My Bookshelf" />

            <div className="min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {/* Header + Search */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
                        <h1
                            className="text-3xl md:text-4xl font-bold flex-1"
                            style={{ fontFamily: 'Poppins, sans-serif', color: currentTheme.foreground }}
                        >
                            My Bookshelf
                        </h1>

                        {seriesGroups.length > 0 && (
                            <div className="relative w-full sm:w-72">
                                <svg
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                                    style={{ color: `${currentTheme.foreground}50` }}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Search series… (min. 3 chars)"
                                    className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm outline-none transition-all"
                                    style={{
                                        background: `${currentTheme.foreground}08`,
                                        border: `1px solid ${currentTheme.foreground}20`,
                                        color: currentTheme.foreground,
                                        fontFamily: 'Poppins, sans-serif',
                                    }}
                                />
                                {query.length > 0 && (
                                    <button
                                        onClick={() => setQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                        style={{ color: `${currentTheme.foreground}50`, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {seriesGroups.length > 0 ? (
                        <div className="space-y-6">
                            {filtered.length === 0 && query.length >= 3 && (
                                <div className="text-center py-10 text-sm opacity-50" style={{ color: currentTheme.foreground }}>
                                    No series found for "{query}"
                                </div>
                            )}
                            {filtered.map(group => (
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
                                            borderColor: `${currentTheme.foreground}20`,
                                        }}
                                    >
                                        <CoverImage
                                            src={group.series_cover}
                                            alt={group.series_title}
                                            aspectClass=""
                                            containerClassName="w-16 h-16 rounded-lg flex-shrink-0"
                                            hoverScale={false}
                                        />
                                        <div className="flex-1">
                                            <Link
                                                href={`/ebookseries/${group.series_slug}`}
                                                className="text-xl font-bold hover:underline"
                                                style={{ fontFamily: 'Poppins, sans-serif', color: currentTheme.foreground }}
                                            >
                                                {group.series_title}
                                            </Link>
                                            <p className="text-sm opacity-70" style={{ fontFamily: 'Poppins, sans-serif', color: currentTheme.foreground }}>
                                                {group.items.length} {group.items.length === 1 ? 'item' : 'items'} owned
                                            </p>
                                        </div>
                                    </div>

                                    {/* Items — horizontal scroll row */}
                                    <ItemsRow
                                        items={group.items}
                                        downloadingIds={downloadingIds}
                                        onDownload={downloadItem}
                                        onDownloadPdf={downloadPdf}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <svg
                                className="w-24 h-24 mx-auto mb-4 opacity-30"
                                style={{ color: currentTheme.foreground }}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif', color: currentTheme.foreground }}>
                                Your bookshelf is empty
                            </h2>
                            <p className="text-base opacity-70 mb-6" style={{ fontFamily: 'Poppins, sans-serif', color: currentTheme.foreground }}>
                                Purchase some ebooks to start your collection!
                            </p>
                            <a
                                href={route('epub-novels.index')}
                                className="inline-block px-6 py-3 rounded-lg font-semibold transition-all hover:opacity-90"
                                style={{ backgroundColor: '#f59e0b', color: 'white', fontFamily: 'Poppins, sans-serif' }}
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
