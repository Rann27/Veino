import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTheme } from '@/Contexts/ThemeContext';

interface Series { id: number; title: string; }
interface Chapter { id: number; label: string; }
interface Comment { id: number; page: string; user_name: string; content: string; created_at: string; }
interface Reaction { page: string; like_count: number; love_count: number; haha_count: number; angry_count: number; sad_count: number; total_count: number; }
interface ViewStat { page: string; type: string; views: number; }
interface Props { series: Series[]; }

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

interface ComboboxProps {
    series: Series[];
    value: number | null;
    onChange: (v: number) => void;
    inputBg: string;
    fg: string;
    muted: string;
    border: string;
    panelBg: string;
    bgColor: string;
}

function SeriesCombobox({ series, value, onChange, inputBg, fg, muted, border, panelBg, bgColor }: ComboboxProps) {
    const [query, setQuery] = useState(() => series.find(s => s.id === value)?.title || '');
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setQuery(series.find(s => s.id === value)?.title || '');
    }, [value, series]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery(series.find(s => s.id === value)?.title || '');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [value, series]);

    const filtered = query.trim()
        ? series.filter(s => s.title.toLowerCase().includes(query.toLowerCase()))
        : series;

    const baseInp: React.CSSProperties = {
        width: '100%', padding: '8px 36px 8px 12px', background: inputBg, color: fg,
        border: `1px solid ${border}`, borderRadius: '6px', fontSize: '13px',
        outline: 'none', boxSizing: 'border-box',
    };

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                placeholder="Type to search series..."
                style={baseInp}
                autoComplete="off"
            />
            <svg style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: muted, pointerEvents: 'none', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {open && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: bgColor, border: `1px solid ${border}`, borderRadius: '8px', maxHeight: '220px', overflowY: 'auto', zIndex: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: '12px 14px', fontSize: '13px', color: muted }}>No series found for "{query}"</div>
                    ) : filtered.map(s => (
                        <div
                            key={s.id}
                            onMouseDown={(e) => { e.preventDefault(); onChange(s.id); setQuery(s.title); setOpen(false); }}
                            style={{ padding: '9px 14px', fontSize: '13px', color: s.id === value ? '#2563eb' : fg, background: s.id === value ? 'rgba(37,99,235,0.1)' : 'transparent', cursor: 'pointer', fontWeight: s.id === value ? 600 : 400 }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = s.id === value ? 'rgba(37,99,235,0.15)' : panelBg; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = s.id === value ? 'rgba(37,99,235,0.1)' : 'transparent'; }}
                        >
                            {s.title}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function MonitoringContent({ series }: Props) {
    const { currentTheme } = useTheme();
    const light   = isLight(currentTheme.background);
    const fg      = currentTheme.foreground;
    const muted   = wa(fg, 0.45);
    const border  = wa(fg, 0.12);
    const cardBg  = light ? wa(fg, 0.03) : wa(fg, 0.06);
    const panelBg = light ? wa(fg, 0.06) : wa(fg, 0.09);
    const inputBg = light ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)';

    const [activeTab, setActiveTab] = useState<'comments' | 'reactions' | 'views'>('comments');

    // Comments state
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentSearch, setCommentSearch] = useState('');
    const [commentFilterType, setCommentFilterType] = useState<'all' | 'series' | 'chapter' | 'series_chapters'>('all');
    const [commentFilterId, setCommentFilterId] = useState<number | null>(null);
    const [commentFilterSeriesId, setCommentFilterSeriesId] = useState<number | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);

    // Reactions state
    const [reactions, setReactions] = useState<Reaction[]>([]);
    const [reactionsLoading, setReactionsLoading] = useState(false);
    const [reactionFilterType, setReactionFilterType] = useState<'all' | 'series' | 'chapter' | 'series_chapters'>('all');
    const [reactionFilterId, setReactionFilterId] = useState<number | null>(null);
    const [reactionFilterSeriesId, setReactionFilterSeriesId] = useState<number | null>(null);
    const [reactionChapters, setReactionChapters] = useState<Chapter[]>([]);

    // Views state
    const [views, setViews] = useState<ViewStat[]>([]);
    const [viewsLoading, setViewsLoading] = useState(false);
    const [viewFilterType, setViewFilterType] = useState<'all' | 'series' | 'chapter' | 'series_chapters'>('all');
    const [viewFilterId, setViewFilterId] = useState<number | null>(null);
    const [viewFilterSeriesId, setViewFilterSeriesId] = useState<number | null>(null);
    const [viewChapters, setViewChapters] = useState<Chapter[]>([]);

    const fetchComments = async () => {
        setCommentsLoading(true);
        try {
            const p = new URLSearchParams();
            if (commentFilterType !== 'all' && commentFilterId) { p.append('filterType', commentFilterType); p.append('filterId', commentFilterId.toString()); }
            if (commentSearch) p.append('search', commentSearch);
            const res = await fetch(`/admin/monitoring/comments?${p}`);
            const data = await res.json();
            setComments(data.data || []);
        } catch (e) { console.error(e); } finally { setCommentsLoading(false); }
    };

    const fetchReactions = async () => {
        setReactionsLoading(true);
        try {
            const p = new URLSearchParams();
            if (reactionFilterType !== 'all' && reactionFilterId) { p.append('filterType', reactionFilterType); p.append('filterId', reactionFilterId.toString()); }
            const res = await fetch(`/admin/monitoring/reactions?${p}`);
            const data = await res.json();
            setReactions(data || []);
        } catch (e) { console.error(e); } finally { setReactionsLoading(false); }
    };

    const fetchViews = async () => {
        setViewsLoading(true);
        try {
            const p = new URLSearchParams();
            if (viewFilterType !== 'all' && viewFilterId) { p.append('filterType', viewFilterType); p.append('filterId', viewFilterId.toString()); }
            const res = await fetch(`/admin/monitoring/views?${p}`);
            const data = await res.json();
            setViews(data || []);
        } catch (e) { console.error(e); } finally { setViewsLoading(false); }
    };

    const fetchChapters = async (seriesId: number, forTab: 'comments' | 'reactions' | 'views') => {
        try {
            const res = await fetch(`/admin/monitoring/series/${seriesId}/chapters`);
            const data = await res.json();
            if (forTab === 'comments') setChapters(data);
            else if (forTab === 'reactions') setReactionChapters(data);
            else setViewChapters(data);
        } catch (e) { console.error(e); }
    };

    const deleteComment = async (id: number) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;
        try {
            await fetch(`/admin/monitoring/comments/${id}`, {
                method: 'DELETE',
                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' },
            });
            fetchComments();
        } catch (e) { console.error(e); }
    };

    useEffect(() => { if (activeTab === 'comments') fetchComments(); }, [activeTab, commentFilterType, commentFilterId, commentSearch]);
    useEffect(() => { if (activeTab === 'reactions') fetchReactions(); }, [activeTab, reactionFilterType, reactionFilterId]);
    useEffect(() => { if (activeTab === 'views') fetchViews(); }, [activeTab, viewFilterType, viewFilterId]);

    useEffect(() => {
        if (commentFilterType === 'series' && commentFilterSeriesId) setCommentFilterId(commentFilterSeriesId);
        else if (commentFilterType === 'series_chapters' && commentFilterSeriesId) { setCommentFilterId(commentFilterSeriesId); fetchChapters(commentFilterSeriesId, 'comments'); }
        else if (commentFilterType === 'chapter' && commentFilterSeriesId) fetchChapters(commentFilterSeriesId, 'comments');
    }, [commentFilterType, commentFilterSeriesId]);

    useEffect(() => {
        if (reactionFilterType === 'series' && reactionFilterSeriesId) setReactionFilterId(reactionFilterSeriesId);
        else if (reactionFilterType === 'series_chapters' && reactionFilterSeriesId) { setReactionFilterId(reactionFilterSeriesId); fetchChapters(reactionFilterSeriesId, 'reactions'); }
        else if (reactionFilterType === 'chapter' && reactionFilterSeriesId) fetchChapters(reactionFilterSeriesId, 'reactions');
    }, [reactionFilterType, reactionFilterSeriesId]);

    useEffect(() => {
        if (viewFilterType === 'series' && viewFilterSeriesId) setViewFilterId(viewFilterSeriesId);
        else if (viewFilterType === 'series_chapters' && viewFilterSeriesId) { setViewFilterId(viewFilterSeriesId); fetchChapters(viewFilterSeriesId, 'views'); }
        else if (viewFilterType === 'chapter' && viewFilterSeriesId) fetchChapters(viewFilterSeriesId, 'views');
    }, [viewFilterType, viewFilterSeriesId]);

    const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', background: inputBg, color: fg, border: `1px solid ${border}`, borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
    const selStyle: React.CSSProperties = { ...inp, appearance: 'none' as any, WebkitAppearance: 'none' as any, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: '32px' };
    const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 500, color: muted, marginBottom: '6px' };
    const thStyle: React.CSSProperties = { padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: muted, textTransform: 'uppercase', letterSpacing: '0.05em', background: panelBg, borderBottom: `1px solid ${border}` };
    const tdStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '13px', color: fg, borderBottom: `1px solid ${border}` };
    const loadingEl = <div style={{ padding: '40px', textAlign: 'center', color: muted }}>Loading...</div>;
    const emptyEl = (msg: string) => <div style={{ padding: '40px', textAlign: 'center', color: muted }}>{msg}</div>;

    const badge = (color: string, text: string) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: color + '22', color }}>{text}</span>
    );

    const optStyle = { background: currentTheme.background, color: fg };

    const FilterSelect = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
        <select value={value} onChange={(e) => onChange(e.target.value)} style={selStyle}>
            {options.map(o => <option key={o.value} value={o.value} style={optStyle}>{o.label}</option>)}
        </select>
    );

    const filterTypeOptions = (prefix: string) => [
        { value: 'all', label: `All ${prefix}` },
        { value: 'series', label: 'Specific Series' },
        { value: 'chapter', label: 'Specific Chapter' },
        { value: 'series_chapters', label: 'All Chapters in Series' },
    ];

    const ChapterSelect = ({ value, onChange, chapters: chs }: { value: number | null; onChange: (v: number) => void; chapters: Chapter[] }) => (
        <select value={value || ''} onChange={(e) => onChange(Number(e.target.value))} style={selStyle}>
            <option value="" style={optStyle}>Choose chapter...</option>
            {chs.map(ch => <option key={ch.id} value={ch.id} style={optStyle}>{ch.label}</option>)}
        </select>
    );

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: fg }}>Monitoring</h1>
                <p style={{ marginTop: '4px', fontSize: '14px', color: muted }}>Monitor and manage comments, reactions, and views across your platform</p>
            </div>

            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '12px', overflow: 'hidden' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: `1px solid ${border}` }}>
                    {(['comments', 'reactions', 'views'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '14px 24px', fontSize: '14px', fontWeight: 500, border: 'none', background: 'none', cursor: 'pointer', color: activeTab === tab ? '#2563eb' : muted, borderBottom: `2px solid ${activeTab === tab ? '#2563eb' : 'transparent'}`, textTransform: 'capitalize', transition: 'color 0.15s' }}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                <div style={{ padding: '24px' }}>
                    {/* COMMENTS TAB */}
                    {activeTab === 'comments' && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                                <div>
                                    <label style={lbl}>Filter By</label>
                                    <FilterSelect value={commentFilterType} onChange={(v) => { setCommentFilterType(v as any); setCommentFilterId(null); setCommentFilterSeriesId(null); setChapters([]); }} options={filterTypeOptions('Comments')} />
                                </div>
                                {commentFilterType !== 'all' && (
                                    <div>
                                        <label style={lbl}>Select Series</label>
                                        <SeriesCombobox series={series} value={commentFilterSeriesId} onChange={setCommentFilterSeriesId} inputBg={inputBg} fg={fg} muted={muted} border={border} panelBg={panelBg} bgColor={currentTheme.background} />
                                    </div>
                                )}
                                {commentFilterType === 'chapter' && chapters.length > 0 && (
                                    <div>
                                        <label style={lbl}>Select Chapter</label>
                                        <ChapterSelect value={commentFilterId} onChange={setCommentFilterId} chapters={chapters} />
                                    </div>
                                )}
                                <div>
                                    <label style={lbl}>Search</label>
                                    <input type="text" value={commentSearch} onChange={(e) => setCommentSearch(e.target.value)} placeholder="Search by user or content..." style={inp} />
                                </div>
                            </div>

                            <div style={{ border: `1px solid ${border}`, borderRadius: '8px', overflow: 'hidden' }}>
                                <div style={{ maxHeight: '70vh', overflowY: 'auto', overflowX: 'auto' }}>
                                    {commentsLoading ? loadingEl : comments.length === 0 ? emptyEl('No comments found') : (
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                                <tr>
                                                    <th style={{ ...thStyle, width: '20%' }}>Page</th>
                                                    <th style={{ ...thStyle, width: '140px' }}>User</th>
                                                    <th style={thStyle}>Comment</th>
                                                    <th style={{ ...thStyle, width: '160px' }}>Date</th>
                                                    <th style={{ ...thStyle, width: '80px', textAlign: 'right' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {comments.map(comment => (
                                                    <tr key={comment.id} style={{ background: 'transparent' }}>
                                                        <td style={tdStyle}><div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{comment.page}</div></td>
                                                        <td style={tdStyle}><div style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{comment.user_name}</div></td>
                                                        <td style={tdStyle}><div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{comment.content}</div></td>
                                                        <td style={{ ...tdStyle, color: muted }}>{comment.created_at}</td>
                                                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                                                            <button onClick={() => deleteComment(comment.id)} style={{ fontSize: '12px', fontWeight: 500, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Delete</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* REACTIONS TAB */}
                    {activeTab === 'reactions' && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                                <div>
                                    <label style={lbl}>Filter By</label>
                                    <FilterSelect value={reactionFilterType} onChange={(v) => { setReactionFilterType(v as any); setReactionFilterId(null); setReactionFilterSeriesId(null); setReactionChapters([]); }} options={filterTypeOptions('Reactions')} />
                                </div>
                                {reactionFilterType !== 'all' && (
                                    <div>
                                        <label style={lbl}>Select Series</label>
                                        <SeriesCombobox series={series} value={reactionFilterSeriesId} onChange={setReactionFilterSeriesId} inputBg={inputBg} fg={fg} muted={muted} border={border} panelBg={panelBg} bgColor={currentTheme.background} />
                                    </div>
                                )}
                                {reactionFilterType === 'chapter' && reactionChapters.length > 0 && (
                                    <div>
                                        <label style={lbl}>Select Chapter</label>
                                        <ChapterSelect value={reactionFilterId} onChange={setReactionFilterId} chapters={reactionChapters} />
                                    </div>
                                )}
                            </div>

                            <div style={{ border: `1px solid ${border}`, borderRadius: '8px', overflow: 'hidden' }}>
                                <div style={{ maxHeight: '70vh', overflowY: 'auto', overflowX: 'auto' }}>
                                    {reactionsLoading ? loadingEl : reactions.length === 0 ? emptyEl('No reactions found') : (
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                                <tr>
                                                    <th style={thStyle}>Page</th>
                                                    <th style={{ ...thStyle, textAlign: 'center' }}>&#128077; Like</th>
                                                    <th style={{ ...thStyle, textAlign: 'center' }}>&#10084;&#65039; Love</th>
                                                    <th style={{ ...thStyle, textAlign: 'center' }}>&#128514; Haha</th>
                                                    <th style={{ ...thStyle, textAlign: 'center' }}>&#128544; Angry</th>
                                                    <th style={{ ...thStyle, textAlign: 'center' }}>&#128546; Sad</th>
                                                    <th style={{ ...thStyle, textAlign: 'center' }}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reactions.map((reaction, i) => (
                                                    <tr key={i}>
                                                        <td style={tdStyle}>{reaction.page}</td>
                                                        <td style={{ ...tdStyle, textAlign: 'center' }}>{reaction.like_count}</td>
                                                        <td style={{ ...tdStyle, textAlign: 'center' }}>{reaction.love_count}</td>
                                                        <td style={{ ...tdStyle, textAlign: 'center' }}>{reaction.haha_count}</td>
                                                        <td style={{ ...tdStyle, textAlign: 'center' }}>{reaction.angry_count}</td>
                                                        <td style={{ ...tdStyle, textAlign: 'center' }}>{reaction.sad_count}</td>
                                                        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{reaction.total_count}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VIEWS TAB */}
                    {activeTab === 'views' && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                                <div>
                                    <label style={lbl}>Filter By</label>
                                    <FilterSelect value={viewFilterType} onChange={(v) => { setViewFilterType(v as any); setViewFilterId(null); setViewFilterSeriesId(null); setViewChapters([]); }} options={filterTypeOptions('Views')} />
                                </div>
                                {viewFilterType !== 'all' && (
                                    <div>
                                        <label style={lbl}>Select Series</label>
                                        <SeriesCombobox series={series} value={viewFilterSeriesId} onChange={setViewFilterSeriesId} inputBg={inputBg} fg={fg} muted={muted} border={border} panelBg={panelBg} bgColor={currentTheme.background} />
                                    </div>
                                )}
                                {viewFilterType === 'chapter' && viewChapters.length > 0 && (
                                    <div>
                                        <label style={lbl}>Select Chapter</label>
                                        <ChapterSelect value={viewFilterId} onChange={setViewFilterId} chapters={viewChapters} />
                                    </div>
                                )}
                            </div>

                            <div style={{ border: `1px solid ${border}`, borderRadius: '8px', overflow: 'hidden' }}>
                                <div style={{ maxHeight: '70vh', overflowY: 'auto', overflowX: 'auto' }}>
                                    {viewsLoading ? loadingEl : views.length === 0 ? emptyEl('No views data found') : (
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                                <tr>
                                                    <th style={thStyle}>Page</th>
                                                    <th style={{ ...thStyle, textAlign: 'center', width: '120px' }}>Type</th>
                                                    <th style={{ ...thStyle, textAlign: 'center', width: '140px' }}>Total Views</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {views.map((view, i) => (
                                                    <tr key={i}>
                                                        <td style={tdStyle}><div style={{ maxWidth: '480px' }}>{view.page}</div></td>
                                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                            {view.type === 'series' ? badge('#2563eb', 'Series') : badge('#22c55e', 'Chapter')}
                                                        </td>
                                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                            {badge('#7c3aed', `\ud83d\udc41\ufe0f ${view.views.toLocaleString()}`)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>

                            {!viewsLoading && views.length > 0 && (
                                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '12px 24px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', borderRadius: '10px', boxShadow: '0 4px 12px rgba(124,58,237,0.35)' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grand Total:</span>
                                        <span style={{ fontSize: '22px', fontWeight: 700 }}>
                                            \ud83d\udc41\ufe0f {views.reduce((sum, v) => sum + v.views, 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Index({ series }: Props) {
    return (
        <AdminLayout title="Monitoring">
            <Head title="Monitoring - Comments, Reactions & Views" />
            <MonitoringContent series={series} />
        </AdminLayout>
    );
}
