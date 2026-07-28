import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTheme } from '@/Contexts/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Series { id: number; title: string; }
interface Chapter { id: number; label: string; }

interface CommentRow {
    id: number;
    page: string;
    context: string | null;
    user_name: string;
    user_email: string | null;
    user_role: string | null;
    content: string;
    is_reply: boolean;
    replies_count: number;
    is_edited: boolean;
    created_at: string | null;
    created_label: string | null;
}

interface ReactionRow {
    page: string;
    context: string | null;
    type: string;
    orphaned: boolean;
    like_count: number;
    love_count: number;
    haha_count: number;
    angry_count: number;
    sad_count: number;
    total_count: number;
}

interface ViewRow { page: string; type: string; views: number; series_id: number; }

interface Paginator<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface Stats {
    comments: { total: number; threads: number; replies: number; commenters: number; today: number; week: number };
    reactions: { total: number; pages: number; by_type: Record<string, number> };
    views: { series: number; chapters: number; total: number; series_count: number; chapter_count: number };
}

interface Props { series: Series[]; stats: Stats; }

type Tab = 'comments' | 'reactions' | 'views';
type Scope = 'all' | 'series' | 'series_chapters' | 'series_all' | 'chapter';

// ─── Colour helpers ───────────────────────────────────────────────────────────

function hexToRgb(hex: string) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function isLight(hex: string) {
    const { r, g, b } = hexToRgb(hex);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}
function wa(hex: string, a: number) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
}

const nf = new Intl.NumberFormat('en-US');

// Validated categorical slots 1–5 (see dataviz palette), never cycled.
const SLOTS_LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'];
const SLOTS_DARK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181'];

const REACTION_KEYS = ['like', 'love', 'haha', 'angry', 'sad'] as const;
const REACTION_META: Record<string, { emoji: string; label: string }> = {
    like: { emoji: '👍', label: 'Like' },
    love: { emoji: '❤️', label: 'Love' },
    haha: { emoji: '😂', label: 'Haha' },
    angry: { emoji: '😠', label: 'Angry' },
    sad: { emoji: '😢', label: 'Sad' },
};

const SCOPES: { value: Scope; label: string; hint: string }[] = [
    { value: 'all', label: 'Everything', hint: 'All series and chapters' },
    { value: 'series_all', label: 'One series (all)', hint: 'Series page + every chapter' },
    { value: 'series', label: 'Series page only', hint: 'Just the series landing page' },
    { value: 'series_chapters', label: 'Chapters of a series', hint: 'Every chapter, excluding the series page' },
    { value: 'chapter', label: 'One chapter', hint: 'A single chapter' },
];

