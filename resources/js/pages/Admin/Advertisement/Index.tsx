import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';

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
  links: Array<{ url?: string; label: string; active: boolean }>;
}

interface AdvertisementIndexProps {
  advertisements: PaginatedData<Advertisement>;
  filters: { status?: string; unit_type?: string };
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

function AdvertisementContent({ advertisements, filters }: AdvertisementIndexProps) {
  const { currentTheme } = useTheme();
  const light   = isLight(currentTheme.background);
  const fg      = currentTheme.foreground;
  const muted   = wa(fg, 0.45);
  const border  = wa(fg, 0.12);
  const cardBg  = light ? wa(fg, 0.03) : wa(fg, 0.06);
  const panelBg = light ? wa(fg, 0.06) : wa(fg, 0.09);
  const inputBg = light ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)';
  const accent  = light ? '#2563eb' : '#60a5fa';

  const [showAddModal, setShowAddModal]       = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedAd, setSelectedAd]           = useState<Advertisement | null>(null);
  const [statusFilter, setStatusFilter]       = useState(filters.status || 'all');
  const [typeFilter, setTypeFilter]           = useState(filters.unit_type || 'all');

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
    const params: Record<string, string> = {};
    if (filterType === 'status') {
      setStatusFilter(value);
      if (value !== 'all') params.status = value;
      if (typeFilter !== 'all') params.unit_type = typeFilter;
    } else {
      setTypeFilter(value);
      if (value !== 'all') params.unit_type = value;
      if (statusFilter !== 'all') params.status = statusFilter;
    }
    router.get('/admin/advertisement-management', params, { preserveState: true, replace: true });
  };

  const openAddModal = () => {
    setFormData({ advertiser_name: '', unit_type: 'banner', file_desktop: null, file_mobile: null, link_url: '', link_caption: '', expired_at: '' });
    setShowAddModal(true);
  };

  const openEditModal = (ad: Advertisement) => {
    setSelectedAd(ad);
    setFormData({ advertiser_name: ad.advertiser_name, unit_type: ad.unit_type, file_desktop: null, file_mobile: null, link_url: ad.link_url, link_caption: ad.link_caption || '', expired_at: ad.expired_at.substring(0, 16) });
    setShowEditModal(true);
  };

  const openPreviewModal = (ad: Advertisement) => { setSelectedAd(ad); setShowPreviewModal(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append('advertiser_name', formData.advertiser_name);
    submitData.append('unit_type', formData.unit_type);
    if (formData.file_desktop) submitData.append('file_desktop', formData.file_desktop);
    if (formData.file_mobile) submitData.append('file_mobile', formData.file_mobile);
    submitData.append('link_url', formData.link_url);
    if (formData.link_caption) submitData.append('link_caption', formData.link_caption);
    submitData.append('expired_at', formData.expired_at);

    if (showEditModal && selectedAd) {
      router.post(`/admin/advertisements/${selectedAd.id}`, { _method: 'PUT', ...Object.fromEntries(submitData) }, {
        forceFormData: true,
        onSuccess: () => { setShowEditModal(false); setSelectedAd(null); },
      });
    } else {
      router.post('/admin/advertisements', submitData, {
        forceFormData: true,
        onSuccess: () => { setShowAddModal(false); },
      });
    }
  };

  const handleDelete = (ad: Advertisement) => {
    if (confirm(`Are you sure you want to delete advertisement from "${ad.advertiser_name}"?`)) {
      router.delete(`/admin/advertisements/${ad.id}`);
    }
  };

  const closeModal = () => { setShowAddModal(false); setShowEditModal(false); setSelectedAd(null); };

  const getStatusBadge = (ad: Advertisement) => {
    if (ad.is_expired) {
      return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>Expired</span>;
    }
    return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>Active</span>;
  };

  const getUnitTypeBadge = (type: string) => {
    const s: Record<string, { bg: string; color: string; bdr: string }> = {
      banner:       { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', bdr: 'rgba(59,130,246,0.3)' },
      interstitial: { bg: 'rgba(168,85,247,0.12)', color: '#a855f7', bdr: 'rgba(168,85,247,0.3)' },
      in_text_link: { bg: 'rgba(249,115,22,0.12)', color: '#f97316', bdr: 'rgba(249,115,22,0.3)' },
    };
    const c = s[type] || s.banner;
    return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, background: c.bg, color: c.color, border: `1px solid ${c.bdr}` }}>{type === 'in_text_link' ? 'In-Text Link' : type.charAt(0).toUpperCase() + type.slice(1)}</span>;
  };

  const inputStyle: React.CSSProperties = {
    display: 'block', width: '100%', padding: '8px 12px',
    background: inputBg, color: fg, border: `1px solid ${border}`,
    borderRadius: '6px', fontSize: '14px', outline: 'none',
  };

  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: fg, marginBottom: '6px' };
  const hintStyle:  React.CSSProperties = { marginTop: '4px', fontSize: '11px', color: muted };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: fg }}>Advertisement Management</h1>
          <p style={{ marginTop: '4px', fontSize: '13px', color: muted }}>Manage your self-hosted advertisements</p>
        </div>
        <button
          onClick={openAddModal}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
        >
          <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Ad
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '10px', padding: '16px' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Filter by Status</label>
            <select value={statusFilter} onChange={(e) => handleFilterChange('status', e.target.value)} style={selectStyle}>
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="expired">Expired Only</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Filter by Unit Type</label>
            <select value={typeFilter} onChange={(e) => handleFilterChange('unit_type', e.target.value)} style={selectStyle}>
              <option value="all">All Types</option>
              <option value="banner">Banner</option>
              <option value="interstitial">Interstitial</option>
              <option value="in_text_link">In-Text Link</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Ads', value: advertisements.total, color: fg },
          { label: 'Active Ads', value: advertisements.data.filter(ad => !ad.is_expired).length, color: '#22c55e' },
          { label: 'Total Clicks', value: advertisements.data.reduce((s, a) => s + a.clicks, 0).toLocaleString(), color: '#3b82f6' },
          { label: 'Total Impressions', value: advertisements.data.reduce((s, a) => s + a.impressions, 0).toLocaleString(), color: '#a855f7' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: muted }}>{stat.label}</div>
            <div style={{ marginTop: '4px', fontSize: '24px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: panelBg }}>
                {['Advertiser', 'Unit Type', 'Expired At', 'Performance', 'Status', ''].map((h) => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: h === '' ? 'right' : 'left', fontSize: '11px', fontWeight: 600, color: muted, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {advertisements.data.length > 0 ? (
                advertisements.data.map((ad, idx) => (
                  <tr key={ad.id} style={{ background: idx % 2 === 0 ? 'transparent' : wa(fg, 0.02), transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = wa(fg, 0.05))}
                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : wa(fg, 0.02))}>
                    <td style={{ padding: '14px 20px', borderBottom: `1px solid ${border}` }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: fg }}>{ad.advertiser_name}</div>
                      <div style={{ fontSize: '11px', color: muted }}>ID: {ad.id}</div>
                    </td>
                    <td style={{ padding: '14px 20px', borderBottom: `1px solid ${border}` }}>{getUnitTypeBadge(ad.unit_type)}</td>
                    <td style={{ padding: '14px 20px', borderBottom: `1px solid ${border}` }}>
                      <div style={{ fontSize: '13px', color: fg }}>
                        {new Date(ad.expired_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '11px', color: muted }}>
                        {new Date(ad.expired_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', borderBottom: `1px solid ${border}` }}>
                      <div style={{ fontSize: '12px', color: fg, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div> {ad.impressions.toLocaleString()} views</div>
                        <div> {ad.clicks.toLocaleString()} clicks</div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', borderBottom: `1px solid ${border}` }}>{getStatusBadge(ad)}</td>
                    <td style={{ padding: '14px 20px', borderBottom: `1px solid ${border}`, textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                        <button onClick={() => openPreviewModal(ad)} title="View" style={{ color: accent, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                          <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button onClick={() => openEditModal(ad)} title="Edit" style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                          <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(ad)} title="Delete" style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                          <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <svg style={{ width: '48px', height: '48px', color: muted, margin: '0 auto' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 style={{ marginTop: '8px', fontSize: '13px', fontWeight: 500, color: fg }}>No advertisements</h3>
                    <p style={{ marginTop: '4px', fontSize: '13px', color: muted }}>Get started by creating a new advertisement.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {advertisements.last_page > 1 && (
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '13px', color: muted }}>
              Showing page {advertisements.current_page} of {advertisements.last_page}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {advertisements.links.map((link, index) => (
                <button
                  key={index}
                  onClick={() => link.url && router.get(link.url)}
                  disabled={!link.url}
                  style={{
                    padding: '4px 10px', fontSize: '13px', borderRadius: '6px', cursor: link.url ? 'pointer' : 'not-allowed', opacity: link.url ? 1 : 0.4,
                    background: link.active ? '#2563eb' : panelBg,
                    color: link.active ? '#fff' : fg,
                    border: `1px solid ${link.active ? '#2563eb' : border}`,
                  }}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', overflowY: 'auto', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '80px', paddingBottom: '40px' }}>
          <div style={{ background: currentTheme.background, border: `1px solid ${border}`, borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '640px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ color: fg, fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {showEditModal ? 'Edit Advertisement' : 'Add New Advertisement'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Advertiser Name *</label>
                <input type="text" value={formData.advertiser_name} onChange={(e) => setFormData(p => ({ ...p, advertiser_name: e.target.value }))} style={inputStyle} placeholder="e.g., Company Name" required />
              </div>

              <div>
                <label style={labelStyle}>Unit Type *</label>
                <select value={formData.unit_type} onChange={(e) => setFormData(p => ({ ...p, unit_type: e.target.value }))} style={selectStyle} required>
                  <option value="banner">Banner</option>
                  <option value="interstitial">Interstitial</option>
                  <option value="in_text_link">In-Text Link</option>
                </select>
              </div>

              {(formData.unit_type === 'banner' || formData.unit_type === 'interstitial') && (
                <>
                  <div>
                    <label style={labelStyle}>Upload Desktop Image {showAddModal && '(Recommended)'}</label>
                    <input type="file" accept=".jpg,.jpeg,.gif" onChange={(e) => setFormData(p => ({ ...p, file_desktop: e.target.files?.[0] || null }))} style={{ ...inputStyle, cursor: 'pointer' }} />
                    <p style={hintStyle}>For desktop/tablet view  JPG/GIF  Max 5MB  Recommended: 728x90 or 970x250</p>
                    {showEditModal && selectedAd?.file_url_desktop && (
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={selectedAd.file_url_desktop} alt="Desktop preview" style={{ height: '48px', borderRadius: '4px', border: `1px solid ${border}` }} />
                        <p style={{ fontSize: '11px', color: accent }}>Current desktop file</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={labelStyle}>Upload Mobile Image {showAddModal && '(Recommended)'}</label>
                    <input type="file" accept=".jpg,.jpeg,.gif" onChange={(e) => setFormData(p => ({ ...p, file_mobile: e.target.files?.[0] || null }))} style={{ ...inputStyle, cursor: 'pointer' }} />
                    <p style={hintStyle}>For mobile view  JPG/GIF  Max 5MB  Recommended: 320x50 or 300x250</p>
                    {showEditModal && selectedAd?.file_url_mobile && (
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={selectedAd.file_url_mobile} alt="Mobile preview" style={{ height: '48px', borderRadius: '4px', border: `1px solid ${border}` }} />
                        <p style={{ fontSize: '11px', color: '#22c55e' }}>Current mobile file</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div>
                <label style={labelStyle}>Destination URL *</label>
                <input type="url" value={formData.link_url} onChange={(e) => setFormData(p => ({ ...p, link_url: e.target.value }))} style={inputStyle} placeholder="https://example.com" required />
              </div>

              {formData.unit_type === 'in_text_link' && (
                <div>
                  <label style={labelStyle}>Link Caption *</label>
                  <input type="text" value={formData.link_caption} onChange={(e) => setFormData(p => ({ ...p, link_caption: e.target.value }))} style={inputStyle} placeholder="e.g., Check out this product" required />
                </div>
              )}

              <div>
                <label style={labelStyle}>Expires At *</label>
                <input type="datetime-local" value={formData.expired_at} onChange={(e) => setFormData(p => ({ ...p, expired_at: e.target.value }))} style={inputStyle} required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
                <button type="button" onClick={closeModal} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: fg, background: panelBg, border: `1px solid ${border}`, borderRadius: '6px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#fff', background: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  {showEditModal ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedAd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', overflowY: 'auto', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '80px', paddingBottom: '40px' }}>
          <div style={{ background: currentTheme.background, border: `1px solid ${border}`, borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '720px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ color: fg, fontSize: '18px', fontWeight: 600 }}>Advertisement Preview</h3>
              <button onClick={() => setShowPreviewModal(false)} style={{ color: muted, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Ad Info */}
              <div style={{ background: panelBg, borderRadius: '10px', padding: '16px' }}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: muted, marginBottom: '4px' }}>Advertiser</div>
                    <div style={{ fontSize: '13px', color: fg }}>{selectedAd.advertiser_name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: muted, marginBottom: '4px' }}>Unit Type</div>
                    <div>{getUnitTypeBadge(selectedAd.unit_type)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: muted, marginBottom: '4px' }}>Destination URL</div>
                    <a href={selectedAd.link_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: accent, textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedAd.link_url}
                    </a>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: muted, marginBottom: '4px' }}>Status</div>
                    <div>{getStatusBadge(selectedAd)}</div>
                  </div>
                </div>
              </div>

              {/* Preview Content */}
              <div style={{ border: `2px dashed ${border}`, borderRadius: '10px', padding: '24px' }}>
                {selectedAd.unit_type === 'in_text_link' ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: muted, marginBottom: '8px' }}>In-Text Link Preview:</div>
                    <a href={selectedAd.link_url} target="_blank" rel="noopener noreferrer sponsored" style={{ color: accent, fontWeight: 500 }}>
                      {selectedAd.link_caption}
                    </a>
                  </div>
                ) : (selectedAd.file_url_desktop || selectedAd.file_url_mobile) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: fg, textAlign: 'center' }}>
                      {selectedAd.unit_type === 'banner' ? 'Banner' : 'Interstitial'} Preview
                    </div>
                    {selectedAd.file_url_desktop && (
                      <div>
                        <div style={{ fontSize: '11px', color: muted, textAlign: 'center', marginBottom: '8px' }}>Desktop Version:</div>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <img src={selectedAd.file_url_desktop} alt={`${selectedAd.advertiser_name} - Desktop`} style={{ maxWidth: '100%', maxHeight: '256px', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', border: '2px solid rgba(59,130,246,0.3)' }} />
                        </div>
                      </div>
                    )}
                    {selectedAd.file_url_mobile && (
                      <div>
                        <div style={{ fontSize: '11px', color: muted, textAlign: 'center', marginBottom: '8px' }}>Mobile Version:</div>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <img src={selectedAd.file_url_mobile} alt={`${selectedAd.advertiser_name} - Mobile`} style={{ maxWidth: '100%', maxHeight: '256px', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', border: '2px solid rgba(34,197,94,0.3)' }} />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: muted, fontSize: '13px' }}>No preview available</div>
                )}
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#3b82f6' }}>Impressions</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#3b82f6' }}>{selectedAd.impressions.toLocaleString()}</div>
                </div>
                <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#22c55e' }}>Clicks</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#22c55e' }}>{selectedAd.clicks.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowPreviewModal(false)} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#fff', background: '#4b5563', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdvertisementIndex(props: AdvertisementIndexProps) {
  return (
    <AdminLayout title="Advertisement Management">
      <Head title="Advertisement Management" />
      <AdvertisementContent {...props} />
    </AdminLayout>
  );
}
