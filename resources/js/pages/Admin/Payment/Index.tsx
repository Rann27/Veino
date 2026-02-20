import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';

interface MembershipPackage {
  id: number;
  name: string;
  gimmick_price: number | null;
  price_usd: number;
  coin_price: number;
  discount_percentage: number;
  is_active: boolean;
}

interface CoinPackage {
  id: number;
  name: string;
  coin_amount: number;
  bonus_premium_days: number;
  price_usd: number;
  is_active: boolean;
}

interface PaymentSettings {
  paypal_client_id: string | null;
  paypal_secret: string | null;
  paypal_mode: string;
  cryptomus_api_key: string | null;
  cryptomus_merchant_id: string | null;
}

interface PaymentIndexProps {
  membershipPackages: MembershipPackage[];
  coinPackages: CoinPackage[];
  paymentSettings: PaymentSettings;
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

function PaymentContent({ membershipPackages, coinPackages, paymentSettings }: PaymentIndexProps) {
  const { currentTheme } = useTheme();
  const light   = isLight(currentTheme.background);
  const fg      = currentTheme.foreground;
  const muted   = wa(fg, 0.45);
  const border  = wa(fg, 0.12);
  const cardBg  = light ? wa(fg, 0.03) : wa(fg, 0.06);
  const panelBg = light ? wa(fg, 0.06) : wa(fg, 0.09);
  const inputBg = light ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)';
  const accent  = light ? '#b45309' : '#fbbf24';

  const [editingPackage, setEditingPackage] = useState<MembershipPackage | null>(null);
  const [packageFormData, setPackageFormData] = useState({
    name: '',
    gimmick_price: '',
    coin_price: '',
    is_active: true,
  });

  const [editingCoinPackage, setEditingCoinPackage] = useState<CoinPackage | null>(null);
  const [coinPackageFormData, setCoinPackageFormData] = useState({
    name: '',
    coin_amount: '',
    bonus_premium_days: '',
    price_usd: '',
    is_active: true,
  });

  const openEditPackage = (pkg: MembershipPackage) => {
    setEditingPackage(pkg);
    setPackageFormData({
      name: pkg.name,
      gimmick_price: pkg.gimmick_price?.toString() || '',
      coin_price: pkg.coin_price.toString(),
      is_active: pkg.is_active,
    });
  };

