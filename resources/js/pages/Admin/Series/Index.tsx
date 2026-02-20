import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';

// â”€â”€ colour helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return { r: parseInt(h.substring(0,2),16), g: parseInt(h.substring(2,4),16), b: parseInt(h.substring(4,6),16) };
}
function isLight(hex: string) { const {r,g,b}=hexToRgb(hex); return (r*.299+g*.587+b*.114)/255>.5; }
function wa(hex: string, a: number) { try { const {r,g,b}=hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; } catch { return `rgba(0,0,0,${a})`; } }

// â”€â”€ types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface Genre { id: number; name: string; }
interface NativeLanguage { id: number; name: string; }
interface Series {
  id: number; title: string; alternative_title?: string;
  cover_url?: string; status: string; type: string;
  slug: string; author?: string; rating: number;
  views: number; chapters_count: number;
  native_language: NativeLanguage; genres: Genre[];
  created_at: string;
}
interface SeriesIndexProps {
  series: Series[]; currentPage: number; totalPages: number;
  hasMore: boolean; search: string; type: string; sort: string; total: number;
}

// â”€â”€ view formatter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const fmtViews = (n: number) => n >= 1_000_000 ? (n/1_000_000).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(1)+'K' : String(n);

// â”€â”€ themed input / select helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TInput({ value, onChange, placeholder, type='text', required=false, fg, border, cardBg, accent }:
  { value: string; onChange: (v:string)=>void; placeholder?: string; type?: string; required?: boolean; fg: string; border: string; cardBg: string; accent: string }) {
  return (
    <input
      type={type} value={value} placeholder={placeholder} required={required}
      onChange={e => onChange(e.target.value)}
      className="block w-full px-3 py-2.5 rounded-xl text-sm outline-none transition"
      style={{ backgroundColor: cardBg, color: fg, border: `1px solid ${border}` }}
      onFocus={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 2px ${accent}22`; }}
      onBlur={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.boxShadow = 'none'; }}
    />
  );
}
function TTextarea({ value, onChange, placeholder, rows=5, fg, border, cardBg, accent }:
  { value: string; onChange: (v:string)=>void; placeholder?: string; rows?: number; fg: string; border: string; cardBg: string; accent: string }) {
  return (
    <textarea
      value={value} placeholder={placeholder} rows={rows}
      onChange={e => onChange(e.target.value)}
      className="block w-full px-3 py-2.5 rounded-xl text-sm outline-none transition resize-none"
      style={{ backgroundColor: cardBg, color: fg, border: `1px solid ${border}` }}
      onFocus={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 2px ${accent}22`; }}
      onBlur={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.boxShadow = 'none'; }}
    />
  );
}
function TSelect({ value, onChange, children, required=false, fg, border, cardBg, accent }:
  { value: string; onChange: (v:string)=>void; children: React.ReactNode; required?: boolean; fg: string; border: string; cardBg: string; accent: string }) {
  return (
    <select
      value={value} required={required}
      onChange={e => onChange(e.target.value)}
      className="block w-full px-3 py-2.5 rounded-xl text-sm outline-none transition"
      style={{ backgroundColor: cardBg, color: fg, border: `1px solid ${border}` }}
      onFocus={e => { e.currentTarget.style.borderColor = accent; }}
      onBlur={e => { e.currentTarget.style.borderColor = border; }}
    >
      {children}
    </select>
  );
}
function TLabel({ children, fg }: { children: React.ReactNode; fg: string }) {
  return <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: fg }}>{children}</label>;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Add Series Modal
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
interface AddSeriesModalProps {
  onClose: () => void;
  genres: Genre[];
  nativeLanguages: NativeLanguage[];
  fg: string; bg: string; border: string; cardBg: string; muted: string;
  accent: string; accentBg: string; light: boolean;
}

