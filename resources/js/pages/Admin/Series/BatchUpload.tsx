import { useState, useRef, useCallback, lazy, Suspense } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTheme } from '@/Contexts/ThemeContext';

const RichTextEditor = lazy(() => import('@/Components/RichTextEditor'));

function wa(hex: string, a: number) {
    try {
        const h = hex.replace('#', '');
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        return `rgba(${r},${g},${b},${a})`;
    } catch { return `rgba(0,0,0,${a})`; }
}
function stripHtml(html: string) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}
function fmtNum(n: number | null | undefined) {
    if (n == null) return '';
    return Number(n).toFixed(2).replace(/\.?0+$/, '');
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface ParsedRow {
    filename: string;
    title: string;
    content: string;
    chapter_number: string;
    volume: string;
    is_premium: boolean;
}

interface CreatedChapter {
    id: number;
    title: string;
    chapter_number: number;
    volume: number | null;
    chapter_link: string;
    is_premium: boolean;
    // edit state
    _number: string;
    _volume: string;
    _title: string;
    _premium: boolean;
    _dirty: boolean;
}

interface Props {
    series: { id: number; title: string; slug: string };
}

// ── Inner component (must be inside AdminLayout so ThemeProvider is available) ─
function BatchUploadContent({ series }: Props) {
    const { currentTheme } = useTheme();
    const fg      = currentTheme.foreground;
    const border  = wa(fg, 0.12);
    const cardBg  = wa(fg, 0.05);
    const panelBg = wa(fg, 0.08);
    const muted   = wa(fg, 0.45);
    const accent  = '#7c3aed';
    const success = '#22c55e';
    const danger  = '#ef4444';

    // ── Phase 1: upload state ──────────────────────────────────────────────────
    const [phase, setPhase]           = useState<'upload' | 'review'>('upload');
    const [rows, setRows]             = useState<ParsedRow[]>([]);
    const [parsing, setParsing]       = useState(false);
    const [uploading, setUploading]   = useState(false);
    const [dragover, setDragover]     = useState(false);
    const [alert, setAlert]           = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const fileInputRef                = useRef<HTMLInputElement>(null);

    // ── Content editor modal ───────────────────────────────────────────────────
    const [editingIdx, setEditingIdx]         = useState<number | null>(null);
    const [editingContent, setEditingContent] = useState('');
    const [showModal, setShowModal]           = useState(false);

    // ── Phase 2: review state ──────────────────────────────────────────────────
    const [created, setCreated]   = useState<CreatedChapter[]>([]);
    const [saving, setSaving]     = useState(false);
    const [reviewAlert, setReviewAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    // Read CSRF from XSRF-TOKEN cookie (always fresh); fallback to meta tag.
    const csrfHeaders = (): Record<string, string> => {
        const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
        if (match) return { 'X-XSRF-TOKEN': decodeURIComponent(match[1]) };
        return { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' };
    };

    const [parseProgress, setParseProgress] = useState<{ done: number; total: number } | null>(null);

    // ── File handling ──────────────────────────────────────────────────────────
    // Files are sent one-by-one to avoid WAF/ModSecurity blocking large payloads.
    const handleFiles = useCallback(async (files: FileList | File[]) => {
        const docxFiles = Array.from(files).filter(f => f.name.endsWith('.docx'));
        if (!docxFiles.length) return;
        setParsing(true);
        setAlert(null);
        setParseProgress({ done: 0, total: docxFiles.length });

        const parseUrl = route('admin.api.batch.parse-docx');
        const failed: string[] = [];

        for (let i = 0; i < docxFiles.length; i++) {
            const f = docxFiles[i];
            try {
                const buf = await f.arrayBuffer();
                let binary = '';
                new Uint8Array(buf).forEach(b => { binary += String.fromCharCode(b); });
                const encoded = btoa(binary);

                const res = await fetch(parseUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...csrfHeaders() },
                    body: JSON.stringify({ files: [{ filename: f.name, content: encoded }] }),
                });

                if (!res.ok) {
                    const txt = await res.text();
                    failed.push(`${f.name}: Server ${res.status}`);
                    continue;
                }

                const data = await res.json() as { filename: string; title?: string; content?: string; error?: string }[];
                const item = data[0];
                if (item?.error) {
                    failed.push(`${f.name}: ${item.error}`);
                } else if (item) {
                    setRows(prev => [...prev, {
                        filename: item.filename ?? '',
                        title: item.title ?? '',
                        content: item.content ?? '',
                        chapter_number: '',
                        volume: '',
                        is_premium: false,
                    }]);
                }
            } catch (e: any) {
                failed.push(`${f.name}: ${String(e?.message ?? e)}`);
            }

            setParseProgress({ done: i + 1, total: docxFiles.length });
        }

        if (failed.length) {
            setAlert({ type: 'error', msg: `${failed.length} file(s) failed:\n${failed.join('\n')}` });
        }

        setParsing(false);
        setParseProgress(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    // ── Upload all ─────────────────────────────────────────────────────────────
    const handleUpload = async () => {
        if (!rows.length || uploading) return;
        setUploading(true);
        setAlert(null);
        try {
            const res  = await fetch(route('admin.chapters.batch-store', { series: series.slug }), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...csrfHeaders() },
                body: JSON.stringify({ chapters: rows.map(r => ({
                    title: r.title, content: r.content,
                    is_premium: r.is_premium,
                    chapter_number: r.chapter_number,
                    volume: r.volume,
                })) }),
            });
            const data = await res.json();
            if (data.success) {
                // Transition to review phase with created chapters
                const reviewRows: CreatedChapter[] = (data.created as any[]).map((c: any) => ({
                    ...c,
                    _number:  fmtNum(c.chapter_number),
                    _volume:  fmtNum(c.volume),
                    _title:   c.title,
                    _premium: c.is_premium ?? false,
                    _dirty:   false,
                }));
                setCreated(reviewRows);
                setRows([]);
                setPhase('review');
            } else {
                setAlert({ type: 'error', msg: data.message ?? 'Upload failed.' });
            }
        } catch {
            setAlert({ type: 'error', msg: 'Network error during upload.' });
        } finally {
            setUploading(false);
        }
    };

    // ── Review: save changes ───────────────────────────────────────────────────
    const handleSaveReview = async () => {
        const dirty = created.filter(c => c._dirty);
        if (!dirty.length || saving) return;
        setSaving(true);
        setReviewAlert(null);
        try {
            const res = await fetch(route('admin.chapters.batch-update', { series: series.slug }), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...csrfHeaders() },
                body: JSON.stringify({ chapters: dirty.map(c => ({
                    id: c.id,
                    title: c._title,
                    chapter_number: parseFloat(c._number) || c.chapter_number,
                    volume: c._volume !== '' ? parseFloat(c._volume) : null,
                    is_premium: c._premium,
                })) }),
            });
            const data = await res.json();
            if (data.success) {
                setReviewAlert({ type: 'success', msg: `${dirty.length} chapter(s) updated.` });
                setCreated(prev => prev.map(c => ({ ...c, _dirty: false })));
            } else {
                setReviewAlert({ type: 'error', msg: data.message ?? 'Save failed.' });
            }
        } catch {
            setReviewAlert({ type: 'error', msg: 'Network error.' });
        } finally {
            setSaving(false);
        }
    };

    const updateRow     = (idx: number, field: keyof ParsedRow, val: string | boolean) =>
        setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
    const updateCreated = (id: number, field: keyof CreatedChapter, val: string | boolean) =>
        setCreated(prev => prev.map(c => c.id === id ? { ...c, [field]: val, _dirty: true } : c));
    const openEditor = (idx: number) => {
        setEditingIdx(idx);
        setEditingContent(rows[idx].content);
        setShowModal(true);
    };
    const saveEditor = () => {
        if (editingIdx !== null) updateRow(editingIdx, 'content', editingContent);
        setShowModal(false);
        setEditingIdx(null);
    };

    const inputCls = "px-2 py-1 rounded-lg text-xs outline-none";
    const inputStyle = { backgroundColor: panelBg, color: fg, border: `1px solid ${border}` };

    return (
        <>
            <Head title={`Batch Upload – ${series.title}`} />

            <div className="p-6 max-w-6xl mx-auto space-y-6">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm" style={{ color: muted }}>
                    <button onClick={() => router.visit(route('admin.series.index'))} className="hover:underline">Series</button>
                    <span>/</span>
                    <button onClick={() => router.visit(route('admin.series.show', { series: series.slug }))} className="hover:underline">{series.title}</button>
                    <span>/</span>
                    <span style={{ color: fg }}>Batch Upload</span>
                </nav>

                {/* Step indicator */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: phase === 'upload' ? accent : success, color: '#fff' }}>
                            {phase === 'review' ? '✓' : '1'}
                        </div>
                        <span className="text-sm font-semibold" style={{ color: phase === 'upload' ? fg : muted }}>Upload</span>
                    </div>
                    <div className="h-px w-8" style={{ backgroundColor: border }} />
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: phase === 'review' ? accent : wa(fg, 0.15), color: phase === 'review' ? '#fff' : muted }}>
                            2
                        </div>
                        <span className="text-sm font-semibold" style={{ color: phase === 'review' ? fg : muted }}>Review</span>
                    </div>
                </div>

                {/* ── PHASE 1: UPLOAD ── */}
                {phase === 'upload' && (
                    <>
                        <h1 className="text-xl font-bold" style={{ color: fg }}>Batch Upload Chapters</h1>

                        {alert && (
                            <div className="p-3 rounded-xl text-sm font-medium whitespace-pre-wrap" style={{
                                backgroundColor: alert.type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                                color: alert.type === 'success' ? success : danger,
                                border: `1px solid ${alert.type === 'success' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                            }}>{alert.msg}</div>
                        )}

                        {/* Drop zone */}
                        <div
                            className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
                            style={{
                                borderColor: dragover ? accent : border,
                                backgroundColor: dragover ? wa(accent, 0.05) : cardBg,
                                padding: '48px 24px',
                            }}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={e => { e.preventDefault(); setDragover(true); }}
                            onDragLeave={() => setDragover(false)}
                            onDrop={e => { e.preventDefault(); setDragover(false); handleFiles(e.dataTransfer.files); }}
                        >
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ color: muted }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                            </svg>
                            <div className="text-center">
                                <p className="font-semibold text-sm" style={{ color: fg }}>
                                    {parsing
                                        ? parseProgress
                                            ? `Parsing ${parseProgress.done}/${parseProgress.total}…`
                                            : 'Parsing files…'
                                        : 'Drop .docx files here, or click to browse'}
                                </p>
                                <p className="text-xs mt-1" style={{ color: muted }}>Supports multiple .docx files at once</p>
                            </div>
                            {parsing && <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: `${accent}30`, borderTopColor: accent }} />}
                            <input ref={fileInputRef} type="file" accept=".docx" multiple hidden
                                onChange={e => e.target.files && handleFiles(e.target.files)} />
                        </div>

                        {/* Preview table */}
                        {rows.length > 0 && (
                            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: border, backgroundColor: cardBg }}>
                                <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: border }}>
                                    <span className="font-semibold text-sm" style={{ color: fg }}>
                                        {rows.length} chapter{rows.length !== 1 ? 's' : ''} ready
                                    </span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setRows([])}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-70 transition-opacity"
                                            style={{ backgroundColor: wa(fg, 0.1), color: fg }}>
                                            Clear All
                                        </button>
                                        <button onClick={handleUpload} disabled={uploading}
                                            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-opacity disabled:opacity-50"
                                            style={{ backgroundColor: accent, color: '#fff' }}>
                                            {uploading ? 'Uploading…' : `Upload All (${rows.length})`}
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr style={{ backgroundColor: panelBg }}>
                                                {['#', 'Title', 'Content Preview', 'Ch No.', 'Vol', 'Premium', ''].map(h => (
                                                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold" style={{ color: muted }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((row, i) => (
                                                <tr key={i} className="border-t" style={{ borderColor: border }}>
                                                    <td className="px-3 py-2 text-xs" style={{ color: muted }}>{i + 1}</td>
                                                    <td className="px-3 py-2">
                                                        <input value={row.title} onChange={e => updateRow(i, 'title', e.target.value)}
                                                            className={`w-full min-w-[160px] ${inputCls}`} style={inputStyle} />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <button onClick={() => openEditor(i)}
                                                            className="text-xs hover:underline truncate block max-w-[180px] text-left"
                                                            style={{ color: accent }}>
                                                            {stripHtml(row.content).substring(0, 55)}…
                                                        </button>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input type="number" step="0.01" min="0" placeholder="Auto"
                                                            value={row.chapter_number} onChange={e => updateRow(i, 'chapter_number', e.target.value)}
                                                            className={`w-20 ${inputCls}`} style={inputStyle} />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input type="number" step="0.01" min="0" placeholder="—"
                                                            value={row.volume} onChange={e => updateRow(i, 'volume', e.target.value)}
                                                            className={`w-16 ${inputCls}`} style={inputStyle} />
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <button type="button" onClick={() => updateRow(i, 'is_premium', !row.is_premium)}
                                                            className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                                                            style={{ backgroundColor: row.is_premium ? accent : wa(fg, 0.2) }}>
                                                            <span className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                                                                style={{ transform: row.is_premium ? 'translateX(18px)' : 'translateX(3px)', display: 'inline-block' }} />
                                                        </button>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <button onClick={() => setRows(prev => prev.filter((_, j) => j !== i))}
                                                            className="p-1 rounded-lg hover:opacity-70 transition-opacity" style={{ color: danger }}>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ── PHASE 2: REVIEW ── */}
                {phase === 'review' && (
                    <>
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-bold" style={{ color: fg }}>Review Uploaded Chapters</h1>
                                <p className="text-xs mt-0.5" style={{ color: muted }}>
                                    {created.length} chapter{created.length !== 1 ? 's' : ''} uploaded. Fine-tune numbering or titles if needed.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveReview}
                                    disabled={saving || !created.some(c => c._dirty)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity disabled:opacity-40"
                                    style={{ backgroundColor: accent, color: '#fff' }}>
                                    {saving ? 'Saving…' : 'Save Changes'}
                                </button>
                                <button
                                    onClick={() => router.visit(route('admin.series.show', { series: series.slug }))}
                                    className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-70 transition-opacity"
                                    style={{ backgroundColor: wa(fg, 0.1), color: fg }}>
                                    Done
                                </button>
                            </div>
                        </div>

                        {reviewAlert && (
                            <div className="p-3 rounded-xl text-sm font-medium" style={{
                                backgroundColor: reviewAlert.type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                                color: reviewAlert.type === 'success' ? success : danger,
                                border: `1px solid ${reviewAlert.type === 'success' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                            }}>{reviewAlert.msg}</div>
                        )}

                        <div className="rounded-2xl overflow-hidden border" style={{ borderColor: border, backgroundColor: cardBg }}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr style={{ backgroundColor: panelBg }}>
                                            {['Vol', 'Ch #', 'Title', 'Premium', 'Link'].map(h => (
                                                <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold" style={{ color: muted }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {created.map(c => (
                                            <tr key={c.id} className="border-t transition-colors"
                                                style={{ borderColor: border, backgroundColor: c._dirty ? 'rgba(124,58,237,0.05)' : 'transparent' }}>
                                                <td className="px-3 py-2">
                                                    <input type="number" step="0.01" min="0" placeholder="—"
                                                        value={c._volume} onChange={e => updateCreated(c.id, '_volume', e.target.value)}
                                                        className={`w-16 ${inputCls}`} style={inputStyle} />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input type="number" step="0.01" min="0"
                                                        value={c._number} onChange={e => updateCreated(c.id, '_number', e.target.value)}
                                                        className={`w-20 ${inputCls}`} style={inputStyle} />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input type="text"
                                                        value={c._title} onChange={e => updateCreated(c.id, '_title', e.target.value)}
                                                        className={`w-full min-w-[200px] ${inputCls}`} style={inputStyle} />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <button type="button" onClick={() => updateCreated(c.id, '_premium', !c._premium)}
                                                        className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                                                        style={{ backgroundColor: c._premium ? accent : wa(fg, 0.2) }}>
                                                        <span className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                                                            style={{ transform: c._premium ? 'translateX(18px)' : 'translateX(3px)', display: 'inline-block' }} />
                                                    </button>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <code className="text-xs" style={{ color: muted }}>{c.chapter_link}</code>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Content editor modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                    <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
                        style={{ backgroundColor: currentTheme.background, border: `1px solid ${border}` }}>
                        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: border }}>
                            <h3 className="font-bold text-base" style={{ color: fg }}>Edit Chapter Content</h3>
                            <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:opacity-70" style={{ color: muted }}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            <Suspense fallback={<div className="h-64 flex items-center justify-center text-sm" style={{ color: muted }}>Loading editor…</div>}>
                                <RichTextEditor value={editingContent} onChange={setEditingContent} placeholder="Chapter content…" />
                            </Suspense>
                        </div>
                        <div className="flex justify-end gap-3 px-5 py-4 border-t" style={{ borderColor: border }}>
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-70"
                                style={{ backgroundColor: wa(fg, 0.1), color: fg }}>Cancel</button>
                            <button onClick={saveEditor} className="px-4 py-2 rounded-xl text-sm font-bold hover:opacity-85"
                                style={{ backgroundColor: accent, color: '#fff' }}>Save Content</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ── Outer export — wraps with AdminLayout ─────────────────────────────────────
export default function BatchUpload(props: Props) {
    return (
        <AdminLayout title={props.series.title}>
            <BatchUploadContent {...props} />
        </AdminLayout>
    );
}
