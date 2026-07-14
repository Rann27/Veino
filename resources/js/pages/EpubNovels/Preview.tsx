import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
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
    const [showNavbar, setShowNavbar]           = useState(true);
    const [showReaderSettings, setShowReaderSettings] = useState(false);
    const [showToc, setShowToc]                 = useState(false);
    const [readingProgress, setReadingProgress] = useState(0);
    const [isMobileViewport, setIsMobileViewport] = useState(false);
    const [copiedId, setCopiedId]               = useState<string | null>(null);
    const readerSettingsButtonRef = useRef<HTMLButtonElement>(null);
    const hideDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fg = currentTheme.foreground;
    const bg = currentTheme.background;
    const { auth } = usePage().props as any;
    const isAdmin = auth?.user?.role === 'admin';

    const effectiveContentWidth = isMobileViewport ? 95 : readerSettings.contentWidth;

    // ── viewport ───────────────────────────────────────────────────────────
    useEffect(() => {
        const sync = () => setIsMobileViewport(window.innerWidth <= 768);
        sync();
        window.addEventListener('resize', sync);
        return () => window.removeEventListener('resize', sync);
    }, []);

    // ── scroll hide/show ───────────────────────────────────────────────────
    useEffect(() => {
        let lastY = 0;
        const handleScroll = () => {
            const cur = window.scrollY;
            if (cur < 10) {
                clearTimeout(hideDelayTimerRef.current!);
                setShowNavbar(true);
            } else if (cur > lastY && cur > 100) {
                clearTimeout(hideDelayTimerRef.current!);
                hideDelayTimerRef.current = setTimeout(() => setShowNavbar(false), 1000);
            } else if (cur < lastY) {
                clearTimeout(hideDelayTimerRef.current!);
                setShowNavbar(true);
            }
            lastY = cur;
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => { window.removeEventListener('scroll', handleScroll); clearTimeout(hideDelayTimerRef.current!); };
    }, []);

    // ── reading progress ───────────────────────────────────────────────────
    useEffect(() => {
        const update = () => {
            const d = document.documentElement.scrollHeight - window.innerHeight;
            setReadingProgress(d > 0 ? Math.round((window.scrollY / d) * 100) : 0);
        };
        window.addEventListener('scroll', update, { passive: true });
        return () => window.removeEventListener('scroll', update);
    }, []);

    // ── process content: sanitize + inject heading IDs ─────────────────────
    const processedContent = useMemo(() => {
        const safe = sanitizeColorStyles(item.preview_content ?? '');
        let idx = 0;
        return safe.replace(/<h1(\s[^>]*)?>/gi, (_m, attrs) => {
            return `<h1${attrs || ''} id="epub-h1-${idx++}">`;
        });
    }, [item.preview_content]);

    // ── extract headings for TOC ───────────────────────────────────────────
    const headings = useMemo(() => {
        const results: { id: string; text: string }[] = [];
        const regex = /<h1[^>]*\sid="(epub-h1-\d+)"[^>]*>([\s\S]*?)<\/h1>/gi;
        let match;
        while ((match = regex.exec(processedContent)) !== null) {
            results.push({
                id: match[1],
                text: match[2].replace(/<[^>]+>/g, '').trim(),
            });
        }
        return results;
    }, [processedContent]);

    // ── auto-scroll from URL hash on load ─────────────────────────────────
    useEffect(() => {
        const hash = window.location.hash;
        if (!hash.startsWith('#epub-h1-')) return;
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const el = document.getElementById(hash.slice(1));
            if (el) {
                const top = el.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        }));
    }, [processedContent]);

    const jumpTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top, behavior: 'smooth' });
            // Update URL hash without page reload
            history.replaceState(null, '', `#${id}`);
        }
        setShowToc(false);
    };

    const copyLink = (id: string) => {
        const url = `${window.location.origin}${window.location.pathname}#${id}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    return (
        <>
            <Head title={`Preview: ${item.title} — ${series.title}`} />

            {/* Reading Progress Bar */}
            <div className="reading-progress-bar"
                style={{ width: `${readingProgress}%`, top: 'auto', bottom: showNavbar ? '64px' : '0' }} />

            {/* Sticky Back Button */}
            <div className={`fixed top-3 left-3 sm:top-4 sm:left-4 z-50 transition-all duration-500 ${
                showNavbar ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
            }`}>
                <Link href={route('epub-novels.show', series.slug)}
                    className="w-10 h-10 flex items-center justify-center rounded-full shadow-lg transition-all reading-bar-btn"
                    style={{ color: fg, backgroundColor: `${bg}D9`, border: `1px solid ${fg}15`, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                    aria-label="Back to series">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
            </div>

            {/* ── TOC Modal ──────────────────────────────────────────────── */}
            {showToc && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                    onClick={e => { if (e.target === e.currentTarget) setShowToc(false); }}>
                    <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col mb-16 sm:mb-0"
                        style={{ backgroundColor: bg, border: `1px solid ${fg}15`, maxHeight: '70vh' }}>

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
                            style={{ borderColor: `${fg}10` }}>
                            <h2 className="text-sm font-bold" style={{ color: fg }}>Table of Contents</h2>
                            <button onClick={() => setShowToc(false)} className="p-1 rounded-lg opacity-50 hover:opacity-100 transition-opacity" style={{ color: fg }}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto flex-1 py-2">
                            {headings.length === 0 ? (
                                <p className="text-center py-8 text-sm" style={{ color: `${fg}50` }}>No headings found</p>
                            ) : headings.map((h, i) => (
                                <div key={h.id} className="flex items-center group"
                                    style={{ borderBottom: `1px solid ${fg}06` }}>
                                    {/* Jump button */}
                                    <button
                                        onClick={() => jumpTo(h.id)}
                                        className="flex-1 text-left flex items-center gap-3 px-5 py-3 transition-opacity hover:opacity-70"
                                        style={{ color: fg }}
                                    >
                                        <span className="text-xs font-bold w-5 flex-shrink-0 opacity-30">{i + 1}</span>
                                        <span className="text-sm leading-snug">{h.text}</span>
                                    </button>
                                    {/* Copy link button — admin only */}
                                    {isAdmin && (
                                        <button
                                            onClick={() => copyLink(h.id)}
                                            className="flex-shrink-0 px-3 py-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{ color: copiedId === h.id ? '#22c55e' : `${fg}50` }}
                                            title="Copy link to this section"
                                        >
                                            {copiedId === h.id ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                </svg>
                                            )}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Bottom Reading Bar ──────────────────────────────────────── */}
            <div className={`fixed bottom-0 left-0 right-0 z-50 border-t transition-all duration-500 ${
                showNavbar ? 'translate-y-0' : 'translate-y-full'
            }`}
                style={{
                    backgroundColor: `${bg}E6`,
                    borderColor: `${fg}20`,
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                }}>
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Left: back link */}
                        <Link href={route('epub-novels.show', series.slug)}
                            className="flex items-center gap-2 font-medium transition-all reading-bar-btn px-2 py-1.5 rounded-lg text-sm"
                            style={{ color: `${fg}80` }}>
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

                        {/* Right: TOC + reader settings */}
                        <div className="flex items-center gap-1">
                            {/* Burger / TOC button — only if there are headings */}
                            {headings.length > 0 && (
                                <button
                                    onClick={() => setShowToc(o => !o)}
                                    className="h-10 w-10 flex items-center justify-center rounded-lg transition-all reading-bar-btn"
                                    style={{ color: showToc ? '#a78bfa' : fg }}
                                    title="Table of contents"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
                                    </svg>
                                </button>
                            )}

                            {/* Settings */}
                            <button
                                ref={readerSettingsButtonRef}
                                onClick={() => setShowReaderSettings(o => !o)}
                                className="h-10 w-10 flex items-center justify-center rounded-lg transition-all reading-bar-btn"
                                style={{ color: fg }}
                                title="Reader settings"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main Content ────────────────────────────────────────────── */}
            <div className="min-h-screen pt-4 pb-24" style={{ backgroundColor: bg }}>
                <div className="mx-auto px-4 sm:px-8 lg:px-12 py-10 rounded-2xl"
                    style={{
                        maxWidth: `${effectiveContentWidth}%`,
                        width: '100%',
                        backgroundColor: `${fg}03`,
                        border: `1px solid ${fg}08`,
                        boxShadow: `0 4px 24px ${fg}04`,
                    }}>

                    {/* Item Header */}
                    <div className="mb-10 text-center">
                        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: `${fg}50` }}>Preview</p>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: fg }}>{item.title}</h1>
                        <Link href={route('epub-novels.show', series.slug)} className="text-sm hover:underline" style={{ color: `${fg}60` }}>
                            {series.title}
                        </Link>
                    </div>

                    {/* Content */}
                    <div
                        className="chapter-content prose max-w-none"
                        style={{
                            color: fg,
                            fontSize: `${readerSettings.fontSize}px`,
                            lineHeight: readerSettings.lineHeight,
                            fontFamily: readerSettings.fontFamily,
                        }}
                        dangerouslySetInnerHTML={{ __html: processedContent }}
                    />

                    {/* End-of-preview CTA */}
                    <div className="mt-12 pt-8 border-t text-center" style={{ borderColor: `${fg}12` }}>
                        <p className="text-sm mb-4" style={{ color: `${fg}60` }}>— End of Preview —</p>
                        <Link href={route('epub-novels.show', series.slug)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                            style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
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
