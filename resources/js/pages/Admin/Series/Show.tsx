import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import RichTextEditor from '@/Components/RichTextEditor';

interface Genre {
  id: number;
  name: string;
}

interface NativeLanguage {
  id: number;
  name: string;
}

interface Chapter {
  id: number;
  chapter_number: number;
  volume?: number;
  title: string;
  content: string;
  is_premium: boolean;
  coin_price: number;
  is_published: boolean;
  created_at: string;
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
  chapters: Chapter[];
  created_at: string;
}

interface SeriesShowProps {
  series: Series;
}

export default function SeriesShow({ series }: SeriesShowProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFormData, setIsLoadingFormData] = useState(false);
  
  // Refs for auto-focus
  const titleInputRef = useRef<HTMLInputElement>(null);
  const chapterTitleInputRef = useRef<HTMLInputElement>(null);
  const [editFormData, setEditFormData] = useState({
    title: series.title,
    alternative_title: series.alternative_title || '',
    cover_url: series.cover_url || '',
    synopsis: series.synopsis || '',
    author: series.author || '',
    artist: series.artist || '',
    rating: series.rating.toString(),
    status: series.status,
    native_language_id: series.native_language.id.toString(),
    genre_ids: series.genres.map(g => g.id),
  });
  const [chapterFormData, setChapterFormData] = useState({
    title: '',
    content: '',
    is_premium: false,
    coin_price: 35,
    use_volume: false,
    volume: '',
    chapter_number: '',
  });
  const [genres, setGenres] = useState<Genre[]>([]);
  const [nativeLanguages, setNativeLanguages] = useState<NativeLanguage[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);

  // Sort chapters based on volume first, then chapter_number
  const sortedChapters = [...series.chapters].sort((a, b) => {
    // Handle volume sorting - nullish volumes go to end
    if (a.volume && b.volume) {
      const volumeDiff = a.volume - b.volume;
      if (volumeDiff !== 0) {
        return sortOrder === 'desc' ? -volumeDiff : volumeDiff;
      }
    } else if (a.volume && !b.volume) {
      return sortOrder === 'desc' ? -1 : 1;
    } else if (!a.volume && b.volume) {
      return sortOrder === 'desc' ? 1 : -1;
    }
    
    // If volumes are equal or both null, sort by chapter_number
    const chapterDiff = a.chapter_number - b.chapter_number;
    return sortOrder === 'desc' ? -chapterDiff : chapterDiff;
  });

  const openEditModal = async () => {
    setIsLoadingFormData(true);
    try {
      const response = await fetch('/admin/series-form-data');
      const data = await response.json();
      setGenres(data.genres);
      setNativeLanguages(data.native_languages);
      setShowEditModal(true);
      
      // Auto-focus on title input after modal opens
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Failed to load form data:', error);
      setAlertMessage({ type: 'error', message: 'Failed to load form data. Please try again.' });
      setTimeout(() => setAlertMessage(null), 5000);
    } finally {
      setIsLoadingFormData(false);
    }
  };

  const openChapterModal = (chapter?: Chapter) => {
    if (chapter) {
      setEditingChapter(chapter);
      setChapterFormData({
        title: chapter.title,
        content: chapter.content || '',
        is_premium: chapter.is_premium,
        coin_price: chapter.coin_price,
        use_volume: !!chapter.volume,
        volume: chapter.volume ? chapter.volume.toString() : '',
        chapter_number: chapter.chapter_number.toString(),
      });
    } else {
      setEditingChapter(null);
      setChapterFormData({
        title: '',
        content: '',
        is_premium: false,
        coin_price: 35,
        use_volume: false,
        volume: '',
        chapter_number: '',
      });
    }
    setShowChapterModal(true);
    
    // Auto-focus on chapter title input after modal opens
    setTimeout(() => {
      chapterTitleInputRef.current?.focus();
    }, 100);
  };

  // Handle genre toggle for edit form
  const handleGenreToggle = (genreId: number) => {
    setEditFormData(prev => ({
      ...prev,
      genre_ids: prev.genre_ids.includes(genreId)
        ? prev.genre_ids.filter(id => id !== genreId)
        : [...prev.genre_ids, genreId]
    }));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    router.put(`/admin/series/${series.slug}`, editFormData, {
      onSuccess: () => {
        setShowEditModal(false);
        setIsSubmitting(false);
        setAlertMessage({ type: 'success', message: 'Series updated successfully!' });
        setTimeout(() => setAlertMessage(null), 5000);
      },
      onError: () => {
        setIsSubmitting(false);
        setAlertMessage({ type: 'error', message: 'Failed to update series. Please try again.' });
        setTimeout(() => setAlertMessage(null), 5000);
      }
    });
  };

  const handleChapterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Prepare data to ensure proper format
    const submitData = {
      title: chapterFormData.title,
      content: chapterFormData.content,
      is_premium: chapterFormData.is_premium ? 1 : 0, // Convert boolean to integer
      coin_price: chapterFormData.is_premium ? chapterFormData.coin_price : 0,
      use_volume: chapterFormData.use_volume,
      volume: chapterFormData.use_volume && chapterFormData.volume ? parseFloat(chapterFormData.volume) : null,
      chapter_number: chapterFormData.chapter_number ? parseFloat(chapterFormData.chapter_number) : null,
    };
    
    if (editingChapter) {
      router.put(`/admin/chapters/${editingChapter.id}`, submitData, {
        onSuccess: () => {
          setShowChapterModal(false);
          setIsSubmitting(false);
          setAlertMessage({ type: 'success', message: 'Chapter updated successfully!' });
          setTimeout(() => setAlertMessage(null), 5000);
        },
        onError: (errors) => {
          console.error('Update error:', errors);
          setIsSubmitting(false);
          setAlertMessage({ type: 'error', message: 'Failed to update chapter. Please try again.' });
          setTimeout(() => setAlertMessage(null), 5000);
        }
      });
    } else {
      router.post(`/admin/series/${series.slug}/chapters`, submitData, {
        onSuccess: () => {
          setShowChapterModal(false);
          setIsSubmitting(false);
          setAlertMessage({ type: 'success', message: 'Chapter created successfully!' });
          setTimeout(() => setAlertMessage(null), 5000);
        },
        onError: (errors) => {
          console.error('Create error:', errors);
          setIsSubmitting(false);
          setAlertMessage({ type: 'error', message: 'Failed to create chapter. Please try again.' });
          setTimeout(() => setAlertMessage(null), 5000);
        }
      });
    }
  };

  const handleDeleteSeries = () => {
    if (confirm('Are you sure you want to delete this series? This action will also delete all chapters in this series and cannot be undone.')) {
      router.delete(`/admin/series/${series.slug}`, {
        onSuccess: () => {
          setAlertMessage({ type: 'success', message: 'Series deleted successfully!' });
          setTimeout(() => {
            router.get('/admin/series');
          }, 2000);
        },
        onError: () => {
          setAlertMessage({ type: 'error', message: 'Failed to delete series. Please try again.' });
          setTimeout(() => setAlertMessage(null), 5000);
        }
      });
    }
  };

  const handleDeleteChapter = (chapterId: number) => {
    if (confirm('Are you sure you want to delete this chapter? This action cannot be undone.')) {
      router.delete(`/admin/chapters/${chapterId}`, {
        onSuccess: () => {
          setAlertMessage({ type: 'success', message: 'Chapter deleted successfully!' });
          setTimeout(() => setAlertMessage(null), 5000);
        },
        onError: () => {
          setAlertMessage({ type: 'error', message: 'Failed to delete chapter. Please try again.' });
          setTimeout(() => setAlertMessage(null), 5000);
        }
      });
    }
  };

  return (
    <AdminLayout>
      <Head title={`${series.title} - Series Management`} />

      {/* Alert Message */}
      {alertMessage && (
        <div className={`mb-6 p-4 rounded-md ${
          alertMessage.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {alertMessage.type === 'success' ? (
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{alertMessage.message}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setAlertMessage(null)}
                  className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    alertMessage.type === 'success'
                      ? 'text-green-500 hover:bg-green-100 focus:ring-green-600'
                      : 'text-red-500 hover:bg-red-100 focus:ring-red-600'
                  }`}
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <Link
          href="/admin/series"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Series
        </Link>
      </div>

      {/* Series Info */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-48 flex-shrink-0">
            {series.cover_url ? (
              <img
                src={series.cover_url}
                alt={series.title}
                className="w-full aspect-[3/4] object-cover rounded-lg"
              />
            ) : (
              <div className="w-full aspect-[3/4] bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">No Cover</span>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{series.title}</h1>
                {series.alternative_title && (
                  <p className="text-gray-600">{series.alternative_title}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={openEditModal}
                  disabled={isLoadingFormData}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoadingFormData && (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{isLoadingFormData ? 'Loading...' : 'Edit Series'}</span>
                </button>
                <button
                  onClick={handleDeleteSeries}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Delete Series
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <span className="text-sm text-gray-500">Author</span>
                <p className="font-medium">{series.author || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Artist</span>
                <p className="font-medium">{series.artist || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Rating</span>
                <p className="font-medium">{series.rating}/10</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status</span>
                <p className="font-medium capitalize">{series.status}</p>
              </div>
            </div>

            <div className="mb-4">
              <span className="text-sm text-gray-500">Language</span>
              <p className="font-medium">{series.native_language.name}</p>
            </div>

            <div className="mb-4">
              <span className="text-sm text-gray-500">Genres</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {series.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>

            {series.synopsis && (
              <div>
                <span className="text-sm text-gray-500">Synopsis</span>
                <div className="mt-1 relative">
                  <div 
                    className={`text-gray-700 transition-all duration-300 prose prose-sm max-w-none ${
                      isSynopsisExpanded ? '' : 'line-clamp-4 overflow-hidden'
                    }`}
                    dangerouslySetInnerHTML={{ __html: series.synopsis }}
                  />
                  
                  {/* Expand/Collapse Button with Gradient */}
                  {series.synopsis.length > 200 && (
                    <div className="relative">
                      {!isSynopsisExpanded && (
                        <div 
                          className="absolute bottom-8 left-0 right-0 h-16 pointer-events-none"
                          style={{
                            background: `linear-gradient(to bottom, transparent, white)`
                          }}
                        />
                      )}
                      <button
                        onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
                        className="w-full mt-2 py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        style={{
                          background: `linear-gradient(to bottom, transparent, white)`,
                          border: 'none'
                        }}
                      >
                        <span className="text-sm font-medium">
                          {isSynopsisExpanded ? 'Show Less' : 'Show More'}
                        </span>
                        <svg 
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isSynopsisExpanded ? 'rotate-180' : ''
                          }`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chapters Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Chapters ({series.chapters.length})
          </h2>
          <div className="flex items-center gap-4">
            {/* Sort Toggle */}
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              <span>Sort:</span>
              <span className="font-semibold">
                {sortOrder === 'desc' ? 'Latest First' : 'Oldest First'}
              </span>
              <svg 
                className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 10l5 5 5-5" />
              </svg>
            </button>
            
            <button
              onClick={() => openChapterModal()}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Add New Chapter
            </button>
          </div>
        </div>

        {/* Chapter Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedChapters.map((chapter) => (
            <div
              key={chapter.id}
              className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md hover:border-gray-300 transition-all duration-200"
            >
              {/* Compact Info Row */}
              <div className="flex items-center justify-between mb-3">
                {/* Volume/Chapter */}
                <div className="font-semibold text-gray-900 text-sm">
                  {chapter.volume 
                    ? `Vol ${chapter.volume} Ch ${chapter.chapter_number}`
                    : `Chapter ${chapter.chapter_number}`
                  }
                </div>
                
                {/* Type Badge */}
                <div>
                  {chapter.is_premium ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      🔒 {chapter.coin_price}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Free
                    </span>
                  )}
                </div>
              </div>
              
              {/* Date */}
              <div className="text-xs text-gray-500 mb-3">
                📅 {new Date(chapter.created_at).toLocaleDateString()}
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => openChapterModal(chapter)}
                  className="flex-1 px-2 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteChapter(chapter.id)}
                  className="flex-1 px-2 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          
          {series.chapters.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📚</div>
              <p className="text-gray-500 text-lg">No chapters yet</p>
              <p className="text-gray-400 text-sm mt-2">Click "Add New Chapter" to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Series Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Series</h3>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title *</label>
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                    placeholder="Enter series title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Alternative Title</label>
                  <input
                    type="text"
                    value={editFormData.alternative_title}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, alternative_title: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                    placeholder="Enter alternative title (optional)..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Cover URL</label>
                  <input
                    type="url"
                    value={editFormData.cover_url}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, cover_url: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                    placeholder="https://example.com/cover-image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Synopsis</label>
                  <RichTextEditor
                    value={editFormData.synopsis}
                    onChange={(content) => setEditFormData(prev => ({ ...prev, synopsis: content }))}
                    placeholder="Enter series synopsis here..."
                    height={200}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Author</label>
                    <input
                      type="text"
                      value={editFormData.author}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, author: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                      placeholder="Enter author name..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Artist</label>
                    <input
                      type="text"
                      value={editFormData.artist}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, artist: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                      placeholder="Enter artist name..."
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
                      value={editFormData.rating}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, rating: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                      placeholder="8.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status *</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
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
                    value={editFormData.native_language_id}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, native_language_id: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
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
                  <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50">
                    {genres.map((genre) => (
                      <label key={genre.id} className="flex items-center hover:bg-white p-1 rounded cursor-pointer transition-colors duration-150">
                        <input
                          type="checkbox"
                          checked={editFormData.genre_ids.includes(genre.id)}
                          onChange={() => handleGenreToggle(genre.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="ml-2 text-sm text-gray-700">{genre.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSubmitting && (
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    <span>{isSubmitting ? 'Updating...' : 'Update Series'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Chapter Modal */}
      {showChapterModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingChapter ? 'Edit Chapter' : 'Add New Chapter'}
              </h3>
              <form onSubmit={handleChapterSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Chapter Title *</label>
                  <input
                    ref={chapterTitleInputRef}
                    type="text"
                    value={chapterFormData.title}
                    onChange={(e) => setChapterFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                    placeholder="Enter chapter title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
                  <RichTextEditor
                    value={chapterFormData.content}
                    onChange={(content) => setChapterFormData(prev => ({ ...prev, content }))}
                    placeholder="Enter chapter content here... You can paste image URLs and they will be converted to images automatically."
                    height={400}
                  />
                </div>

                {/* Volume and Chapter Number Section */}
                <div className="space-y-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                  <div className="flex items-center">
                    <label className="flex items-center hover:bg-white p-2 rounded cursor-pointer transition-colors duration-150">
                      <input
                        type="checkbox"
                        checked={chapterFormData.use_volume}
                        onChange={(e) => setChapterFormData(prev => ({
                          ...prev,
                          use_volume: e.target.checked,
                          volume: e.target.checked ? prev.volume || '1' : '',
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="ml-2 text-sm text-gray-700 font-medium">Use Volume (Light Novel Style)</span>
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {chapterFormData.use_volume && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Volume</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={chapterFormData.volume}
                          onChange={(e) => setChapterFormData(prev => ({ ...prev, volume: e.target.value }))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                          placeholder="1"
                        />
                        <p className="text-xs text-gray-500 mt-1">For light novels with volumes</p>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Chapter Number {!chapterFormData.use_volume && <span className="text-gray-400">(Auto-increment if empty)</span>}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={chapterFormData.chapter_number}
                        onChange={(e) => setChapterFormData(prev => ({ ...prev, chapter_number: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                        placeholder="Auto-increment"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {chapterFormData.use_volume 
                          ? "Chapter within the volume (e.g., 1, 2, 3.5)" 
                          : "Leave empty for auto-increment (webnovel style)"
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <label className="flex items-center hover:bg-white p-2 rounded cursor-pointer transition-colors duration-150">
                    <input
                      type="checkbox"
                      checked={chapterFormData.is_premium}
                      onChange={(e) => setChapterFormData(prev => ({
                        ...prev,
                        is_premium: e.target.checked,
                        // If toggled ON and no price set (or 0), default to 35; if OFF, reset to 0
                        coin_price: e.target.checked ? (prev.coin_price && prev.coin_price > 0 ? prev.coin_price : 35) : 0,
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-700 font-medium">Premium Chapter</span>
                  </label>

                  {chapterFormData.is_premium && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Coin Price</label>
                      <input
                        type="number"
                        min="1"
                        value={chapterFormData.coin_price}
                        onChange={(e) => setChapterFormData(prev => ({ ...prev, coin_price: parseInt(e.target.value) }))}
                        className="mt-1 block w-24 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                        placeholder="35"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowChapterModal(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:bg-green-400 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSubmitting && (
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    <span>
                      {isSubmitting 
                        ? (editingChapter ? 'Updating...' : 'Creating...') 
                        : (editingChapter ? 'Update Chapter' : 'Create Chapter')
                      }
                    </span>
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
