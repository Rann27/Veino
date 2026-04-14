import React, { useState, useEffect, useRef } from 'react';
import { useTheme, SHINY_PURPLE } from '@/Contexts/ThemeContext';
import { useToast } from '@/Contexts/ToastContext';
import { router } from '@inertiajs/react';

// ── Icons ─────────────────────────────────────────────────────────────────────

const SendIcon = () => (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);
const ReplyIcon = () => (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 0 0-4-4H4" />
    </svg>
);
const EditIcon = () => (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);
const DeleteIcon = () => (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);
const ChevronIcon = ({ open }: { open: boolean }) => (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

// ── Types ─────────────────────────────────────────────────────────────────────

interface User { id: number; display_name: string; avatar_url?: string; is_premium?: boolean; }

interface Comment {
    id: number;
    user: User;
    content: string;
    created_at: string;
    is_edited: boolean;
    edited_at: string | null;
    user_reaction: string | null;
    replies: Comment[];
    reactions?: { type: string; count: number }[];
}

interface Props {
    commentableType: 'series' | 'chapter';
    commentableId: number;
    isAuthenticated: boolean;
    currentUserId?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60)     return 'just now';
    if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Avatar({ user, size = 36 }: { user: User; size?: number }) {
    const [err, setErr] = useState(false);
    const initials = user.display_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    const premiumRing: React.CSSProperties = user.is_premium
        ? { boxShadow: `0 0 0 2px ${SHINY_PURPLE}, 0 0 0 4px ${SHINY_PURPLE}30` }
        : {};

    if (!user.avatar_url || err) {
        return (
            <div
                className="flex items-center justify-center rounded-full flex-shrink-0 font-bold select-none"
                style={{
                    width: size, height: size, fontSize: size * 0.36,
                    background: `linear-gradient(135deg, ${SHINY_PURPLE}CC, ${SHINY_PURPLE}80)`,
                    color: '#fff',
                    ...premiumRing,
                }}
            >
                {initials}
            </div>
        );
    }
    return (
        <img
            src={user.avatar_url}
            alt={user.display_name}
            onError={() => setErr(true)}
            className="rounded-full object-cover flex-shrink-0"
            style={{ width: size, height: size, ...premiumRing }}
        />
    );
}

function Textarea({
    value, onChange, placeholder, rows = 3, autoFocus = false,
    style,
}: {
    value: string; onChange: (v: string) => void; placeholder: string;
    rows?: number; autoFocus?: boolean; style?: React.CSSProperties;
}) {
    const { currentTheme } = useTheme();
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);

    return (
        <textarea
            ref={ref}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full resize-none rounded-xl text-sm focus:outline-none transition-colors"
            style={{
                backgroundColor: `${currentTheme.foreground}05`,
                border: `1px solid ${currentTheme.foreground}12`,
                color: currentTheme.foreground,
                padding: '10px 14px',
                ...style,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = `${SHINY_PURPLE}60`; }}
            onBlur={e => { e.currentTarget.style.borderColor = `${currentTheme.foreground}12`; }}
        />
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CommentSection({ commentableType, commentableId, isAuthenticated, currentUserId }: Props) {
    const { currentTheme } = useTheme();
    const { confirm, toast } = useToast();

    const [comments, setComments]       = useState<Comment[]>([]);
    const [loading, setLoading]         = useState(true);
    const [newComment, setNewComment]   = useState('');
    const [sortBy, setSortBy]           = useState<'newest' | 'oldest' | 'popular'>('newest');
    const [submitting, setSubmitting]   = useState(false);

    // Pagination
    const [page, setPage]               = useState(1);
    const [hasMore, setHasMore]         = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [totalAll, setTotalAll]       = useState(0);

    // Per-comment state
    const [replyTo, setReplyTo]         = useState<number | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [editingId, setEditingId]     = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [expanded, setExpanded]       = useState<Set<number>>(new Set());

    useEffect(() => { loadComments(1, false); }, [commentableType, commentableId, sortBy]);

    // Read CSRF from XSRF-TOKEN cookie (always fresh, set by Laravel on every response).
    // The meta[name="csrf-token"] tag becomes stale after Inertia SPA navigation post-login,
    // causing 419 errors on first session. Cookie-based token avoids this entirely.
    const csrfHeaders = (): Record<string, string> => {
        const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
        if (match) return { 'X-XSRF-TOKEN': decodeURIComponent(match[1]) };
        return { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' };
    };

    async function loadComments(pageNum = 1, append = false) {
        if (!append) setLoading(true);
        else setLoadingMore(true);
        try {
            const res = await fetch(
                route('comments.index', { type: commentableType, id: commentableId }) +
                `?sort=${sortBy}&page=${pageNum}&per_page=10`
            );
            if (res.ok) {
                const data = await res.json();
                const incoming = data.comments || [];
                setComments(prev => append ? [...prev, ...incoming] : incoming);
                setHasMore(data.has_more || false);
                setTotalAll(data.total_all || 0);
                setPage(pageNum);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); setLoadingMore(false); }
    }

    async function postComment(content: string, parentId?: number) {
        if (!content.trim() || submitting) return false;
        setSubmitting(true);
        try {
            const res = await fetch(route('comments.store', { type: commentableType, id: commentableId }), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...csrfHeaders() },
                body: JSON.stringify({ content, ...(parentId ? { parent_id: parentId } : {}) }),
            });
            if (res.ok) {
                await loadComments(1, false);
                return true;
            }
            if (res.status === 419) {
                toast.error('Session expired. Please reload the page and try again.', 'Session Expired');
            } else {
                toast.error('Failed to post comment. Please try again.', 'Error');
            }
        } catch (e) {
            console.error(e);
            toast.error('Connection error. Please check your internet and try again.', 'Error');
        }
        finally { setSubmitting(false); }
        return false;
    }

    async function submitEdit(commentId: number) {
        if (!editContent.trim() || submitting) return;
        setSubmitting(true);
        try {
            const res = await fetch(route('comments.update', { id: commentId }), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...csrfHeaders() },
                body: JSON.stringify({ content: editContent }),
            });
            if (res.ok) {
                setEditingId(null);
                setEditContent('');
                await loadComments(1, false);
            } else {
                toast.error('Failed to update comment. Please try again.', 'Error');
            }
        } catch (e) {
            console.error(e);
            toast.error('Connection error. Please try again.', 'Error');
        }
        finally { setSubmitting(false); }
    }

    function deleteComment(id: number) {
        confirm('This will permanently delete your comment.', async () => {
            try {
                const res = await fetch(route('comments.destroy', { id }), {
                    method: 'DELETE',
                    headers: { 'Accept': 'application/json', ...csrfHeaders() },
                });
                if (res.ok) {
                    await loadComments(1, false);
                } else {
                    toast.error('Failed to delete comment. Please try again.', 'Error');
                }
            } catch (e) {
                console.error(e);
                toast.error('Connection error. Please try again.', 'Error');
            }
        }, 'Delete Comment', 'danger');
    }

    function toggleExpanded(id: number) {
        setExpanded(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    // ── Render a single comment ──────────────────────────────────────────────

    function renderComment(comment: Comment, isReply = false) {
        const isEditing  = editingId === comment.id;
        const isReplying = replyTo === comment.id;
        const canEdit    = isAuthenticated && currentUserId === comment.user.id;
        const hasReplies = !isReply && comment.replies?.length > 0;
        const isOpen     = expanded.has(comment.id);

        return (
            <div key={comment.id}>
                {/* Comment card */}
                <div
                    className="flex gap-3"
                >
                    <Avatar user={comment.user} size={isReply ? 30 : 36} />

                    <div className="flex-1 min-w-0">
                        {/* Bubble */}
                        <div
                            className="rounded-2xl px-4 py-3"
                            style={{
                                backgroundColor: isReply
                                    ? `${currentTheme.foreground}04`
                                    : `${currentTheme.foreground}06`,
                                border: `1px solid ${currentTheme.foreground}08`,
                            }}
                        >
                            {/* Header */}
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className="text-sm font-bold" style={{ color: comment.user.is_premium ? SHINY_PURPLE : currentTheme.foreground }}>
                                    {comment.user.display_name}
                                </span>
                                <span className="text-[11px]" style={{ color: `${currentTheme.foreground}40` }}>
                                    {timeAgo(comment.created_at)}
                                </span>
                                {comment.is_edited && (
                                    <span className="text-[11px] italic" style={{ color: `${currentTheme.foreground}35` }}>
                                        edited
                                    </span>
                                )}
                            </div>

                            {/* Content / Edit form */}
                            {isEditing ? (
                                <div className="mt-1">
                                    <Textarea value={editContent} onChange={setEditContent}
                                        placeholder="Edit your comment..." rows={3} autoFocus />
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => submitEdit(comment.id)} disabled={submitting || !editContent.trim()}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-50"
                                            style={{ backgroundColor: SHINY_PURPLE, color: '#fff' }}>
                                            Save
                                        </button>
                                        <button onClick={() => { setEditingId(null); setEditContent(''); }}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-70"
                                            style={{ backgroundColor: `${currentTheme.foreground}10`, color: currentTheme.foreground }}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words"
                                    style={{ color: `${currentTheme.foreground}CC` }}>
                                    {comment.content}
                                </p>
                            )}
                        </div>

                        {/* Actions row */}
                        {!isEditing && (
                            <div className="flex items-center gap-3 mt-1.5 px-1">
                                {/* Reply — only on top-level comments, only for authenticated users */}
                                {isAuthenticated && !isReply && (
                                    <button
                                        onClick={() => {
                                            if (replyTo === comment.id) {
                                                setReplyTo(null); setReplyContent('');
                                            } else {
                                                setReplyTo(comment.id); setReplyContent('');
                                                // Auto-expand replies when replying
                                                if (!isOpen) toggleExpanded(comment.id);
                                            }
                                        }}
                                        className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
                                        style={{ color: isReplying ? SHINY_PURPLE : `${currentTheme.foreground}50` }}
                                    >
                                        <ReplyIcon />
                                        Reply
                                    </button>
                                )}

                                {canEdit && (
                                    <>
                                        <button
                                            onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}
                                            className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
                                            style={{ color: `${currentTheme.foreground}50` }}
                                        >
                                            <EditIcon />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteComment(comment.id)}
                                            className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
                                            style={{ color: '#ef444490' }}
                                        >
                                            <DeleteIcon />
                                            Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Inline reply form */}
                        {isReplying && (
                            <div className="mt-3 flex gap-2.5">
                                <img
                                    src="/images/default-avatar.svg"
                                    alt="avatar"
                                    className="rounded-full object-cover flex-shrink-0"
                                    style={{ width: 28, height: 28 }}
                                />
                                <div className="flex-1">
                                    <Textarea
                                        value={replyContent}
                                        onChange={setReplyContent}
                                        placeholder={`Reply to ${comment.user.display_name}...`}
                                        rows={2}
                                        autoFocus
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={async () => {
                                                const ok = await postComment(replyContent, comment.id);
                                                if (ok) { setReplyContent(''); setReplyTo(null); setExpanded(prev => new Set([...prev, comment.id])); }
                                            }}
                                            disabled={submitting || !replyContent.trim()}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-opacity disabled:opacity-50"
                                            style={{ backgroundColor: SHINY_PURPLE, color: '#fff' }}
                                        >
                                            <SendIcon /> Send
                                        </button>
                                        <button
                                            onClick={() => { setReplyTo(null); setReplyContent(''); }}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-70"
                                            style={{ backgroundColor: `${currentTheme.foreground}10`, color: currentTheme.foreground }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Expand/collapse replies toggle */}
                        {hasReplies && (
                            <button
                                onClick={() => toggleExpanded(comment.id)}
                                className="mt-2 px-1 flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
                                style={{ color: SHINY_PURPLE }}
                            >
                                <ChevronIcon open={isOpen} />
                                {isOpen ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                            </button>
                        )}

                        {/* Replies — 1 level only, with left thread line */}
                        {hasReplies && isOpen && (
                            <div className="mt-3 relative">
                                {/* Thread connector line */}
                                <div
                                    className="absolute left-3.5 top-0 bottom-4 w-px"
                                    style={{ backgroundColor: `${SHINY_PURPLE}30` }}
                                />
                                <div className="pl-8 space-y-3">
                                    {comment.replies.map(reply => renderComment(reply, true))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── Root render ──────────────────────────────────────────────────────────

    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{
                backgroundColor: `${currentTheme.foreground}03`,
                border: `1px solid ${currentTheme.foreground}08`,
            }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-5 py-4"
                style={{
                    background: `linear-gradient(135deg, ${currentTheme.foreground}05 0%, ${currentTheme.foreground}02 100%)`,
                    borderBottom: `1px solid ${currentTheme.foreground}08`,
                }}
            >
                <div className="flex items-center gap-2.5">
                    <div className="w-1 h-6 rounded-full"
                        style={{ background: `linear-gradient(to bottom, ${SHINY_PURPLE}, ${SHINY_PURPLE}60)` }} />
                    <h3 className="text-base font-bold" style={{ color: currentTheme.foreground }}>
                        Comments
                    </h3>
                    {totalAll > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                            style={{ backgroundColor: `${SHINY_PURPLE}18`, color: SHINY_PURPLE }}>
                            {totalAll}
                        </span>
                    )}
                </div>
                <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                    style={{
                        border: `1px solid ${currentTheme.foreground}10`,
                        backgroundColor: `${currentTheme.foreground}06`,
                        color: currentTheme.foreground,
                        colorScheme: 'dark',
                    }}
                >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="popular">Popular</option>
                </select>
            </div>

            <div className="p-5 space-y-5">
                {/* Comment input */}
                {isAuthenticated ? (
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                            <img
                                src="/images/default-avatar.svg"
                                alt="avatar"
                                className="w-8 h-8 rounded-full object-cover"
                            />
                        </div>
                        <div className="flex-1">
                            <Textarea
                                value={newComment}
                                onChange={setNewComment}
                                placeholder="Share your thoughts..."
                                rows={3}
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={async () => {
                                        const ok = await postComment(newComment);
                                        if (ok) setNewComment('');
                                    }}
                                    disabled={submitting || !newComment.trim()}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
                                    style={{ backgroundColor: SHINY_PURPLE, color: '#fff' }}
                                >
                                    <SendIcon /> Post Comment
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div
                        className="flex items-center justify-between p-4 rounded-xl"
                        style={{ backgroundColor: `${currentTheme.foreground}05`, border: `1px solid ${currentTheme.foreground}08` }}
                    >
                        <p className="text-sm" style={{ color: `${currentTheme.foreground}60` }}>
                            Login to join the conversation
                        </p>
                        <button
                            onClick={() => router.visit(route('login'))}
                            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
                            style={{ backgroundColor: SHINY_PURPLE, color: '#fff' }}
                        >
                            Login
                        </button>
                    </div>
                )}

                {/* Comments list */}
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-6 h-6 rounded-full border-2 animate-spin"
                            style={{ borderColor: `${currentTheme.foreground}20`, borderTopColor: SHINY_PURPLE }} />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-sm font-medium" style={{ color: `${currentTheme.foreground}40` }}>
                            No comments yet — be the first!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {comments.map(c => renderComment(c))}

                        {/* Load more */}
                        {hasMore && (
                            <div className="flex justify-center pt-2">
                                <button
                                    onClick={() => loadComments(page + 1, true)}
                                    disabled={loadingMore}
                                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 hover:opacity-80"
                                    style={{
                                        backgroundColor: `${SHINY_PURPLE}15`,
                                        color: SHINY_PURPLE,
                                        border: `1px solid ${SHINY_PURPLE}30`,
                                    }}
                                >
                                    {loadingMore ? (
                                        <>
                                            <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin"
                                                style={{ borderColor: `${SHINY_PURPLE}40`, borderTopColor: SHINY_PURPLE }} />
                                            Loading...
                                        </>
                                    ) : (
                                        'Load more comments'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
