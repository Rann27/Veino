import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Head, Link } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme } from '@/Contexts/ThemeContext';

const ReaderSettingsModal = lazy(() => import('@/Components/ReaderSettingsModal'));

const sanitizeColorStyles = (html: string): string => {
    if (!html) return '';
    return html
        .replace(/style="[^"]*color:\s*[^;"]+;?[^"]*"/gi, (match) => {
            const styleContent = match.match(/style="([^"]*)"/i)?.[1] || '';
            const filtered = styleContent
                .split(';')
                .filter(s => !s.trim().startsWith('color'))
                .filter(s => s.trim().length > 0)
                .join(';');
            return filtered ? `style="${filtered}"` : '';
        })
        .replace(/color:\s*[^;"]+;?/gi, '');
};

interface Series {
    id: number;
    title: string;
    slug: string;
}

interface Item {
    id: number;
    title: string;
    order: number;
    preview_content: string;
}

interface Props {
    series: Series;
    item: Item;
}

function PreviewContent({ series, item }: Props) {
    const { currentTheme, readerSettings } = useTheme();
    const [showNavbar, setShowNavbar] = useState(true);
    const [showReaderSettings, setShowReaderSettings] = useState(false);
    const [readingProgress, setReadingProgress] = useState(0);
    const [isMobileViewport, setIsMobileViewport] = useState(false);
    const readerSettingsButtonRef = useRef<HTMLButtonElement>(null);
    const hideDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const effectiveContentWidth = isMobileViewport ? 95 : readerSettings.contentWidth;

    useEffect(() => {
        const sync = () => setIsMobileViewport(window.innerWidth <= 768);
        sync();
        window.addEventListener('resize', sync);
        return () => window.removeEventListener('resize', sync);
    }, []);

    useEffect(() => {
        let lastY = 0;
        const handleScroll = () => {
            const cur = window.scrollY;
            if (cur < 10) {
                if (hideDelayTimerRef.current) { clearTimeout(hideDelayTimerRef.current); hideDelayTimerRef.current = null; }
                setShowNavbar(true);
            } else if (cur > lastY && cur > 100) {
                if (hideDelayTimerRef.current) clearTimeout(hideDelayTimerRef.current);
                hideDelayTimerRef.current = setTimeout(() => setShowNavbar(false), 1000);
            } else if (cur < lastY) {
                if (hideDelayTimerRef.current) { clearTimeout(hideDelayTimerRef.current); hideDelayTimerRef.current = null; }
                setShowNavbar(true);
            }
            lastY = cur;
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (hideDelayTimerRef.current) clearTimeout(hideDelayTimerRef.current);
        };
    }, []);

    useEffect(() => {
        const update = () => {
            const scrollTop = window.scrollY;
            const docH = document.documentElement.scrollHeight - window.innerHeight;
            setReadingProgress(docH > 0 ? Math.round((scrollTop / docH) * 100) : 0);
        };
        window.addEventListener('scroll', update, { passive: true });
        return () => window.removeEventListener('scroll', update);
    }, []);

    const safeContent = sanitizeColorStyles(item.preview_content ?? '');

    return (
        <>
            <Head title={`Preview: ${item.title} — ${series.title}`} />

            {/* Reading Progress Bar */}
            <div
                className="reading-progress-bar"
                style={{ width: `${readingProgress}%`, top: 'auto', bottom: showNavbar ? '64px' : '0' }}
            />

            {/* Sticky Back Button (top-left) */}
            <div
                className={`fixed top-3 left-3 sm:top-4 sm:left-4 z-50 transition-all duration-500 ease-in-out ${
                    showNavbar ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
                }`}
            >
                <Link
                    href={route('epub-novels.show', series.slug)}
                    className="w-10 h-10 flex items-center justify-center rounded-full shadow-lg transition-all reading-bar-btn"
                    style={{
                        color: currentTheme.foreground,
                        backgroundColor: `${currentTheme.background}D9`,
                        border: `1px solid ${currentTheme.foreground}15`,
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                    }}
                    aria-label="Back to series"
                    title="Back to series"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
            </div>

            {/* Bottom Reading Bar — only back + settings, no prev/next/list */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-50 border-t transition-all duration-500 ease-in-out ${
                    showNavbar ? 'translate-y-0' : 'translate-y-full'
                }`}
                style={{
                    backgroundColor: `${currentTheme.background}E6`,
                    borderColor: `${currentTheme.foreground}20`,
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                }}
            >
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Left: back link + title */}
                        <Link
                            href={route('epub-novels.show', series.slug)}
                            className="flex items-center gap-2 font-medium transition-all reading-bar-btn px-2 py-1.5 rounded-lg text-sm"
                            style={{ color: `${currentTheme.foreground}80` }}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="hidden sm:inline">{series.title}</span>
                            <span className="sm:hidden">Back</span>
                        </Link>

                        {/* Center: preview badge */}
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                            </svg>
                            Preview
                        </div>

                        {/* Right: reader settings */}
                        <button
                            ref={readerSettingsButtonRef}
                            onClick={() => setShowReaderSettings(o => !o)}
                            className="h-10 w-10 flex items-center justify-center rounded-lg transition-all reading-bar-btn"
                            style={{ color: currentTheme.foreground }}
                            title="Reader settings"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="min-h-screen pt-4 pb-24" style={{ backgroundColor: currentTheme.background }}>
                <div
                    className="mx-auto px-4 sm:px-8 lg:px-12 py-10 rounded-2xl"
                    style={{
                        maxWidth: `${effectiveContentWidth}%`,
                        width: '100%',
                        backgroundColor: `${currentTheme.foreground}03`,
                        border: `1px solid ${currentTheme.foreground}08`,
                        boxShadow: `0 4px 24px ${currentTheme.foreground}04`,
                    }}
                >
                    {/* Item Header */}
                    <div className="mb-10 text-center">
                        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: `${currentTheme.foreground}50` }}>
                            Preview
                        </p>
                        <h1
                            className="text-2xl sm:text-3xl font-bold mb-2"
                            style={{ color: currentTheme.foreground }}
                        >
                            {item.title}
                        </h1>
                        <Link
                            href={route('epub-novels.show', series.slug)}
                            className="text-sm hover:underline"
                            style={{ color: `${currentTheme.foreground}60` }}
                        >
                            {series.title}
                        </Link>
                    </div>

                    {/* Preview Content */}
                    <div
                        className="chapter-content prose max-w-none"
                        style={{
                            color: currentTheme.foreground,
                            fontSize: `${readerSettings.fontSize}px`,
                            lineHeight: readerSettings.lineHeight,
                            fontFamily: readerSettings.fontFamily,
                        }}
                        dangerouslySetInnerHTML={{ __html: safeContent }}
                    />

                    {/* End-of-preview CTA */}
                    <div
                        className="mt-12 pt-8 border-t text-center"
                        style={{ borderColor: `${currentTheme.foreground}12` }}
                    >
                        <p className="text-sm mb-4" style={{ color: `${currentTheme.foreground}60` }}>
                            — End of Preview —
                        </p>
                        <Link
                            href={route('epub-novels.show', series.slug)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                            style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}
                        >
                            Get full volume →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Reader Settings Modal */}
            <Suspense fallback={null}>
                <ReaderSettingsModal
                    isOpen={showReaderSettings}
                    onClose={() => setShowReaderSettings(false)}
                    triggerElement={readerSettingsButtonRef.current}
                />
            </Suspense>
        </>
    );
}

export default function Preview(props: Props) {
    return (
        <UserLayout hideMobileBottomNav hideSiteChrome>
            <PreviewContent {...props} />
        </UserLayout>
    );
}
