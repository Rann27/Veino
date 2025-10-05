import React, { useState, useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { router } from '@inertiajs/react';

// SVG Icons
const SendIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <line x1="22" y1="2" x2="11" y2="13"/>
        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
);

const ReplyIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <polyline points="9 14 4 9 9 4"/>
        <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
    </svg>
);

const EditIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
);

const DeleteIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
);

const ChevronDownIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <polyline points="6 9 12 15 18 9"/>
    </svg>
);

interface User {
    id: number;
    display_name: string;
    avatar_url?: string;
}

interface Reaction {
    type: string;
    count: number;
}

interface Comment {
    id: number;
    user: User;
    content: string;
    created_at: string;
    is_edited: boolean;
    edited_at: string | null;
    user_reaction: string | null;
    replies: Comment[];
    reactions?: Reaction[];
}

interface CommentSectionProps {
    commentableType: 'series' | 'chapter';
    commentableId: number;
    isAuthenticated: boolean;
    currentUserId?: number;
}

export default function CommentSection({
    commentableType,
    commentableId,
    isAuthenticated,
    currentUserId,
}: CommentSectionProps) {
    const { currentTheme } = useTheme();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState<number | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
    const [submitting, setSubmitting] = useState(false);
    const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());

    useEffect(() => {
        loadComments();
    }, [commentableType, commentableId, sortBy]);

    const loadComments = async () => {
        try {
            const response = await fetch(
                route('comments.index', { type: commentableType, id: commentableId }) + `?sort=${sortBy}`
            );
            
            if (response.ok) {
                const data = await response.json();
                setComments(data.comments || []);
            }
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitComment = async () => {
        if (!newComment.trim() || submitting) return;

        setSubmitting(true);

        try {
            const response = await fetch(route('comments.store', { type: commentableType, id: commentableId }), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    content: newComment,
                }),
            });

            if (response.ok) {
                setNewComment('');
                await loadComments();
            }
        } catch (error) {
            console.error('Error posting comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitReply = async (parentId: number) => {
        if (!replyContent.trim() || submitting) return;

        setSubmitting(true);

        try {
            const response = await fetch(route('comments.store', { type: commentableType, id: commentableId }), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    content: replyContent,
                    parent_id: parentId,
                }),
            });

            if (response.ok) {
                setReplyContent('');
                setReplyTo(null);
                await loadComments();
            }
        } catch (error) {
            console.error('Error posting reply:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = async (commentId: number) => {
        if (!editContent.trim() || submitting) return;

        setSubmitting(true);

        try {
            const response = await fetch(route('comments.update', { id: commentId }), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    content: editContent,
                }),
            });

            if (response.ok) {
                setEditingId(null);
                setEditContent('');
                await loadComments();
            }
        } catch (error) {
            console.error('Error editing comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId: number) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            const response = await fetch(route('comments.destroy', { id: commentId }), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                await loadComments();
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const toggleReplies = (commentId: number) => {
        const newExpanded = new Set(expandedReplies);
        if (newExpanded.has(commentId)) {
            newExpanded.delete(commentId);
        } else {
            newExpanded.add(commentId);
        }
        setExpandedReplies(newExpanded);
    };

    const renderComment = (comment: Comment, isReply = false) => {
        const isEditing = editingId === comment.id;
        const isReplying = replyTo === comment.id;
        const canEdit = isAuthenticated && currentUserId === comment.user.id;
        const hasReplies = comment.replies && comment.replies.length > 0;
        const repliesExpanded = expandedReplies.has(comment.id);

        return (
            <div key={comment.id} className={`${isReply ? 'ml-12' : ''}`}>
                <div 
                    className="p-4 rounded-lg"
                    style={{ 
                        backgroundColor: isReply ? `${currentTheme.foreground}03` : `${currentTheme.foreground}05`,
                    }}
                >
                    {/* User info */}
                    <div className="flex items-start gap-3">
                        <img
                            src={comment.user.avatar_url || '/images/default-avatar.svg'}
                            alt={comment.user.display_name}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span 
                                    className="font-semibold text-sm"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    {comment.user.display_name}
                                </span>
                                <span 
                                    className="text-xs"
                                    style={{ color: `${currentTheme.foreground}50` }}
                                >
                                    {formatDate(comment.created_at)}
                                </span>
                                {comment.is_edited && (
                                    <span 
                                        className="text-xs italic"
                                        style={{ color: `${currentTheme.foreground}40` }}
                                    >
                                        (edited)
                                    </span>
                                )}
                            </div>

                            {/* Comment content */}
                            {isEditing ? (
                                <div className="mt-2">
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full p-3 rounded-lg border resize-none"
                                        style={{
                                            borderColor: `${currentTheme.foreground}20`,
                                            backgroundColor: currentTheme.background,
                                            color: currentTheme.foreground,
                                        }}
                                        rows={3}
                                        placeholder="Edit your comment..."
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => handleEdit(comment.id)}
                                            disabled={submitting}
                                            className="px-3 py-1 text-sm rounded-lg transition-colors disabled:opacity-50"
                                            style={{
                                                backgroundColor: '#3b82f6',
                                                color: '#ffffff',
                                            }}
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingId(null);
                                                setEditContent('');
                                            }}
                                            className="px-3 py-1 text-sm rounded-lg border transition-colors"
                                            style={{
                                                borderColor: `${currentTheme.foreground}20`,
                                                color: currentTheme.foreground,
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p 
                                    className="text-sm whitespace-pre-wrap break-words"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    {comment.content}
                                </p>
                            )}

                            {/* Actions */}
                            {!isEditing && (
                                <div className="flex items-center gap-4 mt-3 flex-wrap">
                                    {isAuthenticated && !isReply && (
                                        <button
                                            onClick={() => setReplyTo(comment.id)}
                                            className="flex items-center gap-1 text-xs transition-colors hover:opacity-70"
                                            style={{ color: `${currentTheme.foreground}70` }}
                                        >
                                            <ReplyIcon size={14} color={`${currentTheme.foreground}70`} />
                                            Reply
                                        </button>
                                    )}

                                    {canEdit && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setEditingId(comment.id);
                                                    setEditContent(comment.content);
                                                }}
                                                className="flex items-center gap-1 text-xs transition-colors hover:opacity-70"
                                                style={{ color: `${currentTheme.foreground}70` }}
                                            >
                                                <EditIcon size={14} color={`${currentTheme.foreground}70`} />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(comment.id)}
                                                className="flex items-center gap-1 text-xs transition-colors hover:opacity-70"
                                                style={{ color: '#ef4444' }}
                                            >
                                                <DeleteIcon size={14} color="#ef4444" />
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reply form */}
                    {isReplying && (
                        <div className="mt-4 ml-13">
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="w-full p-3 rounded-lg border resize-none"
                                style={{
                                    borderColor: `${currentTheme.foreground}20`,
                                    backgroundColor: currentTheme.background,
                                    color: currentTheme.foreground,
                                }}
                                rows={3}
                                placeholder={`Reply to ${comment.user.display_name}...`}
                            />
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => handleSubmitReply(comment.id)}
                                    disabled={submitting || !replyContent.trim()}
                                    className="px-3 py-1 text-sm rounded-lg transition-colors disabled:opacity-50"
                                    style={{
                                        backgroundColor: '#3b82f6',
                                        color: '#ffffff',
                                    }}
                                >
                                    Reply
                                </button>
                                <button
                                    onClick={() => {
                                        setReplyTo(null);
                                        setReplyContent('');
                                    }}
                                    className="px-3 py-1 text-sm rounded-lg border transition-colors"
                                    style={{
                                        borderColor: `${currentTheme.foreground}20`,
                                        color: currentTheme.foreground,
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Show replies toggle */}
                {hasReplies && !isReply && (
                    <button
                        onClick={() => toggleReplies(comment.id)}
                        className="ml-4 mt-2 flex items-center gap-2 text-sm transition-colors hover:opacity-70"
                        style={{ color: '#3b82f6' }}
                    >
                        <span 
                            className="inline-block transition-transform"
                            style={{ 
                                transform: repliesExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            }}
                        >
                            <ChevronDownIcon size={16} color="#3b82f6" />
                        </span>
                        {repliesExpanded ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                    </button>
                )}

                {/* Replies */}
                {hasReplies && repliesExpanded && (
                    <div className="mt-3 space-y-3">
                        {comment.replies.map((reply) => renderComment(reply, true))}
                        
                        {/* Reply form when replies are expanded */}
                        {isAuthenticated && (
                            <div className="ml-12 mt-3">
                                <textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    className="w-full p-3 rounded-lg border resize-none"
                                    style={{
                                        borderColor: `${currentTheme.foreground}20`,
                                        backgroundColor: currentTheme.background,
                                        color: currentTheme.foreground,
                                    }}
                                    rows={3}
                                    placeholder="Write a reply..."
                                    onFocus={() => setReplyTo(comment.id)}
                                />
                                {replyTo === comment.id && replyContent.trim() && (
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => handleSubmitReply(comment.id)}
                                            disabled={submitting}
                                            className="px-3 py-1 text-sm rounded-lg transition-colors disabled:opacity-50"
                                            style={{
                                                backgroundColor: '#3b82f6',
                                                color: '#ffffff',
                                            }}
                                        >
                                            Reply
                                        </button>
                                        <button
                                            onClick={() => {
                                                setReplyTo(null);
                                                setReplyContent('');
                                            }}
                                            className="px-3 py-1 text-sm rounded-lg border transition-colors"
                                            style={{
                                                borderColor: `${currentTheme.foreground}20`,
                                                color: currentTheme.foreground,
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div 
            className="rounded-lg border p-6"
            style={{
                backgroundColor: currentTheme.background,
                borderColor: `${currentTheme.foreground}20`,
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 
                    className="text-xl font-bold"
                    style={{ color: currentTheme.foreground }}
                >
                    Comments ({comments.length})
                </h3>
                
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-1.5 text-sm border rounded-lg"
                    style={{
                        borderColor: `${currentTheme.foreground}30`,
                        backgroundColor: currentTheme.background,
                        color: currentTheme.foreground,
                    }}
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="popular">Most Popular</option>
                </select>
            </div>

            {/* New comment form */}
            {isAuthenticated ? (
                <div className="mb-6">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full p-4 rounded-lg border resize-none"
                        style={{
                            borderColor: `${currentTheme.foreground}20`,
                            backgroundColor: `${currentTheme.foreground}03`,
                            color: currentTheme.foreground,
                        }}
                        rows={4}
                        placeholder="Write a comment..."
                    />
                    <div className="flex justify-end mt-2">
                        <button
                            onClick={handleSubmitComment}
                            disabled={submitting || !newComment.trim()}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: '#3b82f6',
                                color: '#ffffff',
                            }}
                        >
                            <SendIcon size={16} color="#ffffff" />
                            Post Comment
                        </button>
                    </div>
                </div>
            ) : (
                <div 
                    className="mb-6 p-4 rounded-lg border text-center"
                    style={{
                        borderColor: `${currentTheme.foreground}20`,
                        backgroundColor: `${currentTheme.foreground}03`,
                        color: `${currentTheme.foreground}70`,
                    }}
                >
                    <p className="mb-2">Please login to post a comment</p>
                    <button
                        onClick={() => router.visit(route('login'))}
                        className="px-4 py-2 rounded-lg transition-colors"
                        style={{
                            backgroundColor: '#3b82f6',
                            color: '#ffffff',
                        }}
                    >
                        Login
                    </button>
                </div>
            )}

            {/* Comments list */}
            {loading ? (
                <div className="text-center py-8">
                    <div 
                        className="inline-block animate-spin rounded-full h-8 w-8 border-b-2"
                        style={{ borderColor: currentTheme.foreground }}
                    />
                </div>
            ) : comments.length === 0 ? (
                <div 
                    className="text-center py-12"
                    style={{ color: `${currentTheme.foreground}50` }}
                >
                    <p className="text-lg">No comments yet</p>
                    <p className="text-sm mt-1">Be the first to comment!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {comments.map((comment) => renderComment(comment))}
                </div>
            )}
        </div>
    );
}
