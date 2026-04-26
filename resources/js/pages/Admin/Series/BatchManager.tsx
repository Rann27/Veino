import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTheme } from '@/Contexts/ThemeContext';

function wa(hex: string, a: number) {
    try {
        const h = hex.replace('#', '');
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        return `rgba(${r},${g},${b},${a})`;
    } catch { return `rgba(0,0,0,${a})`; }
}

interface ChapterRow {
    id: number;
    chapter_number: number;
    volume: number | null;
    chapter_link: string;
    title: string;
    is_premium: boolean;
    // local edit state
    _number: string;
    _volume: string;
    _title: string;
    _premium: boolean;
    _dirty: boolean;
    _deleted: boolean;
}

interface Props {
    series: { id: number; title: string; slug: string };
    chapters: {
        id: number;
        chapter_number: number;
        volume: number | null;
        chapter_link: string;
        title: string;
        is_premium: boolean;
    }[];
}

function fmtNum(n: number | null | undefined): string {
    if (n === null || n === undefined) return '';
    const s = Number(n).toFixed(2);
    return s.replace(/\.?0+$/, '');
}

function BatchManagerContent({ series, chapters: initialChapters }: Props) {
    const { currentTheme } = useTheme();
    const fg      = currentTheme.foreground;
    const border  = wa(fg, 0.12);
    const cardBg  = wa(fg, 0.05);
    const panelBg = wa(fg, 0.08);
    const muted   = wa(fg, 0.45);
    const accent  = '#7c3aed';
    const danger  = '#ef4444';
    const success = '#22c55e';

    const [rows, setRows] = useState<ChapterRow[]>(() =>
        initialChapters.map(c => ({
            ...c,
            _number:  fmtNum(c.chapter_number),
            _volume:  fmtNum(c.volume),
            _title:   c.title,
            _premium: c.is_premium,
            _dirty:   false,
            _deleted: false,
        }))
    );

    const [saving, setSaving]   = useState(false);
    const [alert, setAlert]     = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const [search, setSearch]   = useState('');

    const update = (id: number, field: keyof ChapterRow, value: string | boolean) => {
        setRows(prev => prev.map(r =>
            r.id === id ? { ...r, [field]: value, _dirty: true } : r
        ));
    };

    const toggleDelete = (id: number) => {
        setRows(prev => prev.map(r =>
            r.id === id ? { ...r, _deleted: !r._deleted, _dirty: true } : r
        ));
    };

    const dirtyCount   = rows.filter(r => r._dirty && !r._deleted).length;
    const deletedCount = rows.filter(r => r._deleted).length;

    const csrfHeaders = (): Record<string, string> => {
        const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
        if (match) return { 'X-XSRF-TOKEN': decodeURIComponent(match[1]) };
        return { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' };
    };

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        setAlert(null);

        const toUpdate = rows.filter(r => r._dirty && !r._deleted);
        const toDelete = rows.filter(r => r._deleted).map(r => r.id);

        try {
            // Batch update
            if (toUpdate.length) {
                const res = await fetch(route('admin.chapters.batch-update', { series: series.slug }), {
                    method:  'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept':       'application/json',
                        ...csrfHeaders(),
                    },
                    body: JSON.stringify({
                        chapters: toUpdate.map(r => ({
                            id:             r.id,
                            title:          r._title,
                            chapter_number: parseFloat(r._number) || r.chapter_number,
                            volume:         r._volume !== '' ? parseFloat(r._volume) : null,
                            is_premium:     r._premium,
                        })),
                    }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.message ?? 'Update failed');
            }

            // Delete chapters
            for (const id of toDelete) {
                await fetch(route('admin.chapters.destroy', { chapter: id }), {
                    method:  'DELETE',
                    headers: {
                        'Accept': 'application/json',
                        ...csrfHeaders(),
                    },
                });
            }

            const saved   = toUpdate.length;
            const deleted = toDelete.length;
            setAlert({ type: 'success', msg: `Saved: ${saved} updated, ${deleted} deleted.` });

            // Remove deleted rows and mark remaining as clean
            setRows(prev => prev
                .filter(r => !r._deleted)
                .map(r => ({ ...r, _dirty: false }))
            );
        } catch (e: any) {
            setAlert({ type: 'error', msg: e.message ?? 'Save failed.' });
        } finally {
            setSaving(false);
        }
    };

    const visible = rows.filter(r =>
        !search || r._title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <Head title={`Batch Manager – ${series.title}`} />

            <div className="p-6 max-w-5xl mx-auto space-y-5">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm" style={{ color: muted }}>
                    <button onClick={() => router.visit(route('admin.series.index'))} className="hover:underline">Series</button>
                    <span>/</span>
                    <button onClick={() => router.visit(route('admin.series.show', { series: series.slug }))} className="hover:underline">{series.title}</button>
                    <span>/</span>
                    <span style={{ color: fg }}>Batch Manager</span>
                </nav>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: fg }}>Batch Chapter Manager</h1>
                        <p className="text-xs mt-0.5" style={{ color: muted }}>
                            {rows.length} chapters · {dirtyCount} edited · {deletedCount} marked for deletion
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving || (dirtyCount === 0 && deletedCount === 0)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity disabled:opacity-40"
                        style={{ backgroundColor: accent, color: '#fff' }}
                    >
                        {saving ? (
                            <>
                                <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin" style={{ borderColor: '#ffffff30', borderTopColor: '#fff' }} />
                                Saving…
                            </>
                        ) : (
                            <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                                Save Changes
                            </>
                        )}
                    </button>
                </div>

                {alert && (
                    <div className="p-3 rounded-xl text-sm font-medium" style={{
                        backgroundColor: alert.type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                        color: alert.type === 'success' ? success : danger,
                        border: `1px solid ${alert.type === 'success' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    }}>
                        {alert.msg}
                    </div>
                )}

                {/* Search */}
                <input
                    type="text"
                    placeholder="Search chapters…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: cardBg, color: fg, border: `1px solid ${border}` }}
                />

                {/* Table */}
                <div className="rounded-2xl overflow-hidden border" style={{ borderColor: border, backgroundColor: cardBg }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ backgroundColor: panelBg }}>
                                    {['Vol', 'Ch #', 'Title', 'Premium', 'Link', ''].map(h => (
                                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold" style={{ color: muted }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map(row => (
                                    <tr
                                        key={row.id}
                                        className="border-t transition-colors"
                                        style={{
                                            borderColor:     border,
                                            backgroundColor: row._deleted ? 'rgba(239,68,68,0.08)' : row._dirty ? 'rgba(124,58,237,0.05)' : 'transparent',
                                            opacity:         row._deleted ? 0.6 : 1,
                                        }}
                                    >
                                        {/* Volume */}
                                        <td className="px-3 py-2">
                                            <input
                                                type="number" step="0.01" min="0"
                                                placeholder="—"
                                                value={row._volume}
                                                disabled={row._deleted}
                                                onChange={e => update(row.id, '_volume', e.target.value)}
                                                className="w-16 px-2 py-1 rounded-lg text-xs outline-none disabled:opacity-50"
                                                style={{ backgroundColor: panelBg, color: fg, border: `1px solid ${border}` }}
                                            />
                                        </td>
                                        {/* Chapter number */}
                                        <td className="px-3 py-2">
                                            <input
                                                type="number" step="0.01" min="0"
                                                value={row._number}
                                                disabled={row._deleted}
                                                onChange={e => update(row.id, '_number', e.target.value)}
                                                className="w-20 px-2 py-1 rounded-lg text-xs outline-none disabled:opacity-50"
                                                style={{ backgroundColor: panelBg, color: fg, border: `1px solid ${border}` }}
                                            />
                                        </td>
                                        {/* Title */}
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={row._title}
                                                disabled={row._deleted}
                                                onChange={e => update(row.id, '_title', e.target.value)}
                                                className="w-full min-w-[200px] px-2 py-1 rounded-lg text-xs outline-none disabled:opacity-50"
                                                style={{ backgroundColor: panelBg, color: fg, border: `1px solid ${border}` }}
                                            />
                                        </td>
                                        {/* Premium toggle */}
                                        <td className="px-3 py-2">
                                            <button
                                                type="button"
                                                disabled={row._deleted}
                                                onClick={() => update(row.id, '_premium', !row._premium)}
                                                className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50"
                                                style={{ backgroundColor: row._premium ? accent : wa(fg, 0.2) }}
                                            >
                                                <span className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                                                    style={{ transform: row._premium ? 'translateX(18px)' : 'translateX(3px)', display: 'inline-block' }} />
                                            </button>
                                        </td>
                                        {/* Chapter link (read-only) */}
                                        <td className="px-3 py-2">
                                            <code className="text-xs" style={{ color: muted }}>{row.chapter_link}</code>
                                        </td>
                                        {/* Delete toggle */}
                                        <td className="px-3 py-2">
                                            <button
                                                onClick={() => toggleDelete(row.id)}
                                                className="p-1 rounded-lg hover:opacity-70 transition-opacity text-xs font-semibold"
                                                style={{ color: row._deleted ? accent : danger }}
                                                title={row._deleted ? 'Undo delete' : 'Mark for deletion'}
                                            >
                                                {row._deleted ? (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {visible.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-10 text-center text-sm" style={{ color: muted }}>
                                            No chapters found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <p className="text-xs" style={{ color: muted }}>
                    Rows highlighted in purple have unsaved changes. Red rows are marked for deletion.
                    Click <strong>Save Changes</strong> to apply all edits.
                </p>
            </div>
        </>
    );
}

export default function BatchManager(props: Props) {
    return (
        <AdminLayout title={props.series.title}>
            <BatchManagerContent {...props} />
        </AdminLayout>
    );
}
