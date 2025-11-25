import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface User {
  id: number;
  display_name: string;
  email: string;
  role: string;
  coins: number;
  membership_tier: 'basic' | 'premium';
  membership_expires_at: string | null;
  is_banned: boolean;
  created_at: string;
}

interface UsersIndexProps {
  users: {
    data: User[];
    links: Array<{
      url?: string;
      label: string;
      active: boolean;
    }>;
  };
  search: string;
}

export default function UsersIndex({ users, search }: UsersIndexProps) {
  const [searchTerm, setSearchTerm] = useState(search || '');
  const [showAddMembershipModal, setShowAddMembershipModal] = useState(false);
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [coinModalType, setCoinModalType] = useState<'add' | 'deduct'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [durationDays, setDurationDays] = useState('');
  const [coinAmount, setCoinAmount] = useState('');
  const [coinReason, setCoinReason] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/admin/user-management', { search: searchTerm }, {
      preserveState: true,
      replace: true,
    });
  };

  const handleBanUser = (user: User) => {
    if (confirm(`Are you sure you want to ban ${user.display_name}?`)) {
      router.post(`/admin/users/${user.id}/ban`);
    }
  };

  const handleUnbanUser = (user: User) => {
    router.post(`/admin/users/${user.id}/unban`);
  };

  const openAddMembershipModal = (user: User) => {
    setSelectedUser(user);
    setDurationDays('');
    setShowAddMembershipModal(true);
  };

  const handleAddMembership = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser && durationDays) {
      router.post(`/admin/users/${selectedUser.id}/add-membership`, {
        duration_days: parseInt(durationDays)
      }, {
        onSuccess: () => setShowAddMembershipModal(false)
      });
    }
  };

  const openAddCoinsModal = (user: User) => {
    setSelectedUser(user);
    setCoinModalType('add');
    setCoinAmount('');
    setCoinReason('');
    setShowCoinModal(true);
  };

  const openDeductCoinsModal = (user: User) => {
    setSelectedUser(user);
    setCoinModalType('deduct');
    setCoinAmount('');
    setCoinReason('');
    setShowCoinModal(true);
  };

  const handleCoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser && coinAmount) {
      const url = coinModalType === 'add'
        ? `/admin/users/${selectedUser.id}/add-coins`
        : `/admin/users/${selectedUser.id}/deduct-coins`;
      
      router.post(url, {
        amount: parseInt(coinAmount),
        reason: coinReason || undefined
      }, {
        onSuccess: () => {
          setShowCoinModal(false);
          setCoinAmount('');
          setCoinReason('');
        }
      });
    }
  };

  return (
    <AdminLayout title="User Management">
      <Head title="User Management" />

      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by display name or email..."
            className="flex-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                router.get('/admin/user-management');
              }}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Coins
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Membership
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.data.map((user) => (
              <tr key={user.id} className={user.is_banned ? 'bg-red-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.display_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-amber-600">
                    ¢{user.coins.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium w-fit ${
                      user.membership_tier === 'premium'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.membership_tier === 'premium' ? 'Premium' : 'Basic'}
                    </span>
                    {user.membership_tier === 'premium' && user.membership_expires_at && (
                      <span className="text-xs text-gray-500 mt-1">
                        Expires: {new Date(user.membership_expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    user.is_banned 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.is_banned ? 'Banned' : 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-col space-y-1">
                    <div className="flex space-x-2">
                      {user.is_banned ? (
                        <button
                          onClick={() => handleUnbanUser(user)}
                          className="text-green-600 hover:text-green-900 text-xs"
                        >
                          Unban
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBanUser(user)}
                          className="text-red-600 hover:text-red-900 text-xs"
                          disabled={user.role === 'admin'}
                        >
                          Ban
                        </button>
                      )}
                      <button
                        onClick={() => openAddMembershipModal(user)}
                        className="text-purple-600 hover:text-purple-900 text-xs"
                      >
                        + Membership
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openAddCoinsModal(user)}
                        className="text-green-600 hover:text-green-900 text-xs"
                      >
                        + Coins
                      </button>
                      <button
                        onClick={() => openDeductCoinsModal(user)}
                        className="text-orange-600 hover:text-orange-900 text-xs"
                        disabled={user.coins === 0}
                      >
                        - Coins
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.data.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {users.links.length > 3 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex space-x-2">
            {users.links.map((link, index) => (
              <button
                key={index}
                onClick={() => link.url && router.get(link.url)}
                className={`px-3 py-2 text-sm rounded-md ${
                  link.active
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } ${!link.url ? 'cursor-not-allowed opacity-50' : ''}`}
                disabled={!link.url}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </nav>
        </div>
      )}

      {/* Add Membership Modal */}
      {showAddMembershipModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add Premium Membership to {selectedUser.display_name}
              </h3>
              <form onSubmit={handleAddMembership} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Status: {' '}
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedUser.membership_tier === 'premium'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedUser.membership_tier === 'premium' ? 'Premium' : 'Basic'}
                    </span>
                  </label>
                  {selectedUser.membership_tier === 'premium' && selectedUser.membership_expires_at && (
                    <p className="text-sm text-gray-500">
                      Expires: {new Date(selectedUser.membership_expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    placeholder="Enter number of days"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Common: 30 (1 month), 90 (3 months), 365 (1 year)
                  </p>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddMembershipModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md"
                  >
                    Confirm
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add/Deduct Coins Modal */}
      {showCoinModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {coinModalType === 'add' ? 'Add Coins to' : 'Deduct Coins from'} {selectedUser.display_name}
              </h3>
              <form onSubmit={handleCoinSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Balance: {' '}
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      ¢{selectedUser.coins.toLocaleString()}
                    </span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={coinModalType === 'deduct' ? selectedUser.coins : 1000000}
                    value={coinAmount}
                    onChange={(e) => setCoinAmount(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    placeholder={coinModalType === 'add' ? 'Enter coins to add' : 'Enter coins to deduct'}
                    required
                  />
                  {coinModalType === 'deduct' && selectedUser.coins > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      Maximum: ¢{selectedUser.coins.toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={coinReason}
                    onChange={(e) => setCoinReason(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    placeholder="e.g., Compensation, Event reward, etc."
                    maxLength={255}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Will appear in user's transaction history
                  </p>
                </div>

                {/* Preview */}
                {coinAmount && (
                  <div className={`rounded-md p-3 ${
                    coinModalType === 'add' ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'
                  }`}>
                    <div className="flex items-center">
                      <svg className={`w-4 h-4 mr-2 ${
                        coinModalType === 'add' ? 'text-green-600' : 'text-orange-600'
                      }`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className={`text-sm font-medium ${
                        coinModalType === 'add' ? 'text-green-800' : 'text-orange-800'
                      }`}>
                        New Balance: ¢
                        {coinModalType === 'add'
                          ? (selectedUser.coins + parseInt(coinAmount)).toLocaleString()
                          : (selectedUser.coins - parseInt(coinAmount)).toLocaleString()
                        }
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCoinModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                      coinModalType === 'add'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-orange-600 hover:bg-orange-700'
                    }`}
                  >
                    {coinModalType === 'add' ? 'Add Coins' : 'Deduct Coins'}
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
