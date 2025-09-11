import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

interface CoinPurchase {
  id: number;
  user: {
    id: number;
    name: string;
  };
  coin_package: {
    id: number;
    name: string;
    coin_amount: number;
  };
  price_usd: number | string;
  status: string;
  created_at: string;
}

interface ChapterPurchase {
  id: number;
  user: {
    id: number;
    name: string;
  };
  chapter: {
    id: number;
    title: string;
    chapter_number: number;
    series: {
      id: number;
      title: string;
      slug: string;
    };
  };
  coin_price: number;
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
  chapterPurchases: PaginatedData<ChapterPurchase>;
}

export default function TransactionHistory({ coinPurchases, chapterPurchases }: TransactionHistoryProps) {
  const [activeTab, setActiveTab] = useState<'coins' | 'chapters'>('coins');

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
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <AdminLayout title="Transaction History">
      <Head title="Transaction History - Admin" />

      <div className="bg-white shadow rounded-lg">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('coins')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'coins'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Coin Purchases ({coinPurchases.total})
            </button>
            <button
              onClick={() => setActiveTab('chapters')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'chapters'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Chapter Purchases ({chapterPurchases.total})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'coins' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Coin Purchase History</h3>
              <div className="space-y-3">
                {coinPurchases.data.length > 0 ? (
                  coinPurchases.data.map((purchase) => (
                    <div key={purchase.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{purchase.user.name}</span> has bought{' '}
                          <span className="font-medium">{purchase.coin_package.name}</span>{' '}
                          <span className="font-medium">${(typeof purchase.price_usd === 'number' ? purchase.price_usd : parseFloat(purchase.price_usd) || 0).toFixed(2)}</span> at{' '}
                          <span className="text-gray-600">{formatDate(purchase.created_at)}</span>
                        </p>
                      </div>
                      <div className="ml-4">
                        {getStatusBadge(purchase.status)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No coin purchases found.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'chapters' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Chapter Purchase History</h3>
              <div className="space-y-3">
                {chapterPurchases.data.length > 0 ? (
                  chapterPurchases.data.map((purchase) => (
                    <div key={purchase.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{purchase.user.name}</span> has bought{' '}
                          <span className="font-medium">Chapter {purchase.chapter.chapter_number}</span> of{' '}
                          <span className="font-medium">{purchase.chapter.series.slug}</span> for{' '}
                          <span className="font-medium">{purchase.coin_price} Coins</span> at{' '}
                          <span className="text-gray-600">{formatDate(purchase.created_at)}</span>
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No chapter purchases found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
