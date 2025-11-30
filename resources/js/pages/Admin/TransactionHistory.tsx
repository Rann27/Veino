import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

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

export default function TransactionHistory({ 
  coinPurchases, 
  membershipPurchases, 
  ebookPurchases 
}: TransactionHistoryProps) {
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
    const statusColors = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      refunded: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentMethodBadge = (method: string) => {
    const methodColors: Record<string, string> = {
      paypal: 'bg-blue-50 text-blue-700 border-blue-200',
      cryptomus: 'bg-purple-50 text-purple-700 border-purple-200',
      coins: 'bg-amber-50 text-amber-700 border-amber-200',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${methodColors[method.toLowerCase()] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
        {method.charAt(0).toUpperCase() + method.slice(1)}
      </span>
    );
  };

  const formatAmount = (amount: string | number) => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return numAmount.toFixed(2);
  };

  const tabs = [
    { id: 'coins' as const, label: 'Coin Purchases', count: coinPurchases.total, icon: '💰' },
    { id: 'membership' as const, label: 'Membership', count: membershipPurchases.total, icon: '💎' },
    { id: 'ebook' as const, label: 'Ebook Purchases', count: ebookPurchases.total, icon: '📚' },
  ];

  return (
    <AdminLayout title="Transaction History">
      <Head title="Transaction History - Admin" />

      <div className="bg-white shadow rounded-lg">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-6 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`
                  ml-2 py-0.5 px-2.5 rounded-full text-xs font-semibold
                  ${activeTab === tab.id
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Coin Purchases Tab */}
        {activeTab === 'coins' && (
          <div className="p-6">
            {coinPurchases.data.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {coinPurchases.data.map((purchase) => (
                  <div 
                    key={purchase.id} 
                    className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {purchase.user.display_name || purchase.user.name}
                          </h3>
                          {getStatusBadge(purchase.status)}
                        </div>
                        <p className="text-sm text-gray-600">{purchase.user.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-amber-600">
                          ${formatAmount(purchase.price_usd)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(purchase.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                          Coins Purchased
                        </div>
                        <div className="text-sm font-semibold text-amber-600">
                          ¢{purchase.coins_amount.toLocaleString()}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                          Package
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {purchase.coin_package?.name || 'N/A'}
                        </div>
                        {purchase.coin_package?.bonus_premium_days && purchase.coin_package.bonus_premium_days > 0 && (
                          <div className="text-xs text-purple-600 mt-0.5">
                            +{purchase.coin_package.bonus_premium_days}d Premium
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                          Payment Method
                        </div>
                        <div>{getPaymentMethodBadge(purchase.payment_method)}</div>
                        {purchase.transaction_id && (
                          <div className="text-xs text-gray-500 mt-1 font-mono">
                            {purchase.transaction_id.substring(0, 20)}...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <span className="text-6xl">💰</span>
                <h3 className="mt-4 text-sm font-medium text-gray-900">No coin purchases yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Coin top-up transactions will appear here.
                </p>
              </div>
            )}

            {coinPurchases.last_page > 1 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing page {coinPurchases.current_page} of {coinPurchases.last_page}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Membership Purchases Tab */}
        {activeTab === 'membership' && (
          <div className="p-6">
            {membershipPurchases.data.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {membershipPurchases.data.map((purchase) => (
                  <div 
                    key={purchase.id} 
                    className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {purchase.user.display_name || purchase.user.name}
                          </h3>
                          {getStatusBadge(purchase.status)}
                        </div>
                        <p className="text-sm text-gray-600">{purchase.user.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">
                          ¢{typeof purchase.amount_usd === 'number' ? purchase.amount_usd.toLocaleString() : parseFloat(purchase.amount_usd).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(purchase.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                          Invoice Number
                        </div>
                        <div className="text-sm font-mono font-semibold text-gray-900">
                          {purchase.invoice_number}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                          Package
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {purchase.membership_package?.name || 'Legacy Package'}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {purchase.duration_days} days
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                          Tier
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                          {purchase.tier.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <span className="text-6xl">💎</span>
                <h3 className="mt-4 text-sm font-medium text-gray-900">No membership purchases yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Membership transactions will appear here.
                </p>
              </div>
            )}

            {membershipPurchases.last_page > 1 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing page {membershipPurchases.current_page} of {membershipPurchases.last_page}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ebook Purchases Tab */}
        {activeTab === 'ebook' && (
          <div className="p-6">
            {ebookPurchases.data.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {ebookPurchases.data.map((purchase) => (
                  <div 
                    key={purchase.id} 
                    className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {purchase.user.display_name || purchase.user.name}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600">{purchase.user.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ¢{purchase.price_paid.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(purchase.purchased_at || purchase.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                          Ebook Series
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {purchase.ebook_item.ebook_series.title}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                          Item
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {purchase.ebook_item.title}
                        </div>
                        {purchase.ebook_item.volume_number && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            Volume {purchase.ebook_item.volume_number}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <span className="text-6xl">📚</span>
                <h3 className="mt-4 text-sm font-medium text-gray-900">No ebook purchases yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Ebook transactions will appear here.
                </p>
              </div>
            )}

            {ebookPurchases.last_page > 1 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing page {ebookPurchases.current_page} of {ebookPurchases.last_page}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
