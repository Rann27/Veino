import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';

interface MembershipPurchase {
  id: number;
  user: {
    id: number;
    name: string;
    display_name: string;
    email: string;
  };
  membership_package: {
    id: number;
    name: string;
    price_usd: string | number;
    duration_days: number;
  };
  invoice_number: string;
  tier: string;
  duration_days: number;
  amount_usd: number | string;
  payment_method: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PaginatedData<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface TransactionHistoryProps {
  membershipPurchases: PaginatedData<MembershipPurchase>;
}

export default function TransactionHistory({ membershipPurchases }: TransactionHistoryProps) {
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
      refunded: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentMethodBadge = (method: string) => {
    const methodColors = {
      paypal: 'bg-blue-50 text-blue-700 border-blue-200',
      cryptomus: 'bg-purple-50 text-purple-700 border-purple-200',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${methodColors[method.toLowerCase() as keyof typeof methodColors] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
        {method.charAt(0).toUpperCase() + method.slice(1)}
      </span>
    );
  };

  const formatAmount = (amount: string | number) => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return numAmount.toFixed(2);
  };

  return (
    <AdminLayout title="Transaction History">
      <Head title="Transaction History - Admin" />

      <div className="bg-white shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Membership Purchase History</h2>
              <p className="mt-1 text-sm text-gray-600">
                Total {membershipPurchases.total} transactions
              </p>
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div className="p-6">
          {membershipPurchases.data.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {membershipPurchases.data.map((purchase) => (
                <div 
                  key={purchase.id} 
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white"
                >
                  {/* Header Row */}
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
                        ${formatAmount(purchase.amount_usd)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(purchase.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                    {/* Invoice */}
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                        Invoice Number
                      </div>
                      <div className="text-sm font-mono font-semibold text-gray-900">
                        {purchase.invoice_number}
                      </div>
                    </div>

                    {/* Package */}
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                        Membership Package
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {purchase.membership_package.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {purchase.duration_days} days
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                        Payment Method
                      </div>
                      <div>
                        {getPaymentMethodBadge(purchase.payment_method)}
                      </div>
                    </div>
                  </div>

                  {/* Tier Badge */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-50 text-purple-700">
                      {purchase.tier.toUpperCase()} Tier
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Membership purchase transactions will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {membershipPurchases.last_page > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {membershipPurchases.current_page} of {membershipPurchases.last_page}
              </div>
              <div className="flex gap-2">
                {/* Add pagination buttons here if needed */}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
