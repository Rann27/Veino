import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme, SHINY_PURPLE } from '@/Contexts/ThemeContext';
import { useToast } from '@/Contexts/ToastContext';
import CommentSectionSkeleton from '@/Components/CommentSectionSkeleton';
import PremiumDiamond from '@/Components/PremiumDiamond';
import InTextAd from '@/Components/Ads/InTextAd';
import InterstitialAd from '@/Components/Ads/InterstitialAd';
import axios from 'axios';
const ReaderSettingsModal = lazy(() => import('@/Components/ReaderSettingsModal'));
const CommentSection = lazy(() => import('@/Components/CommentSection'));
const ReactionBar = lazy(() => import('@/Components/ReactionBar'));

// ── sanitize colour styles ─────────────────────────────────────────────────
const sanitizeColorStyles = (html: string): string => {
    if (!html) return '';
    return html
        .replace(/style="[^"]*color:\s*[^;"]+;?[^"]*"/gi, (match) => {
            const styleContent = match.match(/style="([^"]*)"/i)?.[1] || '';
            const filteredStyles = styleContent
                .split(';')
                .filter(style => !style.trim().startsWith('color'))
                .filter(style => style.trim().length > 0)
                .join(';');
            return filteredStyles ? `style="${filteredStyles}"` : '';
        })
        .replace(/color:\s*[^;"]+;?/gi, '');
};

// ── add data-p-index to <p> tags ───────────────────────────────────────────
function addParagraphIndices(html: string): string {
    let idx = 0;
    return html.replace(/<p(\s[^>]*)?>/gi, (_match, attrs) => {
        return `<p${attrs || ''} data-p-index="${idx++}">`;
    });
}

// ── types ──────────────────────────────────────────────────────────────────
interface Series {
    id: number;
    title: string;
    slug: string;
    type?: 'light-novel' | 'web-novel';
}

interface Chapter {
    id: number;
    title: string;
    chapter_number: number;
    volume?: number;
    chapter_link: string;
    content: string | null;
    is_premium: boolean;
    coin_price: number;
}

interface NavigationChapter {
    chapter_link: string;
    title: string;
}

interface ChapterOption {
    chapter_link: string;
    chapter_number: number;
    volume?: number;
    title: string;
    is_premium: boolean;
}

interface MarkItem {
    id: number;
    paragraph_index: number;
    paragraph_preview: string;
}

interface SeriesMark extends MarkItem {
    chapter_id: number;
    chapter_title: string;
    chapter_number: number;
    chapter_link: string;
    chapter_volume?: number;
    created_at: string;
}

interface Props {
    series: Series;
    chapter: Chapter;
    canAccess: boolean;
    isPremiumMember: boolean;
    hasCoinPurchase: boolean;
    prevChapter: NavigationChapter | null;
    nextChapter: NavigationChapter | null;
    allChapters: ChapterOption[];
    marks: MarkItem[];
    auth?: {
        user?: {
            id: number;
            display_name: string;
            coins: number;
        };
    };
}

// ── floating toolbar ───────────────────────────────────────────────────────
interface ToolbarState {
    visible: boolean;
    pIndex: number;
    preview: string;
    top: number;
    left: number;
    width: number;
}

// ── marks modal ────────────────────────────────────────────────────────────
function MarksModal({
    seriesSlug, seriesTitle, onClose, onMarkDeleted, fg, bg, border, muted,
}: {
    seriesSlug: string; seriesTitle: string; onClose: () => void;
    onMarkDeleted: (id: number, chapterId: number, paragraphIndex: number) => void;
    fg: string; bg: string; border: string; muted: string;
}) {
    const [marks, setMarks] = useState<SeriesMark[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(route('marks.for-series', seriesSlug))
            .then(r => r.json())
            .then(data => { setMarks(data); setLoading(false); })
            .catch(() => { setMarks([]); setLoading(false); });
    }, [seriesSlug]);

    const handleDelete = async (m: SeriesMark) => {
        await fetch(route('marks.destroy', m.id), {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '' },
        });
        setMarks(prev => prev?.filter(x => x.id !== m.id) ?? []);
        onMarkDeleted(m.id, m.chapter_id, m.paragraph_index);
    };

    // Group by chapter
    const grouped = useMemo(() => {
        if (!marks) return [];
        const map = new Map<number, { chapter_title: string; chapter_link: string; chapter_number: number; chapter_volume?: number; items: SeriesMark[] }>();
        marks.forEach(m => {
            if (!map.has(m.chapter_id)) {
                map.set(m.chapter_id, {
                    chapter_title: m.chapter_title,
                    chapter_link: m.chapter_link,
                    chapter_number: m.chapter_number,
                    chapter_volume: m.chapter_volume,
                    items: [],
                });
            }
            map.get(m.chapter_id)!.items.push(m);
        });
        return Array.from(map.values());
    }, [marks]);

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
            {/* mb-16 = 64px — clears the bottom reading bar on mobile */}
            <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col mb-16 sm:mb-0"
                style={{ backgroundColor: bg, border: `1px solid ${border}`, maxHeight: '75vh' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
                    style={{ borderColor: border }}>
                    <div>
                        <h2 className="text-base font-bold" style={{ color: fg }}>Marks</h2>
                        <p className="text-xs mt-0.5" style={{ color: muted }}>{seriesTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: muted }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.6'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 py-2">
                    {loading && (
                        <div className="flex items-center justify-center py-12 gap-2" style={{ color: muted }}>
                            <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: `${fg}20`, borderTopColor: fg }} />
                            <span className="text-sm">Loading…</span>
                        </div>
                    )}
                    {!loading && grouped.length === 0 && (
                        <div className="text-center py-12" style={{ color: muted }}>
                            <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                            </svg>
                            <p className="text-sm font-medium">No marks yet</p>
                            <p className="text-xs mt-1 opacity-60">Click a paragraph while reading to mark it</p>
                        </div>
                    )}
                    {!loading && grouped.map(group => (
                        <div key={group.chapter_link} className="mb-1">
                            {/* Chapter label */}
                            <div className="px-5 py-2 sticky top-0" style={{ backgroundColor: `${bg}f0` }}>
                                <Link
                                    href={route('chapters.show', [seriesSlug, group.chapter_link])}
                                    onClick={onClose}
                                    className="text-xs font-bold hover:underline"
                                    style={{ color: SHINY_PURPLE }}
                                >
                                    {group.chapter_volume ? `Vol ${group.chapter_volume} ` : ''}Ch {group.chapter_number} — {group.chapter_title}
                                </Link>
                            </div>
                            {/* Marks in this chapter */}
                            {group.items.map(m => (
                                <div key={m.id} className="flex items-start gap-3 px-5 py-3 group"
                                    style={{ borderTop: `1px solid ${border}` }}>
                                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-50" fill="currentColor" viewBox="0 0 24 24"
                                        style={{ color: '#fbbf24' }}>
                                        <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                                    </svg>
                                    <Link
                                        href={route('chapters.show', [seriesSlug, m.chapter_link]) + `#mark-${m.paragraph_index}`}
                                        onClick={onClose}
                                        className="flex-1 min-w-0 block"
                                    >
                                        <p className="text-sm leading-relaxed line-clamp-3 hover:opacity-75 transition-opacity" style={{ color: fg }}>
                                            {m.paragraph_preview || <span style={{ color: muted }}>(no preview)</span>}
                                        </p>
                                        <p className="text-[10px] mt-1" style={{ color: muted }}>
                                            Paragraph {m.paragraph_index + 1}
                                        </p>
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(m)}
                                        className="flex-shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{ color: '#ef4444' }}
                                        title="Remove mark">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════
// Main Chapter Content
// ══════════════════════════════════════════════════════════════════════════
function ChapterShowContent({
    series, chapter, canAccess, isPremiumMember, hasCoinPurchase,
    prevChapter, nextChapter, allChapters, marks: initialMarks, auth,
}: Props) {
    const { currentTheme, readerSettings } = useTheme();
    const { confirm } = useToast();
    const [showNavbar, setShowNavbar]           = useState(true);
    const [showChapterList, setShowChapterList] = useState(false);
    const [showReaderSettings, setShowReaderSettings] = useState(false);
    const [showMarksModal, setShowMarksModal]   = useState(false);
    const readerSettingsButtonRef = useRef<HTMLButtonElement>(null);
    const hideDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [inTextAds, setInTextAds] = useState<Array<{id: number; caption: string; link_url: string}>>([]);
    const [readingProgress, setReadingProgress] = useState(0);
    const [isMobileViewport, setIsMobileViewport] = useState(false);
    const effectiveContentWidth = isMobileViewport ? 95 : readerSettings.contentWidth;

    // ── marks state ────────────────────────────────────────────────────────
    const [activeMarks, setActiveMarks] = useState<MarkItem[]>(initialMarks);
    const [toolbar, setToolbar] = useState<ToolbarState>({ visible: false, pIndex: -1, preview: '', top: 0, left: 0, width: 0 });
    const [markLoading, setMarkLoading] = useState(false);
    const isAuthenticated = !!auth?.user;
    const fg   = currentTheme.foreground;
    const bg   = currentTheme.background;
    const muted = `${fg}70`;
    const border = `${fg}15`;

    // ── viewport ───────────────────────────────────────────────────────────
    useEffect(() => {
        const sync = () => setIsMobileViewport(window.innerWidth <= 768);
        sync();
        window.addEventListener('resize', sync);
        return () => window.removeEventListener('resize', sync);
    }, []);

    // ── scroll hide/show navbar ────────────────────────────────────────────
    useEffect(() => {
        let lastY = 0;
        const handleScroll = () => {
            const y = window.scrollY;
            if (y < 10) { clearTimeout(hideDelayTimerRef.current!); setShowNavbar(true); }
            else if (y > lastY && y > 100) {
                if (hideDelayTimerRef.current) clearTimeout(hideDelayTimerRef.current);
                hideDelayTimerRef.current = setTimeout(() => setShowNavbar(false), 1000);
            } else if (y < lastY) { clearTimeout(hideDelayTimerRef.current!); setShowNavbar(true); }
            lastY = y;
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

    // ── close toolbar on scroll / outside click ────────────────────────────
    useEffect(() => {
        if (!toolbar.visible) return;
        const hide = () => setToolbar(t => ({ ...t, visible: false }));
        window.addEventListener('scroll', hide, { passive: true });
        return () => window.removeEventListener('scroll', hide);
    }, [toolbar.visible]);

    // ── in-text ads ────────────────────────────────────────────────────────
    const isAdFree = isPremiumMember || (hasCoinPurchase && chapter.is_premium);
    useEffect(() => {
        if (!isAdFree) {
            axios.get('/api/ads/in-text/random', { params: { count: 5 } })
                .then(r => {
                    if (r.data?.ads) {
                        setInTextAds(r.data.ads);
                        r.data.ads.forEach((ad: any) => axios.post(`/api/ads/${ad.id}/track-impression`).catch(() => {}));
                    }
                }).catch(() => {});
        }
    }, [isAdFree]);

    useEffect(() => {
        const handleAdClick = (e: MouseEvent) => {
            const t = e.target as HTMLElement;
            if (t.classList.contains('in-text-ad-link')) {
                const id = t.getAttribute('data-ad-id');
                if (id) axios.post(`/api/ads/${id}/track-click`).catch(() => {});
            }
        };
        document.addEventListener('click', handleAdClick);
        return () => document.removeEventListener('click', handleAdClick);
    }, []);

    // ── inject ads helper ──────────────────────────────────────────────────
    const injectInTextAds = (content: string): string => {
        if (isAdFree || inTextAds.length === 0) return content;
        const paragraphs = content.split(/<\/p>/gi);
        let lineCount = 0, adIndex = 0;
        const result: string[] = [];
        paragraphs.forEach((para, index) => {
            if (para.trim()) {
                result.push(para + (index < paragraphs.length - 1 ? '</p>' : ''));
                lineCount++;
                if (lineCount % 40 === 0 && adIndex < inTextAds.length) {
                    const ad = inTextAds[adIndex];
                    result.push(`<p style="margin-bottom:1.5em"><a href="${ad.link_url}" target="_blank" rel="noopener noreferrer" data-ad-id="${ad.id}" class="in-text-ad-link" style="color:#a78bfa;text-decoration:none" onmouseover="this.style.color='#c084fc';this.style.textDecoration='underline'" onmouseout="this.style.color='#a78bfa';this.style.textDecoration='none'">${ad.caption} <span style="opacity:.7;font-size:.9em">[AD]</span></a></p>`);
                    adIndex++;
                }
            }
        });
        return result.join('');
    };

    // ── processed content (memoized, with paragraph indices) ───────────────
    const processedContent = useMemo(() => {
        const content = chapter.content ?? '';
        const hasHtml = /<(p|div|h[1-6]|ul|ol|blockquote|figure)\b/i.test(content);
        let html: string;

        if (hasHtml) {
            let p = sanitizeColorStyles(content);
            p = p.replace(/style\s*=\s*["']([^"']*)["']/gi, (_m, sc) => {
                const cleaned = sc.replace(/font-family\s*:[^;]+;?/gi, '').replace(/font-size\s*:[^;]+;?/gi, '').trim();
                return cleaned ? `style="${cleaned}"` : '';
            });
            p = p.replace(/<(p|h[1-6]|li|blockquote|figcaption)(\s[^>]*)?>/gi, (_m, tag, attrs) => {
                const styles = [
                    `margin-bottom:${readerSettings.paragraphSpacing}em`,
                    'margin-top:0',
                    `text-align:${readerSettings.textAlign}`,
                    readerSettings.hyphenation ? 'hyphens:auto' : 'hyphens:none',
                    tag === 'p' && readerSettings.textIndent > 0 ? `text-indent:${readerSettings.textIndent}em` : '',
                ].filter(Boolean).join(';');
                const ea = attrs || '';
                return /style\s*=/i.test(ea)
                    ? `<${tag}${ea.replace(/style\s*=\s*["']([^"']*)["']/i, `style="${styles};$1"`)}`
                    : `<${tag}${ea} style="${styles}">`;
            });
            html = p;
        } else {
            html = content.split(/\n\s*\n/).map((para, i) => {
                const fp = para.trim().replace(/\n/g, '<br>');
                return `<p style="margin-bottom:${readerSettings.paragraphSpacing}em;margin-top:0;text-align:${readerSettings.textAlign};${readerSettings.hyphenation ? 'hyphens:auto;' : ''}${i > 0 && readerSettings.textIndent > 0 ? `text-indent:${readerSettings.textIndent}em;` : ''}">${fp}</p>`;
            }).filter(Boolean).join('');
        }

        // Add indices BEFORE ads so indices stay stable
        html = addParagraphIndices(html);
        html = injectInTextAds(html);
        return html;
    }, [chapter.content, readerSettings, isAdFree, inTextAds]);

    // ── jump to marked paragraph from URL hash (#mark-N) ──────────────────
    useEffect(() => {
        const hash = window.location.hash;
        if (!hash.startsWith('#mark-')) return;
        const pIndex = parseInt(hash.replace('#mark-', ''), 10);
        if (isNaN(pIndex)) return;
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const el = document.querySelector(`[data-p-index="${pIndex}"]`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                (el as HTMLElement).style.transition = 'background 0.3s';
                (el as HTMLElement).style.background = 'rgba(251,191,36,0.25)';
                setTimeout(() => { (el as HTMLElement).style.background = ''; }, 1500);
            }
        }));
    }, [processedContent]);

    // ── mark highlight CSS ─────────────────────────────────────────────────
    const markHighlightCss = useMemo(() => {
        if (activeMarks.length === 0) return '';
        const selectors = activeMarks.map(m => `[data-p-index="${m.paragraph_index}"]`).join(', ');
        return `${selectors} { background: rgba(251,191,36,0.10); border-left: 3px solid rgba(251,191,36,0.55); padding-left: 0.75em; margin-left: -0.75em; border-radius: 0 4px 4px 0; transition: background 0.2s; }`;
    }, [activeMarks]);

    // ── paragraph click handler ────────────────────────────────────────────
    const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isAuthenticated) return;
        const el = (e.target as HTMLElement).closest('[data-p-index]') as HTMLElement | null;
        if (!el) { setToolbar(t => ({ ...t, visible: false })); return; }
        const pIndex = parseInt(el.getAttribute('data-p-index') ?? '-1', 10);
        if (pIndex < 0) return;
        const preview = el.textContent?.trim().slice(0, 150) ?? '';
        const rect = el.getBoundingClientRect();
        setToolbar({
            visible: true,
            pIndex,
            preview,
            top: rect.bottom + 6,
            left: rect.left,
            width: rect.width,
        });
    };

    // ── mark / unmark ──────────────────────────────────────────────────────
    const handleMark = async () => {
        if (markLoading || toolbar.pIndex < 0) return;
        setMarkLoading(true);
        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
        try {
            const res = await fetch(route('marks.store', [series.slug, chapter.chapter_link]), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json' },
                body: JSON.stringify({ paragraph_index: toolbar.pIndex, paragraph_preview: toolbar.preview }),
            });
            const data = await res.json();
            if (data.action === 'added') {
                setActiveMarks(prev => [...prev, { id: data.id, paragraph_index: toolbar.pIndex, paragraph_preview: toolbar.preview }]);
            } else {
                setActiveMarks(prev => prev.filter(m => m.paragraph_index !== toolbar.pIndex));
            }
        } catch {}
        setMarkLoading(false);
        setToolbar(t => ({ ...t, visible: false }));
    };

    const isCurrentParagraphMarked = activeMarks.some(m => m.paragraph_index === toolbar.pIndex);

    // ── navigation helpers ─────────────────────────────────────────────────
    const jumpToChapter = (link: string) => { router.get(route('chapters.show', [series.slug, link])); setShowChapterList(false); };
    const formatChapterLabel = (ch: { title: string; chapter_number: number; volume?: number }) => {
        if (series.type === 'light-novel') {
            const t = ch.title.trim();
            const prefix = t.includes(':') ? t.slice(0, t.indexOf(':')).trim() : t;
            return `Vol ${ch.volume ?? chapter.volume ?? ch.chapter_number} ${prefix || t}`;
        }
        return `Chapter ${ch.chapter_number}`;
    };

    // ── paywall ────────────────────────────────────────────────────────────
    if (!canAccess && chapter.is_premium) {
        const coinPrice  = chapter.coin_price ?? 0;
        const userCoins  = auth?.user?.coins ?? 0;
        const hasEnough  = userCoins >= coinPrice;
        return (
            <div className="h-[calc(100vh-4rem)] overflow-hidden relative flex items-center justify-center" style={{ backgroundColor: currentTheme.background }}>
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: SHINY_PURPLE }} />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: '#e879f9' }} />
                </div>
                <div className="relative z-10 max-w-sm w-full mx-auto px-6 py-12 text-center">
                    <div className="mb-6 flex justify-center">
                        <svg className="w-20 h-20 animate-pulse" viewBox="0 0 24 24" fill="none">
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
                            <path d="M12 2L3 9L12 22L21 9L12 2Z" fill="url(#paywallDiamond)" stroke="#fff" strokeWidth="0.5" />
                            <path d="M12 2L12 22M3 9L21 9M7 5.5L17 5.5M7 9L12 22M17 9L12 22" stroke="#fff" strokeWidth="0.3" opacity="0.6" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold mb-3" style={{ color: SHINY_PURPLE, textShadow: `0 0 20px ${SHINY_PURPLE}50` }}>Premium Chapter</h1>
                    <p className="text-base mb-8 leading-relaxed" style={{ color: `${currentTheme.foreground}80` }}>
                        This chapter is only available for Premium Members, or you can buy it with coins
                    </p>
                    <div className="flex flex-col gap-3">
                        <Link href="/shop?tab=membership" className="w-full py-3 px-6 rounded-xl font-semibold text-base text-white transition-all hover:scale-105 hover:opacity-90"
                            style={{ background: `linear-gradient(135deg,${SHINY_PURPLE} 0%,#e879f9 100%)`, boxShadow: `0 4px 20px ${SHINY_PURPLE}40` }}>
                            Get Membership
                        </Link>
                        {!auth?.user ? (
                            <Link href={route('login')} className="w-full py-3 px-6 rounded-xl font-semibold text-base transition-all hover:scale-105 hover:opacity-90" style={{ backgroundColor: '#eab308', color: '#000' }}>
                                Login to Buy with ¢{coinPrice}
                            </Link>
                        ) : hasEnough ? (
                            <button onClick={() => confirm(`Unlock this chapter for ¢${coinPrice}?`, () => router.post(route('chapters.purchase', [series.slug, chapter.chapter_link])), 'Buy Chapter', 'purchase')}
                                className="w-full py-3 px-6 rounded-xl font-semibold text-base transition-all hover:scale-105 hover:opacity-90" style={{ backgroundColor: '#eab308', color: '#000' }}>
                                Buy with ¢{coinPrice}
                            </button>
                        ) : (
                            <Link href="/shop?tab=coins" className="w-full py-3 px-6 rounded-xl font-semibold text-base text-center transition-all hover:scale-105 hover:opacity-90"
                                style={{ backgroundColor: 'rgba(234,179,8,0.15)', color: '#eab308', border: '1px solid rgba(234,179,8,0.4)' }}>
                                ¢{coinPrice} — Top Up Coins
                            </Link>
                        )}
                    </div>
                    <div className="mt-8 text-sm">
                        <Link href={`/series/${series.slug}`} className="transition-colors hover:opacity-60" style={{ color: `${currentTheme.foreground}60` }}>← Back to Series</Link>
                    </div>
                </div>
            </div>
        );
    }

    const chapterMetaDesc = `Read ${chapter.title} from ${series.title} on VeiNovel — free light novel reading platform.`;
    const ogTitle = `${chapter.title} - ${series.title} | VeiNovel`;

    return (
        <>
            <Head title={`${chapter.title} - ${series.title}`}>
                <meta name="description" content={chapterMetaDesc} />
                <meta property="og:title" content={ogTitle} />
                <meta property="og:description" content={chapterMetaDesc} />
                <meta property="og:type" content="article" />
                <meta property="og:site_name" content="VeiNovel" />
            </Head>

            {/* Reading Progress Bar */}
            <div className="reading-progress-bar" style={{ width: `${readingProgress}%`, top: 'auto', bottom: showNavbar ? '64px' : '0' }} />

            {/* Sticky Back Button */}
            <div className={`fixed top-3 left-3 sm:top-4 sm:left-4 z-50 transition-all duration-500 ease-in-out ${showNavbar ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
                <Link href={route('series.show', series.slug)}
                    className="w-10 h-10 flex items-center justify-center rounded-full shadow-lg transition-all reading-bar-btn"
                    style={{ color: currentTheme.foreground, backgroundColor: `${currentTheme.background}D9`, border: `1px solid ${currentTheme.foreground}15`, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                    aria-label="Back to series">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
            </div>

            {/* ── Floating Mark Toolbar ───────────────────────────────────── */}
            {toolbar.visible && isAuthenticated && (
                <div
                    className="fixed z-[55] flex items-center gap-1 px-2 py-1.5 rounded-xl shadow-xl border"
                    style={{
                        top: Math.max(8, toolbar.top),
                        left: Math.max(8, toolbar.left),
                        maxWidth: Math.min(toolbar.width, window.innerWidth - 16),
                        backgroundColor: currentTheme.background,
                        borderColor: `${fg}20`,
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <button
                        onClick={handleMark}
                        disabled={markLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                            backgroundColor: isCurrentParagraphMarked ? 'rgba(251,191,36,0.15)' : 'rgba(251,191,36,0.1)',
                            color: '#f59e0b',
                            border: '1px solid rgba(251,191,36,0.3)',
                        }}
                    >
                        {markLoading ? (
                            <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: '#f59e0b40', borderTopColor: '#f59e0b' }} />
                        ) : (
                            <svg className="w-3.5 h-3.5" fill={isCurrentParagraphMarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                            </svg>
                        )}
                        {isCurrentParagraphMarked ? 'Unmark' : 'Mark'}
                    </button>
                    <button
                        onClick={() => setToolbar(t => ({ ...t, visible: false }))}
                        className="p-1.5 rounded-lg"
                        style={{ color: muted }}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* ── Bottom Reading Bar ──────────────────────────────────────── */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-50 border-t transition-all duration-500 ease-in-out ${showNavbar ? 'translate-y-0' : 'translate-y-full'}`}
                style={{
                    backgroundColor: `${currentTheme.background}E6`,
                    borderColor: `${currentTheme.foreground}20`,
                    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                    paddingBottom: 'env(safe-area-inset-bottom,0px)',
                }}
            >
                <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
                    <div className={`grid ${isAuthenticated ? 'grid-cols-5' : 'grid-cols-4'} h-16 items-center`}>

                        {/* Prev chapter */}
                        {prevChapter ? (
                            <Link href={route('chapters.show', [series.slug, prevChapter.chapter_link])}
                                className="order-1 h-full flex items-center justify-center rounded transition-all reading-bar-btn"
                                style={{ color: currentTheme.foreground }} title={`Previous: ${prevChapter.title}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Link>
                        ) : (
                            <button disabled className="order-1 h-full flex items-center justify-center rounded opacity-30" style={{ color: currentTheme.foreground }}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}

                        {/* Chapter list */}
                        <div className="relative order-2 h-full">
                            <button onClick={() => setShowChapterList(!showChapterList)}
                                className="h-full w-full flex items-center justify-center rounded transition-all reading-bar-btn"
                                style={{ color: currentTheme.foreground }} title="Chapter list">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            {showChapterList && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 sm:w-80 border rounded-xl shadow-2xl max-h-96 overflow-y-auto z-10 themed-scrollbar"
                                    style={{ backgroundColor: currentTheme.background, borderColor: `${currentTheme.foreground}15` }}>
                                    {allChapters.map(ch => (
                                        <button key={ch.chapter_link} onClick={() => jumpToChapter(ch.chapter_link)}
                                            className={`w-full text-left px-3 sm:px-4 py-2 transition-colors hover:opacity-70 flex items-center justify-between ${ch.chapter_link === chapter.chapter_link ? 'opacity-80' : ''}`}
                                            style={{ color: ch.chapter_link === chapter.chapter_link ? SHINY_PURPLE : currentTheme.foreground, backgroundColor: ch.chapter_link === chapter.chapter_link ? `${currentTheme.foreground}10` : 'transparent' }}>
                                            <span className="truncate text-sm sm:text-base">{formatChapterLabel(ch)}</span>
                                            {ch.is_premium && <span className="ml-2 flex-shrink-0"><PremiumDiamond size={16} /></span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Marks button — only for auth users */}
                        {isAuthenticated && (
                            <button
                                onClick={() => setShowMarksModal(true)}
                                className="order-3 h-full flex items-center justify-center rounded transition-all reading-bar-btn relative"
                                style={{ color: activeMarks.length > 0 ? '#f59e0b' : currentTheme.foreground }}
                                title="View marks"
                            >
                                <svg className="w-5 h-5" fill={activeMarks.length > 0 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                                </svg>
                                {activeMarks.length > 0 && (
                                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                                        style={{ backgroundColor: '#f59e0b', color: '#000' }}>
                                        {activeMarks.length > 9 ? '9+' : activeMarks.length}
                                    </span>
                                )}
                            </button>
                        )}

                        {/* Reader settings */}
                        <button
                            ref={readerSettingsButtonRef}
                            onClick={() => setShowReaderSettings(open => !open)}
                            className={`${isAuthenticated ? 'order-4' : 'order-3'} h-full flex items-center justify-center rounded transition-all reading-bar-btn`}
                            style={{ color: currentTheme.foreground }} title="Reader settings">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>

                        {/* Next chapter */}
                        {nextChapter ? (
                            <Link href={route('chapters.show', [series.slug, nextChapter.chapter_link])}
                                className={`${isAuthenticated ? 'order-5' : 'order-4'} h-full flex items-center justify-center rounded transition-all reading-bar-btn`}
                                style={{ color: currentTheme.foreground }} title={`Next: ${nextChapter.title}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        ) : (
                            <button disabled className={`${isAuthenticated ? 'order-5' : 'order-4'} h-full flex items-center justify-center rounded opacity-30`} style={{ color: currentTheme.foreground }}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Chapter Content ─────────────────────────────────────────── */}
            <div className="min-h-screen pt-4 pb-20" style={{ backgroundColor: currentTheme.background }}>
                <div className="mx-auto px-4 sm:px-8 lg:px-12 py-10 rounded-2xl"
                    style={{ maxWidth: `${effectiveContentWidth}%`, width: '100%', backgroundColor: `${currentTheme.foreground}03`, border: `1px solid ${currentTheme.foreground}08`, boxShadow: `0 4px 24px ${currentTheme.foreground}04` }}>

                    {/* Chapter Header */}
                    <div className="mb-10 text-center">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: currentTheme.foreground }}>{chapter.title}</h1>
                        <Link href={route('series.show', series.slug)} className="text-base sm:text-lg transition-colors hover:opacity-70" style={{ color: SHINY_PURPLE }}>
                            {series.title}
                        </Link>
                        {chapter.is_premium && (
                            <div className="mt-4">
                                <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full"
                                    style={{ backgroundColor: `${SHINY_PURPLE}15`, color: SHINY_PURPLE, border: `1px solid ${SHINY_PURPLE}40` }}>
                                    <PremiumDiamond size={16} className="mr-1.5" /> Premium Chapter
                                </span>
                            </div>
                        )}
                        <div className="mt-6 mx-auto w-16 h-px" style={{ backgroundColor: `${currentTheme.foreground}15` }} />
                    </div>

                    {/* Mark hint — only for auth users */}
                    {isAuthenticated && (
                        <div className="mb-6 flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
                            style={{ color: muted, backgroundColor: `${fg}06`, border: `1px solid ${fg}0a` }}>
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                            </svg>
                            Tap any paragraph to mark it
                        </div>
                    )}

                    {/* Chapter Content */}
                    <div
                        className="max-w-none reader-content"
                        style={{ fontSize: `${readerSettings.fontSize}px`, fontFamily: readerSettings.fontFamily, color: currentTheme.foreground, '--reader-line-height': readerSettings.lineHeight } as React.CSSProperties & { '--reader-line-height': number }}
                        data-line-height={readerSettings.lineHeight}
                    >
                        <style>{`
                            .reader-content * { font-family: ${readerSettings.fontFamily} !important; font-size: inherit !important; }
                            .reader-content img { max-width: 100%; height: auto; }
                            .reader-content strong, .reader-content b { font-weight: bold !important; }
                            .reader-content em, .reader-content i { font-style: italic !important; }
                            .reader-content u { text-decoration: underline !important; }
                            .reader-content s, .reader-content strike, .reader-content del { text-decoration: line-through !important; }
                            ${markHighlightCss}
                        `}</style>
                        <div
                            style={{ whiteSpace: 'normal', lineHeight: readerSettings.lineHeight, fontSize: 'inherit', fontFamily: 'inherit', color: 'inherit', cursor: isAuthenticated ? 'text' : 'auto' }}
                            onClick={handleContentClick}
                            dangerouslySetInnerHTML={{ __html: processedContent }}
                        />
                    </div>

                    {/* Chapter Navigation Footer */}
                    <div className="mt-14 pt-8" style={{ borderTop: `1px solid ${currentTheme.foreground}10` }}>
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                            {prevChapter ? (
                                <Link href={route('chapters.show', [series.slug, prevChapter.chapter_link])}
                                    className="w-full sm:w-auto px-6 py-3 rounded-xl transition-all hover:opacity-80 text-center text-sm font-medium"
                                    style={{ backgroundColor: `${currentTheme.foreground}08`, color: currentTheme.foreground, border: `1px solid ${currentTheme.foreground}10` }}>
                                    ← Previous Chapter
                                </Link>
                            ) : <div className="w-full sm:w-auto" />}
                            <Link href={route('series.show', series.slug)}
                                className="px-6 py-3 rounded-xl transition-all hover:opacity-80 text-sm font-medium"
                                style={{ border: `1px solid ${currentTheme.foreground}15`, color: `${currentTheme.foreground}80` }}>
                                Back to Series
                            </Link>
                            {nextChapter ? (
                                <Link href={route('chapters.show', [series.slug, nextChapter.chapter_link])}
                                    className="w-full sm:w-auto px-6 py-3 rounded-xl transition-all hover:opacity-90 hover:shadow-lg text-center text-sm font-semibold"
                                    style={{ backgroundColor: currentTheme.foreground, color: currentTheme.background }}>
                                    Next Chapter →
                                </Link>
                            ) : <div className="w-full sm:w-auto" />}
                        </div>

                        {/* Reactions */}
                        <div className="mt-10">
                            <div className="rounded-2xl p-8 text-center"
                                style={{ backgroundColor: `${currentTheme.foreground}04`, border: `1px solid ${currentTheme.foreground}08` }}>
                                <h3 className="text-xl sm:text-2xl font-bold mb-6" style={{ color: currentTheme.foreground }}>How was this chapter?</h3>
                                <Suspense fallback={null}>
                                    <ReactionBar reactableType="chapter" reactableId={chapter.id} isAuthenticated={isAuthenticated} size="large" />
                                </Suspense>
                            </div>
                        </div>

                        {/* Comments */}
                        <div className="mt-8">
                            <Suspense fallback={<CommentSectionSkeleton />}>
                                <CommentSection commentableType="chapter" commentableId={chapter.id} isAuthenticated={isAuthenticated} currentUserId={auth?.user?.id} />
                            </Suspense>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reader Settings Modal */}
            <Suspense fallback={null}>
                <ReaderSettingsModal isOpen={showReaderSettings} onClose={() => setShowReaderSettings(false)} triggerElement={readerSettingsButtonRef.current} />
            </Suspense>

            {/* Marks Modal */}
            {showMarksModal && (
                <MarksModal
                    seriesSlug={series.slug}
                    seriesTitle={series.title}
                    onClose={() => setShowMarksModal(false)}
                    onMarkDeleted={(_id, chapterId, paragraphIndex) => {
                        if (chapterId === chapter.id) {
                            setActiveMarks(prev => prev.filter(m => m.paragraph_index !== paragraphIndex));
                        }
                    }}
                    fg={currentTheme.foreground}
                    bg={currentTheme.background}
                    border={`${currentTheme.foreground}15`}
                    muted={`${currentTheme.foreground}60`}
                />
            )}

            {!isAdFree && <InterstitialAd chapterId={chapter.id} />}
        </>
    );
}

export default function ChapterShow(props: Props) {
    return (
        <UserLayout hideMobileBottomNav hideSiteChrome>
            <ChapterShowContent {...props} />
        </UserLayout>
    );
}
