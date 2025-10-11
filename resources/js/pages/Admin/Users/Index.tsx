import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface User {
  id: number;
  display_name: string;
  email: string;
  role: string;
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [durationDays, setDurationDays] = useState('');

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
                  <div className="flex space-x-2">
                    {user.is_banned ? (
                      <button
                        onClick={() => handleUnbanUser(user)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Unban
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBanUser(user)}
                        className="text-red-600 hover:text-red-900"
                        disabled={user.role === 'admin'}
                      >
                        Ban
                      </button>
                    )}
                    <button
                      onClick={() => openAddMembershipModal(user)}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      Add Membership
                    </button>
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
    </AdminLayout>
  );
}
