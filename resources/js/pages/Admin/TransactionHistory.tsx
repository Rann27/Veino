import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
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
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface TransactionHistoryProps {
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

function TransactionContent({ coinPurchases, membershipPurchases, ebookPurchases }: TransactionHistoryProps) {
  const { currentTheme } = useTheme();
  const light   = isLight(currentTheme.background);
  const fg      = currentTheme.foreground;
  const muted   = wa(fg, 0.45);
  const border  = wa(fg, 0.12);
  const cardBg  = light ? wa(fg, 0.03) : wa(fg, 0.06);
  const panelBg = light ? wa(fg, 0.06) : wa(fg, 0.09);

  const [activeTab, setActiveTab] = useState<'coins' | 'membership' | 'ebook'>('coins');

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

  const cardStyle = {
    border: `1px solid ${border}`,
    borderRadius: '10px',
    padding: '20px',
    background: cardBg,
    transition: 'box-shadow 0.2s',
  };

  const labelStyle = { fontSize: '11px', fontWeight: 600 as const, color: muted, textTransform: 'uppercase' as const, marginBottom: '4px', letterSpacing: '0.05em' };
  const valueStyle = { fontSize: '13px', fontWeight: 600 as const, color: fg };

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

      {/* Coin Purchases Tab */}
      {activeTab === 'coins' && (
        <div style={{ padding: '24px' }}>
          {coinPurchases.data.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {coinPurchases.data.map((purchase) => (
                <div key={purchase.id} style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: fg }}>
                          {purchase.user.display_name || purchase.user.name}
                        </h3>
                        {getStatusBadge(purchase.status)}
                      </div>
                      <p style={{ fontSize: '13px', color: muted }}>{purchase.user.email}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#d97706' }}>
                        ${formatAmount(purchase.price_usd)}
                      </div>
                      <div style={{ fontSize: '11px', color: muted, marginTop: '4px' }}>
                        {formatDate(purchase.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ paddingTop: '16px', borderTop: `1px solid ${border}` }}>
                    <div>
                      <div style={labelStyle}>Coins Purchased</div>
                      <div style={{ ...valueStyle, color: '#d97706' }}>{purchase.coins_amount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Package</div>
                      <div style={valueStyle}>{purchase.coin_package?.name || 'N/A'}</div>
                      {purchase.coin_package?.bonus_premium_days && purchase.coin_package.bonus_premium_days > 0 && (
                        <div style={{ fontSize: '11px', color: '#a855f7', marginTop: '2px' }}>
                          +{purchase.coin_package.bonus_premium_days}d Premium
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={labelStyle}>Payment Method</div>
                      <div>{getPaymentMethodBadge(purchase.payment_method)}</div>
                      {purchase.transaction_id && (
                        <div style={{ fontSize: '11px', color: muted, marginTop: '4px', fontFamily: 'monospace' }}>
                          {purchase.transaction_id.substring(0, 20)}...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <span style={{ fontSize: '56px' }}></span>
              <h3 style={{ marginTop: '16px', fontSize: '13px', fontWeight: 500, color: fg }}>No coin purchases yet</h3>
              <p style={{ marginTop: '4px', fontSize: '13px', color: muted }}>Coin top-up transactions will appear here.</p>
            </div>
          )}

          {coinPurchases.last_page > 1 && (
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${border}` }}>
              <div style={{ fontSize: '13px', color: muted }}>
                Showing page {coinPurchases.current_page} of {coinPurchases.last_page}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Membership Purchases Tab */}
      {activeTab === 'membership' && (
        <div style={{ padding: '24px' }}>
          {membershipPurchases.data.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {membershipPurchases.data.map((purchase) => (
                <div key={purchase.id} style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: fg }}>
                          {purchase.user.display_name || purchase.user.name}
                        </h3>
                        {getStatusBadge(purchase.status)}
                      </div>
                      <p style={{ fontSize: '13px', color: muted }}>{purchase.user.email}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#a855f7' }}>
                        {typeof purchase.amount_usd === 'number' ? purchase.amount_usd.toLocaleString() : parseFloat(purchase.amount_usd).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '11px', color: muted, marginTop: '4px' }}>
                        {formatDate(purchase.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ paddingTop: '16px', borderTop: `1px solid ${border}` }}>
                    <div>
                      <div style={labelStyle}>Invoice Number</div>
                      <div style={{ ...valueStyle, fontFamily: 'monospace' }}>{purchase.invoice_number}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Package</div>
                      <div style={valueStyle}>{purchase.membership_package?.name || 'Legacy Package'}</div>
                      <div style={{ fontSize: '11px', color: muted, marginTop: '2px' }}>{purchase.duration_days} days</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Tier</div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, background: 'rgba(168,85,247,0.12)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)' }}>
                        {purchase.tier.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <span style={{ fontSize: '56px' }}></span>
              <h3 style={{ marginTop: '16px', fontSize: '13px', fontWeight: 500, color: fg }}>No membership purchases yet</h3>
              <p style={{ marginTop: '4px', fontSize: '13px', color: muted }}>Membership transactions will appear here.</p>
            </div>
          )}

          {membershipPurchases.last_page > 1 && (
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${border}` }}>
              <div style={{ fontSize: '13px', color: muted }}>
                Showing page {membershipPurchases.current_page} of {membershipPurchases.last_page}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ebook Purchases Tab */}
      {activeTab === 'ebook' && (
        <div style={{ padding: '24px' }}>
          {ebookPurchases.data.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {ebookPurchases.data.map((purchase) => (
                <div key={purchase.id} style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: fg }}>
                          {purchase.user.display_name || purchase.user.name}
                        </h3>
                      </div>
                      <p style={{ fontSize: '13px', color: muted }}>{purchase.user.email}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e' }}>
                        {purchase.price_paid.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '11px', color: muted, marginTop: '4px' }}>
                        {formatDate(purchase.purchased_at || purchase.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ paddingTop: '16px', borderTop: `1px solid ${border}` }}>
                    <div>
                      <div style={labelStyle}>Ebook Series</div>
                      <div style={valueStyle}>{purchase.ebook_item.ebook_series.title}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Item</div>
                      <div style={valueStyle}>{purchase.ebook_item.title}</div>
                      {purchase.ebook_item.volume_number && (
                        <div style={{ fontSize: '11px', color: muted, marginTop: '2px' }}>
                          Volume {purchase.ebook_item.volume_number}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <span style={{ fontSize: '56px' }}></span>
              <h3 style={{ marginTop: '16px', fontSize: '13px', fontWeight: 500, color: fg }}>No ebook purchases yet</h3>
              <p style={{ marginTop: '4px', fontSize: '13px', color: muted }}>Ebook transactions will appear here.</p>
            </div>
          )}

          {ebookPurchases.last_page > 1 && (
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${border}` }}>
              <div style={{ fontSize: '13px', color: muted }}>
                Showing page {ebookPurchases.current_page} of {ebookPurchases.last_page}
              </div>
            </div>
          )}
        </div>
      )}
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