const PERIODS = [
    { value: 'all', label: 'All time' },
    { value: 'today', label: 'Today' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
];

const PER_PAGE = [25, 50, 100, 200];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Index({ series, stats }: Props) {
    return (
        <AdminLayout title="Monitoring">
            <Head title="Monitoring - Comments, Reactions & Views" />
            <MonitoringContent series={series} stats={stats} />
        </AdminLayout>
    );
}

function MonitoringContent({ series, stats: initialStats }: Props) {
    const { currentTheme } = useTheme();
    const light = isLight(currentTheme.background);
    const fg = currentTheme.foreground;

    const ink = useMemo(() => ({
        primary: fg,
        secondary: wa(fg, 0.62),
        muted: wa(fg, 0.42),
        grid: wa(fg, 0.08),
        border: wa(fg, 0.12),
        card: light ? wa(fg, 0.03) : wa(fg, 0.06),
        panel: light ? wa(fg, 0.06) : wa(fg, 0.09),
        input: light ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
        surface: currentTheme.background,
    }), [fg, light, currentTheme.background]);

    const slots = light ? SLOTS_LIGHT : SLOTS_DARK;
    const accent = slots[0];
    const danger = '#d03b3b';

    const [tab, setTab] = useState<Tab>('comments');
    const [stats, setStats] = useState<Stats>(initialStats);

    // ── Filters (shared shape across tabs) ──
    const [scope, setScope] = useState<Scope>('all');
    const [seriesId, setSeriesId] = useState<number | null>(null);
    const [chapterId, setChapterId] = useState<number | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [period, setPeriod] = useState('all');
    const [sort, setSort] = useState('newest');
    const [perPage, setPerPage] = useState(25);
    const [page, setPage] = useState(1);
    const [itemType, setItemType] = useState('all');
    const [includeReplies, setIncludeReplies] = useState(false);

    // ── Data ──
    const [comments, setComments] = useState<Paginator<CommentRow> | null>(null);
    const [reactions, setReactions] = useState<{ rows: Paginator<ReactionRow>; totals: Record<string, number> } | null>(null);
    const [views, setViews] = useState<{ rows: Paginator<ViewRow>; totals: Record<string, number> } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [confirmDelete, setConfirmDelete] = useState<CommentRow | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    // Guards against a slow early request overwriting a fast later one.
    const reqId = useRef(0);

    // ── Debounce the search box so typing doesn't fire a request per keystroke ──
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(t);
    }, [search]);

    // ── Reset dependent filters whenever the scope or series changes ──
    useEffect(() => {
        setChapterId(null);
        setPage(1);
        if (scope === 'all') {
            setSeriesId(null);
            setChapters([]);
        }
    }, [scope]);

    useEffect(() => {
        // A chapter chosen under the previous series must not linger.
        setChapterId(null);
        setPage(1);

        if (!seriesId) {
            setChapters([]);
            return;
        }

        let cancelled = false;
        fetch(route('admin.monitoring.chapters', seriesId), { headers: { Accept: 'application/json' } })
            .then(r => (r.ok ? r.json() : []))
            .then(d => { if (!cancelled) setChapters(Array.isArray(d) ? d : []); })
            .catch(() => { if (!cancelled) setChapters([]); });

        return () => { cancelled = true; };
    }, [seriesId]);

    useEffect(() => { setPage(1); }, [tab, debouncedSearch, period, sort, perPage, itemType, includeReplies]);

    // ── The filter target actually sent to the server ──
    const filterTarget = useMemo(() => {
        if (scope === 'all') return null;
        if (scope === 'chapter') return chapterId ? { filterType: 'chapter', filterId: chapterId } : null;
        return seriesId ? { filterType: scope, filterId: seriesId } : null;
    }, [scope, seriesId, chapterId]);

    // A scope was picked but its target isn't chosen yet — don't query blindly.
    const awaitingTarget = scope !== 'all' && filterTarget === null;

    const buildParams = useCallback(() => {
        const p = new URLSearchParams();
        if (filterTarget) {
            p.set('filterType', filterTarget.filterType);
            p.set('filterId', String(filterTarget.filterId));
        }
        if (debouncedSearch) p.set('search', debouncedSearch);
        if (sort !== 'newest') p.set('sort', sort);
        p.set('perPage', String(perPage));
        p.set('page', String(page));
        return p;
    }, [filterTarget, debouncedSearch, sort, perPage, page]);

    const load = useCallback(async () => {
        if (awaitingTarget) {
            setComments(null); setReactions(null); setViews(null);
            return;
        }

        const id = ++reqId.current;
        setLoading(true);
        setError(null);

        try {
            const p = buildParams();
            let url: string;

            if (tab === 'comments') {
                if (period !== 'all') p.set('period', period);
                if (includeReplies) p.set('includeReplies', '1');
                url = route('admin.monitoring.comments');
            } else if (tab === 'reactions') {
                url = route('admin.monitoring.reactions');
            } else {
                if (itemType !== 'all') p.set('itemType', itemType);
                url = route('admin.monitoring.views');
            }

            const res = await fetch(`${url}?${p}`, { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
            if (!res.ok) throw new Error(`Request failed (${res.status})`);
            const json = await res.json();

            if (id !== reqId.current) return; // a newer request already won

            if (tab === 'comments') setComments(json);
            else if (tab === 'reactions') setReactions(json);
            else setViews(json);
        } catch (e) {
            if (id === reqId.current) setError(e instanceof Error ? e.message : 'Something went wrong');
        } finally {
            if (id === reqId.current) setLoading(false);
        }
    }, [tab, buildParams, period, itemType, includeReplies, awaitingTarget]);

    useEffect(() => { load(); }, [load]);

    const refreshStats = useCallback(async () => {
        try {
            const res = await fetch(route('admin.monitoring.stats'), { headers: { Accept: 'application/json' } });
            if (res.ok) setStats(await res.json());
        } catch { /* the tiles simply keep their previous values */ }
    }, []);

    const doDelete = async () => {
        if (!confirmDelete) return;
        const target = confirmDelete;
        setConfirmDelete(null);

        try {
            const res = await fetch(route('admin.monitoring.comments.delete', target.id), {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.message || 'Delete failed');

            setToast(json.message || 'Comment deleted.');
            load();
            refreshStats();
        } catch (e) {
            setToast(e instanceof Error ? e.message : 'Delete failed');
        }
    };

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(t);
    }, [toast]);

    const activePaginator: Paginator<unknown> | null =
        tab === 'comments' ? comments : tab === 'reactions' ? (reactions?.rows ?? null) : (views?.rows ?? null);

    const sortOptions = tab === 'comments'
        ? [
            { value: 'newest', label: 'Newest first' },
            { value: 'oldest', label: 'Oldest first' },
            { value: 'replies', label: 'Most replies' },
            { value: 'longest', label: 'Longest first' },
        ]
        : tab === 'reactions'
            ? [{ value: 'newest', label: 'Most reactions' }, { value: 'least', label: 'Fewest reactions' }]
            : [
                { value: 'newest', label: 'Most views' },
                { value: 'least', label: 'Fewest views' },
                { value: 'title', label: 'Title A–Z' },
            ];

    const card: React.CSSProperties = {
        background: ink.card,
        border: `1px solid ${ink.border}`,
        borderRadius: 12,
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: ink.primary }}>Monitoring</h1>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: ink.muted }}>
                        Community activity and page performance across every series and chapter.
                    </p>
                </div>
                <div style={{ flex: 1 }} />
                <button
                    onClick={() => { load(); refreshStats(); }}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px',
                        borderRadius: 9, border: `1px solid ${ink.border}`, background: ink.card,
                        fontSize: 12.5, fontWeight: 600, color: ink.primary, cursor: 'pointer',
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* ── Summary tiles ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12 }}>
                <Tile
                    ink={ink} accent={slots[0]} label="Comments"
                    value={stats.comments.total}
                    lines={[
                        `${nf.format(stats.comments.threads)} threads · ${nf.format(stats.comments.replies)} replies`,
                        `${nf.format(stats.comments.today)} today · ${nf.format(stats.comments.week)} this week`,
                    ]}
                />
                <Tile
                    ink={ink} accent={slots[1]} label="Commenters"
                    value={stats.comments.commenters}
                    lines={['Distinct users who have commented']}
                />
                <Tile
                    ink={ink} accent={slots[2]} label="Reactions"
                    value={stats.reactions.total}
                    lines={[
                        `Across ${nf.format(stats.reactions.pages)} pages`,
                        REACTION_KEYS.map(k => `${REACTION_META[k].emoji}${nf.format(stats.reactions.by_type[k] ?? 0)}`).join('  '),
                    ]}
                />
                <Tile
                    ink={ink} accent={slots[3]} label="Total views"
                    value={stats.views.total}
                    lines={[
                        `${nf.format(stats.views.series)} on ${nf.format(stats.views.series_count)} series pages`,
                        `${nf.format(stats.views.chapters)} on ${nf.format(stats.views.chapter_count)} chapters`,
                    ]}
                />
            </div>

            {/* ── Panel ── */}
            <div style={{ ...card, overflow: 'hidden' }}>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: `1px solid ${ink.border}`, overflowX: 'auto' }}>
                    {(['comments', 'reactions', 'views'] as Tab[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            style={{
                                padding: '13px 22px', fontSize: 13.5, fontWeight: tab === t ? 700 : 500,
                                border: 'none', background: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                                color: tab === t ? accent : ink.secondary,
                                borderBottom: `2px solid ${tab === t ? accent : 'transparent'}`,
                                textTransform: 'capitalize',
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* Filter bar */}
                <div style={{ padding: 16, borderBottom: `1px solid ${ink.border}`, background: ink.panel }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
                        <Field label="Scope" hint={SCOPES.find(s => s.value === scope)?.hint} ink={ink}>
                            <Select value={scope} onChange={v => setScope(v as Scope)} options={SCOPES.map(s => ({ value: s.value, label: s.label }))} ink={ink} />
                        </Field>

                        {scope !== 'all' && (
                            <Field label="Series" hint={!seriesId ? 'Required for this scope' : undefined} ink={ink}>
                                <SeriesCombobox series={series} value={seriesId} onChange={setSeriesId} ink={ink} />
                            </Field>
                        )}

                        {scope === 'chapter' && (
                            <Field label="Chapter" hint={seriesId && !chapterId ? 'Pick a chapter' : undefined} ink={ink}>
                                <Select
                                    value={chapterId ? String(chapterId) : ''}
                                    onChange={v => setChapterId(v ? Number(v) : null)}
                                    options={[
                                        { value: '', label: seriesId ? (chapters.length ? 'Choose chapter…' : 'No chapters') : 'Pick a series first' },
                                        ...chapters.map(c => ({ value: String(c.id), label: c.label })),
                                    ]}
                                    ink={ink}
                                    disabled={!seriesId || chapters.length === 0}
                                />
                            </Field>
                        )}

                        {tab !== 'reactions' && (
                            <Field label="Search" ink={ink}>
                                <Input
                                    value={search}
                                    onChange={setSearch}
                                    placeholder={tab === 'comments' ? 'User or comment text…' : 'Series or chapter title…'}
                                    ink={ink}
                                    onClear={() => setSearch('')}
                                />
                            </Field>
                        )}

                        {tab === 'comments' && (
                            <Field label="Period" ink={ink}>
                                <Select value={period} onChange={setPeriod} options={PERIODS} ink={ink} />
                            </Field>
                        )}

                        {tab === 'views' && (
                            <Field label="Page type" ink={ink}>
                                <Select
                                    value={itemType}
                                    onChange={setItemType}
                                    options={[
                                        { value: 'all', label: 'Series & chapters' },
                                        { value: 'series', label: 'Series pages only' },
                                        { value: 'chapter', label: 'Chapters only' },
                                    ]}
                                    ink={ink}
                                />
                            </Field>
                        )}

                        <Field label="Sort" ink={ink}>
                            <Select value={sort} onChange={setSort} options={sortOptions} ink={ink} />
                        </Field>

                        <Field label="Rows" ink={ink}>
                            <Select
                                value={String(perPage)}
                                onChange={v => setPerPage(Number(v))}
                                options={PER_PAGE.map(n => ({ value: String(n), label: `${n} per page` }))}
                                ink={ink}
                            />
                        </Field>
                    </div>

                    {tab === 'comments' && (
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 12.5, color: ink.secondary, cursor: 'pointer' }}>
                            <input type="checkbox" checked={includeReplies} onChange={e => setIncludeReplies(e.target.checked)} style={{ accentColor: accent }} />
                            Include replies (off = top-level comments only)
                        </label>
                    )}

                    {(scope !== 'all' || search || period !== 'all' || itemType !== 'all') && (
                        <button
                            onClick={() => { setScope('all'); setSeriesId(null); setChapterId(null); setSearch(''); setPeriod('all'); setItemType('all'); setSort('newest'); }}
                            style={{
                                marginTop: 12, marginLeft: tab === 'comments' ? 16 : 0, padding: '5px 11px',
                                fontSize: 11.5, fontWeight: 600, borderRadius: 7, cursor: 'pointer',
                                border: `1px solid ${ink.border}`, background: 'transparent', color: ink.secondary,
                            }}
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                {/* Views totals strip — a real SUM over everything matching the filter */}
                {tab === 'views' && views && !loading && (
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: 18, padding: '13px 16px',
                        borderBottom: `1px solid ${ink.border}`, alignItems: 'baseline',
                    }}>
                        <Total label="Total views" value={views.totals.views} ink={ink} accent={slots[0]} big />
                        <Total label="Series pages" value={views.totals.series_views} ink={ink} accent={slots[1]} />
                        <Total label="Chapters" value={views.totals.chapter_views} ink={ink} accent={slots[2]} />
                        <div style={{ flex: 1 }} />
                        <span style={{ fontSize: 11.5, color: ink.muted }}>
                            across {nf.format(views.totals.rows)} pages matching this filter
                        </span>
                    </div>
                )}

                {/* Reaction totals strip */}
                {tab === 'reactions' && reactions && !loading && (
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: 18, padding: '13px 16px',
                        borderBottom: `1px solid ${ink.border}`, alignItems: 'baseline',
                    }}>
                        <Total label="Total reactions" value={reactions.totals.total} ink={ink} accent={slots[0]} big />
                        {REACTION_KEYS.map((k, i) => (
                            <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: ink.secondary }}>
                                <span style={{ width: 9, height: 9, borderRadius: 3, background: slots[i], flexShrink: 0 }} />
                                <span aria-hidden>{REACTION_META[k].emoji}</span>
                                {REACTION_META[k].label}
                                <strong style={{ color: ink.primary, fontVariantNumeric: 'tabular-nums' }}>{nf.format(reactions.totals[k] ?? 0)}</strong>
                            </span>
                        ))}
                    </div>
                )}

                {/* Body */}
                <div>
                    {awaitingTarget ? (
                        <Notice ink={ink} accent={accent}
                            title={scope === 'chapter' && seriesId ? 'Pick a chapter' : 'Pick a series'}
                            body={SCOPES.find(s => s.value === scope)?.hint ?? ''} />
                    ) : error ? (
                        <Notice ink={ink} accent={danger} title="Could not load data" body={error} />
                    ) : loading ? (
                        <Skeleton ink={ink} rows={6} />
                    ) : tab === 'comments' ? (
                        <CommentsTable rows={comments?.data ?? []} ink={ink} slots={slots} danger={danger} onDelete={setConfirmDelete} />
                    ) : tab === 'reactions' ? (
                        <ReactionsTable rows={reactions?.rows.data ?? []} ink={ink} slots={slots} />
                    ) : (
                        <ViewsTable rows={views?.rows.data ?? []} ink={ink} slots={slots} />
                    )}
                </div>

                {/* Pagination */}
                {!awaitingTarget && !loading && !error && activePaginator && activePaginator.total > 0 && (
                    <Pagination p={activePaginator} onPage={setPage} ink={ink} accent={accent} />
                )}
            </div>

            {confirmDelete && (
                <ConfirmDialog
                    ink={ink}
                    danger={danger}
                    comment={confirmDelete}
                    onCancel={() => setConfirmDelete(null)}
                    onConfirm={doDelete}
                />
            )}

            {toast && (
                <div style={{
                    position: 'fixed', bottom: 22, right: 22, zIndex: 1000,
                    padding: '12px 18px', borderRadius: 10, background: ink.surface,
                    border: `1px solid ${ink.border}`, boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                    fontSize: 13, color: ink.primary, maxWidth: 340,
                }}>
                    {toast}
                </div>
            )}
        </div>
    );
}

