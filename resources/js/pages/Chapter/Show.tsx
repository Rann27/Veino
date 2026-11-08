import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme, SHINY_PURPLE } from '@/Contexts/ThemeContext';
import { useToast } from '@/Contexts/ToastContext';
import CommentSectionSkeleton from '@/Components/CommentSectionSkeleton';
import PremiumDiamond from '@/Components/PremiumDiamond';
import InTextAd from '@/Components/Ads/InTextAd';
import { markChapterVisited, saveScrollPosition, getScrollPosition, clearScrollPosition } from '@/lib/reading';
import InterstitialAd from '@/Components/Ads/InterstitialAd';
import { ResponsiveAd, UnitAd, useShowAds } from '@/Components/Ads/NetworkAds';
import { UNITS } from '@/ads/units';
import axios from 'axios';
import { csrfHeaders } from '@/lib/csrf';
import { formatOpensIn, useCountdown } from '@/lib/earlyAccess';
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

/**
 * Splits the chapter in two at a paragraph boundary near the middle, for the
 * mid-chapter ad to sit between the halves as an ordinary element. Only cuts
 * where no block element is left open (a paragraph inside a blockquote or a
 * list is skipped), so neither half is malformed. Short chapters are not
 * split: an ad every few lines reads as spam. Paragraph indices are assigned
 * before this, so marks are unaffected.
 */
const BLOCK_TAGS = ['div', 'blockquote', 'section', 'ul', 'ol', 'table', 'figure', 'article', 'aside'];

