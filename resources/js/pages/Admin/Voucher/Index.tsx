import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTheme } from '@/Contexts/ThemeContext';

interface Voucher {
    id: number;
    code: string;
    type: 'membership' | 'ebook' | 'hybrid';
    discount_type: 'percent' | 'flat';
    discount_value: number;
    usage_limit_type: 'per_user' | 'global';
    usage_limit: number;
    usage_count: number;
    expires_at: string | null;
    is_active: boolean;
}

interface VoucherUsage {
    id: number;
    user_display_name: string;
    used_for: string;
    discount_amount: number;
    created_at: string;
}

interface Props {
    vouchers: {
        data: Voucher[];
        links: any[];
        current_page: number;
        last_page: number;
    };
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

function VoucherIndexContent({ vouchers }: Props) {
    const { currentTheme } = useTheme();
    const light   = isLight(currentTheme.background);
    const fg      = currentTheme.foreground;
    const muted   = wa(fg, 0.45);
    const border  = wa(fg, 0.12);
    const cardBg  = light ? wa(fg, 0.03) : wa(fg, 0.06);
    const panelBg = light ? wa(fg, 0.06) : wa(fg, 0.09);

    const [showTrackModal, setShowTrackModal] = useState(false);
    const [trackingVoucher, setTrackingVoucher] = useState<Voucher | null>(null);
    const [usageHistory, setUsageHistory] = useState<VoucherUsage[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this voucher?')) {
            router.delete(route('admin.voucher.destroy', id));
        }
    };

