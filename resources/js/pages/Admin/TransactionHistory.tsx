import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';

interface User {
  id: number;
  name: string;
  display_name: string;
  email: string;
}

interface CoinPackage {
  id: number;
  name: string;
  coin_amount: number;
  bonus_premium_days: number;
  price_usd: number;
}

interface CoinPurchase {
  id: number;
  user: User;
  coin_package?: CoinPackage;
  coins_amount: number;
  price_usd: string | number;
  payment_method: string;
  transaction_id?: string;
  status: string;
  created_at: string;
}

interface MembershipPackage {
  id: number;
  name: string;
  price_usd: string | number;
  duration_days: number;
}

interface MembershipPurchase {
  id: number;
  user: User;
  membership_package: MembershipPackage | null;
  invoice_number: string;
  tier: string;
  duration_days: number;
  amount_usd: number | string;
  payment_method: string;
  status: string;
  created_at: string;
}

interface EbookItem {
  id: number;
  title: string;
  volume_number?: string;
  price_coins: number;
  ebook_series: {
    id: number;
    title: string;
    slug: string;
  };
}

interface EbookPurchase {
  id: number;
  user: User;
  ebook_item: EbookItem;
  price_paid: number;
  purchased_at: string;
  created_at: string;
}

interface PaginatedData<T> {
  data: T[];
  links: { url: string | null; label: string; active: boolean }[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface TransactionHistoryProps {
  sorts: Record<'coin' | 'membership' | 'ebook', { key: string; dir: 'asc' | 'desc' }>;
  coinPurchases: PaginatedData<CoinPurchase>;
  membershipPurchases: PaginatedData<MembershipPurchase>;
  ebookPurchases: PaginatedData<EbookPurchase>;
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

type SortState = { key: string; dir: 'asc' | 'desc' };
type Column = { key: string; label: string; align?: 'left' | 'right'; sortable?: boolean };

function TransactionContent({ coinPurchases, membershipPurchases, ebookPurchases, sorts }: TransactionHistoryProps) {
  const { currentTheme } = useTheme();
  const light   = isLight(currentTheme.background);
  const fg      = currentTheme.foreground;
  const muted   = wa(fg, 0.45);
  const border  = wa(fg, 0.12);
  const cardBg  = light ? wa(fg, 0.03) : wa(fg, 0.06);
  const panelBg = light ? wa(fg, 0.06) : wa(fg, 0.09);

  const [activeTab, setActiveTab] = useState<'coins' | 'membership' | 'ebook'>('coins');
  // Server tab keys differ from the UI ones by a single letter.
  const serverTab = activeTab === 'coins' ? 'coin' : activeTab;
  const sortKey = sorts[serverTab]?.key ?? 'date';
  const sortDir = sorts[serverTab]?.dir ?? 'desc';

  // Moving to a new column starts at the direction that column is usually read
  // in — newest first, biggest first, A→Z — rather than always ascending.
  const FIRST_DIR: Record<string, 'asc' | 'desc'> = {
    user: 'asc', item: 'asc', quantity: 'desc', amount: 'desc',
    method: 'asc', status: 'asc', date: 'desc',
  };

  // Reloads with the new ordering rather than reshuffling the rows in place —
  // that is what makes "highest amount" mean highest overall, not highest here.
  const toggleSort = (key: string) => {
    const dir = key === sortKey ? (sortDir === 'asc' ? 'desc' : 'asc') : (FIRST_DIR[key] ?? 'asc');
    router.get(window.location.pathname,
      { ...Object.fromEntries(new URLSearchParams(window.location.search)), [`${serverTab}_sort`]: key, [`${serverTab}_dir`]: dir },
      { preserveState: false, preserveScroll: true });
  };

  // Status sorts by how far along a payment is, not alphabetically — "cancelled"
  // landing before "completed" would tell an admin nothing useful.
  const STATUS_ORDER: Record<string, number> = {
    completed: 0, pending: 1, failed: 2, cancelled: 3, refunded: 4,
  };

  const paginator = activeTab === 'coins' ? coinPurchases
    : activeTab === 'membership' ? membershipPurchases
    : ebookPurchases;

  const rows = paginator.data as any[];

  const columns = useMemo<Column[]>(() => {
    const user: Column = { key: 'user', label: 'User' };
    const date: Column = { key: 'date', label: 'Date' };

    if (activeTab === 'coins') {
      return [user,
        { key: 'item', label: 'Package' },
        { key: 'quantity', label: 'Coins', align: 'right' },
        { key: 'amount', label: 'Amount', align: 'right' },
        { key: 'method', label: 'Method' },
        { key: 'status', label: 'Status' },
        date];
    }

    if (activeTab === 'membership') {
      return [user,
        { key: 'item', label: 'Package' },
        { key: 'quantity', label: 'Duration', align: 'right' },
        { key: 'amount', label: 'Amount', align: 'right' },
        { key: 'method', label: 'Method' },
        { key: 'status', label: 'Status' },
        date];
    }

    return [user,
      { key: 'item', label: 'Item' },
      { key: 'amount', label: 'Paid', align: 'right' },
      date];
  }, [activeTab]);

  const cellStyle: React.CSSProperties = { padding: '12px', verticalAlign: 'top', color: fg };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; bdr: string }> = {
      completed: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', bdr: 'rgba(34,197,94,0.3)' },
      pending:   { bg: 'rgba(234,179,8,0.12)', color: '#ca8a04', bdr: 'rgba(234,179,8,0.3)' },
      failed:    { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', bdr: 'rgba(239,68,68,0.3)' },
      refunded:  { bg: wa(fg, 0.08), color: muted, bdr: border },
      cancelled: { bg: wa(fg, 0.08), color: muted, bdr: border },
    };
    const s = styles[status] || styles.refunded;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.bdr}` }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentMethodBadge = (method: string) => {
    const styles: Record<string, { bg: string; color: string; bdr: string }> = {
      paypal:    { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', bdr: 'rgba(59,130,246,0.25)' },
      oxapay:    { bg: 'rgba(168,85,247,0.1)', color: '#a855f7', bdr: 'rgba(168,85,247,0.25)' },
      cryptomus: { bg: 'rgba(168,85,247,0.1)', color: '#a855f7', bdr: 'rgba(168,85,247,0.25)' },
      coins:     { bg: 'rgba(251,191,36,0.12)', color: '#d97706', bdr: 'rgba(251,191,36,0.3)' },
    };
    const s = styles[method.toLowerCase()] || { bg: wa(fg, 0.08), color: muted, bdr: border };
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, background: s.bg, color: s.color, border: `1px solid ${s.bdr}` }}>
        {method.charAt(0).toUpperCase() + method.slice(1)}
      </span>
    );
  };

  const formatAmount = (amount: string | number) => {
    const n = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return n.toFixed(2);
  };

  const tabs = [
    { id: 'coins' as const, label: 'Coin Purchases', count: coinPurchases.total, icon: '' },
    { id: 'membership' as const, label: 'Membership', count: membershipPurchases.total, icon: '' },
    { id: 'ebook' as const, label: 'Ebook Purchases', count: ebookPurchases.total, icon: '' },
  ];

  return (
    <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '12px', overflow: 'hidden' }}>
      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${border}` }}>
        <nav style={{ display: 'flex', padding: '0 24px', marginBottom: '-1px' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 24px',
                borderBottom: activeTab === tab.id ? `2px solid ${light ? '#b45309' : '#fbbf24'}` : '2px solid transparent',
                fontWeight: 500,
                fontSize: '13px',
                color: activeTab === tab.id ? (light ? '#b45309' : '#fbbf24') : muted,
                background: 'none',
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              <span style={{ fontSize: '18px' }}>{tab.icon}</span>
              <span>{tab.label}</span>
              <span style={{
                marginLeft: '4px',
                padding: '1px 8px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 700,
                background: activeTab === tab.id
                  ? (light ? 'rgba(180,83,9,0.12)' : 'rgba(251,191,36,0.15)')
                  : wa(fg, 0.08),
                color: activeTab === tab.id ? (light ? '#b45309' : '#fbbf24') : muted,
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* One row per transaction. The card layout put a single record across
          five stacked blocks, so comparing two payments meant scrolling; a
          table lets the eye run down a column instead. */}
      <div style={{ padding: '24px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${border}` }}>
                {columns.map((col: Column) => (
                  <th key={col.key} style={{ padding: 0, textAlign: col.align ?? 'left' }}>
                    {col.sortable === false ? (
                      <span style={{ display: 'block', padding: '10px 12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: muted }}>
                        {col.label}
                      </span>
                    ) : (
                      <button onClick={() => toggleSort(col.key)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '4px',
                          justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start',
                          padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                          color: sortKey === col.key ? fg : muted,
                        }}
                        title={`Sort by ${col.label.toLowerCase()}`}>
                        {col.label}
                        <span aria-hidden style={{ fontSize: '9px', opacity: sortKey === col.key ? 1 : 0.35 }}>
                          {sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                        </span>
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id} style={{ borderBottom: `1px solid ${border}` }}>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 600, color: fg }}>{row.user?.display_name || row.user?.name || '—'}</div>
                    <div style={{ fontSize: '12px', color: muted }}>{row.user?.email}</div>
                  </td>

                  {activeTab === 'coins' && (
                    <>
                      <td style={cellStyle}>
                        <div style={{ color: fg }}>{row.coin_package?.name ?? '—'}</div>
                        {row.coin_package?.bonus_premium_days > 0 && (
                          <div style={{ fontSize: '12px', color: '#a78bfa' }}>+{row.coin_package.bonus_premium_days}d Premium</div>
                        )}
                      </td>
                      <td style={{ ...cellStyle, textAlign: 'right', color: light ? '#b45309' : '#fbbf24', fontWeight: 600 }}>
                        {Number(row.coins_amount).toLocaleString()}
                      </td>
                    </>
                  )}

                  {activeTab === 'membership' && (
                    <>
                      <td style={cellStyle}>
                        <div style={{ color: fg }}>{row.membership_package?.name ?? '—'}</div>
                        <div style={{ fontSize: '12px', color: muted, fontFamily: 'monospace' }}>{row.invoice_number}</div>
                      </td>
                      <td style={{ ...cellStyle, textAlign: 'right', color: fg }}>{row.duration_days}d</td>
                    </>
                  )}

                  {activeTab === 'ebook' && (
                    <>
                      <td style={cellStyle}>
                        <div style={{ color: fg }}>{row.ebook_item?.title ?? '—'}</div>
                        <div style={{ fontSize: '12px', color: muted }}>{row.ebook_item?.ebook_series?.title}</div>
                      </td>
                      <td style={{ ...cellStyle, textAlign: 'right', color: light ? '#b45309' : '#fbbf24', fontWeight: 600 }}>
                        &#162;{Number(row.price_paid).toLocaleString()}
                      </td>
                    </>
                  )}

                  {activeTab !== 'ebook' && (
                    <>
                      <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 700, color: light ? '#b45309' : '#fbbf24' }}>
                        ${Number(activeTab === 'coins' ? row.price_usd : row.amount_usd).toFixed(2)}
                      </td>
                      <td style={cellStyle}>
                        <span style={{ fontSize: '12px', color: fg }}>{row.payment_method}</span>
                        {row.transaction_id && (
                          <div style={{ fontSize: '11px', color: muted, fontFamily: 'monospace' }}>{row.transaction_id}</div>
                        )}
                      </td>
                      <td style={cellStyle}>{getStatusBadge(row.status)}</td>
                    </>
                  )}

                  <td style={{ ...cellStyle, color: muted, whiteSpace: 'nowrap' }}>
                    {formatDate(activeTab === 'ebook' ? (row.purchased_at ?? row.created_at) : row.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', color: muted }}>No transactions yet.</div>
          )}
        </div>

        {/* Page buttons, not just a page number. The old footer said "page 1 of
            8" without offering any way to reach page 2. */}
        {paginator.last_page > 1 && (
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${border}`, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: muted, marginRight: 'auto' }}>
              Page {paginator.current_page} of {paginator.last_page} · {paginator.total.toLocaleString()} records
            </span>
            {(paginator.links ?? []).map((link, i) => (
              <button key={i}
                onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                disabled={!link.url}
                style={{
                  padding: '6px 12px', fontSize: '13px', borderRadius: '6px',
                  border: `1px solid ${border}`, cursor: link.url ? 'pointer' : 'not-allowed',
                  opacity: link.url ? 1 : 0.4,
                  background: link.active ? (light ? '#b45309' : '#fbbf24') : panelBg,
                  color: link.active ? (light ? '#fff' : '#000') : fg,
                  fontWeight: link.active ? 600 : 400,
                }}
                dangerouslySetInnerHTML={{ __html: link.label }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TransactionHistory(props: TransactionHistoryProps) {
  return (
    <AdminLayout title="Transaction History">
      <Head title="Transaction History - Admin" />
      <TransactionContent {...props} />
    </AdminLayout>
  );
}
