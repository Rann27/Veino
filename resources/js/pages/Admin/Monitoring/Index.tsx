import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface Series {
    id: number;
    title: string;
}

interface Chapter {
    id: number;
    label: string;
}

interface Comment {
    id: number;
    page: string;
    user_name: string;
    content: string;
    created_at: string;
}

interface Reaction {
    page: string;
    like_count: number;
    love_count: number;
    haha_count: number;
    angry_count: number;
    sad_count: number;
    total_count: number;
}

interface ViewStat {
    page: string;
    unique_views: number;
    total_views: number;
    is_series_view: boolean;
}

interface Props {
    series: Series[];
}

export default function Index({ series }: Props) {
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

    // Fetch comments
    const fetchComments = async () => {
        setCommentsLoading(true);
        try {
            const params = new URLSearchParams();
            if (commentFilterType !== 'all' && commentFilterId) {
                params.append('filterType', commentFilterType);
                params.append('filterId', commentFilterId.toString());
            }
            if (commentSearch) {
                params.append('search', commentSearch);
            }

            const response = await fetch(`/admin/monitoring/comments?${params.toString()}`);
            const data = await response.json();
            setComments(data.data || []);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setCommentsLoading(false);
        }
    };

    // Fetch reactions
    const fetchReactions = async () => {
        setReactionsLoading(true);
        try {
            const params = new URLSearchParams();
            if (reactionFilterType !== 'all' && reactionFilterId) {
                params.append('filterType', reactionFilterType);
                params.append('filterId', reactionFilterId.toString());
            }

            const response = await fetch(`/admin/monitoring/reactions?${params.toString()}`);
            const data = await response.json();
            setReactions(data || []);
        } catch (error) {
            console.error('Error fetching reactions:', error);
        } finally {
            setReactionsLoading(false);
        }
    };

    // Fetch views
    const fetchViews = async () => {
        setViewsLoading(true);
        try {
            const params = new URLSearchParams();
            if (viewFilterType !== 'all' && viewFilterId) {
                params.append('filterType', viewFilterType);
                params.append('filterId', viewFilterId.toString());
            }

            const response = await fetch(`/admin/monitoring/views?${params.toString()}`);
            const data = await response.json();
            setViews(data || []);
        } catch (error) {
            console.error('Error fetching views:', error);
        } finally {
            setViewsLoading(false);
        }
    };

    // Fetch chapters when series is selected
    const fetchChapters = async (seriesId: number, forTab: 'comments' | 'reactions' | 'views') => {
        try {
            const response = await fetch(`/admin/monitoring/series/${seriesId}/chapters`);
            const data = await response.json();
            if (forTab === 'comments') {
                setChapters(data);
            } else if (forTab === 'reactions') {
                setReactionChapters(data);
            } else {
                setViewChapters(data);
            }
        } catch (error) {
            console.error('Error fetching chapters:', error);
        }
    };

    // Delete comment
    const deleteComment = async (id: number) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            await fetch(`/admin/monitoring/comments/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            fetchComments();
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    // Effects
    useEffect(() => {
        if (activeTab === 'comments') {
            fetchComments();
        }
    }, [activeTab, commentFilterType, commentFilterId, commentSearch]);

    useEffect(() => {
        if (activeTab === 'reactions') {
            fetchReactions();
        }
    }, [activeTab, reactionFilterType, reactionFilterId]);

    useEffect(() => {
        if (activeTab === 'views') {
            fetchViews();
        }
    }, [activeTab, viewFilterType, viewFilterId]);

    // Handle comment filter changes
    useEffect(() => {
        if (commentFilterType === 'series' && commentFilterSeriesId) {
            setCommentFilterId(commentFilterSeriesId);
        } else if (commentFilterType === 'series_chapters' && commentFilterSeriesId) {
            setCommentFilterId(commentFilterSeriesId);
            fetchChapters(commentFilterSeriesId, 'comments');
        } else if (commentFilterType === 'chapter' && commentFilterSeriesId) {
            fetchChapters(commentFilterSeriesId, 'comments');
        }
    }, [commentFilterType, commentFilterSeriesId]);

    // Handle reaction filter changes
    useEffect(() => {
        if (reactionFilterType === 'series' && reactionFilterSeriesId) {
            setReactionFilterId(reactionFilterSeriesId);
        } else if (reactionFilterType === 'series_chapters' && reactionFilterSeriesId) {
            setReactionFilterId(reactionFilterSeriesId);
            fetchChapters(reactionFilterSeriesId, 'reactions');
        } else if (reactionFilterType === 'chapter' && reactionFilterSeriesId) {
            fetchChapters(reactionFilterSeriesId, 'reactions');
        }
    }, [reactionFilterType, reactionFilterSeriesId]);

    // Handle view filter changes
    useEffect(() => {
        if (viewFilterType === 'series' && viewFilterSeriesId) {
            setViewFilterId(viewFilterSeriesId);
        } else if (viewFilterType === 'series_chapters' && viewFilterSeriesId) {
            setViewFilterId(viewFilterSeriesId);
            fetchChapters(viewFilterSeriesId, 'views');
        } else if (viewFilterType === 'chapter' && viewFilterSeriesId) {
            fetchChapters(viewFilterSeriesId, 'views');
        }
    }, [viewFilterType, viewFilterSeriesId]);

    return (
        <AdminLayout>
            <Head title="Monitoring - Comments, Reactions & Views" />

            <div className="py-6">
                <div className="w-full px-4">
                    <div className="bg-white shadow-sm rounded-lg">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Monitoring - Comments, Reactions & Views
                            </h2>
                            <p className="mt-1 text-sm text-gray-600">
                                Monitor and manage comments, reactions, and views across your platform
                            </p>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-gray-200">
                            <nav className="flex -mb-px">
                                <button
                                    onClick={() => setActiveTab('comments')}
                                    className={`px-6 py-4 text-sm font-medium border-b-2 ${
                                        activeTab === 'comments'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    Comments
                                </button>
                                <button
                                    onClick={() => setActiveTab('reactions')}
                                    className={`px-6 py-4 text-sm font-medium border-b-2 ${
                                        activeTab === 'reactions'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    Reactions
                                </button>
                                <button
                                    onClick={() => setActiveTab('views')}
                                    className={`px-6 py-4 text-sm font-medium border-b-2 ${
                                        activeTab === 'views'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    Views
                                </button>
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {activeTab === 'comments' ? (
                                <div>
                                    {/* Filters & Search */}
                                    <div className="mb-6 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            {/* Filter Type */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Filter By
                                                </label>
                                                <select
                                                    value={commentFilterType}
                                                    onChange={(e) => {
                                                        setCommentFilterType(e.target.value as any);
                                                        setCommentFilterId(null);
                                                        setCommentFilterSeriesId(null);
                                                        setChapters([]);
                                                    }}
                                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                >
                                                    <option value="all">All Comments</option>
                                                    <option value="series">Specific Series</option>
                                                    <option value="chapter">Specific Chapter</option>
                                                    <option value="series_chapters">All Chapters in Series</option>
                                                </select>
                                            </div>

                                            {/* Series Selector */}
                                            {commentFilterType !== 'all' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Select Series
                                                    </label>
                                                    <select
                                                        value={commentFilterSeriesId || ''}
                                                        onChange={(e) => setCommentFilterSeriesId(Number(e.target.value))}
                                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    >
                                                        <option value="">Choose series...</option>
                                                        {series.map((s) => (
                                                            <option key={s.id} value={s.id}>
                                                                {s.title}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {/* Chapter Selector */}
                                            {commentFilterType === 'chapter' && chapters.length > 0 && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Select Chapter
                                                    </label>
                                                    <select
                                                        value={commentFilterId || ''}
                                                        onChange={(e) => setCommentFilterId(Number(e.target.value))}
                                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    >
                                                        <option value="">Choose chapter...</option>
                                                        {chapters.map((ch) => (
                                                            <option key={ch.id} value={ch.id}>
                                                                {ch.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {/* Search */}
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Search
                                                </label>
                                                <input
                                                    type="text"
                                                    value={commentSearch}
                                                    onChange={(e) => setCommentSearch(e.target.value)}
                                                    placeholder="Search by user name or content..."
                                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Comments Table */}
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="overflow-x-auto" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                            {commentsLoading ? (
                                                <div className="p-8 text-center text-gray-500">Loading...</div>
                                            ) : comments.length === 0 ? (
                                                <div className="p-8 text-center text-gray-500">No comments found</div>
                                            ) : (
                                                <table className="w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50 sticky top-0">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                                                Page
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                                                User
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Comment
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                                                                Date
                                                            </th>
                                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                                                Actions
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {comments.map((comment) => (
                                                            <tr key={comment.id} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                                    <div className="max-w-xs">{comment.page}</div>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                                    <div className="truncate max-w-[120px]">{comment.user_name}</div>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                                    <div className="whitespace-normal break-words">
                                                                        {comment.content}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {comment.created_at}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                                    <button
                                                                        onClick={() => deleteComment(comment.id)}
                                                                        className="text-red-600 hover:text-red-900 font-medium"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : activeTab === 'reactions' ? (
                                <div>
                                    {/* Filters */}
                                    <div className="mb-6 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Filter Type */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Filter By
                                                </label>
                                                <select
                                                    value={reactionFilterType}
                                                    onChange={(e) => {
                                                        setReactionFilterType(e.target.value as any);
                                                        setReactionFilterId(null);
                                                        setReactionFilterSeriesId(null);
                                                        setReactionChapters([]);
                                                    }}
                                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                >
                                                    <option value="all">All Reactions</option>
                                                    <option value="series">Specific Series</option>
                                                    <option value="chapter">Specific Chapter</option>
                                                    <option value="series_chapters">All Chapters in Series</option>
                                                </select>
                                            </div>

                                            {/* Series Selector */}
                                            {reactionFilterType !== 'all' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Select Series
                                                    </label>
                                                    <select
                                                        value={reactionFilterSeriesId || ''}
                                                        onChange={(e) => setReactionFilterSeriesId(Number(e.target.value))}
                                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    >
                                                        <option value="">Choose series...</option>
                                                        {series.map((s) => (
                                                            <option key={s.id} value={s.id}>
                                                                {s.title}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {/* Chapter Selector */}
                                            {reactionFilterType === 'chapter' && reactionChapters.length > 0 && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Select Chapter
                                                    </label>
                                                    <select
                                                        value={reactionFilterId || ''}
                                                        onChange={(e) => setReactionFilterId(Number(e.target.value))}
                                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    >
                                                        <option value="">Choose chapter...</option>
                                                        {reactionChapters.map((ch) => (
                                                            <option key={ch.id} value={ch.id}>
                                                                {ch.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Reactions Table */}
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="overflow-x-auto" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                            {reactionsLoading ? (
                                                <div className="p-8 text-center text-gray-500">Loading...</div>
                                            ) : reactions.length === 0 ? (
                                                <div className="p-8 text-center text-gray-500">No reactions found</div>
                                            ) : (
                                                <table className="w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50 sticky top-0">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Page
                                                            </th>
                                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                👍 Like
                                                            </th>
                                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                ❤️ Love
                                                            </th>
                                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                😂 Haha
                                                            </th>
                                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                😠 Angry
                                                            </th>
                                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                😢 Sad
                                                            </th>
                                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Total
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {reactions.map((reaction, index) => (
                                                            <tr key={index} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {reaction.page}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                                                    {reaction.like_count}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                                                    {reaction.love_count}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                                                    {reaction.haha_count}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                                                    {reaction.angry_count}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                                                    {reaction.sad_count}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-gray-900">
                                                                    {reaction.total_count}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : activeTab === 'views' ? (
                                <div>
                                    {/* Filters */}
                                    <div className="mb-6 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Filter Type */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Filter By
                                                </label>
                                                <select
                                                    value={viewFilterType}
                                                    onChange={(e) => {
                                                        setViewFilterType(e.target.value as any);
                                                        setViewFilterId(null);
                                                        setViewFilterSeriesId(null);
                                                        setViewChapters([]);
                                                    }}
                                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                >
                                                    <option value="all">All Views</option>
                                                    <option value="series">Specific Series</option>
                                                    <option value="chapter">Specific Chapter</option>
                                                    <option value="series_chapters">All Chapters in Series</option>
                                                </select>
                                            </div>

                                            {/* Series Selector */}
                                            {viewFilterType !== 'all' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Select Series
                                                    </label>
                                                    <select
                                                        value={viewFilterSeriesId || ''}
                                                        onChange={(e) => setViewFilterSeriesId(Number(e.target.value))}
                                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    >
                                                        <option value="">Choose series...</option>
                                                        {series.map((s) => (
                                                            <option key={s.id} value={s.id}>
                                                                {s.title}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {/* Chapter Selector */}
                                            {viewFilterType === 'chapter' && viewChapters.length > 0 && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Select Chapter
                                                    </label>
                                                    <select
                                                        value={viewFilterId || ''}
                                                        onChange={(e) => setViewFilterId(Number(e.target.value))}
                                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    >
                                                        <option value="">Choose chapter...</option>
                                                        {viewChapters.map((ch) => (
                                                            <option key={ch.id} value={ch.id}>
                                                                {ch.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Views Table */}
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="overflow-x-auto" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                            {viewsLoading ? (
                                                <div className="p-8 text-center text-gray-500">Loading...</div>
                                            ) : views.length === 0 ? (
                                                <div className="p-8 text-center text-gray-500">No views data found</div>
                                            ) : (
                                                <table className="w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50 sticky top-0">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Page
                                                            </th>
                                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Type
                                                            </th>
                                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Total Views
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {views.map((view, index) => (
                                                            <tr key={index} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    <div className="max-w-md">{view.page}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                                                    {view.type === 'series' ? (
                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                            Series
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                            Chapter
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-gray-900">
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                                        👁️ {view.views.toLocaleString()}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>

                                    {/* Grand Total */}
                                    {!viewsLoading && views.length > 0 && (
                                        <div className="mt-4 flex justify-end">
                                            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg shadow-md">
                                                <span className="text-sm font-semibold uppercase tracking-wide">Grand Total:</span>
                                                <span className="text-2xl font-bold">
                                                    👁️ {views.reduce((sum, view) => sum + view.views, 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