function splitForMidAd(html: string): [string, string] {
    const closes = [...html.matchAll(/<\/p>/gi)];
    if (closes.length < 8) return [html, ''];

    const balanced = (head: string) => BLOCK_TAGS.every((tag) =>
        (head.match(new RegExp(`<${tag}[\\s>]`, 'gi')) ?? []).length
            === (head.match(new RegExp(`</${tag}>`, 'gi')) ?? []).length);

    // Middle first, then step outwards until a clean cut turns up.
    const mid = Math.floor(closes.length / 2);
    for (let step = 0; step < closes.length; step++) {
        for (const i of [mid + step, mid - step]) {
            const at = closes[i];
            if (!at || i < 3 || i > closes.length - 3) continue;
            const cut = (at.index ?? 0) + at[0].length;
            if (balanced(html.slice(0, cut))) return [html.slice(0, cut), html.slice(cut)];
        }
    }

    return [html, ''];
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

interface Challenge {
    available: boolean;
    days: number;
    daily_limit: number;
    used_today: number;
    sandbox?: boolean;
    /** Seconds until the free unlock opens (premium early access); null once open. */
    opens_in?: number | null;
    opens_at?: string | null;
}

interface Props {
    series: Series;
    chapter: Chapter;
    canAccess: boolean;
    isPremiumMember: boolean;
    hasCoinPurchase: boolean;
    challenge?: Challenge;
    temporaryAccessExpiresAt?: string | null;
    justUnlocked?: boolean;
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
            headers: { ...csrfHeaders() },
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
            style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
            {/* mb-16 = 64px — clears the bottom reading bar on mobile */}
            <div className="w-full sm:max-w-md rounded-t-lg sm:rounded-lg shadow-2xl overflow-hidden flex flex-col mb-16 sm:mb-0"
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
    challenge, temporaryAccessExpiresAt = null, justUnlocked = false,
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

    // ── reading progress + resume position ─────────────────────────────────
    useEffect(() => {
        let saveTimer: ReturnType<typeof setTimeout> | undefined;

        const update = () => {
            const d = document.documentElement.scrollHeight - window.innerHeight;
            const percent = d > 0 ? Math.round((window.scrollY / d) * 100) : 0;
            setReadingProgress(percent);

            // Debounced: scroll fires far too often to persist on every tick.
            clearTimeout(saveTimer);
            saveTimer = setTimeout(() => {
                // Near either end there is nothing worth resuming to.
                if (percent > 3 && percent < 97) {
                    saveScrollPosition(chapter.id, percent);
                } else {
                    clearScrollPosition(chapter.id);
                }
            }, 600);
        };

        window.addEventListener('scroll', update, { passive: true });
        return () => { window.removeEventListener('scroll', update); clearTimeout(saveTimer); };
    }, [chapter.id]);

    // Opening a chapter marks it visited, so the series list can grey it out
    // even for guests, who have no reading_history row.
    useEffect(() => {
        markChapterVisited(series.id, chapter.id);
    }, [series.id, chapter.id]);

    // ── free unlock via the shortlink challenge ────────────────────────────
    const [startingChallenge, setStartingChallenge] = useState(false);
    const [challengeError, setChallengeError] = useState<string | null>(null);

    // The unlock flow redirects here with a flashed reason when it refuses —
    // "start the challenge first", "that was too quick", the daily cap. Nothing
    // on this page read it, so a rejected claim looked identical to simply
    // arriving at the paywall, and the guard appeared to be doing nothing.
    const flashError = (usePage().props as { flash?: { error?: string } }).flash?.error;

    useEffect(() => {
        if (flashError) setChallengeError(flashError);
    }, [flashError]);
    const [showUnlockedModal, setShowUnlockedModal] = useState(justUnlocked);

    // Light novels are read by chapter title, web novels by number.
    const chapterLabel = series.type === 'light-novel' && chapter.title
        ? chapter.title
        : `Chapter ${chapter.chapter_number}`;

    // Premium early access: the button stays visible but disabled, counting
    // down, and comes alive by itself the moment the window closes.
    const opensIn = useCountdown(challenge?.opens_in);
    const inEarlyAccess = opensIn !== null && opensIn > 0;

    const startChallenge = async () => {
        if (inEarlyAccess) return;
        if (!auth?.user) {
            router.visit(route('login'));
            return;
        }

        setStartingChallenge(true);
        setChallengeError(null);

        try {
            const res = await fetch(route('chapters.unlock.start', [series.slug, chapter.chapter_link]), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...csrfHeaders(),
                },
            });
            // A 419 here means the session itself lapsed while the page sat
            // open — no token can rescue that, only a reload. Say so plainly
            // instead of surfacing Laravel's "CSRF token mismatch".
            if (res.status === 419) {
                setChallengeError('Your session expired. Please refresh the page and try again.');
                setStartingChallenge(false);
                return;
            }

            const json = await res.json().catch(() => ({}));

            if (!res.ok || !json.shortlink) {
                setChallengeError(json.message ?? 'Could not start the challenge. Please try again.');
                setStartingChallenge(false);
                return;
            }

            // Same tab: the reader has to come back here to be granted access,
            // and a popup would likely be blocked anyway.
            window.location.href = json.shortlink;
        } catch {
            setChallengeError('Network error. Please try again.');
            setStartingChallenge(false);
        }
    };

    // Drop `?unlocked=1` so a refresh does not replay the celebration.
    useEffect(() => {
        if (!justUnlocked) return;

        const url = new URL(window.location.href);
        url.searchParams.delete('unlocked');
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    }, [justUnlocked]);

    // ── offer to resume ────────────────────────────────────────────────────
    // Offered, never automatic: yanking the page down before the reader has got
    // their bearings is more disorienting than starting from the top.
    const [resumeAt, setResumeAt] = useState<number | null>(null);

    useEffect(() => {
        // A deep link to a mark wins — that is a more specific intent.
        if (window.location.hash.startsWith('#mark-')) return;

        const saved = getScrollPosition(chapter.id);
        if (saved === null || saved <= 3) return;

        // Wait for images before offering. The position is a percentage of page
        // height, and a chapter full of illustrations grows as they load — jump
        // too early and the reader lands in the wrong place.
        const offer = () => setResumeAt(saved);

        if (document.readyState === 'complete') {
            offer();
            return;
        }

        window.addEventListener('load', offer, { once: true });
        return () => window.removeEventListener('load', offer);
    }, [chapter.id]);

    // Auto-dismiss: an unanswered prompt should not hover over the page forever.
    useEffect(() => {
        if (resumeAt === null) return;

        const timer = setTimeout(() => setResumeAt(null), 12000);
        return () => clearTimeout(timer);
    }, [resumeAt]);

    const jumpToSaved = () => {
        if (resumeAt === null) return;
        const d = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: (d * resumeAt) / 100, behavior: 'smooth' });
        setResumeAt(null);
    };

    // ── close toolbar on scroll / outside click ────────────────────────────
    useEffect(() => {
        if (!toolbar.visible) return;
        const hide = () => setToolbar(t => ({ ...t, visible: false }));
        window.addEventListener('scroll', hide, { passive: true });
        return () => window.removeEventListener('scroll', hide);
    }, [toolbar.visible]);

    // ── in-text ads ────────────────────────────────────────────────────────
    const isAdFree = isPremiumMember || (hasCoinPurchase && chapter.is_premium);
    // Network ads inside the chapter follow the same rule as the in-text ads:
    // none on a chapter the reader paid for, nor for members.
    const showNetworkAds = useShowAds() && !isAdFree;
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

    const contentStyle: React.CSSProperties = {
        whiteSpace: 'normal', lineHeight: readerSettings.lineHeight, fontSize: 'inherit',
        fontFamily: 'inherit', color: 'inherit', cursor: isAuthenticated ? 'text' : 'auto',
    };

    const [contentHead, contentTail] = useMemo(
        () => (showNetworkAds ? splitForMidAd(processedContent) : [processedContent, ''] as [string, string]),
        [processedContent, showNetworkAds],
    );

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
        try {
            const res = await fetch(route('marks.store', [series.slug, chapter.chapter_link]), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...csrfHeaders(), 'Accept': 'application/json' },
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
                <div className="relative z-10 max-w-sm w-full mx-auto px-6 py-12 text-center">
                    <div className="mb-6 flex justify-center">
                        <PremiumDiamond size={48} className="text-[#a78bfa]" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: currentTheme.foreground }}>Premium Chapter</h1>
                    <p className="text-sm sm:text-base mb-8 leading-relaxed" style={{ color: muted }}>
                        This chapter is only available for Premium Members, or you can buy it with coins
                    </p>
                    <div className="flex flex-col gap-3">
                        <Link href="/shop?tab=membership" className="w-full py-3 px-6 rounded-lg font-semibold text-sm sm:text-base text-white transition-opacity hover:opacity-90 text-center"
                            style={{ backgroundColor: '#a78bfa' }}>
                            Get Membership
                        </Link>
                        {!auth?.user ? (
                            <Link href={route('login')} className="w-full py-3 px-6 rounded-lg font-semibold text-sm sm:text-base transition-opacity hover:opacity-90 text-center" style={{ backgroundColor: '#f59e0b', color: '#000' }}>
                                Login to Buy with ¢{coinPrice}
                            </Link>
                        ) : hasEnough ? (
                            <button onClick={() => confirm(`Unlock this chapter for ¢${coinPrice}?`, () => router.post(route('chapters.purchase', [series.slug, chapter.chapter_link])), 'Buy Chapter', 'purchase')}
                                className="w-full py-3 px-6 rounded-lg font-semibold text-sm sm:text-base transition-opacity hover:opacity-90" style={{ backgroundColor: '#f59e0b', color: '#000' }}>
                                Buy with ¢{coinPrice}
                            </button>
                        ) : (
                            <Link href="/shop?tab=coins" className="w-full py-3 px-6 rounded-lg font-semibold text-sm sm:text-base text-center transition-opacity hover:opacity-90"
                                style={{ backgroundColor: '#f59e0b15', color: '#f59e0b', border: '1px solid #f59e0b40' }}>
                                ¢{coinPrice} — Top Up Coins
                            </Link>
                        )}

                        {/* The free route sits last, behind a divider: it is the
                            fallback for readers who will not pay, not the offer
                            we lead with. */}
                        {challenge?.available && (
                            <>
                                <div className="flex items-center gap-3 py-1">
                                    <span className="h-px flex-1" style={{ backgroundColor: border }} />
                                    <span className="text-xs font-medium uppercase tracking-wider" style={{ color: muted }}>or</span>
                                    <span className="h-px flex-1" style={{ backgroundColor: border }} />
                                </div>
                                <button
                                    onClick={startChallenge}
                                    disabled={startingChallenge || inEarlyAccess}
                                    className={`w-full py-3 px-6 rounded-lg font-semibold text-sm sm:text-base transition-opacity ${inEarlyAccess ? 'cursor-not-allowed' : 'text-white hover:opacity-90 disabled:opacity-60'}`}
                                    style={inEarlyAccess
                                        ? { backgroundColor: `${currentTheme.foreground}0d`, color: muted, border: `1px dashed ${border}`, fontVariantNumeric: 'tabular-nums' }
                                        : { backgroundColor: '#16a34a' }}
                                >
                                    {inEarlyAccess
                                        ? `Will be available in ${formatOpensIn(opensIn)}`
                                        : startingChallenge
                                            ? 'Preparing…'
                                            : challenge.sandbox
                                                ? `SANDBOX — ${challenge.days}d Free (no ad)`
                                                : `${challenge.days}d Free with challenge`}
                                </button>
                                <p className="-mt-1 text-xs" style={{ color: muted }}>
                                    {inEarlyAccess ? (
                                        <>
                                            New chapters are Premium early access first. The free unlock opens
                                            {challenge.opens_at ? ` on ${new Date(challenge.opens_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}` : ' soon'}.
                                        </>
                                    ) : (
                                        <>
                                            Complete a short sponsored link to read this chapter free for {challenge.days} days.
                                            {challenge.daily_limit > 0 && auth?.user && (
                                                <> {Math.max(0, challenge.daily_limit - challenge.used_today)} of {challenge.daily_limit} left today.</>
                                            )}
                                        </>
                                    )}
                                </p>
                                {challengeError && (
                                    <p className="-mt-1 text-xs font-medium" style={{ color: '#ef4444' }}>{challengeError}</p>
                                )}
                            </>
                        )}
                    </div>
                    <div className="mt-8 text-sm">
                        <Link href={`/series/${series.slug}`} className="transition-opacity hover:opacity-60" style={{ color: muted }}>← Back to Series</Link>
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

            {/* Unlocked confirmation, after returning from the challenge */}
            {showUnlockedModal && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
                    onClick={() => setShowUnlockedModal(false)}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="w-full max-w-sm rounded-lg p-6 text-center shadow-2xl"
                        style={{ backgroundColor: currentTheme.background, border: `1px solid ${border}` }}
                    >
                        <div
                            className="w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: '#16a34a' }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold mb-2" style={{ color: currentTheme.foreground }}>Chapter unlocked</h2>
                        <p className="text-sm leading-relaxed mb-1" style={{ color: muted }}>
                            You&rsquo;ve unlocked <strong style={{ color: currentTheme.foreground }}>{series.title}</strong>
                            {' — '}
                            <strong style={{ color: currentTheme.foreground }}>{chapterLabel}</strong>
                        </p>
                        {temporaryAccessExpiresAt && (
                            <p className="text-xs mb-5" style={{ color: muted }}>
                                Yours until {new Date(temporaryAccessExpiresAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                        )}
                        <button
                            onClick={() => setShowUnlockedModal(false)}
                            className="w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
                            style={{ backgroundColor: currentTheme.foreground, color: currentTheme.background }}
                        >
                            Start reading
                        </button>
                    </div>
                </div>
            )}

            {/* Reading Progress Bar */}
            <div className="reading-progress-bar" style={{ width: `${readingProgress}%`, top: 'auto', bottom: showNavbar ? '64px' : '0' }} />

            {/* Resume prompt — offered, not forced. Sits clear of the bottom bar. */}
            {resumeAt !== null && (
                <div
                    className="fixed left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2 rounded-lg shadow-xl"
                    style={{
                        bottom: showNavbar ? '80px' : '18px',
                        backgroundColor: currentTheme.background,
                        border: `1px solid ${border}`,
                        maxWidth: 'calc(100vw - 24px)',
                    }}
                >
                    <span className="text-xs whitespace-nowrap" style={{ color: muted }}>
                        Continue from {resumeAt}%?
                    </span>
                    <button
                        onClick={jumpToSaved}
                        className="text-xs font-bold px-3 py-1 rounded-lg transition-opacity hover:opacity-80"
                        style={{ backgroundColor: currentTheme.foreground, color: currentTheme.background }}
                    >
                        Resume
                    </button>
                    <button
                        onClick={() => { clearScrollPosition(chapter.id); setResumeAt(null); }}
                        aria-label="Dismiss"
                        className="text-base leading-none px-1 transition-opacity hover:opacity-70"
                        style={{ color: muted }}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Sticky Back Button */}
            <div className={`fixed top-3 left-3 sm:top-4 sm:left-4 z-50 transition-all duration-300 ease-out ${showNavbar ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
                <Link href={route('series.show', series.slug)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg shadow-md transition-opacity hover:opacity-80"
                    style={{ color: currentTheme.foreground, backgroundColor: currentTheme.background, border: `1px solid ${border}` }}
                    aria-label="Back to series">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
            </div>

            {/* ── Floating Mark Toolbar ───────────────────────────────────── */}
            {toolbar.visible && isAuthenticated && (
                <div
                    className="fixed z-[55] flex items-center gap-1 px-2 py-1.5 rounded-lg shadow-lg border"
                    style={{
                        top: Math.max(8, toolbar.top),
                        left: Math.max(8, toolbar.left),
                        maxWidth: Math.min(toolbar.width, window.innerWidth - 16),
                        backgroundColor: currentTheme.background,
                        borderColor: border,
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
                className={`fixed bottom-0 left-0 right-0 z-50 border-t transition-all duration-300 ease-out ${showNavbar ? 'translate-y-0' : 'translate-y-full'}`}
                style={{
                    backgroundColor: currentTheme.background,
                    borderColor: border,
                    paddingBottom: 'env(safe-area-inset-bottom,0px)',
                }}
            >
                <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
                    <div className={`grid ${isAuthenticated ? 'grid-cols-5' : 'grid-cols-4'} h-16 items-center`}>

                        {/* Prev chapter */}
                        {prevChapter ? (
                            <Link prefetch href={route('chapters.show', [series.slug, prevChapter.chapter_link])}
                                className="order-1 h-full flex items-center justify-center rounded-lg transition-opacity hover:opacity-75 reading-bar-btn"
                                style={{ color: currentTheme.foreground }} title={`Previous: ${prevChapter.title}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Link>
                        ) : (
                            <button disabled className="order-1 h-full flex items-center justify-center rounded-lg opacity-30" style={{ color: currentTheme.foreground }}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}

                        {/* Chapter list */}
                        <div className="relative order-2 h-full">
                            <button onClick={() => setShowChapterList(!showChapterList)}
                                className="h-full w-full flex items-center justify-center rounded-lg transition-opacity hover:opacity-75 reading-bar-btn"
                                style={{ color: currentTheme.foreground }} title="Chapter list">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            {showChapterList && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 sm:w-80 border rounded-lg shadow-xl max-h-96 overflow-y-auto z-10 themed-scrollbar"
                                    style={{ backgroundColor: currentTheme.background, borderColor: border }}>
                                    {allChapters.map(ch => (
                                        <button key={ch.chapter_link} onClick={() => jumpToChapter(ch.chapter_link)}
                                            className={`w-full text-left px-3 sm:px-4 py-2 transition-colors hover:opacity-80 flex items-center justify-between ${ch.chapter_link === chapter.chapter_link ? 'font-semibold' : ''}`}
                                            style={{ color: currentTheme.foreground, backgroundColor: ch.chapter_link === chapter.chapter_link ? `${currentTheme.foreground}12` : 'transparent' }}>
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
                            <Link prefetch href={route('chapters.show', [series.slug, nextChapter.chapter_link])}
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
            <div className="min-h-screen pt-4 pb-24" style={{ backgroundColor: currentTheme.background }}>
                <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6"
                    style={{ maxWidth: `${effectiveContentWidth}%`, width: '100%' }}>

                    {/* Chapter Header */}
                    <div className="mb-10 text-center">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: currentTheme.foreground }}>{chapter.title}</h1>
                        <Link href={route('series.show', series.slug)} className="text-base sm:text-lg transition-opacity hover:opacity-70" style={{ color: muted }}>
                            {series.title}
                        </Link>
                        {chapter.is_premium && (
                            <div className="mt-4">
                                <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg"
                                    style={{ backgroundColor: '#a78bfa15', color: '#a78bfa', border: '1px solid #a78bfa35' }}>
                                    <PremiumDiamond size={14} className="mr-1.5" /> Premium Chapter
                                </span>
                            </div>
                        )}
                        <div className="mt-6 mx-auto w-16 h-px" style={{ backgroundColor: border }} />
                    </div>

                    {/* Mark hint — only for auth users */}
                    {isAuthenticated && (
                        <div className="mb-6 flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                            style={{ color: muted, backgroundColor: `${fg}08`, border: `1px solid ${border}` }}>
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
                            /* Illustrations are always centred, whatever the source paragraph's alignment. */
                            .reader-content img { display: block; max-width: 100%; height: auto; margin: 1.25rem auto; border-radius: 0.375rem; }
                            .reader-content figure { margin: 1.5rem auto; text-align: center; }
                            .reader-content figure img { margin: 0 auto; }
                            .reader-content strong, .reader-content b { font-weight: bold !important; }
                            .reader-content em, .reader-content i { font-style: italic !important; }
                            .reader-content u { text-decoration: underline !important; }
                            .reader-content s, .reader-content strike, .reader-content del { text-decoration: line-through !important; }
                            ${markHighlightCss}
                        `}</style>
                        <div
                            style={contentStyle}
                            onClick={handleContentClick}
                            dangerouslySetInnerHTML={{ __html: contentHead }}
                        />
                        {contentTail && (
                            <>
                                <ResponsiveAd desktop={UNITS.adsterraLeaderboard} mobile={UNITS.adsterraMobileBanner} className="my-8" />
                                <div
                                    style={contentStyle}
                                    onClick={handleContentClick}
                                    dangerouslySetInnerHTML={{ __html: contentTail }}
                                />
                            </>
                        )}
                    </div>

                    {showNetworkAds && <UnitAd unit={UNITS.adsterraRectangle} className="mt-10" />}

                    {/* Chapter Navigation Footer */}
                    <div className="mt-14 pt-8" style={{ borderTop: `1px solid ${border}` }}>
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                            {prevChapter ? (
                                <Link prefetch href={route('chapters.show', [series.slug, prevChapter.chapter_link])}
                                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg transition-opacity hover:opacity-80 text-center text-sm font-medium"
                                    style={{ backgroundColor: `${currentTheme.foreground}08`, color: currentTheme.foreground, border: `1px solid ${border}` }}>
                                    ← Previous Chapter
                                </Link>
                            ) : <div className="w-full sm:w-auto" />}
                            <Link href={route('series.show', series.slug)}
                                className="w-full sm:w-auto px-5 py-2.5 rounded-lg transition-opacity hover:opacity-80 text-center text-sm font-medium"
                                style={{ border: `1px solid ${border}`, color: muted }}>
                                Back to Series
                            </Link>
                            {nextChapter ? (
                                <Link prefetch href={route('chapters.show', [series.slug, nextChapter.chapter_link])}
                                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg transition-opacity hover:opacity-90 text-center text-sm font-semibold"
                                    style={{ backgroundColor: currentTheme.foreground, color: currentTheme.background }}>
                                    Next Chapter →
                                </Link>
                            ) : <div className="w-full sm:w-auto" />}
                        </div>

                        {/* Reactions */}
                        <div className="mt-10">
                            <div className="rounded-lg p-6 sm:p-8 text-center"
                                style={{ backgroundColor: `${currentTheme.foreground}08`, border: `1px solid ${border}` }}>
                                <h3 className="text-lg sm:text-xl font-bold mb-6" style={{ color: currentTheme.foreground }}>How was this chapter?</h3>
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
