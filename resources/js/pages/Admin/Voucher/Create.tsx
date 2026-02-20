import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTheme } from '@/Contexts/ThemeContext';

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

function VoucherCreateContent() {
    const { currentTheme } = useTheme();
    const light   = isLight(currentTheme.background);
    const fg      = currentTheme.foreground;
    const muted   = wa(fg, 0.45);
    const border  = wa(fg, 0.12);
    const cardBg  = light ? wa(fg, 0.03) : wa(fg, 0.06);
    const panelBg = light ? wa(fg, 0.06) : wa(fg, 0.09);
    const inputBg = light ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)';

    const [formData, setFormData] = useState({
        code: '',
        type: 'membership',
        discount_type: 'percent',
        discount_value: '',
        usage_limit_type: 'per_user',
        usage_limit: '1',
        expires_at: '',
        is_active: true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});
        router.post(route('admin.voucher.store'), formData, {
            onError: (errs) => { setErrors(errs); setIsSubmitting(false); },
            onFinish: () => { setIsSubmitting(false); },
        });
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }));
    };

    const inputStyle = (hasError?: boolean): React.CSSProperties => ({
        width: '100%', padding: '10px 14px', background: inputBg, color: fg,
        border: `1px solid ${hasError ? '#ef4444' : border}`, borderRadius: '6px',
        fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    });
    const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: fg, marginBottom: '6px' };
    const hintStyle:  React.CSSProperties = { marginTop: '4px', fontSize: '11px', color: muted };
    const errStyle:   React.CSSProperties = { marginTop: '4px', fontSize: '12px', color: '#ef4444' };

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: fg }}>Create New Voucher</h1>
            </div>

            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '12px', padding: '24px' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Voucher Code */}
                    <div>
                        <label style={labelStyle}>Voucher Code *</label>
                        <input type="text" value={formData.code} onChange={handleCodeChange} style={inputStyle(!!errors.code)} placeholder="e.g., NEWYEAR2025" required />
                        <p style={hintStyle}>All caps recommended. Numbers are allowed.</p>
                        {errors.code && <p style={errStyle}>{errors.code}</p>}
                    </div>

                    {/* Usage Rule */}
                    <div>
                        <label style={labelStyle}>Usage Rule *</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <select value={formData.usage_limit_type} onChange={(e) => setFormData(p => ({ ...p, usage_limit_type: e.target.value as 'per_user' | 'global' }))} style={inputStyle()}>
                                    <option value="per_user">N times per user</option>
                                    <option value="global">N times for all users (global)</option>
                                </select>
                            </div>
                            <div>
                                <input type="number" min="1" value={formData.usage_limit} onChange={(e) => setFormData(p => ({ ...p, usage_limit: e.target.value }))} style={inputStyle(!!errors.usage_limit)} placeholder="Usage limit" required />
                                {errors.usage_limit && <p style={errStyle}>{errors.usage_limit}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Expiry Date */}
                    <div>
                        <label style={labelStyle}>Expiry Date</label>
                        <input type="datetime-local" value={formData.expires_at} onChange={(e) => setFormData(p => ({ ...p, expires_at: e.target.value }))} style={inputStyle(!!errors.expires_at)} />
                        <p style={hintStyle}>Leave empty for no expiry date.</p>
                        {errors.expires_at && <p style={errStyle}>{errors.expires_at}</p>}
                    </div>

                    {/* Voucher For */}
                    <div>
                        <label style={labelStyle}>Voucher For *</label>
                        <select value={formData.type} onChange={(e) => setFormData(p => ({ ...p, type: e.target.value as 'membership' | 'ebook' | 'hybrid' }))} style={inputStyle(!!errors.type)}>
                            <option value="membership">Membership</option>
                            <option value="ebook">Ebook</option>
                            <option value="hybrid">Hybrid (Both Membership & Ebook)</option>
                        </select>
                        {errors.type && <p style={errStyle}>{errors.type}</p>}
                    </div>

                    {/* Discount */}
                    <div>
                        <label style={labelStyle}>Discount *</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <select value={formData.discount_type} onChange={(e) => setFormData(p => ({ ...p, discount_type: e.target.value as 'percent' | 'flat' }))} style={inputStyle()}>
                                    <option value="percent">Percent (%)</option>
                                    <option value="flat">Flat (\u00a2)</option>
                                </select>
                            </div>
                            <div>
                                <input type="number" min="0" step="0.01" value={formData.discount_value} onChange={(e) => setFormData(p => ({ ...p, discount_value: e.target.value }))} style={inputStyle(!!errors.discount_value)} placeholder={formData.discount_type === 'percent' ? 'e.g., 50' : 'e.g., 100'} required />
                                {errors.discount_value && <p style={errStyle}>{errors.discount_value}</p>}
                            </div>
                        </div>
                        <p style={hintStyle}>
                            {formData.discount_type === 'percent' ? 'Enter percentage (e.g., 50 for 50% off)' : 'Enter coin amount (e.g., 100 for \u00a2100 off)'}
                        </p>
                    </div>

                    {/* Active Status */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: '#2563eb' }} />
                            <span style={{ fontSize: '13px', fontWeight: 500, color: fg }}>Active</span>
                        </label>
                        <p style={hintStyle}>Inactive vouchers cannot be used.</p>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
                        <button type="button" onClick={() => router.visit(route('admin.voucher.index'))} disabled={isSubmitting} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: fg, background: panelBg, border: `1px solid ${border}`, borderRadius: '6px', cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#fff', background: isSubmitting ? '#93c5fd' : '#2563eb', border: 'none', borderRadius: '6px', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                            {isSubmitting && (
                                <svg style={{ width: '14px', height: '14px', animation: 'spin 0.8s linear infinite' }} fill="none" viewBox="0 0 24 24">
                                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            <span>{isSubmitting ? 'Creating...' : 'Create Voucher'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function VoucherCreate() {
    return (
        <AdminLayout title="Create Voucher">
            <Head title="Create Voucher" />
            <VoucherCreateContent />
        </AdminLayout>
    );
}
