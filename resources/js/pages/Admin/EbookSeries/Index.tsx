import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface Series {
    id: number;
    title: string;
    alternative_title?: string;
    slug: string;
    cover_url: string;
    author?: string;
    artist?: string;
    items_count: number;
    price_range: string;
}

interface Props {
    series: {
        data: Series[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function Index({ series }: Props) {
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isCleaning, setIsCleaning] = useState(false);

    const deleteSeries = (seriesId: number, title: string) => {
        if (confirm(`Are you sure you want to delete "${title}"? This will also delete all items in this series.`)) {
            setDeletingId(seriesId);
            router.delete(route('admin.ebookseries.destroy', seriesId), {
                onFinish: () => setDeletingId(null)
            });
        }
    };

    const handleCleanupOrphanedFiles = () => {
        if (confirm(
            '⚠️ WARNING: This will permanently delete all .epub files that are not referenced in the database.\n\n' +
            'This action cannot be undone!\n\n' +
            'Are you sure you want to continue?'
        )) {
            setIsCleaning(true);
            router.post(route('admin.ebookseries.cleanup'), {}, {
                onFinish: () => setIsCleaning(false)
            });
        }
    };

    return (
        <AdminLayout>
            <Head title="Manage Ebook Series" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Manage Ebook Series
                    </h1>

                    <div className="flex gap-3">
                        <button
                            onClick={handleCleanupOrphanedFiles}
                            disabled={isCleaning}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isCleaning ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Cleaning...
                                </>
                            ) : (
                                <>
                                    🗑️ Cleanup Orphaned Files
                                </>
                            )}
                        </button>

                        <Link
                            href={route('admin.ebookseries.create')}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                        >
                            + Add New Series
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Total Series</p>
                        <p className="text-2xl font-bold text-gray-900">{series.total}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Current Page</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {series.current_page} / {series.last_page}
                        </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Per Page</p>
                        <p className="text-2xl font-bold text-gray-900">{series.per_page}</p>
                    </div>
                </div>

                {/* Series List */}
                {series.data.length > 0 ? (
                    <div className="space-y-4">
                        {series.data.map((item) => (
                            <div 
                                key={item.id}
                                className="bg-white border border-gray-200 rounded-lg p-4 flex gap-4 hover:shadow-lg transition"
                            >
                                {/* Cover */}
                                <div className="w-20 sm:w-24 flex-shrink-0">
                                    <img
                                        src={item.cover_url}
                                        alt={item.title}
                                        className="w-full rounded-lg"
                                        onError={(e) => {
                                            e.currentTarget.src = '/images/default-cover.jpg';
                                        }}
                                    />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                                        {item.title}
                                    </h3>

                                    {item.alternative_title && (
                                        <p className="text-sm text-gray-600 mb-2">
                                            {item.alternative_title}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3 text-sm">
                                        {item.author && (
                                            <span className="text-gray-600">
                                                👤 {item.author}
                                            </span>
                                        )}
                                        {item.artist && (
                                            <span className="text-gray-600">
                                                🎨 {item.artist}
                                            </span>
                                        )}
                                        <span className="text-gray-600">
                                            📚 {item.items_count} items
                                        </span>
                                        <span className="text-amber-600 font-semibold">
                                            {item.price_range}
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <Link
                                            href={route('admin.ebookseries.edit', item.id)}
                                            className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-semibold text-sm transition"
                                        >
                                            Edit
                                        </Link>

                                        <button
                                            onClick={() => deleteSeries(item.id, item.title)}
                                            disabled={deletingId === item.id}
                                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition disabled:opacity-50"
                                        >
                                            {deletingId === item.id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Pagination */}
                        {series.last_page > 1 && (
                            <div className="flex justify-center gap-2 mt-8">
                                {Array.from({ length: series.last_page }, (_, i) => i + 1).map((page) => (
                                    <Link
                                        key={page}
                                        href={route('admin.ebookseries.index', { page })}
                                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                                            page === series.current_page
                                                ? 'bg-amber-500 text-white'
                                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                        }`}
                                    >
                                        {page}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            No series yet
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Create your first ebook series
                        </p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
