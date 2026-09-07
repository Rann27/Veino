import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTheme } from '@/Contexts/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Referrer { type: string; label: string; url: string | null }

interface FileRow {
    path: string;
    disk: string;
    dir: string;
    name: string;
    ext: string;
    size: number;
    modified: number;
    used: boolean;
    used_by: Referrer[];
    used_by_count: number;
    url: string | null;
    hash: string | null;
}

interface DirSummary { dir: string; disk: string; files: number; size: number; unused: number; unused_size: number }

interface Props {
    files: FileRow[];
    summary: {
        total_files: number; total_size: number;
        unused_files: number; unused_size: number;
        directories: DirSummary[];
    };
    duplicates: { hash: string; count: number; size: number; wasted: number; files: { path: string; used: boolean; url: string | null }[] }[];
    missing: { path: string; disk: string; used_by: Referrer[]; used_by_count: number }[];
    scannedAt: string;
    trash: { id: number; original_path: string; size: number; deleted_at: string; expires_at: string; deleted_by: string | null }[];
    trashSize: number;
    retentionDays: number;
    diskUsage: { free: number | null; total: number | null };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const human = (b: number) => {
    if (b >= 1073741824) return `${(b / 1073741824).toFixed(2)} GB`;
    if (b >= 1048576) return `${(b / 1048576).toFixed(2)} MB`;
    if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${b} B`;
};

const when = (unix: number) => new Date(unix * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
const whenIso = (iso: string) => new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'bmp'];

type Tab = 'files' | 'duplicates' | 'missing' | 'trash';
type Filter = 'all' | 'unused' | 'used';
type SortKey = 'name' | 'size' | 'modified' | 'used';
type SortDir = 'asc' | 'desc';

/** Which way round each column starts, so the first click gives the useful order. */
const FIRST_DIR: Record<SortKey, SortDir> = {
    name: 'asc',        // A→Z
    size: 'desc',       // biggest first — the ones worth reclaiming
    modified: 'desc',   // newest first
    used: 'asc',        // unused first
};

// useTheme() only works below AdminLayout, which is what mounts the
// ThemeProvider — hence the split into a thin wrapper and this content
// component. Calling the hook in the wrapper throws before anything renders.
function StorageContent(props: Props) {
    const { files, summary, duplicates, missing, scannedAt, trash, trashSize, retentionDays, diskUsage } = props;
    const { currentTheme } = useTheme();

    const fg = currentTheme.foreground;
    const bg = currentTheme.background;
    const light = currentTheme.name?.toLowerCase().includes('light') ?? false;
    const cardBg = light ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)';
    const border = `${fg}15`;
    const muted = `${fg}70`;

    const [tab, setTab] = useState<Tab>('files');
    const [dir, setDir] = useState<string>('all');
    const [filter, setFilter] = useState<Filter>('unused');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [expanded, setExpanded] = useState<string | null>(null);
    const [sortKey, setSortKey] = useState<SortKey>('size');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [busy, setBusy] = useState(false);

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        const rows = files
            .filter(f => dir === 'all' || f.dir === dir)
            .filter(f => filter === 'all' || (filter === 'unused' ? !f.used : f.used))
            .filter(f => !q || f.name.toLowerCase().includes(q) || f.used_by.some(u => u.label.toLowerCase().includes(q)));

        const sign = sortDir === 'asc' ? 1 : -1;

        return rows.sort((a, b) => {
            switch (sortKey) {
                // localeCompare so numbers inside filenames order the way a
                // human reads them, rather than by raw code point.
                case 'name': return sign * a.name.localeCompare(b.name, undefined, { numeric: true });
                case 'modified': return sign * (a.modified - b.modified);
                // Falls back to size so the two status groups stay useful inside.
                case 'used': return sign * (Number(a.used) - Number(b.used)) || b.size - a.size;
                default: return sign * (a.size - b.size);
            }
        });
    }, [files, dir, filter, search, sortKey, sortDir]);

    // Re-clicking a column flips it; moving to a new one starts at that
    // column's most useful direction instead of always ascending.
    const sortBy = (key: SortKey) => {
        if (key === sortKey) {
            setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir(FIRST_DIR[key]);
        }
    };

    // Only unused files can ever be selected, so a stale selection can never
    // become a delete request for something that is in use.
    const selectableVisible = useMemo(() => visible.filter(f => !f.used), [visible]);
    const selectedSize = useMemo(
        () => files.filter(f => selected.has(f.path)).reduce((n, f) => n + f.size, 0),
        [files, selected]
    );

    const toggle = (path: string, used: boolean) => {
        if (used) return;
        setSelected(prev => {
            const next = new Set(prev);
            next.has(path) ? next.delete(path) : next.add(path);
            return next;
        });
    };

    const toggleAll = () => {
        const all = selectableVisible.every(f => selected.has(f.path));
        setSelected(prev => {
            const next = new Set(prev);
            selectableVisible.forEach(f => (all ? next.delete(f.path) : next.add(f.path)));
            return next;
        });
    };

    const doDelete = () => {
        if (selected.size === 0) return;
        if (!confirm(
            `Move ${selected.size} file(s) (${human(selectedSize)}) to quarantine?\n\n` +
            `They stay recoverable for ${retentionDays} days before being deleted for good.`
        )) return;

        setBusy(true);
        router.delete(route('admin.storage.destroy'), {
            data: { paths: Array.from(selected) },
            preserveScroll: true,
            onSuccess: () => setSelected(new Set()),
            onFinish: () => setBusy(false),
        });
    };

    const doRestore = (ids: number[]) => {
        setBusy(true);
        router.post(route('admin.storage.restore'), { ids }, { preserveScroll: true, onFinish: () => setBusy(false) });
    };

    const doPurge = (all: boolean) => {
        if (!confirm(all
            ? 'Permanently delete every quarantined file? This cannot be undone.'
            : `Permanently delete quarantined files older than ${retentionDays} days?`)) return;
        setBusy(true);
        router.delete(route('admin.storage.purge'), { data: { all }, preserveScroll: true, onFinish: () => setBusy(false) });
    };

    const card: React.CSSProperties = { background: cardBg, border: `1px solid ${border}`, borderRadius: 14 };

    return (
        <div className="space-y-5">
            {/* ── Header ── */}
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: fg }}>Storage Manager</h1>
                    <p className="text-sm mt-1" style={{ color: muted }}>
                        Scanned {new Date(scannedAt).toLocaleString()} · every chapter body, cover, and the homepage
                        banner file were checked for references.
                    </p>
                </div>
                <button
                    onClick={() => router.get(route('admin.storage.index'), { refresh: 1 }, { preserveScroll: true })}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: cardBg, color: fg, border: `1px solid ${border}` }}>
                    ↻ Rescan
                </button>
            </div>

            {/* ── Stat tiles ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Files tracked', value: String(summary.total_files), sub: human(summary.total_size) },
                    { label: 'Not referenced', value: String(summary.unused_files), sub: `${human(summary.unused_size)} reclaimable`, accent: '#f59e0b' },
                    { label: 'In quarantine', value: String(trash.length), sub: human(trashSize), accent: trash.length ? '#8b5cf6' : undefined },
                    {
                        label: 'Broken references', value: String(missing.length),
                        sub: missing.length ? 'files missing from disk' : 'none',
                        accent: missing.length ? '#ef4444' : '#22c55e',
                    },
                ].map(t => (
                    <div key={t.label} style={card} className="p-4">
                        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: muted }}>{t.label}</p>
                        <p className="text-2xl font-extrabold mt-1" style={{ color: t.accent ?? fg }}>{t.value}</p>
                        <p className="text-xs mt-0.5" style={{ color: muted }}>{t.sub}</p>
                    </div>
                ))}
            </div>

            {diskUsage.total && diskUsage.free && (
                <p className="text-xs" style={{ color: muted }}>
                    Server disk: {human(diskUsage.total - diskUsage.free)} used of {human(diskUsage.total)} · {human(diskUsage.free)} free
                </p>
            )}

            {/* ── Tabs ── */}
            <div className="flex flex-wrap gap-2">
                {([
                    ['files', `Files (${files.length})`],
                    ['duplicates', `Duplicates (${duplicates.length})`],
                    ['missing', `Broken (${missing.length})`],
                    ['trash', `Quarantine (${trash.length})`],
                ] as [Tab, string][]).map(([id, label]) => (
                    <button key={id} onClick={() => setTab(id)}
                        className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{
                            background: tab === id ? `${fg}12` : 'transparent',
                            color: tab === id ? fg : muted,
                            border: `1px solid ${tab === id ? `${fg}25` : border}`,
                        }}>
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Files ── */}
            {tab === 'files' && (
                <>
                    <div style={card} className="p-3 flex flex-wrap items-center gap-2">
                        <select value={dir} onChange={e => setDir(e.target.value)}
                            className="px-3 py-2 rounded-lg text-sm outline-none"
                            style={{ background: bg, color: fg, border: `1px solid ${border}` }}>
                            <option value="all">All directories ({summary.total_files})</option>
                            {summary.directories.map(d => (
                                <option key={d.dir} value={d.dir}>{d.dir} — {d.files} files, {d.unused} unused</option>
                            ))}
                        </select>

                        <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${border}` }}>
                            {(['unused', 'used', 'all'] as Filter[]).map(f => (
                                <button key={f} onClick={() => setFilter(f)}
                                    className="px-3 py-2 text-sm font-semibold capitalize transition-all"
                                    style={{ background: filter === f ? `${fg}12` : 'transparent', color: filter === f ? fg : muted }}>
                                    {f === 'unused' ? 'Not referenced' : f === 'used' ? 'In use' : 'All'}
                                </button>
                            ))}
                        </div>

                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search filename or referrer…"
                            className="flex-1 min-w-[180px] px-3 py-2 rounded-lg text-sm outline-none"
                            style={{ background: bg, color: fg, border: `1px solid ${border}` }} />

                        <span className="text-sm" style={{ color: muted }}>{visible.length} shown</span>
                    </div>

                    {selected.size > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl"
                            style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.30)' }}>
                            <span className="text-sm font-semibold" style={{ color: fg }}>
                                {selected.size} selected · {human(selectedSize)}
                            </span>
                            <div className="flex gap-2">
                                <button onClick={() => setSelected(new Set())}
                                    className="px-3 py-2 rounded-lg text-sm font-semibold"
                                    style={{ background: 'transparent', color: muted, border: `1px solid ${border}` }}>
                                    Clear
                                </button>
                                <button onClick={doDelete} disabled={busy}
                                    className="px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
                                    style={{ background: '#ef4444' }}>
                                    {busy ? 'Working…' : `Move to quarantine`}
                                </button>
                            </div>
                        </div>
                    )}

                    <div style={card} className="overflow-hidden">
                        <div style={{ overflowX: 'auto' }}>
                            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${border}` }}>
                                        <th className="p-3 w-10">
                                            <input type="checkbox" onChange={toggleAll}
                                                checked={selectableVisible.length > 0 && selectableVisible.every(f => selected.has(f.path))}
                                                disabled={selectableVisible.length === 0} />
                                        </th>
                                        <th className="p-3 text-left text-xs font-bold uppercase tracking-wider"
                                            style={{ color: muted }}>Preview</th>
                                        {([
                                            ['File', 'name'],
                                            ['Size', 'size'],
                                            ['Modified', 'modified'],
                                            ['Status', 'used'],
                                        ] as [string, SortKey][]).map(([label, key]) => {
                                            const active = sortKey === key;
                                            return (
                                                <th key={key} className="p-0 text-left">
                                                    <button onClick={() => sortBy(key)}
                                                        className="w-full flex items-center gap-1 p-3 text-xs font-bold uppercase tracking-wider"
                                                        style={{ color: active ? fg : muted }}
                                                        title={`Sort by ${label.toLowerCase()}`}>
                                                        {label}
                                                        <span aria-hidden style={{ fontSize: 9, opacity: active ? 1 : 0.35 }}>
                                                            {active ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                                                        </span>
                                                    </button>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {visible.map(f => (
                                        <React.Fragment key={f.path}>
                                            <tr style={{ borderBottom: `1px solid ${border}` }}>
                                                <td className="p-3">
                                                    <input type="checkbox" checked={selected.has(f.path)}
                                                        disabled={f.used} onChange={() => toggle(f.path, f.used)}
                                                        title={f.used ? 'In use — cannot be deleted' : undefined} />
                                                </td>
                                                <td className="p-3">
                                                    {f.url && IMAGE_EXT.includes(f.ext) ? (
                                                        <img src={f.url} alt="" loading="lazy"
                                                            className="rounded object-cover"
                                                            style={{ width: 44, height: 44, border: `1px solid ${border}` }} />
                                                    ) : (
                                                        <div className="rounded flex items-center justify-center text-[10px] font-bold uppercase"
                                                            style={{ width: 44, height: 44, background: `${fg}08`, color: muted, border: `1px solid ${border}` }}>
                                                            {f.ext || '?'}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <p className="text-sm font-semibold break-all" style={{ color: fg }}>{f.name}</p>
                                                    <p className="text-xs" style={{ color: muted }}>{f.dir}</p>
                                                </td>
                                                <td className="p-3 text-sm whitespace-nowrap" style={{ color: fg }}>{human(f.size)}</td>
                                                <td className="p-3 text-sm whitespace-nowrap" style={{ color: muted }}>{when(f.modified)}</td>
                                                <td className="p-3">
                                                    {f.used ? (
                                                        <button onClick={() => setExpanded(expanded === f.path ? null : f.path)}
                                                            className="px-2.5 py-1 rounded-full text-xs font-bold"
                                                            style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                                                            In use ({f.used_by_count}) {expanded === f.path ? '▴' : '▾'}
                                                        </button>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                                                            style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                                                            Not referenced
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                            {expanded === f.path && f.used && (
                                                <tr style={{ borderBottom: `1px solid ${border}` }}>
                                                    <td colSpan={6} className="px-3 pb-3" style={{ background: `${fg}04` }}>
                                                        <p className="text-xs font-bold uppercase tracking-wider pt-3 pb-1.5" style={{ color: muted }}>
                                                            Referenced by
                                                        </p>
                                                        <ul className="space-y-1">
                                                            {f.used_by.map((u, i) => (
                                                                <li key={i} className="text-sm">
                                                                    <span className="text-xs px-1.5 py-0.5 rounded mr-2 font-mono"
                                                                        style={{ background: `${fg}0C`, color: muted }}>{u.type}</span>
                                                                    {u.url
                                                                        ? <a href={u.url} className="underline" style={{ color: fg }}>{u.label}</a>
                                                                        : <span style={{ color: fg }}>{u.label}</span>}
                                                                </li>
                                                            ))}
                                                            {f.used_by_count > f.used_by.length && (
                                                                <li className="text-xs" style={{ color: muted }}>
                                                                    …and {f.used_by_count - f.used_by.length} more
                                                                </li>
                                                            )}
                                                        </ul>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                            {visible.length === 0 && (
                                <p className="p-8 text-center text-sm" style={{ color: muted }}>No files match these filters.</p>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ── Duplicates ── */}
            {tab === 'duplicates' && (
                <div style={card} className="p-4 space-y-4">
                    {duplicates.length === 0 && (
                        <p className="text-sm text-center py-6" style={{ color: muted }}>No byte-identical files found.</p>
                    )}
                    {duplicates.map(g => (
                        <div key={g.hash} className="p-3 rounded-xl" style={{ border: `1px solid ${border}` }}>
                            <p className="text-sm font-semibold mb-2" style={{ color: fg }}>
                                {g.count} identical copies · {human(g.size)} each ·{' '}
                                <span style={{ color: '#f59e0b' }}>{human(g.wasted)} wasted</span>
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {g.files.map(f => (
                                    <div key={f.path} className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                                        style={{ background: `${fg}06`, border: `1px solid ${border}` }}>
                                        {f.url && <img src={f.url} alt="" className="rounded" style={{ width: 28, height: 28, objectFit: 'cover' }} />}
                                        <span className="text-xs break-all" style={{ color: fg }}>{f.path}</span>
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                            style={f.used
                                                ? { background: 'rgba(34,197,94,0.12)', color: '#22c55e' }
                                                : { background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                                            {f.used ? 'in use' : 'unused'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Broken references ── */}
            {tab === 'missing' && (
                <div style={card} className="p-4">
                    <p className="text-sm mb-3" style={{ color: muted }}>
                        These paths are referenced by the site but no longer exist on disk — readers see a broken image.
                    </p>
                    {missing.length === 0 && (
                        <p className="text-sm text-center py-6" style={{ color: '#22c55e' }}>✓ Every reference resolves to a real file.</p>
                    )}
                    <ul className="space-y-2">
                        {missing.map(m => (
                            <li key={m.path} className="p-3 rounded-xl" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)' }}>
                                <p className="text-sm font-mono break-all" style={{ color: fg }}>{m.path}</p>
                                <ul className="mt-1.5 space-y-0.5">
                                    {m.used_by.map((u, i) => (
                                        <li key={i} className="text-xs" style={{ color: muted }}>
                                            {u.url ? <a href={u.url} className="underline">{u.label}</a> : u.label}
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ── Quarantine ── */}
            {tab === 'trash' && (
                <div style={card} className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <p className="text-sm" style={{ color: muted }}>
                            Deleted files are held for {retentionDays} days, then removed automatically.
                        </p>
                        {trash.length > 0 && (
                            <div className="flex gap-2">
                                <button onClick={() => doPurge(false)} disabled={busy}
                                    className="px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                                    style={{ background: 'transparent', color: fg, border: `1px solid ${border}` }}>
                                    Purge expired
                                </button>
                                <button onClick={() => doPurge(true)} disabled={busy}
                                    className="px-3 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
                                    style={{ background: '#ef4444' }}>
                                    Empty quarantine
                                </button>
                            </div>
                        )}
                    </div>

                    {trash.length === 0 && (
                        <p className="text-sm text-center py-6" style={{ color: muted }}>Quarantine is empty.</p>
                    )}

                    <ul className="space-y-2">
                        {trash.map(t => (
                            <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl"
                                style={{ border: `1px solid ${border}` }}>
                                <div className="min-w-0">
                                    <p className="text-sm font-mono break-all" style={{ color: fg }}>{t.original_path}</p>
                                    <p className="text-xs" style={{ color: muted }}>
                                        {human(t.size)} · deleted {whenIso(t.deleted_at)}
                                        {t.deleted_by ? ` by ${t.deleted_by}` : ''} · purges {whenIso(t.expires_at)}
                                    </p>
                                </div>
                                <button onClick={() => doRestore([t.id])} disabled={busy}
                                    className="px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                                    style={{ background: `${fg}0C`, color: fg, border: `1px solid ${border}` }}>
                                    Restore
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default function StorageIndex(props: Props) {
    return (
        <AdminLayout title="Storage Manager">
            <Head title="Storage Manager" />
            <StorageContent {...props} />
        </AdminLayout>
    );
}