// ─── Tables ───────────────────────────────────────────────────────────────────

type Ink = Record<string, string>;

const thBase = (ink: Ink): React.CSSProperties => ({
    padding: '10px 16px', textAlign: 'left', fontSize: 10.5, fontWeight: 600,
    color: ink.muted, textTransform: 'uppercase', letterSpacing: '0.05em',
    background: ink.panel, borderBottom: `1px solid ${ink.border}`, whiteSpace: 'nowrap',
    position: 'sticky', top: 0, zIndex: 1,
});
const tdBase = (ink: Ink): React.CSSProperties => ({
    padding: '12px 16px', fontSize: 13, color: ink.primary, borderBottom: `1px solid ${ink.grid}`,
    verticalAlign: 'top',
});

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ maxHeight: '65vh', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table>
        </div>
    );
}

function CommentsTable({ rows, ink, slots, danger, onDelete }: {
    rows: CommentRow[]; ink: Ink; slots: string[]; danger: string; onDelete: (c: CommentRow) => void;
}) {
    if (!rows.length) return <Empty ink={ink} msg="No comments match this filter." />;

    const th = thBase(ink); const td = tdBase(ink);

    return (
        <Shell>
            <thead>
                <tr>
                    <th style={{ ...th, width: '22%' }}>Page</th>
                    <th style={{ ...th, width: 170 }}>User</th>
                    <th style={th}>Comment</th>
                    <th style={{ ...th, width: 150 }}>Posted</th>
                    <th style={{ ...th, width: 80, textAlign: 'right' }}>Action</th>
                </tr>
            </thead>
            <tbody>
                {rows.map(c => (
                    <tr key={c.id}>
                        <td style={td}>
                            <div style={{ fontWeight: 600, lineHeight: 1.4 }}>{c.page}</div>
                            {c.context && <div style={{ fontSize: 11, color: ink.muted, marginTop: 3 }}>{c.context}</div>}
                        </td>
                        <td style={td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                    width: 26, height: 26, borderRadius: 999, flexShrink: 0,
                                    background: slots[0], color: '#fff', fontSize: 11, fontWeight: 700,
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {c.user_name.charAt(0).toUpperCase()}
                                </span>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.user_email ?? undefined}>
                                        {c.user_name}
                                    </div>
                                    {c.user_role === 'admin' && (
                                        <span style={{ fontSize: 9.5, fontWeight: 700, color: slots[1], textTransform: 'uppercase', letterSpacing: '.04em' }}>Admin</span>
                                    )}
                                </div>
                            </div>
                        </td>
                        <td style={td}>
                            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.55 }}>{c.content}</div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                                {c.is_reply && <Pill ink={ink} color={ink.muted} text="Reply" />}
                                {c.replies_count > 0 && <Pill ink={ink} color={slots[2]} text={`${c.replies_count} ${c.replies_count === 1 ? 'reply' : 'replies'}`} />}
                                {c.is_edited && <Pill ink={ink} color={ink.muted} text="Edited" />}
                            </div>
                        </td>
                        <td style={{ ...td, color: ink.secondary, whiteSpace: 'nowrap' }}>{c.created_label ?? '—'}</td>
                        <td style={{ ...td, textAlign: 'right' }}>
                            <button
                                onClick={() => onDelete(c)}
                                style={{ fontSize: 12, fontWeight: 600, color: danger, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Shell>
    );
}

function ReactionsTable({ rows, ink, slots }: { rows: ReactionRow[]; ink: Ink; slots: string[] }) {
    if (!rows.length) return <Empty ink={ink} msg="No reactions match this filter." />;

    const th = thBase(ink); const td = tdBase(ink);

    return (
        <Shell>
            <thead>
                <tr>
                    <th style={th}>Page</th>
                    {REACTION_KEYS.map(k => (
                        <th key={k} style={{ ...th, textAlign: 'center', width: 78 }}>
                            <span aria-hidden>{REACTION_META[k].emoji}</span> {REACTION_META[k].label}
                        </th>
                    ))}
                    <th style={{ ...th, textAlign: 'center', width: 84 }}>Total</th>
                    <th style={{ ...th, width: 130 }}>Mix</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((r, i) => (
                    <tr key={i}>
                        <td style={td}>
                            <div style={{ fontWeight: 600, lineHeight: 1.4 }}>
                                {r.page}
                                {r.orphaned && <span style={{ marginLeft: 8, fontSize: 10.5, color: '#d03b3b', fontWeight: 600 }}>orphaned</span>}
                            </div>
                            {r.context && <div style={{ fontSize: 11, color: ink.muted, marginTop: 3 }}>{r.context}</div>}
                        </td>
                        {REACTION_KEYS.map(k => {
                            const v = r[`${k}_count` as keyof ReactionRow] as number;
                            return (
                                <td key={k} style={{ ...td, textAlign: 'center', color: v ? ink.primary : ink.muted, fontVariantNumeric: 'tabular-nums' }}>
                                    {v}
                                </td>
                            );
                        })}
                        <td style={{ ...td, textAlign: 'center', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{r.total_count}</td>
                        <td style={td}>
                            <div style={{ display: 'flex', height: 7, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
                                {REACTION_KEYS.map((k, ki) => {
                                    const v = r[`${k}_count` as keyof ReactionRow] as number;
                                    if (!v) return null;
                                    return (
                                        <span
                                            key={k}
                                            title={`${REACTION_META[k].label}: ${v}`}
                                            style={{ width: `${(v / (r.total_count || 1)) * 100}%`, background: slots[ki] }}
                                        />
                                    );
                                })}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Shell>
    );
}

function ViewsTable({ rows, ink, slots }: { rows: ViewRow[]; ink: Ink; slots: string[] }) {
    if (!rows.length) return <Empty ink={ink} msg="No pages match this filter." />;

    const th = thBase(ink); const td = tdBase(ink);
    const max = Math.max(...rows.map(r => r.views), 1);

    return (
        <Shell>
            <thead>
                <tr>
                    <th style={th}>Page</th>
                    <th style={{ ...th, width: 100, textAlign: 'center' }}>Type</th>
                    <th style={{ ...th, width: 190 }}>Views</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((r, i) => (
                    <tr key={i}>
                        <td style={{ ...td, lineHeight: 1.45 }}>{r.page}</td>
                        <td style={{ ...td, textAlign: 'center' }}>
                            <Pill ink={ink} color={r.type === 'series' ? slots[0] : slots[2]} text={r.type === 'series' ? 'Series' : 'Chapter'} solid />
                        </td>
                        <td style={td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ width: 62, textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                                    {nf.format(r.views)}
                                </span>
                                <span style={{ flex: 1, height: 6, background: ink.panel, borderRadius: 3, overflow: 'hidden' }}>
                                    <span style={{ display: 'block', width: `${(r.views / max) * 100}%`, height: '100%', background: r.type === 'series' ? slots[0] : slots[2] }} />
                                </span>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Shell>
    );
}

// ─── Pieces ───────────────────────────────────────────────────────────────────

function Tile({ ink, accent, label, value, lines }: { ink: Ink; accent: string; label: string; value: number; lines: string[] }) {
    return (
        <div style={{
            background: ink.card, border: `1px solid ${ink.border}`, borderRadius: 12,
            padding: 16, position: 'relative', overflow: 'hidden',
        }}>
            <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accent }} />
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', color: ink.muted }}>{label}</p>
            <p style={{ margin: '7px 0 0', fontSize: 25, fontWeight: 700, color: ink.primary, lineHeight: 1.1 }}>{nf.format(value)}</p>
            {lines.map((l, i) => (
                <p key={i} style={{ margin: '4px 0 0', fontSize: 11, color: ink.muted }}>{l}</p>
            ))}
        </div>
    );
}

function Total({ label, value, ink, accent, big = false }: { label: string; value: number; ink: Ink; accent: string; big?: boolean }) {
    return (
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: accent, flexShrink: 0, alignSelf: 'center' }} />
            <span style={{ fontSize: 11.5, color: ink.secondary }}>{label}</span>
            <strong style={{ fontSize: big ? 19 : 14, fontWeight: 700, color: ink.primary, fontVariantNumeric: 'tabular-nums' }}>
                {nf.format(value)}
            </strong>
        </span>
    );
}

function Field({ label, hint, ink, children }: { label: string; hint?: string; ink: Ink; children: React.ReactNode }) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: ink.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                {label}
            </label>
            {children}
            {hint && <p style={{ margin: '4px 0 0', fontSize: 10.5, color: ink.muted }}>{hint}</p>}
        </div>
    );
}

function Select({ value, onChange, options, ink, disabled }: {
    value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; ink: Ink; disabled?: boolean;
}) {
    return (
        <select
            value={value}
            disabled={disabled}
            onChange={e => onChange(e.target.value)}
            style={{
                width: '100%', padding: '8px 30px 8px 11px', background: ink.input, color: ink.primary,
                border: `1px solid ${ink.border}`, borderRadius: 8, fontSize: 12.5, outline: 'none',
                boxSizing: 'border-box', appearance: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.55 : 1,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
            }}
        >
            {options.map(o => (
                <option key={o.value} value={o.value} style={{ background: ink.surface, color: ink.primary }}>{o.label}</option>
            ))}
        </select>
    );
}

function Input({ value, onChange, placeholder, ink, onClear }: {
    value: string; onChange: (v: string) => void; placeholder?: string; ink: Ink; onClear?: () => void;
}) {
    return (
        <div style={{ position: 'relative' }}>
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                style={{
                    width: '100%', padding: '8px 30px 8px 11px', background: ink.input, color: ink.primary,
                    border: `1px solid ${ink.border}`, borderRadius: 8, fontSize: 12.5, outline: 'none', boxSizing: 'border-box',
                }}
            />
            {value && onClear && (
                <button
                    onClick={onClear}
                    aria-label="Clear search"
                    style={{
                        position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: ink.muted,
                        fontSize: 15, lineHeight: 1, padding: '2px 5px',
                    }}
                >
                    ×
                </button>
            )}
        </div>
    );
}

function SeriesCombobox({ series, value, onChange, ink }: {
    series: Series[]; value: number | null; onChange: (v: number | null) => void; ink: Ink;
}) {
    const [query, setQuery] = useState(() => series.find(s => s.id === value)?.title ?? '');
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => { setQuery(series.find(s => s.id === value)?.title ?? ''); }, [value, series]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery(series.find(s => s.id === value)?.title ?? '');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [value, series]);

    const filtered = query.trim()
        ? series.filter(s => s.title.toLowerCase().includes(query.toLowerCase()))
        : series;

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <input
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                placeholder="Search series…"
                autoComplete="off"
                style={{
                    width: '100%', padding: '8px 30px 8px 11px', background: ink.input, color: ink.primary,
                    border: `1px solid ${ink.border}`, borderRadius: 8, fontSize: 12.5, outline: 'none', boxSizing: 'border-box',
                }}
            />
            {value && (
                <button
                    onClick={() => { onChange(null); setQuery(''); }}
                    aria-label="Clear series"
                    style={{
                        position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: ink.muted, fontSize: 15, padding: '2px 5px',
                    }}
                >
                    ×
                </button>
            )}
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
                    background: ink.surface, border: `1px solid ${ink.border}`, borderRadius: 8,
                    maxHeight: 240, overflowY: 'auto', boxShadow: '0 10px 28px rgba(0,0,0,0.28)',
                }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: '11px 13px', fontSize: 12.5, color: ink.muted }}>No series matches “{query}”.</div>
                    ) : filtered.map(s => (
                        <div
                            key={s.id}
                            onMouseDown={e => { e.preventDefault(); onChange(s.id); setQuery(s.title); setOpen(false); }}
                            style={{
                                padding: '9px 13px', fontSize: 12.5, cursor: 'pointer',
                                color: s.id === value ? '#fff' : ink.primary,
                                background: s.id === value ? '#2a78d6' : 'transparent',
                                fontWeight: s.id === value ? 600 : 400,
                            }}
                            onMouseEnter={e => { if (s.id !== value) e.currentTarget.style.background = ink.panel; }}
                            onMouseLeave={e => { if (s.id !== value) e.currentTarget.style.background = 'transparent'; }}
                        >
                            {s.title}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Pagination({ p, onPage, ink, accent }: { p: Paginator<unknown>; onPage: (n: number) => void; ink: Ink; accent: string }) {
    const pages = useMemo(() => {
        const out: (number | '…')[] = [];
        const last = p.last_page;
        const cur = p.current_page;

        for (let i = 1; i <= last; i++) {
            if (i === 1 || i === last || (i >= cur - 1 && i <= cur + 1)) out.push(i);
            else if (out[out.length - 1] !== '…') out.push('…');
        }
        return out;
    }, [p.last_page, p.current_page]);

    const btn = (active: boolean, disabled = false): React.CSSProperties => ({
        minWidth: 32, padding: '6px 9px', fontSize: 12.5, fontWeight: active ? 700 : 500,
        borderRadius: 7, cursor: disabled ? 'not-allowed' : 'pointer',
        border: `1px solid ${active ? accent : ink.border}`,
        background: active ? accent : 'transparent',
        color: active ? '#fff' : disabled ? ink.muted : ink.secondary,
        opacity: disabled ? 0.5 : 1,
    });

    return (
        <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10,
            padding: '13px 16px', borderTop: `1px solid ${ink.border}`,
        }}>
            <span style={{ fontSize: 12, color: ink.muted }}>
                Showing {nf.format(p.from ?? 0)}–{nf.format(p.to ?? 0)} of {nf.format(p.total)}
            </span>
            <div style={{ flex: 1 }} />
            {p.last_page > 1 && (
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button disabled={p.current_page <= 1} onClick={() => onPage(p.current_page - 1)} style={btn(false, p.current_page <= 1)}>Prev</button>
                    {pages.map((n, i) =>
                        n === '…'
                            ? <span key={`e${i}`} style={{ color: ink.muted, fontSize: 12, padding: '0 2px' }}>…</span>
                            : <button key={n} onClick={() => onPage(n)} style={btn(n === p.current_page)}>{n}</button>
                    )}
                    <button disabled={p.current_page >= p.last_page} onClick={() => onPage(p.current_page + 1)} style={btn(false, p.current_page >= p.last_page)}>Next</button>
                </div>
            )}
        </div>
    );
}

function Pill({ ink, color, text, solid = false }: { ink: Ink; color: string; text: string; solid?: boolean }) {
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 999,
            fontSize: 10.5, fontWeight: 600, whiteSpace: 'nowrap',
            background: solid ? color : wa('#808080', 0.12),
            color: solid ? '#fff' : color,
            border: solid ? 'none' : `1px solid ${ink.border}`,
        }}>
            {text}
        </span>
    );
}