    const handleTrack = async (voucher: Voucher) => {
        setTrackingVoucher(voucher);
        setShowTrackModal(true);
        setLoadingHistory(true);
        setUsageHistory([]);
        try {
            const response = await fetch(route('admin.voucher.usage', voucher.id), {
                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' },
            });
            const data = await response.json();
            setUsageHistory(data.usages || []);
        } catch (error) {
            console.error('Failed to fetch usage history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const closeModal = () => { setShowTrackModal(false); setTrackingVoucher(null); setUsageHistory([]); };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = { membership: 'Membership', ebook: 'Ebook', hybrid: 'Hybrid (Both)' };
        return labels[type] || type;
    };

    const getRuleLabel = (voucher: Voucher) => {
        if (voucher.usage_limit_type === 'per_user') return `${voucher.usage_limit}x per user`;
        return `${voucher.usage_limit}x global (${voucher.usage_count} used)`;
    };

    const getDiscountLabel = (voucher: Voucher) => {
        if (voucher.discount_type === 'percent') return `${voucher.discount_value}%`;
        return `\u00a2${voucher.discount_value}`;
    };

    const getTypeBadge = (type: string) => {
        const s: Record<string, { bg: string; color: string; bdr: string }> = {
            membership: { bg: 'rgba(168,85,247,0.12)', color: '#a855f7', bdr: 'rgba(168,85,247,0.3)' },
            ebook:      { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', bdr: 'rgba(59,130,246,0.3)' },
            hybrid:     { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', bdr: 'rgba(34,197,94,0.3)' },
        };
        const c = s[type] || s.hybrid;
        return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: c.bg, color: c.color, border: `1px solid ${c.bdr}` }}>{getTypeLabel(type)}</span>;
    };

    const thStyle: React.CSSProperties = { padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: muted, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${border}` };
    const tdStyle: React.CSSProperties = { padding: '14px 20px', borderBottom: `1px solid ${border}` };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: fg }}>Voucher Management</h1>
                <Link
                    href={route('admin.voucher.create')}
                    style={{ padding: '10px 18px', background: '#2563eb', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}
                >
                    Create Voucher
                </Link>
            </div>

            {/* Table */}
            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: panelBg }}>
                                <th style={thStyle}>Voucher Code</th>
                                <th style={thStyle}>Rule</th>
                                <th style={thStyle}>Expiry Date</th>
                                <th style={thStyle}>Voucher For</th>
                                <th style={thStyle}>Discount</th>
                                <th style={thStyle}>Status</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vouchers.data.map((voucher, idx) => (
                                <tr key={voucher.id}
                                    style={{ background: idx % 2 === 0 ? 'transparent' : wa(fg, 0.02) }}
                                    onMouseEnter={e => (e.currentTarget.style.background = wa(fg, 0.05))}
                                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : wa(fg, 0.02))}>
                                    <td style={tdStyle}>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: fg, fontFamily: 'monospace', letterSpacing: '0.05em' }}>{voucher.code}</div>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ fontSize: '13px', color: fg }}>{getRuleLabel(voucher)}</div>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ fontSize: '13px', color: fg }}>
                                            {voucher.expires_at
                                                ? new Date(voucher.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                                : <span style={{ color: muted }}>No Expiry</span>
                                            }
                                        </div>
                                    </td>
                                    <td style={tdStyle}>{getTypeBadge(voucher.type)}</td>
                                    <td style={tdStyle}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: fg }}>{getDiscountLabel(voucher)}</div>
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600,
                                            background: voucher.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                                            color: voucher.is_active ? '#22c55e' : '#ef4444',
                                            border: `1px solid ${voucher.is_active ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                        }}>
                                            {voucher.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px' }}>
                                            <button onClick={() => handleTrack(voucher)} style={{ fontSize: '13px', fontWeight: 500, color: '#22c55e', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                Track
                                            </button>
                                            <Link href={route('admin.voucher.edit', voucher.id)} style={{ fontSize: '13px', fontWeight: 500, color: '#6366f1', textDecoration: 'none' }}>
                                                Edit
                                            </Link>
                                            <button onClick={() => handleDelete(voucher.id)} style={{ fontSize: '13px', fontWeight: 500, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {vouchers.last_page > 1 && (
                    <div style={{ padding: '12px 20px', borderTop: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ fontSize: '13px', color: muted }}>
                            Page <strong style={{ color: fg }}>{vouchers.current_page}</strong> of{' '}
                            <strong style={{ color: fg }}>{vouchers.last_page}</strong>
                        </p>
                        <nav style={{ display: 'flex', gap: '4px' }}>
                            {vouchers.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    style={{
                                        padding: '4px 10px', fontSize: '13px', borderRadius: '6px',
                                        background: link.active ? '#2563eb' : panelBg,
                                        color: link.active ? '#fff' : fg,
                                        border: `1px solid ${link.active ? '#2563eb' : border}`,
                                        textDecoration: 'none',
                                    }}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </nav>
                    </div>
                )}
            </div>

            {/* Track Usage Modal */}
            {showTrackModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', overflowY: 'auto', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '80px' }} onClick={closeModal}>
                    <div style={{ background: currentTheme.background, border: `1px solid ${border}`, borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '720px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 600, color: fg }}>
                                Usage History  <span style={{ fontFamily: 'monospace', color: '#22c55e' }}>{trackingVoucher?.code}</span>
                            </h3>
                            <button onClick={closeModal} style={{ color: muted, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                                <svg style={{ width: '24px', height: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {loadingHistory ? (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <div style={{ display: 'inline-block', width: '32px', height: '32px', border: `3px solid ${border}`, borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                                <p style={{ marginTop: '12px', fontSize: '13px', color: muted }}>Loading usage history...</p>
                            </div>
                        ) : usageHistory.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: panelBg }}>
                                            {['User', 'Used For', 'Discount Amount', 'Date'].map(h => (
                                                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: muted, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${border}` }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usageHistory.map((usage) => (
                                            <tr key={usage.id}>
                                                <td style={{ padding: '12px 16px', borderBottom: `1px solid ${border}`, fontSize: '13px', fontWeight: 500, color: fg }}>{usage.user_display_name}</td>
                                                <td style={{ padding: '12px 16px', borderBottom: `1px solid ${border}` }}>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600,
                                                        background: usage.used_for === 'membership' ? 'rgba(168,85,247,0.12)' : 'rgba(59,130,246,0.12)',
                                                        color: usage.used_for === 'membership' ? '#a855f7' : '#3b82f6',
                                                        border: `1px solid ${usage.used_for === 'membership' ? 'rgba(168,85,247,0.3)' : 'rgba(59,130,246,0.3)'}`,
                                                    }}>
                                                        {usage.used_for === 'membership' ? 'Membership' : 'Ebook'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px', borderBottom: `1px solid ${border}`, fontSize: '13px', color: fg }}>
                                                    \u00a2{usage.discount_amount.toLocaleString()}
                                                </td>
                                                <td style={{ padding: '12px 16px', borderBottom: `1px solid ${border}`, fontSize: '13px', color: muted }}>
                                                    {new Date(usage.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <svg style={{ width: '48px', height: '48px', color: muted, margin: '0 auto' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p style={{ marginTop: '8px', fontSize: '13px', color: muted }}>No usage history yet</p>
                            </div>
                        )}

                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={closeModal} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: fg, background: panelBg, border: `1px solid ${border}`, borderRadius: '6px', cursor: 'pointer' }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function VoucherIndex(props: Props) {
    return (
        <AdminLayout title="Voucher Management">
            <Head title="Voucher Management" />
            <VoucherIndexContent {...props} />
        </AdminLayout>
    );
}