function AddSeriesModal({ onClose, genres, nativeLanguages, fg, bg, border, cardBg, muted, accent, accentBg, light }: AddSeriesModalProps) {
  const [coverType, setCoverType] = useState<'cdn'|'file'>('cdn');
  const [coverFile, setCoverFile] = useState<File|null>(null);
  const [coverPreview, setCoverPreview] = useState<string|null>(null);
  const [formData, setFormData] = useState({
    title: '', alternative_title: '', cover_url: '', synopsis: '',
    author: '', artist: '', rating: '8.5', status: 'ongoing',
    type: 'web-novel', native_language_id: '',
    genre_ids: [] as number[], is_mature: false,
  });

  const set = (k: string, v: any) => setFormData(p => ({ ...p, [k]: v }));
  const toggleGenre = (id: number) => set('genre_ids', formData.genre_ids.includes(id) ? formData.genre_ids.filter(x=>x!==id) : [...formData.genre_ids, id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setCoverFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setCoverPreview(url);
    } else {
      setCoverPreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', formData.title);
    fd.append('alternative_title', formData.alternative_title);
    fd.append('cover_type', coverType);
    if (coverType === 'cdn') fd.append('cover_url', formData.cover_url);
    else if (coverFile) fd.append('cover_file', coverFile);
    fd.append('synopsis', formData.synopsis);
    fd.append('author', formData.author);
    fd.append('artist', formData.artist);
    fd.append('rating', formData.rating);
    fd.append('status', formData.status);
    fd.append('type', formData.type);
    fd.append('native_language_id', formData.native_language_id);
    formData.genre_ids.forEach(id => fd.append('genre_ids[]', id.toString()));
    fd.append('is_mature', formData.is_mature ? '1' : '0');
    router.post('/admin/series', fd, { onSuccess: onClose, forceFormData: true });
  };

  const inputProps = { fg, border, cardBg, accent };
  const panelBg = light ? wa(fg, 0.03) : wa(fg, 0.06);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="relative w-full max-w-4xl my-8 rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: bg }}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: border }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: fg }}>Add New Series</h2>
            <p className="text-xs mt-0.5" style={{ color: muted }}>Fill in the details below to create a new series</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-colors" style={{ color: muted }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = wa(fg,0.08))}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[75vh] overflow-y-auto">
            {/* â”€â”€ Left: Cover Preview â”€â”€ */}
            <div className="lg:col-span-1 space-y-4">
              {/* Cover preview box */}
              <div className="aspect-[2/3] rounded-xl overflow-hidden border-2 border-dashed flex items-center justify-center" style={{ borderColor: border, backgroundColor: panelBg }}>
                {(coverType === 'cdn' && formData.cover_url) || coverPreview ? (
                  <img
                    src={coverPreview || formData.cover_url}
                    alt="preview" className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2" style={{ color: muted }}>
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                    <span className="text-xs">Cover Preview</span>
                  </div>
                )}
              </div>

              {/* Cover type toggle */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: panelBg }}>
                {(['cdn', 'file'] as const).map(t => (
                  <button key={t} type="button" onClick={() => { setCoverType(t); setCoverPreview(null); setCoverFile(null); }}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ backgroundColor: coverType===t ? accent : 'transparent', color: coverType===t ? bg : muted }}>
                    {t === 'cdn' ? 'CDN URL' : 'Upload File'}
                  </button>
                ))}
              </div>

              {coverType === 'cdn' ? (
                <div>
                  <TLabel fg={muted}>Image URL</TLabel>
                  <TInput value={formData.cover_url} onChange={v=>set('cover_url',v)} placeholder="https://example.com/cover.jpg" {...inputProps} />
                </div>
              ) : (
                <div>
                  <TLabel fg={muted}>Upload File</TLabel>
                  <label
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors"
                    style={{ borderColor: border, backgroundColor: panelBg }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f=e.dataTransfer.files[0]; if(f){ setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); } }}
                  >
                    <svg className="w-6 h-6" style={{ color: muted }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                    <span className="text-xs" style={{ color: muted }}>{coverFile ? coverFile.name : 'Drop or click to upload'}</span>
                    <input type="file" className="hidden" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleFileChange} />
                  </label>
                  <p className="text-[10px] mt-1.5" style={{ color: muted }}>Max 2MB Â· JPG, PNG, WebP</p>
                </div>
              )}

              {/* Rating */}
              <div>
                <TLabel fg={muted}>Rating (0â€“10)</TLabel>
                <TInput type="number" value={formData.rating} onChange={v=>set('rating',v)} placeholder="8.5" {...inputProps} />
              </div>

              {/* Mature toggle */}
              <label
                className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer"
                style={{ borderColor: formData.is_mature ? '#ef444460' : border, backgroundColor: formData.is_mature ? 'rgba(239,68,68,0.07)' : panelBg }}
              >
                <input type="checkbox" checked={formData.is_mature} onChange={e=>set('is_mature',e.target.checked)} className="mt-0.5 h-4 w-4 rounded" />
                <div>
                  <p className="text-xs font-bold" style={{ color: formData.is_mature ? '#dc2626' : fg }}>ðŸ”ž Mature Content</p>
                  <p className="text-[10px] mt-0.5" style={{ color: muted }}>Shows age-gate warning to users</p>
                </div>
              </label>
            </div>

            {/* â”€â”€ Right: Form Fields â”€â”€ */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <TLabel fg={muted}>Title *</TLabel>
                <TInput value={formData.title} onChange={v=>set('title',v)} placeholder="Enter series title" required {...inputProps} />
              </div>
              <div>
                <TLabel fg={muted}>Alternative Title</TLabel>
                <TInput value={formData.alternative_title} onChange={v=>set('alternative_title',v)} placeholder="Original / alternative title" {...inputProps} />
              </div>
              <div>
                <TLabel fg={muted}>Synopsis</TLabel>
                <TTextarea value={formData.synopsis} onChange={v=>set('synopsis',v)} placeholder="Enter series synopsis..." rows={5} {...inputProps} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <TLabel fg={muted}>Author</TLabel>
                  <TInput value={formData.author} onChange={v=>set('author',v)} placeholder="Author name" {...inputProps} />
                </div>
                <div>
                  <TLabel fg={muted}>Artist</TLabel>
                  <TInput value={formData.artist} onChange={v=>set('artist',v)} placeholder="Artist / Illustrator" {...inputProps} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <TLabel fg={muted}>Status *</TLabel>
                  <TSelect value={formData.status} onChange={v=>set('status',v)} required {...inputProps}>
                    <option value="ongoing">Ongoing</option>
                    <option value="complete">Complete</option>
                    <option value="hiatus">Hiatus</option>
                  </TSelect>
                </div>
                <div>
                  <TLabel fg={muted}>Type *</TLabel>
                  <TSelect value={formData.type} onChange={v=>set('type',v)} required {...inputProps}>
                    <option value="web-novel">Web Novel</option>
                    <option value="light-novel">Light Novel</option>
                  </TSelect>
                </div>
                <div>
                  <TLabel fg={muted}>Language *</TLabel>
                  <TSelect value={formData.native_language_id} onChange={v=>set('native_language_id',v)} required {...inputProps}>
                    <option value="">Select...</option>
                    {nativeLanguages.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </TSelect>
                </div>
              </div>

              {/* Genres */}
              <div>
                <TLabel fg={muted}>Genres *</TLabel>
                <div className="p-3 rounded-xl border" style={{ borderColor: border, backgroundColor: panelBg }}>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {genres.map(g => {
                      const active = formData.genre_ids.includes(g.id);
                      return (
                        <label key={g.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-xs"
                          style={{ backgroundColor: active ? accentBg : 'transparent', color: active ? accent : fg }}>
                          <input type="checkbox" checked={active} onChange={()=>toggleGenre(g.id)} className="h-3.5 w-3.5 rounded" />
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
            <button type="button" onClick={onClose}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={{ color: fg, backgroundColor: wa(fg, 0.08) }}
              onMouseEnter={e=>(e.currentTarget.style.backgroundColor=wa(fg,0.13))}
              onMouseLeave={e=>(e.currentTarget.style.backgroundColor=wa(fg,0.08))}>
              Cancel
            </button>
            <button type="submit"
              className="px-5 py-2 rounded-xl text-sm font-bold transition-colors"
              style={{ color: bg, backgroundColor: accent }}>
              Create Series
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Series Card
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function SeriesCard({ item, fg, border, cardBg, muted, accent, accentBg, light }:
  { item: Series; fg: string; border: string; cardBg: string; muted: string; accent: string; accentBg: string; light: boolean }) {
  const [hovered, setHovered] = useState(false);

  const statusColors: Record<string, { color: string; bg: string }> = {
    ongoing:  { color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
    complete: { color: '#2563eb', bg: 'rgba(37,99,235,0.12)' },
    hiatus:   { color: '#d97706', bg: 'rgba(217,119,6,0.12)' },
  };
  const sc = statusColors[item.status] ?? { color: muted, bg: wa(fg, 0.06) };

  return (
    <Link href={`/admin/series/${item.slug}`}>
      <div
        className="group relative rounded-2xl overflow-hidden border transition-all duration-200"
        style={{
          backgroundColor: cardBg,
          borderColor: hovered ? accent : border,
          transform: hovered ? 'translateY(-3px)' : 'none',
          boxShadow: hovered ? `0 8px 24px ${wa(fg, 0.12)}` : 'none',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Cover image â€” 2:3 ratio */}
        <div className="relative aspect-[2/3] overflow-hidden" style={{ backgroundColor: wa(fg, 0.06) }}>
          {item.cover_url ? (
            <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-8 h-8" style={{ color: wa(fg, 0.2) }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
          )}

          {/* Type badge top-left */}
          <div className="absolute top-1.5 left-1.5">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
              style={{ backgroundColor: item.type==='light-novel' ? 'rgba(37,99,235,0.85)' : 'rgba(124,58,237,0.85)', color: '#fff' }}>
              {item.type === 'light-novel' ? 'LN' : 'WN'}
            </span>
          </div>

          {/* Mature badge */}
          {(item as any).is_mature && (
            <div className="absolute top-1.5 right-1.5">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(220,38,38,0.85)', color: '#fff' }}>18+</span>
            </div>
          )}

          {/* Bottom overlay with stats */}
          <div className="absolute inset-x-0 bottom-0 px-2 py-2" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)' }}>
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
                <span className="text-[10px] font-semibold">{item.chapters_count} ch</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                <span className="text-[10px] font-semibold">{fmtViews(item.views)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card body */}
        <div className="p-2.5">
          <h3 className="text-xs font-bold leading-tight line-clamp-2 mb-1.5" style={{ color: fg }}>{item.title}</h3>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize"
              style={{ color: sc.color, backgroundColor: sc.bg }}>
              {item.status}
            </span>
            {item.genres[0] && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{ color: accent, backgroundColor: accentBg }}>
                {item.genres[0].name}{item.genres.length > 1 ? ` +${item.genres.length-1}` : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Main Page
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function SeriesIndexContent({ series: initialSeries, currentPage, hasMore, search: initialSearch, type: initialType, sort: initialSort, total }: SeriesIndexProps) {
  const { currentTheme } = useTheme();
  const light = isLight(currentTheme.background);
  const fg      = currentTheme.foreground;
  const bg      = currentTheme.background;
  const muted   = wa(fg, 0.45);
  const border  = wa(fg, 0.1);
  const cardBg  = light ? wa(fg, 0.03) : wa(fg, 0.06);
  const accent  = light ? '#b45309' : '#fbbf24';
  const accentBg = light ? 'rgba(217,119,6,0.1)' : 'rgba(251,191,36,0.15)';
  const panelBg = light ? wa(fg, 0.03) : wa(fg, 0.06);

  const [series, setSeries]       = useState<Series[]>(initialSeries);
  const [search, setSearch]       = useState(initialSearch);
  const [type, setType]           = useState(initialType);
  const [sort, setSort]           = useState(initialSort);
  const [loading, setLoading]     = useState(false);
  const [page, setPage]           = useState(currentPage);
  const [hasMoreState, setHasMore]= useState(hasMore);
  const [showModal, setShowModal] = useState(false);
  const [genres, setGenres]       = useState<Genre[]>([]);
  const [nativeLangs, setNativeLangs] = useState<NativeLanguage[]>([]);
  const isFirstRender = useRef(true);

  // Shared fetch function
  const fetchSeries = (params: { search: string; type: string; sort: string; page: number }, append = false) => {
    setLoading(true);
    router.get('/admin/series', params, {
      preserveState: true,
      onSuccess: (p: any) => {
        const newSeries = p.props.series as Series[];
        setSeries(prev => append ? [...prev, ...newSeries] : newSeries);
        setPage(params.page);
        setHasMore(p.props.hasMore);
        setLoading(false);
      },
      onError: () => setLoading(false),
    });
  };

  // Auto-fetch on search/type/sort change (debounced for search, immediate for dropdowns)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const tid = setTimeout(() => fetchSeries({ search, type, sort, page: 1 }), search !== initialSearch ? 400 : 0);
    return () => clearTimeout(tid);
  }, [search, type, sort]);

  const loadMore = () => {
    if (!hasMoreState || loading) return;
    fetchSeries({ search, type, sort, page: page + 1 }, true);
  };

  const openModal = async () => {
    if (genres.length === 0) {
      const res = await fetch('/admin/series-form-data');
      const data = await res.json();
      setGenres(data.genres);
      setNativeLangs(data.native_languages);
    }
    setShowModal(true);
  };

  const themeProps = { fg, border, cardBg, muted, accent, accentBg, light };

  return (
    <div>
      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: fg }}>Series Management</h1>
          <p className="text-sm mt-1" style={{ color: muted }}>
            {loading ? 'Loadingâ€¦' : `${total} series total`}
          </p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{ backgroundColor: accent, color: bg }}
          onMouseEnter={e=>(e.currentTarget.style.opacity='0.88')}
          onMouseLeave={e=>(e.currentTarget.style.opacity='1')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add New Series
        </button>
      </div>

      {/* â”€â”€ Filters row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <svg className="w-4 h-4" style={{ color: muted }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: `${accent}40`, borderTopColor: accent }} />
            </div>
          )}
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search series by titleâ€¦"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none"
            style={{ backgroundColor: cardBg, color: fg, border: `1px solid ${border}` }}
            onFocus={e => { e.currentTarget.style.borderColor = accent; }}
            onBlur={e => { e.currentTarget.style.borderColor = border; }}
          />
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: panelBg, border: `1px solid ${border}` }}>
          {[{label:'All Types', value:''},{label:'Web Novel', value:'web-novel'},{label:'Light Novel', value:'light-novel'}].map(opt => (
            <button key={opt.value} onClick={() => setType(opt.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ backgroundColor: type===opt.value ? accent : 'transparent', color: type===opt.value ? bg : muted }}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: panelBg, border: `1px solid ${border}` }}>
          {[{label:'Newest', value:'newest'},{label:'Oldest', value:'oldest'},{label:'Views', value:'views'},{label:'Chapters', value:'chapters'}].map(opt => (
            <button key={opt.value} onClick={() => setSort(opt.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ backgroundColor: sort===opt.value ? accent : 'transparent', color: sort===opt.value ? bg : muted }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* â”€â”€ Grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {series.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: muted }}>
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
          <p className="text-sm font-medium">{search || type ? 'No series match your filters' : 'No series yet'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3">
          {series.map(item => (
            <SeriesCard key={item.id} item={item} {...themeProps} />
          ))}
        </div>
      )}

      {/* â”€â”€ Load More â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {hasMoreState && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={loadMore} disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold border transition-all"
            style={{ color: fg, borderColor: border, backgroundColor: cardBg }}
            onMouseEnter={e=>(e.currentTarget.style.borderColor=accent)}
            onMouseLeave={e=>(e.currentTarget.style.borderColor=border)}
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: `${accent}40`, borderTopColor: accent }} />Loadingâ€¦</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>Load More</>
            )}
          </button>
        </div>
      )}

      {/* â”€â”€ Add Series Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showModal && (
        <AddSeriesModal
          onClose={() => setShowModal(false)}
          genres={genres} nativeLanguages={nativeLangs}
          bg={bg} {...themeProps}
        />
      )}
    </div>
  );
}

export default function SeriesIndex(props: SeriesIndexProps) {
  return (
    <AdminLayout title="Series Management">
      <Head title="Series Management" />
      <SeriesIndexContent {...props} />
    </AdminLayout>
  );
}