function Skeleton({ ink, rows }: { ink: Ink; rows: number }) {
    return (
        <div style={{ padding: 16 }}>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    {[22, 14, 40, 12].map((w, j) => (
                        <div key={j} style={{
                            height: 13, width: `${w}%`, borderRadius: 5,
                            background: ink.panel, opacity: 1 - i * 0.11,
                        }} />
                    ))}
                </div>
            ))}
        </div>
    );
}

function Empty({ ink, msg }: { ink: Ink; msg: string }) {
    return <div style={{ padding: '44px 20px', textAlign: 'center', fontSize: 13, color: ink.muted }}>{msg}</div>;
}

function Notice({ ink, accent, title, body }: { ink: Ink; accent: string; title: string; body: string }) {
    return (
        <div style={{ padding: '38px 20px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: accent }}>{title}</p>
            <p style={{ margin: '6px 0 0', fontSize: 12.5, color: ink.muted }}>{body}</p>
        </div>
    );
}

function ConfirmDialog({ ink, danger, comment, onCancel, onConfirm }: {
    ink: Ink; danger: string; comment: CommentRow; onCancel: () => void; onConfirm: () => void;
}) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onCancel]);

    return (
        <div
            onClick={onCancel}
            style={{
                position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: ink.surface, border: `1px solid ${ink.border}`, borderRadius: 14,
                    padding: 22, maxWidth: 460, width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
                }}
            >
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: ink.primary }}>Delete this comment?</h3>
                <p style={{ margin: '8px 0 0', fontSize: 12.5, color: ink.secondary, lineHeight: 1.6 }}>
                    From <strong style={{ color: ink.primary }}>{comment.user_name}</strong> on {comment.page}.
                    {comment.replies_count > 0 && (
                        <> Its <strong style={{ color: danger }}>{comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}</strong> will be deleted too.</>
                    )}
                </p>
                <div style={{
                    margin: '12px 0 0', padding: 11, borderRadius: 8, background: ink.panel,
                    fontSize: 12, color: ink.secondary, maxHeight: 110, overflowY: 'auto',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.55,
                }}>
                    {comment.content}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, marginTop: 18 }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '8px 15px', fontSize: 12.5, fontWeight: 600, borderRadius: 8, cursor: 'pointer',
                            border: `1px solid ${ink.border}`, background: 'transparent', color: ink.secondary,
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '8px 15px', fontSize: 12.5, fontWeight: 700, borderRadius: 8, cursor: 'pointer',
                            border: 'none', background: danger, color: '#fff',
                        }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
