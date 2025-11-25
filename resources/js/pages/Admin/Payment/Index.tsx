import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface MembershipPackage {
  id: number;
  name: string;
  gimmick_price: number | null;
  price_usd: number;
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

export default function PaymentIndex({ membershipPackages, coinPackages, paymentSettings }: PaymentIndexProps) {
  const [editingPackage, setEditingPackage] = useState<MembershipPackage | null>(null);
  const [packageFormData, setPackageFormData] = useState({
    name: '',
    gimmick_price: '',
    price_usd: '',
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
      price_usd: pkg.price_usd.toString(),
      is_active: pkg.is_active,
    });
  };

  const handlePackageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPackage) {
      router.put(`/admin/membership-packages/${editingPackage.id}`, {
        name: packageFormData.name,
        gimmick_price: packageFormData.gimmick_price ? parseFloat(packageFormData.gimmick_price) : null,
        price_usd: parseFloat(packageFormData.price_usd),
        is_active: packageFormData.is_active,
      }, {
        onSuccess: () => {
          setEditingPackage(null);
          setPackageFormData({ name: '', gimmick_price: '', price_usd: '', is_active: true });
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

  return (
    <AdminLayout title="Payment Management">
      <Head title="Payment Management" />

      <div className="space-y-8">
        {/* Membership Packages Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Membership Packages</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {membershipPackages.map((pkg) => {
              // Convert to numbers for calculation
              const gimmickPrice = pkg.gimmick_price ? parseFloat(pkg.gimmick_price.toString()) : 0;
              const realPrice = parseFloat(pkg.price_usd.toString());
              
              // Calculate discount percentage
              const discountPercentage = gimmickPrice && gimmickPrice > realPrice
                ? Math.round(((gimmickPrice - realPrice) / gimmickPrice) * 100)
                : 0;

              return (
                <div
                  key={pkg.id}
                  className={`border rounded-lg p-4 relative ${
                    pkg.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {/* Discount Badge */}
                  {discountPercentage > 0 && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Save {discountPercentage}%
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <h3 className="font-semibold text-lg text-gray-900 mb-3">{pkg.name}</h3>
                    
                    {/* Price Display */}
                    <div className="mt-2">
                      {gimmickPrice > 0 && gimmickPrice > realPrice && (
                        <div className="text-gray-500 line-through text-sm">
                          ${gimmickPrice.toFixed(2)}
                        </div>
                      )}
                      <div className="mt-1">
                        <span className="text-2xl font-bold text-purple-600">
                          ${realPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        pkg.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {pkg.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <button
                      onClick={() => openEditPackage(pkg)}
                      className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm"
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
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Coin Packages</h2>
            <span className="text-sm text-gray-500">Users can purchase coins for premium features</span>
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
                  className={`border rounded-lg p-4 relative ${
                    pkg.is_active ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {/* Bonus Badge */}
                  {bonusPercentage > 0 && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-500 text-white shadow-lg">
                        +{bonusPercentage}%
                      </span>
                    </div>
                  )}

                  {/* Package Name */}
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg whitespace-nowrap">
                      {pkg.name}
                    </span>
                  </div>

                  <div className="text-center mt-4">
                    {/* Coin Amount */}
                    <div className="mb-3">
                      <div className="text-3xl font-bold text-amber-500">
                        ¢{pkg.coin_amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">coins</div>
                    </div>

                    {/* Premium Days Bonus */}
                    {pkg.bonus_premium_days > 0 && (
                      <div className="mb-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          💎 +{pkg.bonus_premium_days}d Premium
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="mb-3 pt-3 border-t border-gray-300">
                      <div className="text-2xl font-bold text-gray-900">
                        ${priceUsd.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">USD</div>
                    </div>

                    {/* Status */}
                    <div className="mb-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        pkg.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {pkg.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <button
                      onClick={() => openEditCoinPackage(pkg)}
                      className="w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 text-sm font-medium"
                    >
                      Edit Package
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Coin Package Management</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
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
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">PayPal Settings</h2>
          
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center space-x-3">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                paymentSettings.paypal_client_id 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  paymentSettings.paypal_client_id ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                {paymentSettings.paypal_client_id ? 'PayPal Configured' : 'PayPal Not Configured'}
              </div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                paymentSettings.paypal_mode === 'live' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {paymentSettings.paypal_mode === 'live' ? 'LIVE MODE' : 'SANDBOX MODE'}
              </div>
            </div>

            {/* PayPal Client ID */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PayPal Client ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={paymentSettings.paypal_client_id || 'Not configured'}
                    readOnly
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 font-mono text-sm cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                {paymentSettings.paypal_client_id && (
                  <p className="mt-1 text-xs text-gray-500">
                    Length: {paymentSettings.paypal_client_id.length} characters • Configured via .env file
                  </p>
                )}
              </div>

              {/* PayPal Secret */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PayPal Secret
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={
                      paymentSettings.paypal_secret 
                        ? `${'*'.repeat(paymentSettings.paypal_secret.length - 5)}${paymentSettings.paypal_secret.slice(-5)}`
                        : 'Not configured'
                    }
                    readOnly
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 font-mono text-sm cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L17 17" />
                    </svg>
                  </div>
                </div>
                {paymentSettings.paypal_secret && (
                  <p className="mt-1 text-xs text-gray-500">
                    Length: {paymentSettings.paypal_secret.length} characters • Configured via .env file (secure)
                  </p>
                )}
              </div>

              {/* PayPal Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PayPal Environment
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={`${paymentSettings.paypal_mode?.toUpperCase() || 'NOT SET'} Environment`}
                    readOnly
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 font-medium text-sm cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9V3m9 9l-3-3m3 3l-3 3" />
                    </svg>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {paymentSettings.paypal_mode === 'live' 
                    ? 'Production environment - Real transactions will be processed'
                    : 'Testing environment - Safe for development and testing'
                  }
                </p>
              </div>
            </div>

            {/* Configuration Instructions */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-green-900 mb-1">
                    Secure PayPal Configuration (.env)
                  </h3>
                  <div className="text-sm text-green-800">
                    <p className="mb-2">PayPal credentials are now securely configured via .env file for maximum security.</p>
                    <p className="mb-1"><strong>To update PayPal settings:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Edit the <code className="bg-green-100 px-1 rounded">.env</code> file on your server</li>
                      <li>Update: <code className="bg-green-100 px-1 rounded">PAYPAL_CLIENT_ID=your_client_id</code></li>
                      <li>Update: <code className="bg-green-100 px-1 rounded">PAYPAL_CLIENT_SECRET=your_secret</code></li>
                      <li>Update: <code className="bg-green-100 px-1 rounded">PAYPAL_MODE=sandbox</code> or <code className="bg-green-100 px-1 rounded">live</code></li>
                      <li>Restart your application server to apply changes</li>
                    </ol>
                    <p className="mt-2 text-xs text-green-700 bg-green-100 p-2 rounded">
                      ✅ <strong>Security Benefits:</strong> Credentials are not stored in database backups, version control, or accessible via web interface.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cryptomus Settings Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Cryptomus Configuration</h2>
          
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center space-x-3">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                paymentSettings.cryptomus_api_key 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  paymentSettings.cryptomus_api_key ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                {paymentSettings.cryptomus_api_key ? 'Cryptomus Configured' : 'Cryptomus Not Configured'}
              </div>
            </div>

            {/* Cryptomus API Key */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cryptomus API Key
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={paymentSettings.cryptomus_api_key || 'Not configured'}
                    readOnly
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 font-mono text-sm cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                {paymentSettings.cryptomus_api_key && (
                  <p className="mt-1 text-xs text-gray-500">
                    Length: {paymentSettings.cryptomus_api_key.length} characters • Configured via .env file
                  </p>
                )}
              </div>

              {/* Cryptomus Merchant ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cryptomus Merchant ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={
                      paymentSettings.cryptomus_merchant_id 
                        ? paymentSettings.cryptomus_merchant_id
                        : 'Not configured'
                    }
                    readOnly
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 font-mono text-sm cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                  </div>
                </div>
                {paymentSettings.cryptomus_merchant_id && (
                  <p className="mt-1 text-xs text-gray-500">
                    Merchant ID • Configured via .env file (secure)
                  </p>
                )}
              </div>
            </div>

            {/* Configuration Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-blue-900 mb-1">
                    Secure Cryptomus Configuration (.env)
                  </h3>
                  <div className="text-sm text-blue-800">
                    <p className="mb-2">Cryptomus credentials are securely configured via .env file for maximum security.</p>
                    <p className="mb-1"><strong>To update Cryptomus settings:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Edit the <code className="bg-blue-100 px-1 rounded">.env</code> file on your server</li>
                      <li>Update: <code className="bg-blue-100 px-1 rounded">CRYPTOMUS_API_KEY=your_api_key</code></li>
                      <li>Update: <code className="bg-blue-100 px-1 rounded">CRYPTOMUS_MERCHANT_ID=your_merchant_id</code></li>
                      <li>Restart your application server to apply changes</li>
                    </ol>
                    <p className="mt-2 text-xs text-blue-700 bg-blue-100 p-2 rounded">
                      ✅ <strong>Security Benefits:</strong> Credentials are not stored in database backups, version control, or accessible via web interface.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Edit Package Modal */}
      {editingPackage && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit {editingPackage.name}
              </h3>
              <form onSubmit={handlePackageSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Membership Title</label>
                  <input
                    type="text"
                    value={packageFormData.name}
                    onChange={(e) => setPackageFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., 1 Month Premium, 3 Months Premium"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Duration title displayed to users</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Gimmick Price (USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={packageFormData.gimmick_price}
                    onChange={(e) => setPackageFormData(prev => ({ ...prev, gimmick_price: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="10.00"
                  />
                  <p className="mt-1 text-xs text-gray-500">Original price (strikethrough display) - Optional</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Real Price (USD)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={packageFormData.price_usd}
                    onChange={(e) => setPackageFormData(prev => ({ ...prev, price_usd: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="7.95"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Actual price charged to gateway</p>
                </div>

                {/* Auto-calculated Discount Preview */}
                {packageFormData.gimmick_price && packageFormData.price_usd && 
                 parseFloat(packageFormData.gimmick_price) > parseFloat(packageFormData.price_usd) && (
                  <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-purple-800">
                        Discount: {Math.round(((parseFloat(packageFormData.gimmick_price) - parseFloat(packageFormData.price_usd)) / parseFloat(packageFormData.gimmick_price)) * 100)}% 
                        (will be auto-calculated)
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={packageFormData.is_active}
                      onChange={(e) => setPackageFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active Package</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingPackage(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                  >
                    Update Package
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Coin Package Modal */}
      {editingCoinPackage && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit {editingCoinPackage.name}
              </h3>
              <form onSubmit={handleCoinPackageSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Package Name</label>
                  <input
                    type="text"
                    value={coinPackageFormData.name}
                    onChange={(e) => setCoinPackageFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    placeholder="e.g., S Package, M Package"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Coin Amount</label>
                  <input
                    type="number"
                    min="1"
                    value={coinPackageFormData.coin_amount}
                    onChange={(e) => setCoinPackageFormData(prev => ({ ...prev, coin_amount: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    placeholder="600"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Number of coins user will receive</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Bonus Premium Days</label>
                  <input
                    type="number"
                    min="0"
                    value={coinPackageFormData.bonus_premium_days}
                    onChange={(e) => setCoinPackageFormData(prev => ({ ...prev, bonus_premium_days: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    placeholder="1"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Premium days granted with purchase (0 for none)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Price (USD)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={coinPackageFormData.price_usd}
                    onChange={(e) => setCoinPackageFormData(prev => ({ ...prev, price_usd: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    placeholder="6.00"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Price charged via payment gateway</p>
                </div>

                {/* Bonus Percentage Preview */}
                {coinPackageFormData.coin_amount && coinPackageFormData.price_usd && 
                 parseInt(coinPackageFormData.coin_amount) > parseFloat(coinPackageFormData.price_usd) * 100 && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">
                        Bonus: +{Math.round(((parseInt(coinPackageFormData.coin_amount) - parseFloat(coinPackageFormData.price_usd) * 100) / (parseFloat(coinPackageFormData.price_usd) * 100)) * 100)}% extra coins
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={coinPackageFormData.is_active}
                      onChange={(e) => setCoinPackageFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active Package</span>
                  </label>
                  <p className="mt-1 ml-6 text-xs text-gray-500">Only active packages appear on Buy Coins page</p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingCoinPackage(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md"
                  >
                    Update Package
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
