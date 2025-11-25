import React, { useState, FormEvent } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface Genre {
    id: number;
    name: string;
}

interface Props {
    genres: Genre[];
}

export default function Create({ genres }: Props) {
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        title: '',
        alternative_title: '',
        cover: null as File | null,
        synopsis: '',
        author: '',
        artist: '',
        genre_ids: [] as number[]
    });

    const [coverPreview, setCoverPreview] = useState<string | null>(null);

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, cover: file }));
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const toggleGenre = (genreId: number) => {
        setFormData(prev => ({
            ...prev,
            genre_ids: prev.genre_ids.includes(genreId)
                ? prev.genre_ids.filter(id => id !== genreId)
                : [...prev.genre_ids, genreId]
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        const data = new FormData();
        data.append('title', formData.title);
        data.append('alternative_title', formData.alternative_title);
        if (formData.cover) data.append('cover', formData.cover);
        data.append('synopsis', formData.synopsis);
        data.append('author', formData.author);
        data.append('artist', formData.artist);
        formData.genre_ids.forEach(id => data.append('genre_ids[]', id.toString()));

        router.post(route('admin.ebookseries.store'), data, {
            onError: (errors) => {
                setErrors(errors);
                setSubmitting(false);
            },
            onFinish: () => {
                setSubmitting(false);
            }
        });
    };

    return (
        <AdminLayout>
            <Head title="Create Ebook Series" />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Create New Ebook Series
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className={`w-full px-4 py-2 rounded-lg border ${
                                errors.title ? 'border-red-500' : 'border-gray-300'
                            } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                            required
                        />
                        {errors.title && (
                            <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                        )}
                    </div>

                    {/* Alternative Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Alternative Title
                        </label>
                        <input
                            type="text"
                            value={formData.alternative_title}
                            onChange={(e) => setFormData(prev => ({ ...prev, alternative_title: e.target.value }))}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    {/* Cover */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Cover Image *
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverChange}
                            className={`w-full px-4 py-2 rounded-lg border ${
                                errors.cover ? 'border-red-500' : 'border-gray-300'
                            } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                            required
                        />
                        {coverPreview && (
                            <div className="mt-2">
                                <img src={coverPreview} alt="Cover preview" className="w-32 rounded-lg" />
                            </div>
                        )}
                        {errors.cover && (
                            <p className="text-red-500 text-sm mt-1">{errors.cover}</p>
                        )}
                    </div>

                    {/* Synopsis */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Synopsis *
                        </label>
                        <textarea
                            value={formData.synopsis}
                            onChange={(e) => setFormData(prev => ({ ...prev, synopsis: e.target.value }))}
                            rows={6}
                            className={`w-full px-4 py-2 rounded-lg border ${
                                errors.synopsis ? 'border-red-500' : 'border-gray-300'
                            } focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none`}
                            required
                        />
                        {errors.synopsis && (
                            <p className="text-red-500 text-sm mt-1">{errors.synopsis}</p>
                        )}
                    </div>

                    {/* Author & Artist */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Author
                            </label>
                            <input
                                type="text"
                                value={formData.author}
                                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Artist
                            </label>
                            <input
                                type="text"
                                value={formData.artist}
                                onChange={(e) => setFormData(prev => ({ ...prev, artist: e.target.value }))}
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
                                        formData.genre_ids.includes(genre.id)
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                    }`}
                                >
                                    {genre.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
                        >
                            {submitting ? 'Creating...' : 'Create Series'}
                        </button>

                        <a
                            href={route('admin.ebookseries.index')}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold transition inline-block"
                        >
                            Cancel
                        </a>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
