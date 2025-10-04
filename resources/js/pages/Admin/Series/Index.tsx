import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

interface Genre {
  id: number;
  name: string;
}

interface NativeLanguage {
  id: number;
  name: string;
}

interface Series {
  id: number;
  title: string;
  alternative_title?: string;
  cover_url?: string;
  synopsis?: string;
  author?: string;
  artist?: string;
  rating: number;
  status: string;
  slug: string;
  native_language: NativeLanguage;
  genres: Genre[];
  chapters_count: number;
  created_at: string;
}

interface SeriesIndexProps {
  series: Series[];
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  search: string;
  total: number;
}

export default function SeriesIndex({ 
  series: initialSeries, 
  currentPage, 
  hasMore, 
  search: initialSearch, 
  total 
}: SeriesIndexProps) {
  const [series, setSeries] = useState<Series[]>(initialSeries);
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(currentPage);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    alternative_title: '',
    cover_url: '',
    synopsis: '',
    author: '',
    artist: '',
    rating: '',
    status: 'ongoing',
    native_language_id: '',
    genre_ids: [] as number[],
  });
  const [genres, setGenres] = useState<Genre[]>([]);
  const [nativeLanguages, setNativeLanguages] = useState<NativeLanguage[]>([]);

  // Auto search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search !== initialSearch) {
        handleSearch();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleSearch = () => {
    setLoading(true);
    router.get('/admin/series', 
      { search, page: 1 }, 
      {
        preserveState: true,
        onSuccess: (page: any) => {
          setSeries(page.props.series as Series[]);
          setPage(1);
          setLoading(false);
        },
        onError: () => setLoading(false)
      }
    );
  };

  const loadMore = () => {
    if (!hasMore || loading) return;
    
    setLoading(true);
    const nextPage = page + 1;
    
    router.get('/admin/series', 
      { search, page: nextPage }, 
      {
        preserveState: true,
        onSuccess: (response: any) => {
          const newSeries = response.props.series as Series[];
          setSeries(prev => [...prev, ...newSeries]);
          setPage(nextPage);
          setLoading(false);
        },
        onError: () => setLoading(false)
      }
    );
  };

  const openModal = async () => {
    try {
      const response = await fetch('/admin/series-form-data');
      const data = await response.json();
      setGenres(data.genres);
      setNativeLanguages(data.native_languages);
      setShowModal(true);
    } catch (error) {
      console.error('Failed to load form data:', error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      title: '',
      alternative_title: '',
      cover_url: '',
      synopsis: '',
      author: '',
      artist: '',
      rating: '',
      status: 'ongoing',
      native_language_id: '',
      genre_ids: [],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.post('/admin/series', formData, {
      onSuccess: () => closeModal(),
    });
  };

  const handleGenreToggle = (genreId: number) => {
    setFormData(prev => ({
      ...prev,
      genre_ids: prev.genre_ids.includes(genreId)
        ? prev.genre_ids.filter(id => id !== genreId)
        : [...prev.genre_ids, genreId]
    }));
  };

  return (
    <AdminLayout title="Series Management">
      <Head title="Series Management" />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Series Management</h1>
          <p className="text-gray-600 mt-1">Total: {total} series</p>
        </div>
        <button
          onClick={openModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add New Series
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search series by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </div>

      {/* Series Grid - 8 cards per row on large desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {series.map((item: Series) => (
          <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <Link href={`/admin/series/${item.slug}`}>
              <div className="aspect-[2/3] bg-gray-200">
                {item.cover_url ? (
                  <img
                    src={item.cover_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No Cover</span>
                  </div>
                )}
              </div>
              <div className="p-2">
                <h3 className="font-semibold text-gray-900 text-xs mb-1 line-clamp-2 leading-tight">{item.title}</h3>
                <p className="text-xs text-gray-600 mb-1">
                  {item.status}
                </p>
                <p className="text-xs text-gray-500">
                  {item.chapters_count} ch
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {item.genres.slice(0, 1).map((genre: Genre) => (
                    <span
                      key={genre.id}
                      className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {genre.name}
                    </span>
                  ))}
                  {item.genres.length > 1 && (
                    <span className="text-xs text-gray-500">+{item.genres.length - 1}</span>
                  )}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading...
              </div>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}

      {/* No results message */}
      {series.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {search ? `No series found for "${search}"` : 'No series found'}
          </p>
        </div>
      )}

      {/* Add Series Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Series</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Alternative Title</label>
                  <input
                    type="text"
                    value={formData.alternative_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, alternative_title: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Cover URL</label>
                  <input
                    type="url"
                    value={formData.cover_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, cover_url: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Synopsis</label>
                  <textarea
                    value={formData.synopsis}
                    onChange={(e) => setFormData(prev => ({ ...prev, synopsis: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Author</label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Artist</label>
                    <input
                      type="text"
                      value={formData.artist}
                      onChange={(e) => setFormData(prev => ({ ...prev, artist: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rating (0-10)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={formData.rating}
                      onChange={(e) => setFormData(prev => ({ ...prev, rating: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="ongoing">Ongoing</option>
                      <option value="complete">Complete</option>
                      <option value="hiatus">Hiatus</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Native Language *</label>
                  <select
                    value={formData.native_language_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, native_language_id: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Language</option>
                    {nativeLanguages.map((lang) => (
                      <option key={lang.id} value={lang.id}>{lang.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Genres *</label>
                  <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                    {genres.map((genre) => (
                      <label key={genre.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.genre_ids.includes(genre.id)}
                          onChange={() => handleGenreToggle(genre.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{genre.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Create Series
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
