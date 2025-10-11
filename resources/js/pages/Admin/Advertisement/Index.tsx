import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface Advertisement {
  id: number;
  advertiser_name: string;
  unit_type: 'banner' | 'interstitial' | 'in_text_link';
  unit_type_display: string;
  file_path_desktop: string | null;
  file_path_mobile: string | null;
  file_url_desktop: string | null;
  file_url_mobile: string | null;
  link_url: string;
  link_caption: string | null;
  expired_at: string;
  clicks: number;
  impressions: number;
  is_active: boolean;
  is_expired: boolean;
  status: 'active' | 'expired';
  created_at: string;
}

interface PaginatedData<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: Array<{
    url?: string;
    label: string;
    active: boolean;
  }>;
}

interface AdvertisementIndexProps {
  advertisements: PaginatedData<Advertisement>;
  filters: {
    status?: string;
    unit_type?: string;
  };
}

export default function AdvertisementIndex({ advertisements, filters }: AdvertisementIndexProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
  const [typeFilter, setTypeFilter] = useState(filters.unit_type || 'all');

  const [formData, setFormData] = useState({
    advertiser_name: '',
    unit_type: 'banner',
    file_desktop: null as File | null,
    file_mobile: null as File | null,
    link_url: '',
    link_caption: '',
    expired_at: '',
  });

  const handleFilterChange = (filterType: string, value: string) => {
    const params: any = {};
    
    if (filterType === 'status') {
      setStatusFilter(value);
      if (value !== 'all') params.status = value;
      if (typeFilter !== 'all') params.unit_type = typeFilter;
    } else {
      setTypeFilter(value);
      if (value !== 'all') params.unit_type = value;
      if (statusFilter !== 'all') params.status = statusFilter;
    }

    router.get('/admin/advertisement-management', params, {
      preserveState: true,
      replace: true,
    });
  };

  const openAddModal = () => {
    setFormData({
      advertiser_name: '',
      unit_type: 'banner',
      file_desktop: null,
      file_mobile: null,
      link_url: '',
      link_caption: '',
      expired_at: '',
    });
    setShowAddModal(true);
  };

  const openEditModal = (ad: Advertisement) => {
    setSelectedAd(ad);
    setFormData({
      advertiser_name: ad.advertiser_name,
      unit_type: ad.unit_type,
      file_desktop: null,
      file_mobile: null,
      link_url: ad.link_url,
      link_caption: ad.link_caption || '',
      expired_at: ad.expired_at.substring(0, 16), // Format for datetime-local
    });
    setShowEditModal(true);
  };

  const openPreviewModal = (ad: Advertisement) => {
    setSelectedAd(ad);
    setShowPreviewModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = new FormData();
    submitData.append('advertiser_name', formData.advertiser_name);
    submitData.append('unit_type', formData.unit_type);
    if (formData.file_desktop) {
      submitData.append('file_desktop', formData.file_desktop);
    }
    if (formData.file_mobile) {
      submitData.append('file_mobile', formData.file_mobile);
    }
    submitData.append('link_url', formData.link_url);
    if (formData.link_caption) {
      submitData.append('link_caption', formData.link_caption);
    }
    submitData.append('expired_at', formData.expired_at);

    if (showEditModal && selectedAd) {
      router.post(`/admin/advertisements/${selectedAd.id}`, {
        _method: 'PUT',
        ...Object.fromEntries(submitData),
      }, {
        forceFormData: true,
        onSuccess: () => {
          setShowEditModal(false);
          setSelectedAd(null);
        },
      });
    } else {
      router.post('/admin/advertisements', submitData, {
        forceFormData: true,
        onSuccess: () => {
          setShowAddModal(false);
        },
      });
    }
  };

  const handleDelete = (ad: Advertisement) => {
    if (confirm(`Are you sure you want to delete advertisement from "${ad.advertiser_name}"?`)) {
      router.delete(`/admin/advertisements/${ad.id}`);
    }
  };

  const getStatusBadge = (ad: Advertisement) => {
    if (ad.is_expired) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
        Active
      </span>
    );
  };

  const getUnitTypeBadge = (type: string) => {
    const colors = {
      banner: 'bg-blue-100 text-blue-800 border-blue-200',
      interstitial: 'bg-purple-100 text-purple-800 border-purple-200',
      in_text_link: 'bg-orange-100 text-orange-800 border-orange-200',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${colors[type as keyof typeof colors]}`}>
        {type === 'in_text_link' ? 'In-Text Link' : type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  return (
    <AdminLayout title="Advertisement Management">
      <Head title="Advertisement Management" />

      <div className="space-y-6">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Advertisement Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your self-hosted advertisements
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Ad
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="expired">Expired Only</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Unit Type</label>
              <select
                value={typeFilter}
                onChange={(e) => handleFilterChange('unit_type', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="banner">Banner</option>
                <option value="interstitial">Interstitial</option>
                <option value="in_text_link">In-Text Link</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500">Total Ads</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{advertisements.total}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500">Active Ads</div>
            <div className="mt-1 text-2xl font-semibold text-green-600">
              {advertisements.data.filter(ad => !ad.is_expired).length}
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500">Total Clicks</div>
            <div className="mt-1 text-2xl font-semibold text-blue-600">
              {advertisements.data.reduce((sum, ad) => sum + ad.clicks, 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500">Total Impressions</div>
            <div className="mt-1 text-2xl font-semibold text-purple-600">
              {advertisements.data.reduce((sum, ad) => sum + ad.impressions, 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Advertisements Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Advertiser
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expired At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {advertisements.data.length > 0 ? (
                advertisements.data.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{ad.advertiser_name}</div>
                      <div className="text-xs text-gray-500">ID: {ad.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getUnitTypeBadge(ad.unit_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(ad.expired_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(ad.expired_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        <div>👁️ {ad.impressions.toLocaleString()} views</div>
                        <div>👆 {ad.clicks.toLocaleString()} clicks</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(ad)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openPreviewModal(ad)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Ad"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openEditModal(ad)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(ad)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No advertisements</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by creating a new advertisement.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {advertisements.last_page > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {advertisements.current_page} of {advertisements.last_page}
                </div>
                <div className="flex space-x-2">
                  {advertisements.links.map((link, index) => (
                    <button
                      key={index}
                      onClick={() => link.url && router.get(link.url)}
                      disabled={!link.url}
                      className={`px-3 py-1 text-sm rounded-md ${
                        link.active
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      } ${!link.url ? 'cursor-not-allowed opacity-50' : ''}`}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {showEditModal ? 'Edit Advertisement' : 'Add New Advertisement'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Advertiser Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Advertiser Name *
                  </label>
                  <input
                    type="text"
                    value={formData.advertiser_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, advertiser_name: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Company Name"
                    required
                  />
                </div>

                {/* Unit Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Type *
                  </label>
                  <select
                    value={formData.unit_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit_type: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="banner">Banner</option>
                    <option value="interstitial">Interstitial</option>
                    <option value="in_text_link">In-Text Link</option>
                  </select>
                </div>

                {/* File Upload Desktop (for banner and interstitial) */}
                {(formData.unit_type === 'banner' || formData.unit_type === 'interstitial') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Desktop Image {showAddModal && '(Recommended)'}
                      </label>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.gif"
                        onChange={(e) => setFormData(prev => ({ ...prev, file_desktop: e.target.files?.[0] || null }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        For desktop/tablet view • JPG/GIF • Max 5MB • Recommended: 728x90 or 970x250
                      </p>
                      {showEditModal && selectedAd?.file_url_desktop && (
                        <div className="mt-2 flex items-center gap-2">
                          <img src={selectedAd.file_url_desktop} alt="Desktop preview" className="h-12 rounded border" />
                          <p className="text-xs text-blue-600">Current desktop file</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Mobile Image {showAddModal && '(Recommended)'}
                      </label>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.gif"
                        onChange={(e) => setFormData(prev => ({ ...prev, file_mobile: e.target.files?.[0] || null }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        For mobile view • JPG/GIF • Max 5MB • Recommended: 320x50 or 300x250
                      </p>
                      {showEditModal && selectedAd?.file_url_mobile && (
                        <div className="mt-2 flex items-center gap-2">
                          <img src={selectedAd.file_url_mobile} alt="Mobile preview" className="h-12 rounded border" />
                          <p className="text-xs text-blue-600">Current mobile file</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Link URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination URL *
                  </label>
                  <input
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com"
                    required
                  />
                </div>

                {/* Link Caption (for in-text link) */}
                {formData.unit_type === 'in_text_link' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Link Caption *
                    </label>
                    <input
                      type="text"
                      value={formData.link_caption}
                      onChange={(e) => setFormData(prev => ({ ...prev, link_caption: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Check out this product"
                      required={formData.unit_type === 'in_text_link'}
                    />
                  </div>
                )}

                {/* Expired At */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expires At *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expired_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, expired_at: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedAd(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                  >
                    {showEditModal ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedAd && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Advertisement Preview
                </h3>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Ad Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-medium text-gray-500">Advertiser</div>
                      <div className="text-sm text-gray-900">{selectedAd.advertiser_name}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500">Unit Type</div>
                      <div className="text-sm">{getUnitTypeBadge(selectedAd.unit_type)}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500">Destination URL</div>
                      <a 
                        href={selectedAd.link_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate block"
                      >
                        {selectedAd.link_url}
                      </a>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500">Status</div>
                      <div className="text-sm">{getStatusBadge(selectedAd)}</div>
                    </div>
                  </div>
                </div>

                {/* Preview Content */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {selectedAd.unit_type === 'in_text_link' ? (
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">In-Text Link Preview:</div>
                      <a 
                        href={selectedAd.link_url}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {selectedAd.link_caption}
                      </a>
                    </div>
                  ) : (selectedAd.file_url_desktop || selectedAd.file_url_mobile) ? (
                    <div className="space-y-6">
                      <div className="text-sm font-medium text-gray-700 text-center">
                        {selectedAd.unit_type === 'banner' ? 'Banner' : 'Interstitial'} Preview
                      </div>
                      
                      {/* Desktop Preview */}
                      {selectedAd.file_url_desktop && (
                        <div>
                          <div className="text-xs text-gray-500 mb-2 text-center">Desktop Version:</div>
                          <div className="flex justify-center">
                            <img 
                              src={selectedAd.file_url_desktop} 
                              alt={`${selectedAd.advertiser_name} - Desktop`}
                              className="max-w-full max-h-64 rounded-lg shadow-lg border-2 border-blue-200"
                            />
                          </div>
                        </div>
                      )}

                      {/* Mobile Preview */}
                      {selectedAd.file_url_mobile && (
                        <div>
                          <div className="text-xs text-gray-500 mb-2 text-center">Mobile Version:</div>
                          <div className="flex justify-center">
                            <img 
                              src={selectedAd.file_url_mobile} 
                              alt={`${selectedAd.advertiser_name} - Mobile`}
                              className="max-w-full max-h-64 rounded-lg shadow-lg border-2 border-green-200"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      No preview available
                    </div>
                  )}
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-xs font-medium text-blue-600">Impressions</div>
                    <div className="text-2xl font-bold text-blue-700">
                      {selectedAd.impressions.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-xs font-medium text-green-600">Clicks</div>
                    <div className="text-2xl font-bold text-green-700">
                      {selectedAd.clicks.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
