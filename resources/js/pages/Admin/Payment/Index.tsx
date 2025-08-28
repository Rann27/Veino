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
  const [settingsFormData, setSettingsFormData] = useState({
    paypal_client_id: paymentSettings.paypal_client_id || '',
    paypal_secret: paymentSettings.paypal_secret || '',
    paypal_mode: paymentSettings.paypal_mode || 'sandbox',
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

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.put('/admin/payment-settings', settingsFormData);
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
          
          <form onSubmit={handleSettingsSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  PayPal Client ID
                </label>
                <input
                  type="text"
                  value={settingsFormData.paypal_client_id}
                  onChange={(e) => setSettingsFormData(prev => ({ ...prev, paypal_client_id: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter PayPal Client ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  PayPal Secret
                </label>
                <input
                  type="password"
                  value={settingsFormData.paypal_secret}
                  onChange={(e) => setSettingsFormData(prev => ({ ...prev, paypal_secret: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter PayPal Secret"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                PayPal Mode
              </label>
              <select
                value={settingsFormData.paypal_mode}
                onChange={(e) => setSettingsFormData(prev => ({ ...prev, paypal_mode: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="sandbox">Sandbox (Testing)</option>
                <option value="live">Live (Production)</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save PayPal Settings
              </button>
            </div>
          </form>
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
