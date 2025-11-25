import React, { useState, FormEvent } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface Genre {
    id: number;
    name: string;
}

interface Item {
    id: number;
    title: string;
    cover_url: string;
    summary?: string;
    price_coins: number;
    order: number;
    has_file: boolean;
}

interface Series {
    id: number;
    title: string;
    alternative_title?: string;
    slug: string;
    cover_url: string;
    synopsis: string;
    author?: string;
    artist?: string;
    genres: Genre[];
}

interface Props {
    series: Series;
    items: Item[];
    genres: Genre[];
}

export default function Edit({ series, items, genres }: Props) {
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Series form state
    const [seriesData, setSeriesData] = useState({
        title: series.title,
        alternative_title: series.alternative_title || '',
        cover: null as File | null,
        synopsis: series.synopsis,
        author: series.author || '',
        artist: series.artist || '',
        genre_ids: series.genres.map(g => g.id),
        show_trial_button: (series as any).show_trial_button || false,
        series_slug: (series as any).series_slug || '',
    });

    const [coverPreview, setCoverPreview] = useState<string>(series.cover_url);

    // Item form state
    const [showItemForm, setShowItemForm] = useState(false);
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [itemData, setItemData] = useState({
        title: '',
        cover: null as File | null,
        summary: '',
        file: null as File | null,
        price_coins: '',
        order: ''
    });

    const [itemCoverPreview, setItemCoverPreview] = useState<string | null>(null);
    const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
    const [existingFileName, setExistingFileName] = useState<string | null>(null);
    const [hasExistingFile, setHasExistingFile] = useState(false);

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSeriesData(prev => ({ ...prev, cover: file }));
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const toggleGenre = (genreId: number) => {
        setSeriesData(prev => ({
            ...prev,
            genre_ids: prev.genre_ids.includes(genreId)
                ? prev.genre_ids.filter(id => id !== genreId)
                : [...prev.genre_ids, genreId]
        }));
    };

    const handleSeriesSubmit = (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        const data = new FormData();
        data.append('title', seriesData.title);
        data.append('alternative_title', seriesData.alternative_title);
        if (seriesData.cover) data.append('cover', seriesData.cover);
        data.append('synopsis', seriesData.synopsis);
        data.append('author', seriesData.author);
        data.append('artist', seriesData.artist);
        seriesData.genre_ids.forEach(id => data.append('genre_ids[]', id.toString()));
        data.append('show_trial_button', seriesData.show_trial_button ? '1' : '0');
        data.append('series_slug', seriesData.series_slug);
        data.append('_method', 'PUT');

        router.post(route('admin.ebookseries.update', series.id), data, {
            onError: (errors) => {
                setErrors(errors);
                setSubmitting(false);
            },
            onFinish: () => {
                setSubmitting(false);
            }
        });
    };

    const openItemForm = (item?: Item) => {
        if (item) {
            setEditingItemId(item.id);
            setItemData({
                title: item.title,
                cover: null,
                summary: item.summary || '',
                file: null,
                price_coins: item.price_coins.toString(),
                order: item.order.toString()
            });
            setItemCoverPreview(item.cover_url);
            setHasExistingFile(item.has_file);
            setExistingFileName(item.has_file ? item.title : null);
        } else {
            setEditingItemId(null);
            setItemData({
                title: '',
                cover: null,
                summary: '',
                file: null,
                price_coins: '',
                order: (items.length + 1).toString()
            });
            setItemCoverPreview(null);
            setHasExistingFile(false);
            setExistingFileName(null);
        }
        setShowItemForm(true);
    };

    const closeItemForm = () => {
        setShowItemForm(false);
        setEditingItemId(null);
        setItemData({
            title: '',
            cover: null,
            summary: '',
            file: null,
            price_coins: '',
            order: ''
        });
        setItemCoverPreview(null);
        setHasExistingFile(false);
        setExistingFileName(null);
    };

    const handleItemCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setItemData(prev => ({ ...prev, cover: file }));
            setItemCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleItemSubmit = (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const data = new FormData();
        data.append('title', itemData.title);
        if (itemData.cover) data.append('cover', itemData.cover);
        data.append('summary', itemData.summary);
        if (itemData.file) data.append('file', itemData.file);
        data.append('price_coins', itemData.price_coins);
        data.append('order', itemData.order);

        if (editingItemId) {
            data.append('_method', 'PUT');
            router.post(route('admin.ebookseries.items.update', [series.id, editingItemId]), data, {
                onSuccess: () => closeItemForm(),
                onFinish: () => setSubmitting(false)
            });
        } else {
            router.post(route('admin.ebookseries.items.store', series.id), data, {
                onSuccess: () => closeItemForm(),
                onFinish: () => setSubmitting(false)
            });
        }
    };

    const deleteItem = (itemId: number, title: string) => {
        if (confirm(`Delete item "${title}"?`)) {
            setDeletingItemId(itemId);
            router.delete(route('admin.ebookseries.items.destroy', [series.id, itemId]), {
                onFinish: () => setDeletingItemId(null)
            });
        }
    };

    return (
        <AdminLayout>
            <Head title={`Edit ${series.title}`} />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Edit: {series.title}
                </h1>

                {/* Series Form */}
                <form onSubmit={handleSeriesSubmit} className="space-y-6 mb-12 bg-white p-6 rounded-lg border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Series Information
                    </h2>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={seriesData.title}
                            onChange={(e) => setSeriesData(prev => ({ ...prev, title: e.target.value }))}
                            className={`w-full px-4 py-2 rounded-lg border ${
                                errors.title ? 'border-red-500' : 'border-gray-300'
                            } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                            required
                        />
                    </div>

                    {/* Alternative Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Alternative Title
                        </label>
                        <input
                            type="text"
                            value={seriesData.alternative_title}
                            onChange={(e) => setSeriesData(prev => ({ ...prev, alternative_title: e.target.value }))}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    {/* Cover */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Cover Image
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverChange}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <div className="mt-2">
                            <img src={coverPreview} alt="Cover" className="w-32 rounded-lg" />
                        </div>
                    </div>

                    {/* Synopsis */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Synopsis *
                        </label>
                        <textarea
                            value={seriesData.synopsis}
                            onChange={(e) => setSeriesData(prev => ({ ...prev, synopsis: e.target.value }))}
                            rows={6}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                            required
                        />
                    </div>

                    {/* Author & Artist */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Author
                            </label>
                            <input
                                type="text"
                                value={seriesData.author}
                                onChange={(e) => setSeriesData(prev => ({ ...prev, author: e.target.value }))}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Artist
                            </label>
                            <input
                                type="text"
                                value={seriesData.artist}
                                onChange={(e) => setSeriesData(prev => ({ ...prev, artist: e.target.value }))}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                    </div>

                    {/* Genres */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Genres
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {genres.map((genre) => (
                                <button
                                    key={genre.id}
                                    type="button"
                                    onClick={() => toggleGenre(genre.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                                        seriesData.genre_ids.includes(genre.id)
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                    }`}
                                >
                                    {genre.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Trial Reading Backlink Section */}
                    <div className="space-y-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                        <div className="flex items-center">
                            <label className="flex items-center hover:bg-white p-2 rounded cursor-pointer transition-colors duration-150">
                                <input
                                    type="checkbox"
                                    checked={seriesData.show_trial_button}
                                    onChange={(e) => setSeriesData(prev => ({
                                        ...prev,
                                        show_trial_button: e.target.checked,
                                        series_slug: e.target.checked ? prev.series_slug : '',
                                    }))}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                                />
                                <span className="ml-2 text-sm text-gray-700 font-medium">Show Trial Reading Button</span>
                            </label>
                        </div>
                        
                        {seriesData.show_trial_button && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Series Slug *
                                </label>
                                <input
                                    type="text"
                                    value={seriesData.series_slug}
                                    onChange={(e) => setSeriesData(prev => ({ ...prev, series_slug: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., novel-series-name"
                                    required={seriesData.show_trial_button}
                                />
                                <p className="text-xs text-gray-500 mt-1">The slug of the Series (on-site novel) to link to</p>
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : 'Save Changes'}
                        </button>

                        <a
                            href={route('admin.ebookseries.index')}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold transition inline-block"
                        >
                            Back to List
                        </a>
                    </div>
                </form>

                {/* Items Section */}
                <div className="border-t border-gray-200 pt-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Items ({items.length})
                        </h2>

                        <button
                            onClick={() => openItemForm()}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                        >
                            + Add Item
                        </button>
                    </div>

                    {items.length > 0 ? (
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div 
                                    key={item.id}
                                    className="bg-white border border-gray-200 rounded-lg p-3 flex gap-3"
                                >
                                    <div className="w-16 flex-shrink-0">
                                        <img src={item.cover_url} alt={item.title} className="w-full rounded" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 mb-1">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-2">
                                            Order: {item.order} | Price: ¢{item.price_coins.toLocaleString()}
                                        </p>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openItemForm(item)}
                                                className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-1 rounded text-xs font-semibold"
                                            >
                                                Edit
                                            </button>

                                            <button
                                                onClick={() => deleteItem(item.id, item.title)}
                                                disabled={deletingItemId === item.id}
                                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-50"
                                            >
                                                {deletingItemId === item.id ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center py-8 text-gray-600 bg-white rounded-lg border border-gray-200">
                            No items yet. Add your first item!
                        </p>
                    )}
                </div>

                {/* Item Form Modal */}
                {showItemForm && (
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={closeItemForm}
                    >
                        <div 
                            className="bg-white max-w-2xl w-full rounded-lg p-6 max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">
                                {editingItemId ? 'Edit Item' : 'Add New Item'}
                            </h3>

                            <form onSubmit={handleItemSubmit} className="space-y-4">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={itemData.title}
                                        onChange={(e) => setItemData(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        required
                                    />
                                </div>

                                {/* Cover */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Cover Image {!editingItemId && '*'}
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleItemCoverChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        required={!editingItemId}
                                    />
                                    {itemCoverPreview && (
                                        <div className="mt-2">
                                            <img src={itemCoverPreview} alt="Cover" className="w-24 rounded" />
                                        </div>
                                    )}
                                </div>

                                {/* Summary */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Summary
                                    </label>
                                    <textarea
                                        value={itemData.summary}
                                        onChange={(e) => setItemData(prev => ({ ...prev, summary: e.target.value }))}
                                        rows={4}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                    />
                                </div>

                                {/* Ebook File */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Ebook File (.epub) {!editingItemId && '*'}
                                    </label>
                                    
                                    {/* Existing file indicator */}
                                    {hasExistingFile && existingFileName && (
                                        <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-sm text-green-700 font-medium">
                                                Current file: {existingFileName}.epub
                                            </span>
                                        </div>
                                    )}
                                    
                                    <input
                                        type="file"
                                        accept=".epub"
                                        onChange={(e) => setItemData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        required={!editingItemId}
                                    />
                                    
                                    {hasExistingFile && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Leave empty to keep current file, or choose a new file to replace it
                                        </p>
                                    )}
                                </div>

                                {/* Price & Order */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Price (Coins) *
                                        </label>
                                        <input
                                            type="number"
                                            value={itemData.price_coins}
                                            onChange={(e) => setItemData(prev => ({ ...prev, price_coins: e.target.value }))}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            min="0"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Order *
                                        </label>
                                        <input
                                            type="number"
                                            value={itemData.order}
                                            onChange={(e) => setItemData(prev => ({ ...prev, order: e.target.value }))}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            min="1"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
                                    >
                                        {submitting ? 'Saving...' : editingItemId ? 'Update Item' : 'Add Item'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={closeItemForm}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
