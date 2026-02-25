import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useRef, lazy, Suspense } from 'react';
const RichTextEditor = lazy(() => import('@/Components/RichTextEditor'));
import { useTheme } from '@/Contexts/ThemeContext';

// ── colour helpers ────────────────────────────────────────────────────────────
function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return { r: parseInt(h.substring(0,2),16), g: parseInt(h.substring(2,4),16), b: parseInt(h.substring(4,6),16) };
}
function isLight(hex: string) { const {r,g,b}=hexToRgb(hex); return (r*.299+g*.587+b*.114)/255>.5; }
function wa(hex: string, a: number) { try { const {r,g,b}=hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; } catch { return `rgba(0,0,0,${a})`; } }
const fmtViews = (n: number) => n >= 1_000_000 ? (n/1_000_000).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(1)+'K' : String(n);

// ── small themed helpers ──────────────────────────────────────────────────────
function TLabel({ children, muted }: { children: React.ReactNode; muted: string }) {
  return <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: muted }}>{children}</label>;
}
function TInput({ value, onChange, placeholder, type='text', required=false, inputRef, fg, border, cardBg, accent }:
  { value: string; onChange: (v:string)=>void; placeholder?: string; type?: string; required?: boolean; inputRef?: React.RefObject<HTMLInputElement>; fg: string; border: string; cardBg: string; accent: string }) {
  return (
    <input ref={inputRef} type={type} value={value} placeholder={placeholder} required={required}
      onChange={e => onChange(e.target.value)}
      className="block w-full px-3 py-2.5 rounded-xl text-sm outline-none transition"
      style={{ backgroundColor: cardBg, color: fg, border: `1px solid ${border}` }}
      onFocus={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 2px ${accent}22`; }}
      onBlur={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.boxShadow = 'none'; }} />
  );
}
function TTextarea({ value, onChange, placeholder, rows=5, fg, border, cardBg, accent }:
  { value: string; onChange: (v:string)=>void; placeholder?: string; rows?: number; fg: string; border: string; cardBg: string; accent: string }) {
  return (
    <textarea value={value} placeholder={placeholder} rows={rows}
      onChange={e => onChange(e.target.value)}
      className="block w-full px-3 py-2.5 rounded-xl text-sm outline-none transition resize-none"
      style={{ backgroundColor: cardBg, color: fg, border: `1px solid ${border}` }}
      onFocus={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 2px ${accent}22`; }}
      onBlur={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.boxShadow = 'none'; }} />
  );
}
function TSelect({ value, onChange, children, required=false, fg, border, cardBg, accent, light }:
  { value: string; onChange: (v:string)=>void; children: React.ReactNode; required?: boolean; fg: string; border: string; cardBg: string; accent: string; light?: boolean }) {
  return (
    <select value={value} required={required}
      onChange={e => onChange(e.target.value)}
      className="block w-full rounded-xl text-sm outline-none transition"
      style={{
        backgroundColor: cardBg, color: fg, border: `1px solid ${border}`,
        padding: '10px 2.5rem 10px 12px',
        appearance: 'none' as any,
        colorScheme: light ? 'light' : 'dark',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(fg)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
      }}
      onFocus={e => { e.currentTarget.style.borderColor = accent; }}
      onBlur={e => { e.currentTarget.style.borderColor = border; }}>
      {children}
    </select>
  );
}
function Toggle({ checked, onChange, accent }: { checked: boolean; onChange: (v:boolean)=>void; accent: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none"
      style={{ backgroundColor: checked ? accent : 'rgba(156,163,175,0.5)' }}>
      <span className="inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? 'translateX(22px)' : 'translateX(3px)', width: 18, height: 18, display: 'inline-block' }} />
    </button>
  );
}

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
  views: number;
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
  type: string;
  slug: string;
  is_mature?: boolean;
  views?: number;
  show_epub_button?: boolean;
  epub_series_slug?: string;
  cover_type?: string;
  cover_url_raw?: string;
  native_language: NativeLanguage;
  genres: Genre[];
  chapters: Chapter[];
  created_at: string;
}

