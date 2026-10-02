import React, { useState, useEffect, useMemo, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';
import { asTier, isPaidTier, TIER_LABEL, TIER_COLOR, type Tier } from '@/lib/tier';

interface User {
    id: number;
    display_name: string;
    email: string;
    role: string;
    coins: number;
    membership_tier: Tier;
    membership_expires_at: string | null;
    is_banned: boolean;
    created_at: string;
    /** Most recent addresses first, capped server-side. */
    ips: { ip: string; last_seen: string; logins: number }[];
    ip_total: number;
}

interface SharedGroup {
    ip: string;
    accounts: number;
    last_seen: string;
    users: {
        id: number; display_name: string; email: string;
        is_banned: boolean; joined: string; last_seen: string; logins: number;
    }[];
}

interface UsersIndexProps {
    sort: { key: string; dir: 'asc' | 'desc' };
    users: {
        data: User[];
        links: Array<{ url?: string; label: string; active: boolean }>;
    };
    search: string;
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function isLight(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}
function wa(hex: string, a: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function Spinner() {
  return (
    <svg style={{ width: 14, height: 14, animation: 'spin 0.8s linear infinite' }} fill="none" viewBox="0 0 24 24">
      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
    </svg>
  );
}

function UsersIndexContent({ users, search, sort }: UsersIndexProps) {
    const { currentTheme } = useTheme();
    const light   = isLight(currentTheme.background);
    const fg      = currentTheme.foreground;
    const muted   = wa(fg, 0.45);
    const border  = wa(fg, 0.12);
    const cardBg  = light ? wa(fg, 0.03) : wa(fg, 0.06);
    const panelBg = light ? wa(fg, 0.06) : wa(fg, 0.09);
    const inputBg = light ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)';

    const [searchTerm, setSearchTerm] = useState(search || '');
    const [showMembershipModal, setShowMembershipModal] = useState(false);
    const [showCoinModal, setShowCoinModal] = useState(false);
    const [coinModalType, setCoinModalType] = useState<'add' | 'deduct'>('add');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [durationDays, setDurationDays] = useState('');
    const [grantTier, setGrantTier] = useState<'premium' | 'exclusive'>('premium');
    type SortKey = 'user' | 'email' | 'role' | 'coins' | 'membership' | 'status' | 'joined';
    const sortKey = (sort?.key ?? 'joined') as SortKey;
    const sortDir = sort?.dir ?? 'desc';

    // Each column opens in the direction it is normally read: names A→Z, but
    // coins and join date newest/biggest first.
    const FIRST_DIR: Record<SortKey, 'asc' | 'desc'> = {
        user: 'asc', email: 'asc', role: 'asc',
        coins: 'desc', membership: 'desc', status: 'asc', joined: 'desc',
    };

    // Re-queries instead of reshuffling the loaded page, so the ordering holds
    // across all pages rather than only the twenty rows on screen.
    const toggleSort = (key: SortKey) => {
        const dir = key === sortKey ? (sortDir === 'asc' ? 'desc' : 'asc') : FIRST_DIR[key];
        router.get('/admin/user-management', { search: searchTerm, sort: key, dir }, { preserveState: true, replace: true });
    };

    const [coinAmount, setCoinAmount] = useState('');
    const [coinReason, setCoinReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showBanModal, setShowBanModal] = useState(false);
    const [banReason, setBanReason] = useState('');
    const [showSharedModal, setShowSharedModal] = useState(false);
    const [sharedGroups, setSharedGroups] = useState<SharedGroup[]>([]);
    const [sharedLoading, setSharedLoading] = useState(false);
    const isFirstRender = useRef(true);

    // Debounced auto-search
    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        const timer = setTimeout(() => {
            router.get('/admin/user-management', { search: searchTerm, sort: sortKey, dir: sortDir }, { preserveState: true, replace: true });
        }, 450);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Already ordered by the server.
    const sortedUsers = users.data;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/user-management', { search: searchTerm }, { preserveState: true, replace: true });
    };

    const openBanModal = (user: User) => {
        setSelectedUser(user);
        setBanReason('');
        setShowBanModal(true);
    };

    const submitBan = () => {
        if (!selectedUser || banReason.trim().length < 3) return;
        setIsSubmitting(true);
        router.post(`/admin/users/${selectedUser.id}/ban`, { reason: banReason.trim() }, {
            preserveScroll: true,
            onSuccess: () => { setShowBanModal(false); setBanReason(''); },
            onFinish: () => setIsSubmitting(false),
        });
    };

    // Loaded on demand — the grouping query is not worth running on every
    // visit to the user list when it is only consulted now and then.
    const openSharedIps = async () => {
        setShowSharedModal(true);
        setSharedLoading(true);
        try {
            const res = await fetch('/admin/users/shared-ips?min=2', {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            const data = await res.json();
            setSharedGroups(data.groups ?? []);
        } catch {
            setSharedGroups([]);
        } finally {
            setSharedLoading(false);
        }
    };

    const handleUnbanUser = (user: User) => {
        router.post(`/admin/users/${user.id}/unban`);
    };

    const openAddMembershipModal = (user: User) => {
        setSelectedUser(user); setDurationDays('');
        setGrantTier(asTier(user.membership_tier) === 'exclusive' ? 'exclusive' : 'premium');
        setShowMembershipModal(true);
    };

    const handleAddMembership = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !durationDays) return;
        setIsSubmitting(true);
        router.post(`/admin/users/${selectedUser.id}/add-membership`, { duration_days: parseInt(durationDays), tier: grantTier }, {
            onSuccess: () => setShowMembershipModal(false),
            onFinish: () => setIsSubmitting(false),
        });
    };

    const openAddCoinsModal = (user: User) => {
        setSelectedUser(user); setCoinModalType('add'); setCoinAmount(''); setCoinReason(''); setShowCoinModal(true);
    };

    const openDeductCoinsModal = (user: User) => {
        setSelectedUser(user); setCoinModalType('deduct'); setCoinAmount(''); setCoinReason(''); setShowCoinModal(true);
    };

    const handleCoinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !coinAmount) return;
        setIsSubmitting(true);
        const url = coinModalType === 'add'
            ? `/admin/users/${selectedUser.id}/add-coins`
            : `/admin/users/${selectedUser.id}/deduct-coins`;
        router.post(url, { amount: parseInt(coinAmount), reason: coinReason || undefined }, {
            onSuccess: () => { setShowCoinModal(false); setCoinAmount(''); setCoinReason(''); },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', background: inputBg, color: fg, border: `1px solid ${border}`, borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
    const lbl: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: fg, marginBottom: '6px' };

    const thStyle: React.CSSProperties = { padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: muted, textTransform: 'uppercase', letterSpacing: '0.05em', background: panelBg, borderBottom: `1px solid ${border}` };
    const tdStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '13px', color: fg, borderBottom: `1px solid ${border}` };

    const badge = (color: string, text: string) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: color + '22', color }}>{text}</span>
    );

    const modalOverlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 };
    const modalBox: React.CSSProperties = { background: currentTheme.background, border: `1px solid ${border}`, borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '440px' };
    const modalTitle: React.CSSProperties = { fontSize: '16px', fontWeight: 700, color: fg, marginBottom: '20px' };
    const btnCancel: React.CSSProperties = { padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: fg, background: panelBg, border: `1px solid ${border}`, borderRadius: '6px', cursor: 'pointer' };

    return (
        <div>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: fg }}>User Management</h1>
                <button type="button" onClick={openSharedIps}
                    title="Accounts signing in from the same address"
                    style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 600, color: fg, background: panelBg, border: `1px solid ${border}`, borderRadius: '8px', cursor: 'pointer' }}>
                    Shared IPs
                </button>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '20px' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by display name or email..." style={{ ...inp, flex: 1 }} />
                    <button type="submit" style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#fff', background: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Search</button>
                    {search && (
                        <button type="button" onClick={() => { setSearchTerm(''); router.get('/admin/user-management'); }} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: fg, background: panelBg, border: `1px solid ${border}`, borderRadius: '6px', cursor: 'pointer' }}>Clear</button>
                    )}
                </form>
            </div>

            {/* Table */}
            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                {([
                                    ['User', 'user'], ['Email', 'email'], ['Role', 'role'],
                                    ['Coins', 'coins'], ['Membership', 'membership'],
                                    ['Status', 'status'], ['Joined', 'joined'],
                                ] as [string, SortKey][]).map(([label, key]) => (
                                    <th key={key} style={{ ...thStyle, padding: 0 }}>
                                        <button onClick={() => toggleSort(key)}
                                            style={{
                                                width: '100%', display: 'flex', alignItems: 'center', gap: '4px',
                                                padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
                                                font: 'inherit', textTransform: 'uppercase', letterSpacing: '0.05em',
                                                color: sortKey === key ? fg : muted,
                                            }}
                                            title={`Sort by ${label.toLowerCase()}`}>
                                            {label}
                                            <span aria-hidden style={{ fontSize: '9px', opacity: sortKey === key ? 1 : 0.35 }}>
                                                {sortKey === key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                                            </span>
                                        </button>
                                    </th>
                                ))}
                                <th style={thStyle}>IP History</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedUsers.map((user) => (
                                <tr key={user.id} style={{ background: user.is_banned ? (light ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.08)') : 'transparent' }}>
                                    <td style={tdStyle}><span style={{ fontWeight: 600 }}>{user.display_name}</span></td>
                                    <td style={tdStyle}>{user.email}</td>
                                    <td style={tdStyle}>{badge(user.role === 'admin' ? '#7c3aed' : '#6b7280', user.role)}</td>
                                    <td style={tdStyle}><span style={{ fontWeight: 700, color: '#d97706' }}>¢{user.coins.toLocaleString()}</span></td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {badge(TIER_COLOR[asTier(user.membership_tier)], TIER_LABEL[asTier(user.membership_tier)])}
                                            {isPaidTier(user.membership_tier) && user.membership_expires_at && (
                                                <span style={{ fontSize: '11px', color: muted }}>Expires: {new Date(user.membership_expires_at).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={tdStyle}>{badge(user.is_banned ? '#ef4444' : '#22c55e', user.is_banned ? 'Banned' : 'Active')}</td>
                                    <td style={{ ...tdStyle, color: muted }}>{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td style={{ ...tdStyle, verticalAlign: 'top' }}>
                                        {user.ips.length === 0 ? (
                                            <span style={{ fontSize: '12px', color: muted }}>&mdash;</span>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '130px' }}>
                                                {user.ips.map(entry => (
                                                    // Hover carries the date, so the column stays a list of
                                                    // places rather than a wall of timestamps.
                                                    <span key={entry.ip}
                                                        title={`Last login ${new Date(entry.last_seen).toLocaleString()} · ${entry.logins} login${entry.logins === 1 ? '' : 's'}`}
                                                        style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: fg, cursor: 'help', whiteSpace: 'nowrap' }}>
                                                        {entry.ip}
                                                    </span>
                                                ))}
                                                {user.ip_total > user.ips.length && (
                                                    <span style={{ fontSize: '11px', color: muted }}>
                                                        +{user.ip_total - user.ips.length} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ ...tdStyle, minWidth: '180px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            {user.is_banned ? (
                                                <button onClick={() => handleUnbanUser(user)} style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, color: '#fff', background: '#22c55e', border: 'none', borderRadius: '5px', cursor: 'pointer', textAlign: 'center' }}>Unban User</button>
                                            ) : (
                                                <button onClick={() => openBanModal(user)} disabled={user.role === 'admin'} style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, color: '#fff', background: user.role === 'admin' ? 'rgba(239,68,68,0.25)' : '#ef4444', border: 'none', borderRadius: '5px', cursor: user.role === 'admin' ? 'not-allowed' : 'pointer', textAlign: 'center' }}>Ban User</button>
                                            )}
                                            <button onClick={() => openAddMembershipModal(user)} style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, color: '#fff', background: '#7c3aed', border: 'none', borderRadius: '5px', cursor: 'pointer', textAlign: 'center' }}>+ Membership</button>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                                                <button onClick={() => openAddCoinsModal(user)} style={{ padding: '5px 6px', fontSize: '11px', fontWeight: 600, color: '#fff', background: '#16a34a', border: 'none', borderRadius: '5px', cursor: 'pointer', textAlign: 'center' }}>+ Coins</button>
                                                <button onClick={() => openDeductCoinsModal(user)} disabled={user.coins === 0} style={{ padding: '5px 6px', fontSize: '11px', fontWeight: 600, color: '#fff', background: user.coins === 0 ? 'rgba(249,115,22,0.25)' : '#ea580c', border: 'none', borderRadius: '5px', cursor: user.coins === 0 ? 'not-allowed' : 'pointer', textAlign: 'center' }}>− Coins</button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {users.data.length === 0 && (
                        <div style={{ padding: '40px', textAlign: 'center', color: muted }}>No users found</div>
                    )}
                </div>
            </div>

            {/* Pagination */}
            {users.links.length > 3 && (
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {users.links.map((link, i) => (
                        <button key={i} onClick={() => link.url && router.get(link.url)} disabled={!link.url}
                            style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px', border: `1px solid ${border}`, cursor: link.url ? 'pointer' : 'not-allowed', opacity: link.url ? 1 : 0.4, background: link.active ? '#2563eb' : panelBg, color: link.active ? '#fff' : fg, fontWeight: link.active ? 600 : 400 }}
                            dangerouslySetInnerHTML={{ __html: link.label }} />
                    ))}
                </div>
            )}

            {/* Membership Modal */}
            {showMembershipModal && selectedUser && (
                <div style={modalOverlay} onClick={() => setShowMembershipModal(false)}>
                    <div style={modalBox} onClick={(e) => e.stopPropagation()}>
                        <h3 style={modalTitle}>Add Membership to {selectedUser.display_name}</h3>
                        <form onSubmit={handleAddMembership} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <span style={{ fontSize: '13px', color: muted }}>Current Status: </span>
                                {badge(TIER_COLOR[asTier(selectedUser.membership_tier)], TIER_LABEL[asTier(selectedUser.membership_tier)])}
                                {isPaidTier(selectedUser.membership_tier) && selectedUser.membership_expires_at && (
                                    <p style={{ marginTop: '4px', fontSize: '12px', color: muted }}>Expires: {new Date(selectedUser.membership_expires_at).toLocaleDateString()}</p>
                                )}
                            </div>
                            <div>
                                <label style={lbl}>Tier *</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    {(['premium', 'exclusive'] as const).map(t => (
                                        <button key={t} type="button" onClick={() => setGrantTier(t)}
                                            style={{ padding: '8px 10px', fontSize: '12px', fontWeight: 700, borderRadius: '6px', cursor: 'pointer', color: grantTier === t ? '#fff' : fg, background: grantTier === t ? TIER_COLOR[t] : 'transparent', border: `1px solid ${grantTier === t ? TIER_COLOR[t] : border}` }}>
                                            {TIER_LABEL[t]}
                                        </button>
                                    ))}
                                </div>
                                {isPaidTier(selectedUser.membership_tier) && asTier(selectedUser.membership_tier) !== grantTier && (
                                    <p style={{ marginTop: '6px', fontSize: '11px', color: muted }}>Switching tier: half of the remaining whole days carry over as a bonus.</p>
                                )}
                            </div>
                            <div>
                                <label style={lbl}>Duration (Days) *</label>
                                <input type="number" min="1" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} style={inp} placeholder="Enter number of days" required />
                                <p style={{ marginTop: '4px', fontSize: '11px', color: muted }}>Common: 30 (1 month), 90 (3 months), 365 (1 year)</p>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                                <button type="button" onClick={() => setShowMembershipModal(false)} style={btnCancel}>Cancel</button>
                                <button type="submit" disabled={isSubmitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#fff', background: TIER_COLOR[grantTier], border: 'none', borderRadius: '6px', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                                    {isSubmitting && <Spinner />}
                                    Confirm
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Coins Modal */}
            {showCoinModal && selectedUser && (
                <div style={modalOverlay} onClick={() => setShowCoinModal(false)}>
                    <div style={modalBox} onClick={(e) => e.stopPropagation()}>
                        <h3 style={modalTitle}>{coinModalType === 'add' ? 'Add Coins to' : 'Deduct Coins from'} {selectedUser.display_name}</h3>
                        <form onSubmit={handleCoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <span style={{ fontSize: '13px', color: muted }}>Current Balance: </span>
                                <span style={{ fontWeight: 700, color: '#d97706' }}>¢{selectedUser.coins.toLocaleString()}</span>
                            </div>
                            <div>
                                <label style={lbl}>Amount *</label>
                                <input type="number" min="1" max={coinModalType === 'deduct' ? selectedUser.coins : 1000000} value={coinAmount} onChange={(e) => setCoinAmount(e.target.value)} style={inp} placeholder={coinModalType === 'add' ? 'Enter coins to add' : 'Enter coins to deduct'} required />
                                {coinModalType === 'deduct' && selectedUser.coins > 0 && (
                                    <p style={{ marginTop: '4px', fontSize: '11px', color: muted }}>Maximum: ¢{selectedUser.coins.toLocaleString()}</p>
                                )}
                            </div>
                            <div>
                                <label style={lbl}>Reason (Optional)</label>
                                <input type="text" value={coinReason} onChange={(e) => setCoinReason(e.target.value)} style={inp} placeholder="e.g., Compensation, Event reward..." maxLength={255} />
                                <p style={{ marginTop: '4px', fontSize: '11px', color: muted }}>Will appear in user's transaction history</p>
                            </div>
                            {coinAmount && (
                                <div style={{ padding: '12px', borderRadius: '8px', background: coinModalType === 'add' ? 'rgba(34,197,94,0.08)' : 'rgba(249,115,22,0.08)', border: `1px solid ${coinModalType === 'add' ? 'rgba(34,197,94,0.3)' : 'rgba(249,115,22,0.3)'}` }}>
                                    <span style={{ fontSize: '13px', fontWeight: 500, color: coinModalType === 'add' ? '#22c55e' : '#f97316' }}>
                                        New Balance: ¢{(coinModalType === 'add' ? selectedUser.coins + parseInt(coinAmount) : selectedUser.coins - parseInt(coinAmount)).toLocaleString()}
                                    </span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                                <button type="button" onClick={() => setShowCoinModal(false)} style={btnCancel}>Cancel</button>
                                <button type="submit" disabled={isSubmitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#fff', background: coinModalType === 'add' ? '#22c55e' : '#f97316', border: 'none', borderRadius: '6px', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                                    {isSubmitting && <Spinner />}
                                    {coinModalType === 'add' ? 'Add Coins' : 'Deduct Coins'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Ban, with the reason the reader will be shown ── */}
            {showBanModal && selectedUser && (
                <div style={modalOverlay} onClick={() => !isSubmitting && setShowBanModal(false)}>
                    <div style={modalBox} onClick={e => e.stopPropagation()}>
                        <h3 style={modalTitle}>Ban {selectedUser.display_name}</h3>

                        <p style={{ fontSize: '13px', color: muted, marginBottom: '16px', lineHeight: 1.6 }}>
                            They will be held on a notice screen and blocked from every other page.
                            The reason below is shown to them there, so write it for them to read.
                        </p>

                        <label style={lbl}>Reason</label>
                        <textarea
                            value={banReason}
                            onChange={e => setBanReason(e.target.value)}
                            rows={4}
                            autoFocus
                            placeholder="e.g. Operating multiple accounts to farm free chapter unlocks."
                            style={{ ...inp, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
                        />
                        <p style={{ fontSize: '11px', color: muted, marginTop: '6px' }}>
                            {banReason.trim().length < 3 ? 'At least 3 characters.' : `${banReason.trim().length} / 1000`}
                        </p>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button type="button" onClick={() => setShowBanModal(false)} disabled={isSubmitting} style={btnCancel}>
                                Cancel
                            </button>
                            <button type="button" onClick={submitBan}
                                disabled={isSubmitting || banReason.trim().length < 3}
                                style={{
                                    padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: '#fff',
                                    background: banReason.trim().length < 3 ? 'rgba(239,68,68,0.35)' : '#ef4444',
                                    border: 'none', borderRadius: '6px',
                                    cursor: banReason.trim().length < 3 ? 'not-allowed' : 'pointer',
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                }}>
                                {isSubmitting && <Spinner />}
                                Ban User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Accounts behind one address ── */}
            {showSharedModal && (
                <div style={modalOverlay} onClick={() => setShowSharedModal(false)}>
                    <div style={{ ...modalBox, maxWidth: '720px', maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ flexShrink: 0 }}>
                            <h3 style={{ ...modalTitle, marginBottom: '6px' }}>Accounts sharing an IP</h3>
                            <p style={{ fontSize: '12px', color: muted, marginBottom: '18px', lineHeight: 1.6 }}>
                                Grouped by sign-in address, most accounts first. A household or a phone on
                                shared mobile data will legitimately show two or three — it is the larger
                                groups, registered close together, that are worth a look.
                            </p>
                        </div>

                        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', marginRight: '-8px', paddingRight: '8px' }}>
                            {sharedLoading ? (
                                <p style={{ fontSize: '13px', color: muted, textAlign: 'center', padding: '28px 0' }}>Loading…</p>
                            ) : sharedGroups.length === 0 ? (
                                <p style={{ fontSize: '13px', color: muted, textAlign: 'center', padding: '28px 0' }}>
                                    No address has more than one account signed in from it.
                                </p>
                            ) : (
                                sharedGroups.map(group => (
                                    <div key={group.ip} style={{ border: `1px solid ${border}`, borderRadius: '10px', marginBottom: '12px', overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 14px', background: panelBg, borderBottom: `1px solid ${border}` }}>
                                            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', fontWeight: 600, color: fg }}>
                                                {group.ip}
                                            </span>
                                            {badge(group.accounts >= 4 ? '#ef4444' : group.accounts === 3 ? '#f59e0b' : '#6b7280',
                                                `${group.accounts} accounts`)}
                                        </div>
                                        <div>
                                            {group.users.map(u => (
                                                <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '8px 14px', borderTop: `1px solid ${border}` }}>
                                                    <div style={{ minWidth: 0 }}>
                                                        <p style={{ fontSize: '13px', fontWeight: 600, color: fg, margin: 0 }}>
                                                            {u.display_name}
                                                            {u.is_banned && <span style={{ marginLeft: '8px' }}>{badge('#ef4444', 'Banned')}</span>}
                                                        </p>
                                                        <p style={{ fontSize: '11px', color: muted, margin: 0, wordBreak: 'break-all' }}>{u.email}</p>
                                                    </div>
                                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                        <p style={{ fontSize: '11px', color: muted, margin: 0 }}>
                                                            joined {new Date(u.joined).toLocaleDateString()}
                                                        </p>
                                                        <p style={{ fontSize: '11px', color: muted, margin: 0 }}
                                                            title={new Date(u.last_seen).toLocaleString()}>
                                                            last login {new Date(u.last_seen).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                            <button type="button" onClick={() => setShowSharedModal(false)} style={btnCancel}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function UsersIndex(props: UsersIndexProps) {
    return (
        <AdminLayout title="User Management">
            <Head title="User Management" />
            <UsersIndexContent {...props} />
        </AdminLayout>
    );
}
