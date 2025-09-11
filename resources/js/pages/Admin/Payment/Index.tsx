import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface CoinPackage {
  id: number;
  name: string;
  coin_amount: number;
  price_usd: number;
  is_active: boolean;
}

interface PaymentSettings {
  paypal_client_id: string | null;
  paypal_secret: string | null;
  paypal_mode: string;
}

interface PaymentIndexProps {
  coinPackages: CoinPackage[];
  paymentSettings: PaymentSettings;
}

export default function PaymentIndex({ coinPackages, paymentSettings }: PaymentIndexProps) {
  const [editingPackage, setEditingPackage] = useState<CoinPackage | null>(null);
  const [packageFormData, setPackageFormData] = useState({
    name: '',
    coin_amount: '',
    price_usd: '',
    is_active: true,
  });

  const openEditPackage = (pkg: CoinPackage) => {
    setEditingPackage(pkg);
    setPackageFormData({
      name: pkg.name,
      coin_amount: pkg.coin_amount.toString(),
      price_usd: pkg.price_usd.toString(),
      is_active: pkg.is_active,
    });
  };

  const handlePackageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPackage) {
      router.put(`/admin/coin-packages/${editingPackage.id}`, {
        ...packageFormData,
        coin_amount: parseInt(packageFormData.coin_amount),
        price_usd: parseFloat(packageFormData.price_usd),
      }, {
        onSuccess: () => {
          setEditingPackage(null);
          setPackageFormData({ name: '', coin_amount: '', price_usd: '', is_active: true });
        }
      });
    }
  };

  return (
    <AdminLayout title="Payment Management">
      <Head title="Payment Management" />

      <div className="space-y-8">
        {/* Coin Packages Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Coin Packages</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {coinPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`border rounded-lg p-4 ${
                  pkg.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="text-center">
                  <h3 className="font-semibold text-lg text-gray-900">{pkg.name}</h3>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-blue-600">
                      {pkg.coin_amount.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-600 ml-1">coins</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-xl font-semibold text-gray-900">
                      ${pkg.price_usd}
                    </span>
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
            ))}
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

        {/* Additional Financial Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Default Chapter Price</h3>
                <p className="text-sm text-gray-600">Default coin price for premium chapters</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold">45 coins</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Transaction Fee</h3>
                <p className="text-sm text-gray-600">PayPal processing fee percentage</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold">~3.5%</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Currency</h3>
                <p className="text-sm text-gray-600">Primary currency for transactions</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold">USD</span>
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
                  <label className="block text-sm font-medium text-gray-700">Package Name</label>
                  <input
                    type="text"
                    value={packageFormData.name}
                    onChange={(e) => setPackageFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Coin Amount</label>
                  <input
                    type="number"
                    min="1"
                    value={packageFormData.coin_amount}
                    onChange={(e) => setPackageFormData(prev => ({ ...prev, coin_amount: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Price (USD)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={packageFormData.price_usd}
                    onChange={(e) => setPackageFormData(prev => ({ ...prev, price_usd: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

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
    </AdminLayout>
  );
}