interface SeriesShowProps {
  series: Series;
}

function SeriesShowContent({ series }: SeriesShowProps) {
  const { currentTheme } = useTheme();
  const light   = isLight(currentTheme.background);
  const fg      = currentTheme.foreground;
  const bg      = currentTheme.background;
  const muted   = wa(fg, 0.45);
  const border  = wa(fg, 0.1);
  const cardBg  = light ? wa(fg, 0.03) : wa(fg, 0.06);
  const panelBg = light ? wa(fg, 0.05) : wa(fg, 0.08);
  const accent  = light ? '#b45309' : '#fbbf24';
  const accentBg = light ? 'rgba(217,119,6,0.1)' : 'rgba(251,191,36,0.15)';
  const dangerColor = '#ef4444';
  const successColor = '#22c55e';
  const themeProps = { fg, border, cardBg, accent, light };
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFormData, setIsLoadingFormData] = useState(false);
  
  // Refs for auto-focus
  const titleInputRef = useRef<HTMLInputElement>(null);
  const chapterTitleInputRef = useRef<HTMLInputElement>(null);
  const [coverType, setCoverType] = useState<'cdn' | 'file'>((series as any).cover_type || 'cdn');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: series.title,
    alternative_title: series.alternative_title || '',
    cover_url: (series as any).cover_url_raw || series.cover_url || '',
    synopsis: series.synopsis || '',
    author: series.author || '',
    artist: series.artist || '',
    rating: series.rating.toString(),
    status: series.status,
    type: (series as any).type || 'web-novel',
    native_language_id: series.native_language.id.toString(),
    genre_ids: series.genres.map(g => g.id),
    show_epub_button: (series as any).show_epub_button || false,
    epub_series_slug: (series as any).epub_series_slug || '',
    is_mature: (series as any).is_mature || false,
  });
  const [chapterFormData, setChapterFormData] = useState({
    title: '',
    content: '',
    is_premium: false,
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
    
    const submitData = new FormData();
    submitData.append('title', editFormData.title);
    submitData.append('alternative_title', editFormData.alternative_title);
    submitData.append('cover_type', coverType);
    
    if (coverType === 'cdn') {
      submitData.append('cover_url', editFormData.cover_url);
    } else if (coverFile) {
      submitData.append('cover_file', coverFile);
    }
    
    submitData.append('synopsis', editFormData.synopsis);
    submitData.append('author', editFormData.author);
    submitData.append('artist', editFormData.artist);
    submitData.append('rating', editFormData.rating);
    submitData.append('status', editFormData.status);
    submitData.append('type', editFormData.type);
    submitData.append('native_language_id', editFormData.native_language_id);
    submitData.append('show_epub_button', editFormData.show_epub_button ? '1' : '0');
    submitData.append('epub_series_slug', editFormData.epub_series_slug);
    submitData.append('is_mature', (editFormData as any).is_mature ? '1' : '0');
    
    editFormData.genre_ids.forEach(id => {
      submitData.append('genre_ids[]', id.toString());
    });
    
    submitData.append('_method', 'PUT');
    
    router.post(`/admin/series/${series.slug}`, submitData, {
      onSuccess: () => {
        setShowEditModal(false);
        setIsSubmitting(false);
        setCoverFile(null);
        setAlertMessage({ type: 'success', message: 'Series updated successfully!' });
        setTimeout(() => setAlertMessage(null), 5000);
      },
      onError: () => {
        setIsSubmitting(false);
        setAlertMessage({ type: 'error', message: 'Failed to update series. Please try again.' });
        setTimeout(() => setAlertMessage(null), 5000);
      },
      forceFormData: true,
    });
  };

  const handleChapterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Prepare data to ensure proper format
    const submitData = {
      title: chapterFormData.title,
      content: chapterFormData.content,
      is_premium: chapterFormData.is_premium, // Send as boolean
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

  const handleTogglePremium = (chapterId: number, newPremiumStatus: boolean) => {
    router.patch(`/admin/chapters/${chapterId}/toggle-premium`, {
      is_premium: newPremiumStatus
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setAlertMessage({ 
          type: 'success', 
          message: `Chapter set to ${newPremiumStatus ? 'Premium' : 'Free'} successfully!` 
        });
        setTimeout(() => setAlertMessage(null), 3000);
      },
      onError: () => {
        setAlertMessage({ type: 'error', message: 'Failed to update chapter status. Please try again.' });
        setTimeout(() => setAlertMessage(null), 5000);
      }
    });
  };

  /* ── status/type colours ── */
  const statusMap: Record<string, { color: string; bg: string }> = {
    ongoing:  { color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
    complete: { color: '#2563eb', bg: 'rgba(37,99,235,0.12)' },
    hiatus:   { color: '#d97706', bg: 'rgba(217,119,6,0.12)' },
  };
  const sc = statusMap[series.status] ?? { color: muted, bg: wa(fg, 0.06) };

  return (
    <div>
      {/* ── Alert ──────────────────────────────────── */}
      {alertMessage && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium"
          style={{ backgroundColor: alertMessage.type==='success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            borderColor: alertMessage.type==='success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
            color: alertMessage.type==='success' ? successColor : dangerColor }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            {alertMessage.type==='success'
              ? <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              : <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />}
          </svg>
          <span className="flex-1">{alertMessage.message}</span>
          <button onClick={() => setAlertMessage(null)} className="opacity-60 hover:opacity-100">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </div>
      )}

      {/* ── Back ───────────────────────────────────── */}
      <Link href="/admin/series" className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 transition-opacity hover:opacity-70" style={{ color: accent }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
        Back to Series
      </Link>

      {/* ── Series Info Card ─────────────────────── */}
      <div className="rounded-2xl border overflow-hidden mb-6" style={{ backgroundColor: cardBg, borderColor: border }}>
        <div className="flex flex-col md:flex-row gap-0">
          {/* Cover */}
          <div className="md:w-52 flex-shrink-0">
            <div className="aspect-[2/3] md:h-full md:aspect-auto overflow-hidden" style={{ backgroundColor: wa(fg, 0.06), minHeight: 220 }}>
              {series.cover_url ? (
                <img src={series.cover_url} alt={series.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-10 h-10" style={{ color: wa(fg, 0.2) }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 p-6">
            {/* Title row */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h1 className="text-2xl font-bold leading-tight" style={{ color: fg }}>{series.title}</h1>
                  {/* Type badge */}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                    style={{ backgroundColor: series.type==='light-novel' ? 'rgba(37,99,235,0.15)' : 'rgba(124,58,237,0.15)',
                      color: series.type==='light-novel' ? '#3b82f6' : '#8b5cf6' }}>
                    {series.type==='light-novel' ? 'Light Novel' : 'Web Novel'}
                  </span>
                  {series.is_mature && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor:'rgba(239,68,68,0.15)', color:'#ef4444' }}>18+</span>}
                </div>
                {series.alternative_title && (
                  <p className="text-sm" style={{ color: muted }}>{series.alternative_title}</p>
                )}
              </div>
              {/* Action buttons */}
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={openEditModal} disabled={isLoadingFormData}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
                  style={{ backgroundColor: accent, color: bg }}>
                  {isLoadingFormData
                    ? <><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Loading…</>
                    : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" /></svg>Edit Series</>
                  }
                </button>
                <button onClick={handleDeleteSeries}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                  style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
                  onMouseEnter={e=>(e.currentTarget.style.backgroundColor='rgba(239,68,68,0.2)')}
                  onMouseLeave={e=>(e.currentTarget.style.backgroundColor='rgba(239,68,68,0.12)')}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                  Delete
                </button>
              </div>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              {[
                { label: 'Author', value: series.author || '—' },
                { label: 'Artist', value: series.artist || '—' },
                { label: 'Rating', value: `${series.rating}/10` },
                { label: 'Language', value: series.native_language.name },
              ].map(item => (
                <div key={item.label} className="px-3 py-2.5 rounded-xl" style={{ backgroundColor: panelBg }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: muted }}>{item.label}</p>
                  <p className="text-sm font-semibold" style={{ color: fg }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Status + Genres row */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ color: sc.color, backgroundColor: sc.bg }}>{series.status}</span>
              {series.genres.map(g => (
                <span key={g.id} className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: accent, backgroundColor: accentBg }}>{g.name}</span>
              ))}
            </div>

            {/* Synopsis */}
            {series.synopsis && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: muted }}>Synopsis</p>
                <div className="relative">
                  <div
                    className={`text-sm leading-relaxed transition-all duration-300 prose prose-sm max-w-none ${
                      isSynopsisExpanded ? '' : 'line-clamp-4 overflow-hidden'
                    }`}
                    style={{ color: wa(fg, 0.8) }}
                    dangerouslySetInnerHTML={{ __html: series.synopsis }}
                  />
                  {series.synopsis.length > 200 && (
                    <div className="relative">
                      {!isSynopsisExpanded && (
                        <div className="absolute bottom-8 left-0 right-0 h-12 pointer-events-none"
                          style={{ background: `linear-gradient(to bottom, transparent, ${bg})` }} />
                      )}
                      <button onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
                        className="mt-2 flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
                        style={{ color: accent }}>
                        {isSynopsisExpanded ? 'Show Less' : 'Show More'}
                        <svg className={`w-3.5 h-3.5 transition-transform ${isSynopsisExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Chapters Section ─────────────────────── */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: border }}>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b" style={{ borderColor: border }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: fg }}>Chapters</h2>
            <p className="text-xs mt-0.5" style={{ color: muted }}>{series.chapters.length} chapters total</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors border"
              style={{ color: fg, borderColor: border, backgroundColor: panelBg }}>
              <svg className={`w-3.5 h-3.5 transition-transform ${sortOrder==='desc' ? 'rotate-180':''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>
              {sortOrder === 'desc' ? 'Latest First' : 'Oldest First'}
            </button>
            <button onClick={() => openChapterModal()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ backgroundColor: successColor, color: '#fff' }}
              onMouseEnter={e=>(e.currentTarget.style.opacity='0.88')}
              onMouseLeave={e=>(e.currentTarget.style.opacity='1')}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Add New Chapter
            </button>
          </div>
        </div>

        {/* Chapter Cards Grid */}
        <div className="p-5">
          {series.chapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: muted }}>
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
              <p className="text-sm font-medium">No chapters yet</p>
              <p className="text-xs">Click "Add New Chapter" to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {sortedChapters.map((chapter) => {
                const premiumGradId = `dmd-${chapter.id}`;
                return (
                  <div key={chapter.id} className="rounded-xl border flex flex-col transition-all duration-200"
                    style={{ backgroundColor: panelBg, borderColor: border }}
                    onMouseEnter={e=>(e.currentTarget.style.borderColor=border.replace(/,[^,]+\)/, `, 0.25)`))}
                    onMouseLeave={e=>(e.currentTarget.style.borderColor=border)}>
                    {/* Top row: chapter label + badge */}
                    <div className="flex items-center justify-between px-3 pt-3 pb-2">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: muted }}>
                          {chapter.volume ? `Vol ${chapter.volume}` : 'Chapter'}
                        </p>
                        <p className="text-sm font-bold" style={{ color: fg }}>Ch {chapter.chapter_number}</p>
                      </div>
                      {chapter.is_premium ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>
                          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none">
                            <defs>
                              <linearGradient id={premiumGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#c084fc' }} />
                                <stop offset="100%" style={{ stopColor: '#a78bfa' }} />
                              </linearGradient>
                            </defs>
                            <path d="M12 2L3 9L12 22L21 9L12 2Z" fill={`url(#${premiumGradId})`} stroke="#fff" strokeWidth="0.5" />
                          </svg>
                          Premium
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>Free</span>
                      )}
                    </div>

                    {/* Title */}
                    {chapter.title && (
                      <p className="px-3 pb-2 text-xs leading-snug line-clamp-2" style={{ color: wa(fg, 0.7) }}>{chapter.title}</p>
                    )}

                    {/* Date + Views row */}
                    <div className="px-3 pb-3 flex items-center justify-between" style={{ color: muted }}>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                        <span className="text-[10px]">{new Date(chapter.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                        <span className="text-[10px]">{fmtViews(chapter.views ?? 0)}</span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="mx-3 h-px" style={{ backgroundColor: border }} />

                    {/* Actions */}
                    <div className="p-2 flex gap-2">
                      <button onClick={() => openChapterModal(chapter)}
                        className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
                        style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#3b82f6' }}
                        onMouseEnter={e=>(e.currentTarget.style.backgroundColor='rgba(37,99,235,0.18)')}
                        onMouseLeave={e=>(e.currentTarget.style.backgroundColor='rgba(37,99,235,0.1)')}>Edit</button>
                      <button onClick={() => handleDeleteChapter(chapter.id)}
                        className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
                        style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                        onMouseEnter={e=>(e.currentTarget.style.backgroundColor='rgba(239,68,68,0.18)')}
                        onMouseLeave={e=>(e.currentTarget.style.backgroundColor='rgba(239,68,68,0.1)')}>Delete</button>
                    </div>

                    {/* Premium quick-toggle */}
                    <div className="px-3 pb-3 flex items-center justify-between">
                      <span className="text-[11px] font-medium" style={{ color: muted }}>Premium</span>
                      <button onClick={() => handleTogglePremium(chapter.id, !chapter.is_premium)}
                        className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                        style={{ backgroundColor: chapter.is_premium ? '#8b5cf6' : wa(fg, 0.2) }}>
                        <span className="inline-block rounded-full bg-white shadow transition-transform"
                          style={{ width:14, height:14, transform: chapter.is_premium ? 'translateX(18px)' : 'translateX(3px)' }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Series Modal ─────────────────────── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="relative w-full max-w-4xl my-8 rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: bg }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: border }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: fg }}>Edit Series</h2>
                <p className="text-xs mt-0.5" style={{ color: muted }}>Update series information</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg transition-colors" style={{ color: muted }}
                onMouseEnter={e=>(e.currentTarget.style.backgroundColor=wa(fg,0.08))}
                onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[78vh] overflow-y-auto">
                {/* ── Left col: Cover + rating + toggles ─── */}
                <div className="space-y-4">
                  {/* Cover preview */}
                  <div className="aspect-[2/3] rounded-xl overflow-hidden border-2 border-dashed flex items-center justify-center" style={{ borderColor: border, backgroundColor: panelBg }}>
                    {(coverType==='cdn' && editFormData.cover_url) ? (
                      <img src={editFormData.cover_url} alt="preview" className="w-full h-full object-cover"
                        onError={e=>{(e.target as HTMLImageElement).style.display='none';}} />
                    ) : (
                      <div className="flex flex-col items-center gap-2" style={{ color: muted }}>
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                        <span className="text-xs">Cover Preview</span>
                      </div>
                    )}
                  </div>

                  {/* Cover type toggle */}
                  <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: panelBg }}>
                    {(['cdn','file'] as const).map(t => (
                      <button key={t} type="button" onClick={() => { setCoverType(t); setCoverFile(null); }}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{ backgroundColor: coverType===t ? accent : 'transparent', color: coverType===t ? bg : muted }}>
                        {t==='cdn' ? 'CDN URL' : 'Upload File'}
                      </button>
                    ))}
                  </div>

                  {coverType==='cdn' ? (
                    <div><TLabel muted={muted}>Image URL</TLabel>
                      <TInput value={editFormData.cover_url} onChange={v=>setEditFormData(p=>({...p,cover_url:v}))} placeholder="https://..." {...themeProps} />
                    </div>
                  ) : (
                    <div>
                      <TLabel muted={muted}>Upload File</TLabel>
                      <label className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer" style={{ borderColor: border, backgroundColor: panelBg }}>
                        <svg className="w-6 h-6" style={{ color: muted }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
                        <span className="text-xs" style={{ color: muted }}>{coverFile ? coverFile.name : 'Click to upload'}</span>
                        <input type="file" className="hidden" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={e=>setCoverFile(e.target.files?.[0]||null)} />
                      </label>
                      <p className="text-[10px] mt-1.5" style={{ color: muted }}>Max 2MB · JPG, PNG, WebP</p>
                    </div>
                  )}

                  <div><TLabel muted={muted}>Rating (0–10)</TLabel>
                    <TInput type="number" value={editFormData.rating} onChange={v=>setEditFormData(p=>({...p,rating:v}))} placeholder="8.5" {...themeProps} />
                  </div>

                  {/* Epub toggle */}
                  <div className="p-3 rounded-xl border" style={{ borderColor: editFormData.show_epub_button ? '#16a34a50' : border, backgroundColor: editFormData.show_epub_button ? 'rgba(22,163,74,0.07)' : panelBg }}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold" style={{ color: editFormData.show_epub_button ? '#16a34a' : fg }}>📖 Epub Download</p>
                      <Toggle checked={editFormData.show_epub_button} onChange={v=>setEditFormData(p=>({...p,show_epub_button:v,epub_series_slug:v?p.epub_series_slug:''}))} accent="#16a34a" />
                    </div>
                    {editFormData.show_epub_button && (
                      <TInput value={editFormData.epub_series_slug} onChange={v=>setEditFormData(p=>({...p,epub_series_slug:v}))} placeholder="epub-series-slug" {...themeProps} />
                    )}
                  </div>

                  {/* Mature toggle */}
                  <label className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer"
                    style={{ borderColor: editFormData.is_mature ? '#ef444460' : border, backgroundColor: editFormData.is_mature ? 'rgba(239,68,68,0.07)' : panelBg }}>
                    <input type="checkbox" checked={editFormData.is_mature} onChange={e=>setEditFormData(p=>({...p,is_mature:e.target.checked}))} className="mt-0.5 h-4 w-4 rounded" />
                    <div>
                      <p className="text-xs font-bold" style={{ color: editFormData.is_mature ? '#dc2626' : fg }}>🔞 Mature Content</p>
                      <p className="text-[10px] mt-0.5" style={{ color: muted }}>Shows age-gate warning</p>
                    </div>
                  </label>
                </div>

                {/* ── Right col: Form fields ─────────────── */}
                <div className="lg:col-span-2 space-y-4">
                  <div><TLabel muted={muted}>Title *</TLabel>
                    <TInput value={editFormData.title} onChange={v=>setEditFormData(p=>({...p,title:v}))} placeholder="Series title" required inputRef={titleInputRef} {...themeProps} />
                  </div>
                  <div><TLabel muted={muted}>Alternative Title</TLabel>
                    <TInput value={editFormData.alternative_title} onChange={v=>setEditFormData(p=>({...p,alternative_title:v}))} placeholder="Original / alternative title" {...themeProps} />
                  </div>

                  <div>
                    <TLabel muted={muted}>Synopsis</TLabel>
                    <Suspense fallback={<div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: cardBg, border: `1px solid ${border}`, borderRadius: '0.5rem', color: muted, fontSize: '0.875rem' }}>Loading editor…</div>}>
                      <RichTextEditor value={editFormData.synopsis} onChange={content=>setEditFormData(p=>({...p,synopsis:content}))} placeholder="Enter series synopsis..." height={200} />
                    </Suspense>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div><TLabel muted={muted}>Author</TLabel>
                      <TInput value={editFormData.author} onChange={v=>setEditFormData(p=>({...p,author:v}))} placeholder="Author name" {...themeProps} />
                    </div>
                    <div><TLabel muted={muted}>Artist</TLabel>
                      <TInput value={editFormData.artist} onChange={v=>setEditFormData(p=>({...p,artist:v}))} placeholder="Artist / Illustrator" {...themeProps} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div><TLabel muted={muted}>Status *</TLabel>
                      <TSelect value={editFormData.status} onChange={v=>setEditFormData(p=>({...p,status:v}))} required {...themeProps}>
                        <option value="ongoing" style={{ background: cardBg, color: fg }}>Ongoing</option>
                        <option value="complete" style={{ background: cardBg, color: fg }}>Complete</option>
                        <option value="hiatus" style={{ background: cardBg, color: fg }}>Hiatus</option>
                      </TSelect>
                    </div>
                    <div><TLabel muted={muted}>Type *</TLabel>
                      <TSelect value={editFormData.type} onChange={v=>setEditFormData(p=>({...p,type:v}))} required {...themeProps}>
                        <option value="web-novel" style={{ background: cardBg, color: fg }}>Web Novel</option>
                        <option value="light-novel" style={{ background: cardBg, color: fg }}>Light Novel</option>
                      </TSelect>
                    </div>
                    <div><TLabel muted={muted}>Language *</TLabel>
                      <TSelect value={editFormData.native_language_id} onChange={v=>setEditFormData(p=>({...p,native_language_id:v}))} required {...themeProps}>
                        <option value="" style={{ background: cardBg, color: fg }}>Select...</option>
                        {nativeLanguages.map(l=><option key={l.id} value={l.id} style={{ background: cardBg, color: fg }}>{l.name}</option>)}
                      </TSelect>
                    </div>
                  </div>

                  {/* Genres */}
                  <div>
                    <TLabel muted={muted}>Genres *</TLabel>
                    <div className="p-3 rounded-xl border" style={{ borderColor: border, backgroundColor: panelBg }}>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {genres.map(g => {
                          const active = editFormData.genre_ids.includes(g.id);
                          return (
                            <label key={g.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-xs"
                              style={{ backgroundColor: active ? accentBg : 'transparent', color: active ? accent : fg }}>
                              <input type="checkbox" checked={active} onChange={()=>handleGenreToggle(g.id)} className="h-3.5 w-3.5 rounded" />
                              {g.name}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: border }}>
                <button type="button" onClick={()=>setShowEditModal(false)} disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                  style={{ color: fg, backgroundColor: wa(fg,0.08) }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-60"
                  style={{ color: bg, backgroundColor: accent }}>
                  {isSubmitting && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                  {isSubmitting ? 'Saving…' : 'Update Series'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add/Edit Chapter Modal (fullscreen) ──── */}
      {showChapterModal && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: bg }}>
          {/* Topbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: border }}>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => setShowChapterModal(false)}
                className="p-2 rounded-xl transition-colors" style={{ color: muted }}
                onMouseEnter={e=>(e.currentTarget.style.backgroundColor=wa(fg,0.08))}
                onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div>
                <h2 className="text-lg font-bold" style={{ color: fg }}>{editingChapter ? 'Edit Chapter' : 'Add New Chapter'}</h2>
                <p className="text-xs" style={{ color: muted }}>{series.title}</p>
              </div>
            </div>
            <button type="button" form="chapter-form" onClick={handleChapterSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
              style={{ backgroundColor: successColor, color: '#fff' }}>
              {isSubmitting && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              {isSubmitting ? (editingChapter ? 'Updating…' : 'Creating…') : (editingChapter ? 'Update Chapter' : 'Create Chapter')}
            </button>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            <form id="chapter-form" onSubmit={handleChapterSubmit}>
              <div className="w-full px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* ── Right sidebar: metadata ─── */}
                <div className="lg:col-span-1 lg:order-2 space-y-4">
                  {/* Chapter numbering */}
                  <div className="rounded-xl border p-4 space-y-4" style={{ backgroundColor: cardBg, borderColor: border }}>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: muted }}>Numbering</p>

                    {/* Volume toggle (LN style) */}
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ backgroundColor: panelBg }}>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: fg }}>Volume (LN Style)</p>
                        <p className="text-[10px]" style={{ color: muted }}>Enable for light novels</p>
                      </div>
                      <Toggle checked={chapterFormData.use_volume}
                        onChange={v => setChapterFormData(prev => ({ ...prev, use_volume: v, volume: v ? prev.volume||'1' : '' }))}
                        accent={accent} />
                    </div>

                    {chapterFormData.use_volume && (
                      <div><TLabel muted={muted}>Volume</TLabel>
                        <TInput type="number" value={chapterFormData.volume} onChange={v=>setChapterFormData(p=>({...p,volume:v}))} placeholder="1" {...themeProps} />
                        <p className="text-[10px] mt-1" style={{ color: muted }}>For light novels with volumes</p>
                      </div>
                    )}

                    <div><TLabel muted={muted}>Chapter Number {!chapterFormData.use_volume && <span style={{ color: muted, fontWeight:400 }}>(auto if empty)</span>}</TLabel>
                      <TInput type="number" value={chapterFormData.chapter_number} onChange={v=>setChapterFormData(p=>({...p,chapter_number:v}))} placeholder="Auto-increment" {...themeProps} />
                      <p className="text-[10px] mt-1" style={{ color: muted }}>
                        {chapterFormData.use_volume ? 'Chapter within volume (e.g. 1, 2, 3.5)' : 'Leave empty for auto-increment'}
                      </p>
                    </div>
                  </div>

                  {/* Premium toggle */}
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: chapterFormData.is_premium ? 'rgba(167,139,250,0.4)' : border }}>
                    <div className="flex items-center justify-between p-4" style={{ background: chapterFormData.is_premium ? 'linear-gradient(135deg, rgba(192,132,252,0.15), rgba(167,139,250,0.1))' : panelBg }}>
                      <div className="flex items-center gap-3">
                        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                          <defs>
                            <linearGradient id="modalDmd" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" style={{ stopColor: '#c084fc' }} />
                              <stop offset="100%" style={{ stopColor: '#a78bfa' }} />
                            </linearGradient>
                          </defs>
                          <path d="M12 2L3 9L12 22L21 9L12 2Z" fill="url(#modalDmd)" stroke="#fff" strokeWidth="0.5" />
                          <path d="M12 2L12 22M3 9L21 9" stroke="#fff" strokeWidth="0.3" opacity="0.6" />
                        </svg>
                        <div>
                          <p className="text-sm font-bold" style={{ color: chapterFormData.is_premium ? '#a78bfa' : fg }}>Premium Chapter</p>
                          <p className="text-[10px]" style={{ color: muted }}>Requires membership to unlock</p>
                        </div>
                      </div>
                      <Toggle checked={chapterFormData.is_premium}
                        onChange={v => setChapterFormData(p=>({...p,is_premium:v}))}
                        accent="#8b5cf6" />
                    </div>
                  </div>
                </div>

                {/* ── Main: Title + Content ─── */}
                <div className="lg:col-span-3 lg:order-1 space-y-4">
                  <div>
                    <TLabel muted={muted}>Chapter Title *</TLabel>
                    <TInput value={chapterFormData.title} onChange={v=>setChapterFormData(p=>({...p,title:v}))} placeholder="Enter chapter title…" required inputRef={chapterTitleInputRef} {...themeProps} />
                  </div>

                  <div>
                    <TLabel muted={muted}>Content *</TLabel>
                    <Suspense fallback={<div style={{ height: 520, display: 'flex', alignItems: 'center', justifyContent: 'center', background: cardBg, border: `1px solid ${border}`, borderRadius: '0.5rem', color: muted, fontSize: '0.875rem' }}>Loading editor…</div>}>
                      <RichTextEditor
                        value={chapterFormData.content}
                        onChange={content=>setChapterFormData(p=>({...p,content}))}
                        placeholder="Enter chapter content here… Paste image URLs and they'll be converted automatically."
                        height={520}
                      />
                    </Suspense>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SeriesShow(props: SeriesShowProps) {
  return (
    <AdminLayout title={props.series.title}>
      <Head title={`${props.series.title} – Series Management`} />
      <SeriesShowContent {...props} />
    </AdminLayout>
  );
}