  const handlePackageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPackage) {
      router.put(`/admin/membership-packages/${editingPackage.id}`, {
        name: packageFormData.name,
        gimmick_price: packageFormData.gimmick_price ? parseFloat(packageFormData.gimmick_price) : null,
        coin_price: parseInt(packageFormData.coin_price),
        is_active: packageFormData.is_active,
      }, {
        onSuccess: () => {
          setEditingPackage(null);
          setPackageFormData({ name: '', gimmick_price: '', coin_price: '', is_active: true });
        }
      });
    }
  };

  const openEditCoinPackage = (pkg: CoinPackage) => {
    setEditingCoinPackage(pkg);
    setCoinPackageFormData({
      name: pkg.name,
      coin_amount: pkg.coin_amount.toString(),
      bonus_premium_days: pkg.bonus_premium_days.toString(),
      price_usd: pkg.price_usd.toString(),
      is_active: pkg.is_active,
    });
  };

  const handleCoinPackageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCoinPackage) {
      router.put(`/admin/coin-packages/${editingCoinPackage.id}`, {
        name: coinPackageFormData.name,
        coin_amount: parseInt(coinPackageFormData.coin_amount),
        bonus_premium_days: parseInt(coinPackageFormData.bonus_premium_days),
        price_usd: parseFloat(coinPackageFormData.price_usd),
        is_active: coinPackageFormData.is_active,
      }, {
        onSuccess: () => {
          setEditingCoinPackage(null);
          setCoinPackageFormData({ name: '', coin_amount: '', bonus_premium_days: '', price_usd: '', is_active: true });
        }
      });
    }
  };

  const inputStyle = {
    background: inputBg,
    color: fg,
    border: `1px solid ${border}`,
    borderRadius: '6px',
    padding: '8px 12px',
    width: '100%',
    fontSize: '14px',
    fontFamily: 'inherit',
    cursor: 'not-allowed',
  };

  const editInputStyle = {
    background: inputBg,
    color: fg,
    border: `1px solid ${border}`,
    borderRadius: '6px',
    padding: '8px 12px',
    width: '100%',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
  };

  return (
    <div className="space-y-8">
      {/* Membership Packages Section */}
      <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ color: fg, fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Membership Packages</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {membershipPackages.map((pkg) => {
            const gimmickPrice = pkg.gimmick_price ? parseFloat(pkg.gimmick_price.toString()) : 0;
            const coinPrice = parseInt(pkg.coin_price.toString());
            const discountPercentage = gimmickPrice && gimmickPrice > coinPrice
              ? Math.round(((gimmickPrice - coinPrice) / gimmickPrice) * 100)
              : 0;

            return (
              <div
                key={pkg.id}
                style={{
                  border: pkg.is_active ? '1px solid rgba(134,239,172,0.5)' : `1px solid ${border}`,
                  background: pkg.is_active ? (light ? 'rgba(134,239,172,0.08)' : 'rgba(134,239,172,0.06)') : panelBg,
                  borderRadius: '10px',
                  padding: '16px',
                  position: 'relative',
                }}
              >
                {discountPercentage > 0 && (
                  <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                    <span style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>
                      Save {discountPercentage}%
                    </span>
                  </div>
                )}

                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ color: fg, fontWeight: 600, fontSize: '18px', marginBottom: '12px' }}>{pkg.name}</h3>
                  
                  <div style={{ marginTop: '8px' }}>
                    {gimmickPrice > 0 && gimmickPrice > coinPrice && (
                      <div style={{ color: muted, textDecoration: 'line-through', fontSize: '13px' }}>
                        {gimmickPrice.toLocaleString()}
                      </div>
                    )}
                    <div style={{ marginTop: '4px' }}>
                      <span style={{ fontSize: '28px', fontWeight: 700, color: '#a855f7' }}>
                        {coinPrice.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: muted, marginTop: '4px' }}>coins</div>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <span style={{
                      background: pkg.is_active ? 'rgba(34,197,94,0.15)' : wa(fg, 0.08),
                      color: pkg.is_active ? '#22c55e' : muted,
                      border: `1px solid ${pkg.is_active ? 'rgba(34,197,94,0.3)' : border}`,
                      borderRadius: '9999px',
                      padding: '2px 10px',
                      fontSize: '11px',
                      fontWeight: 500,
                    }}>
                      {pkg.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <button
                    onClick={() => openEditPackage(pkg)}
                    style={{ marginTop: '12px', width: '100%', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Edit Package
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coin Packages Section */}
      <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ color: fg, fontSize: '20px', fontWeight: 600 }}>Coin Packages</h2>
          <span style={{ fontSize: '13px', color: muted }}>Users can purchase coins for premium features</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {coinPackages.map((pkg) => {
            const priceUsd = parseFloat(pkg.price_usd.toString());
            const bonusPercentage = pkg.coin_amount > priceUsd * 100
              ? Math.round(((pkg.coin_amount - priceUsd * 100) / (priceUsd * 100)) * 100)
              : 0;

            return (
              <div
                key={pkg.id}
                style={{
                  border: pkg.is_active ? '1px solid rgba(251,191,36,0.4)' : `1px solid ${border}`,
                  background: pkg.is_active ? (light ? 'rgba(251,191,36,0.06)' : 'rgba(251,191,36,0.04)') : panelBg,
                  borderRadius: '10px',
                  padding: '16px',
                  position: 'relative',
                }}
              >
                {bonusPercentage > 0 && (
                  <div style={{ position: 'absolute', top: '-8px', right: '-8px', zIndex: 10 }}>
                    <span style={{ background: '#22c55e', color: '#fff', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                      +{bonusPercentage}%
                    </span>
                  </div>
                )}

                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                  <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, background: 'linear-gradient(to right, #f59e0b, #d97706)', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
                    {pkg.name}
                  </span>
                </div>

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: accent }}>
                      {pkg.coin_amount.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '11px', color: muted, marginTop: '4px' }}>coins</div>
                  </div>

                  {pkg.bonus_premium_days > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px', fontWeight: 500 }}>
                         +{pkg.bonus_premium_days}d Premium
                      </span>
                    </div>
                  )}

                  <div style={{ marginBottom: '12px', paddingTop: '12px', borderTop: `1px solid ${border}` }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: fg }}>
                      ${priceUsd.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '11px', color: muted }}>USD</div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <span style={{
                      background: pkg.is_active ? 'rgba(34,197,94,0.15)' : wa(fg, 0.08),
                      color: pkg.is_active ? '#22c55e' : muted,
                      border: `1px solid ${pkg.is_active ? 'rgba(34,197,94,0.3)' : border}`,
                      borderRadius: '9999px',
                      padding: '2px 10px',
                      fontSize: '11px',
                      fontWeight: 500,
                    }}>
                      {pkg.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <button
                    onClick={() => openEditCoinPackage(pkg)}
                    style={{ width: '100%', background: '#d97706', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Edit Package
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div style={{ background: light ? 'rgba(251,191,36,0.08)' : 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <svg style={{ width: '20px', height: '20px', color: accent, marginTop: '2px', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div style={{ fontSize: '13px', color: fg }}>
              <p style={{ fontWeight: 600, marginBottom: '6px' }}>Coin Package Management</p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: muted }}>
                <li>Users purchase coins with real money (PayPal/Cryptomus)</li>
                <li>Coins can be used for: Membership upgrades, unlocking chapters, shop items</li>
                <li>Bonus Premium Days are granted automatically upon purchase</li>
                <li>Inactive packages won't be displayed on Buy Coins page</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* PayPal Settings Section */}
      <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ color: fg, fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>PayPal Settings</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '4px 12px',
              borderRadius: '9999px', fontSize: '13px', fontWeight: 500,
              background: paymentSettings.paypal_client_id ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              color: paymentSettings.paypal_client_id ? '#22c55e' : '#ef4444',
              border: `1px solid ${paymentSettings.paypal_client_id ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', marginRight: '8px', background: paymentSettings.paypal_client_id ? '#22c55e' : '#ef4444' }}></span>
              {paymentSettings.paypal_client_id ? 'PayPal Configured' : 'PayPal Not Configured'}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '4px 12px',
              borderRadius: '9999px', fontSize: '13px', fontWeight: 500,
              background: paymentSettings.paypal_mode === 'live' ? 'rgba(239,68,68,0.12)' : 'rgba(234,179,8,0.12)',
              color: paymentSettings.paypal_mode === 'live' ? '#ef4444' : '#ca8a04',
              border: `1px solid ${paymentSettings.paypal_mode === 'live' ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.3)'}`,
            }}>
              {paymentSettings.paypal_mode === 'live' ? 'LIVE MODE' : 'SANDBOX MODE'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* PayPal Client ID */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: fg, marginBottom: '8px' }}>PayPal Client ID</label>
              <div style={{ position: 'relative' }}>
                <input type="text" value={paymentSettings.paypal_client_id || 'Not configured'} readOnly style={{ ...inputStyle, paddingRight: '40px', fontFamily: 'monospace' }} />
                <div style={{ position: 'absolute', inset: '0 12px 0 auto', display: 'flex', alignItems: 'center' }}>
                  <svg style={{ width: '16px', height: '16px', color: muted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              {paymentSettings.paypal_client_id && (
                <p style={{ marginTop: '4px', fontSize: '11px', color: muted }}>
                  Length: {paymentSettings.paypal_client_id.length} characters  Configured via .env file
                </p>
              )}
            </div>

            {/* PayPal Secret */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: fg, marginBottom: '8px' }}>PayPal Secret</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={paymentSettings.paypal_secret ? `${'*'.repeat(paymentSettings.paypal_secret.length - 5)}${paymentSettings.paypal_secret.slice(-5)}` : 'Not configured'}
                  readOnly
                  style={{ ...inputStyle, paddingRight: '40px', fontFamily: 'monospace' }}
                />
                <div style={{ position: 'absolute', inset: '0 12px 0 auto', display: 'flex', alignItems: 'center' }}>
                  <svg style={{ width: '16px', height: '16px', color: muted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L17 17" />
                  </svg>
                </div>
              </div>
              {paymentSettings.paypal_secret && (
                <p style={{ marginTop: '4px', fontSize: '11px', color: muted }}>
                  Length: {paymentSettings.paypal_secret.length} characters  Configured via .env file (secure)
                </p>
              )}
            </div>

            {/* PayPal Mode */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: fg, marginBottom: '8px' }}>PayPal Environment</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={`${paymentSettings.paypal_mode?.toUpperCase() || 'NOT SET'} Environment`}
                  readOnly
                  style={{ ...inputStyle, paddingRight: '40px' }}
                />
                <div style={{ position: 'absolute', inset: '0 12px 0 auto', display: 'flex', alignItems: 'center' }}>
                  <svg style={{ width: '16px', height: '16px', color: muted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9V3m9 9l-3-3m3 3l-3 3" />
                  </svg>
                </div>
              </div>
              <p style={{ marginTop: '4px', fontSize: '11px', color: muted }}>
                {paymentSettings.paypal_mode === 'live'
                  ? 'Production environment - Real transactions will be processed'
                  : 'Testing environment - Safe for development and testing'}
              </p>
            </div>
          </div>

          {/* Configuration Instructions */}
          <div style={{ background: light ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <svg style={{ width: '20px', height: '20px', color: '#22c55e', marginTop: '2px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e', marginBottom: '6px' }}>Secure PayPal Configuration (.env)</h3>
                <div style={{ fontSize: '13px', color: fg }}>
                  <p style={{ marginBottom: '8px', color: muted }}>PayPal credentials are now securely configured via .env file for maximum security.</p>
                  <p style={{ marginBottom: '4px', fontWeight: 600 }}>To update PayPal settings:</p>
                  <ol style={{ listStyleType: 'decimal', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: muted }}>
                    <li>Edit the <code style={{ background: 'rgba(34,197,94,0.15)', padding: '0 4px', borderRadius: '4px', fontFamily: 'monospace' }}>.env</code> file on your server</li>
                    <li>Update: <code style={{ background: 'rgba(34,197,94,0.15)', padding: '0 4px', borderRadius: '4px', fontFamily: 'monospace' }}>PAYPAL_CLIENT_ID=your_client_id</code></li>
                    <li>Update: <code style={{ background: 'rgba(34,197,94,0.15)', padding: '0 4px', borderRadius: '4px', fontFamily: 'monospace' }}>PAYPAL_CLIENT_SECRET=your_secret</code></li>
                    <li>Update: <code style={{ background: 'rgba(34,197,94,0.15)', padding: '0 4px', borderRadius: '4px', fontFamily: 'monospace' }}>PAYPAL_MODE=sandbox</code> or <code style={{ background: 'rgba(34,197,94,0.15)', padding: '0 4px', borderRadius: '4px', fontFamily: 'monospace' }}>live</code></li>
                    <li>Restart your application server to apply changes</li>
                  </ol>
                  <p style={{ marginTop: '8px', fontSize: '12px', color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '8px', borderRadius: '6px' }}>
                     <strong>Security Benefits:</strong> Credentials are not stored in database backups, version control, or accessible via web interface.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cryptomus Settings Section */}
      <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ color: fg, fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Cryptomus Configuration</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '4px 12px',
              borderRadius: '9999px', fontSize: '13px', fontWeight: 500,
              background: paymentSettings.cryptomus_api_key ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              color: paymentSettings.cryptomus_api_key ? '#22c55e' : '#ef4444',
              border: `1px solid ${paymentSettings.cryptomus_api_key ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', marginRight: '8px', background: paymentSettings.cryptomus_api_key ? '#22c55e' : '#ef4444' }}></span>
              {paymentSettings.cryptomus_api_key ? 'Cryptomus Configured' : 'Cryptomus Not Configured'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Cryptomus API Key */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: fg, marginBottom: '8px' }}>Cryptomus API Key</label>
              <div style={{ position: 'relative' }}>
                <input type="text" value={paymentSettings.cryptomus_api_key || 'Not configured'} readOnly style={{ ...inputStyle, paddingRight: '40px', fontFamily: 'monospace' }} />
                <div style={{ position: 'absolute', inset: '0 12px 0 auto', display: 'flex', alignItems: 'center' }}>
                  <svg style={{ width: '16px', height: '16px', color: muted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              {paymentSettings.cryptomus_api_key && (
                <p style={{ marginTop: '4px', fontSize: '11px', color: muted }}>
                  Length: {paymentSettings.cryptomus_api_key.length} characters  Configured via .env file
                </p>
              )}
            </div>

            {/* Cryptomus Merchant ID */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: fg, marginBottom: '8px' }}>Cryptomus Merchant ID</label>
              <div style={{ position: 'relative' }}>
                <input type="text" value={paymentSettings.cryptomus_merchant_id || 'Not configured'} readOnly style={{ ...inputStyle, paddingRight: '40px', fontFamily: 'monospace' }} />
                <div style={{ position: 'absolute', inset: '0 12px 0 auto', display: 'flex', alignItems: 'center' }}>
                  <svg style={{ width: '16px', height: '16px', color: muted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
              </div>
              {paymentSettings.cryptomus_merchant_id && (
                <p style={{ marginTop: '4px', fontSize: '11px', color: muted }}>
                  Merchant ID  Configured via .env file (secure)
                </p>
              )}
            </div>
          </div>

          {/* Cryptomus Configuration Instructions */}
          <div style={{ background: light ? 'rgba(59,130,246,0.06)' : 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <svg style={{ width: '20px', height: '20px', color: '#3b82f6', marginTop: '2px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6', marginBottom: '6px' }}>Secure Cryptomus Configuration (.env)</h3>
                <div style={{ fontSize: '13px', color: fg }}>
                  <p style={{ marginBottom: '8px', color: muted }}>Cryptomus credentials are securely configured via .env file for maximum security.</p>
                  <p style={{ marginBottom: '4px', fontWeight: 600 }}>To update Cryptomus settings:</p>
                  <ol style={{ listStyleType: 'decimal', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: muted }}>
                    <li>Edit the <code style={{ background: 'rgba(59,130,246,0.15)', padding: '0 4px', borderRadius: '4px', fontFamily: 'monospace' }}>.env</code> file on your server</li>
                    <li>Update: <code style={{ background: 'rgba(59,130,246,0.15)', padding: '0 4px', borderRadius: '4px', fontFamily: 'monospace' }}>CRYPTOMUS_API_KEY=your_api_key</code></li>
                    <li>Update: <code style={{ background: 'rgba(59,130,246,0.15)', padding: '0 4px', borderRadius: '4px', fontFamily: 'monospace' }}>CRYPTOMUS_MERCHANT_ID=your_merchant_id</code></li>
                    <li>Restart your application server to apply changes</li>
                  </ol>
                  <p style={{ marginTop: '8px', fontSize: '12px', color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '8px', borderRadius: '6px' }}>
                     <strong>Security Benefits:</strong> Credentials are not stored in database backups, version control, or accessible via web interface.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Membership Package Modal */}
      {editingPackage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', overflowY: 'auto', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '80px' }}>
          <div style={{ background: currentTheme.background, border: `1px solid ${border}`, borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ color: fg, fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              Edit {editingPackage.name}
            </h3>
            <form onSubmit={handlePackageSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: fg, marginBottom: '6px' }}>Membership Title</label>
                <input
                  type="text"
                  value={packageFormData.name}
                  onChange={(e) => setPackageFormData(prev => ({ ...prev, name: e.target.value }))}
                  style={editInputStyle}
                  placeholder="e.g., 1 Month Premium, 3 Months Premium"
                  required
                />
                <p style={{ marginTop: '4px', fontSize: '11px', color: muted }}>Duration title displayed to users</p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: fg, marginBottom: '6px' }}>Gimmick Price (Coins)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={packageFormData.gimmick_price}
                  onChange={(e) => setPackageFormData(prev => ({ ...prev, gimmick_price: e.target.value }))}
                  style={editInputStyle}
                  placeholder="1000"
                />
                <p style={{ marginTop: '4px', fontSize: '11px', color: muted }}>Original price (strikethrough display) - Optional</p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: fg, marginBottom: '6px' }}>Real Price (Coins)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={packageFormData.coin_price}
                  onChange={(e) => setPackageFormData(prev => ({ ...prev, coin_price: e.target.value }))}
                  style={editInputStyle}
                  placeholder="549"
                  required
                />
                <p style={{ marginTop: '4px', fontSize: '11px', color: muted }}>Actual coin price users will pay</p>
              </div>

              {packageFormData.gimmick_price && packageFormData.coin_price &&
               parseFloat(packageFormData.gimmick_price) > parseFloat(packageFormData.coin_price) && (
                <div style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg style={{ width: '16px', height: '16px', color: '#a855f7' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#a855f7' }}>
                      Discount: {Math.round(((parseFloat(packageFormData.gimmick_price) - parseFloat(packageFormData.coin_price)) / parseFloat(packageFormData.gimmick_price)) * 100)}% (will be auto-calculated)
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={packageFormData.is_active}
                    onChange={(e) => setPackageFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                  />
                  <span style={{ fontSize: '13px', color: fg }}>Active Package</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEditingPackage(null)}
                  style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: fg, background: panelBg, border: `1px solid ${border}`, borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#fff', background: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Update Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Coin Package Modal */}
      {editingCoinPackage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', overflowY: 'auto', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '80px' }}>
          <div style={{ background: currentTheme.background, border: `1px solid ${border}`, borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ color: fg, fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              Edit {editingCoinPackage.name}
            </h3>
            <form onSubmit={handleCoinPackageSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: fg, marginBottom: '6px' }}>Package Name</label>
                <input
                  type="text"
                  value={coinPackageFormData.name}
                  onChange={(e) => setCoinPackageFormData(prev => ({ ...prev, name: e.target.value }))}
                  style={editInputStyle}
                  placeholder="e.g., S Package, M Package"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: fg, marginBottom: '6px' }}>Coin Amount</label>
                <input
                  type="number"
                  min="1"
                  value={coinPackageFormData.coin_amount}
                  onChange={(e) => setCoinPackageFormData(prev => ({ ...prev, coin_amount: e.target.value }))}
                  style={editInputStyle}
                  placeholder="600"
                  required
                />
                <p style={{ marginTop: '4px', fontSize: '11px', color: muted }}>Number of coins user will receive</p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: fg, marginBottom: '6px' }}>Bonus Premium Days</label>
                <input
                  type="number"
                  min="0"
                  value={coinPackageFormData.bonus_premium_days}
                  onChange={(e) => setCoinPackageFormData(prev => ({ ...prev, bonus_premium_days: e.target.value }))}
                  style={editInputStyle}
                  placeholder="1"
                  required
                />
                <p style={{ marginTop: '4px', fontSize: '11px', color: muted }}>Premium days granted with purchase (0 for none)</p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: fg, marginBottom: '6px' }}>Price (USD)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={coinPackageFormData.price_usd}
                  onChange={(e) => setCoinPackageFormData(prev => ({ ...prev, price_usd: e.target.value }))}
                  style={editInputStyle}
                  placeholder="6.00"
                  required
                />
                <p style={{ marginTop: '4px', fontSize: '11px', color: muted }}>Price charged via payment gateway</p>
              </div>

              {coinPackageFormData.coin_amount && coinPackageFormData.price_usd &&
               parseInt(coinPackageFormData.coin_amount) > parseFloat(coinPackageFormData.price_usd) * 100 && (
                <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg style={{ width: '16px', height: '16px', color: '#22c55e' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#22c55e' }}>
                      Bonus: +{Math.round(((parseInt(coinPackageFormData.coin_amount) - parseFloat(coinPackageFormData.price_usd) * 100) / (parseFloat(coinPackageFormData.price_usd) * 100)) * 100)}% extra coins
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={coinPackageFormData.is_active}
                    onChange={(e) => setCoinPackageFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    style={{ width: '16px', height: '16px', accentColor: '#d97706' }}
                  />
                  <span style={{ fontSize: '13px', color: fg }}>Active Package</span>
                </label>
                <p style={{ marginTop: '4px', marginLeft: '24px', fontSize: '11px', color: muted }}>Only active packages appear on Buy Coins page</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEditingCoinPackage(null)}
                  style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: fg, background: panelBg, border: `1px solid ${border}`, borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#fff', background: '#d97706', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Update Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentIndex(props: PaymentIndexProps) {
  return (
    <AdminLayout title="Payment Management">
      <Head title="Payment Management" />
      <PaymentContent {...props} />
    </AdminLayout>
  );
}
