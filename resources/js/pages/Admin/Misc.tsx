import { useState, FormEvent, useRef } from 'react';
import { router, usePage, Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import axios from 'axios';

interface Series { id: number; title: string; slug: string; }
interface BannerData { image_path: string; image_url: string; link_url: string; alt: string; }
interface Props {
    allSeries: Series[];
    config: { hero_series: number[]; featured_series: number[]; banners: BannerData[]; };
    [key: string]: any;
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

function MiscContent() {
    const { allSeries, config } = usePage<Props>().props;
    const { currentTheme } = useTheme();
    const light   = isLight(currentTheme.background);
    const fg      = currentTheme.foreground;
    const muted   = wa(fg, 0.45);
    const border  = wa(fg, 0.12);
    const cardBg  = light ? wa(fg, 0.03) : wa(fg, 0.06);
    const panelBg = light ? wa(fg, 0.06) : wa(fg, 0.09);
    const inputBg = light ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)';
    const accent  = currentTheme.accent || '#2563eb';

    const emptyBanner: BannerData = { image_path: '', image_url: '', link_url: '', alt: '' };

    const [heroSeries, setHeroSeries] = useState<number[]>(
        [...config.hero_series, ...Array(5 - config.hero_series.length).fill(0)].slice(0, 5)
    );
    const [featuredSeries, setFeaturedSeries] = useState<number[]>(
        [...config.featured_series, ...Array(8 - config.featured_series.length).fill(0)].slice(0, 8)
    );
    const initialBanners = config.banners && config.banners.length > 0
        ? [...config.banners, ...Array(Math.max(0, 5 - config.banners.length)).fill(emptyBanner)].slice(0, 5)
        : Array(5).fill(null).map(() => ({ ...emptyBanner }));
    const [banners, setBanners] = useState<BannerData[]>(initialBanners);
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMessage('');
        const payload = {
            hero_series: heroSeries.filter(id => id > 0),
            featured_series: featuredSeries.filter(id => id > 0),
            banners: banners
                .filter(b => b.image_path)
                .map(b => ({ image_path: b.image_path, link_url: b.link_url, alt: b.alt })),
        };
        router.put('/admin/misc', payload, {
            preserveScroll: true,
            onSuccess: () => { setSuccessMessage('Configuration saved successfully!'); setSaving(false); setTimeout(() => setSuccessMessage(''), 3000); },
            onError: () => { setSaving(false); },
        });
    };

    const handleFileUpload = async (index: number, file: File) => {
        setUploadingIndex(index);
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await axios.post('/admin/misc/upload-banner', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const newBanners = [...banners];
            newBanners[index] = { ...newBanners[index], image_path: res.data.image_path, image_url: res.data.image_url };
            setBanners(newBanners);
        } catch {
            alert('Failed to upload image. Max size is 2MB. Allowed: jpeg, png, jpg, gif, webp.');
        } finally {
            setUploadingIndex(null);
        }
    };

    const handleRemoveBanner = async (index: number) => {
        const banner = banners[index];
        if (banner.image_path) {
            try { await axios.delete('/admin/misc/delete-banner', { data: { image_path: banner.image_path } }); } catch {}
        }
        const newBanners = [...banners];
        newBanners[index] = { ...emptyBanner };
        setBanners(newBanners);
        if (fileInputRefs.current[index]) fileInputRefs.current[index]!.value = '';
    };

    const updateHeroSeries = (index: number, value: string) => {
        const n = [...heroSeries]; n[index] = parseInt(value) || 0; setHeroSeries(n);
    };
    const updateFeaturedSeries = (index: number, value: string) => {
        const n = [...featuredSeries]; n[index] = parseInt(value) || 0; setFeaturedSeries(n);
    };

    const selStyle: React.CSSProperties = {
        flex: 1, minWidth: 0, padding: '9px 36px 9px 12px', background: inputBg, color: fg,
        border: `1px solid ${border}`, borderRadius: '7px', fontSize: '13px', outline: 'none',
        appearance: 'none' as any, WebkitAppearance: 'none' as any,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', boxSizing: 'border-box' as any,
    };
    const optStyle = { background: currentTheme.background, color: fg };
    const inpStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', background: inputBg, color: fg, border: `1px solid ${border}`, borderRadius: '7px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
    const sectionCard: React.CSSProperties = { background: cardBg, border: `1px solid ${border}`, borderRadius: '12px', padding: '24px', marginBottom: '20px' };
    const sectionTitle: React.CSSProperties = { fontSize: '16px', fontWeight: 700, color: fg, marginBottom: '6px' };
    const sectionDesc: React.CSSProperties = { fontSize: '13px', color: muted, marginBottom: '18px' };
    const slotLabel: React.CSSProperties = { width: '56px', flexShrink: 0, fontSize: '12px', fontWeight: 600, color: muted };

    const activeBanners = banners.filter(b => b.image_path).length;

    return (
        <div style={{ maxWidth: '820px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: fg }}>Homepage Configuration</h1>
                <p style={{ marginTop: '4px', fontSize: '14px', color: muted }}>Manage the hero slider, featured series, and promotional banners</p>
            </div>

            {/* Success toast */}
            {successMessage && (
                <div style={{ marginBottom: '20px', padding: '12px 16px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', borderRadius: '8px', color: '#22c55e', fontSize: '14px', fontWeight: 500 }}>
                    {successMessage}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Hero Section */}
                <div style={sectionCard}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <h2 style={sectionTitle}>Hero Section (Slider)</h2>
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: 'rgba(37,99,235,0.12)', color: accent }}>{heroSeries.filter(id => id > 0).length} / 5 filled</span>
                    </div>
                    <p style={sectionDesc}>Select up to 5 series to display in the hero slider on the homepage</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {heroSeries.map((seriesId, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={slotLabel}>Slot {index + 1}</span>
                                <select value={seriesId} onChange={(e) => updateHeroSeries(index, e.target.value)} style={selStyle}>
                                    <option value="0" style={optStyle}>-- None --</option>
                                    {allSeries.map(s => <option key={s.id} value={s.id} style={optStyle}>{s.title}</option>)}
                                </select>
                                {seriesId > 0 && (
                                    <button type="button" onClick={() => updateHeroSeries(index, '0')} style={{ fontSize: '13px', color: muted, background: 'none', border: 'none', cursor: 'pointer', padding: '4px', lineHeight: 1 }} title="Clear slot"></button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Featured Section */}
                <div style={sectionCard}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <h2 style={sectionTitle}>Featured Series</h2>
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: 'rgba(124,58,237,0.12)', color: '#7c3aed' }}>{featuredSeries.filter(id => id > 0).length} / 8 filled</span>
                    </div>
                    <p style={sectionDesc}>Select up to 8 series to display in the featured section</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {featuredSeries.map((seriesId, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={slotLabel}>Slot {index + 1}</span>
                                <select value={seriesId} onChange={(e) => updateFeaturedSeries(index, e.target.value)} style={selStyle}>
                                    <option value="0" style={optStyle}>-- None --</option>
                                    {allSeries.map(s => <option key={s.id} value={s.id} style={optStyle}>{s.title}</option>)}
                                </select>
                                {seriesId > 0 && (
                                    <button type="button" onClick={() => updateFeaturedSeries(index, '0')} style={{ fontSize: '13px', color: muted, background: 'none', border: 'none', cursor: 'pointer', padding: '4px', lineHeight: 1 }} title="Clear slot"></button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Banner Section */}
                <div style={sectionCard}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <h2 style={sectionTitle}>Banner Slider</h2>
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: activeBanners > 0 ? 'rgba(34,197,94,0.12)' : wa(fg, 0.06), color: activeBanners > 0 ? '#22c55e' : muted }}>{activeBanners} / 5 active</span>
                    </div>
                    <p style={sectionDesc}>Upload up to 5 promotional banners (recommended: 72890px or wider, max 2MB each)</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {banners.map((banner, index) => (
                            <div key={index} style={{ border: `1px solid ${border}`, borderRadius: '10px', padding: '16px', background: panelBg }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: fg }}>Banner {index + 1}</span>
                                    {banner.image_path && (
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
                                            Active
                                        </span>
                                    )}
                                </div>

                                {/* Image upload area */}
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: muted, marginBottom: '8px' }}>Banner Image</label>
                                    {!banner.image_url ? (
                                        <>
                                            <input ref={(el) => { fileInputRefs.current[index] = el; }} type="file" accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                                                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(index, file); }}
                                                style={{ display: 'none' }} id={`banner-file-${index}`} />
                                            <label htmlFor={`banner-file-${index}`}
                                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 16px', border: `2px dashed ${uploadingIndex === index ? accent : border}`, borderRadius: '8px', cursor: 'pointer', background: uploadingIndex === index ? `${accent}0d` : inputBg, transition: 'border-color 0.15s' }}>
                                                {uploadingIndex === index ? (
                                                    <>
                                                        <svg style={{ width: '28px', height: '28px', animation: 'spin 0.8s linear infinite', color: accent, marginBottom: '8px' }} fill="none" viewBox="0 0 24 24">
                                                            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                                        </svg>
                                                        <span style={{ fontSize: '13px', color: accent }}>Uploading...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg style={{ width: '28px', height: '28px', color: muted, marginBottom: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                                        </svg>
                                                        <span style={{ fontSize: '13px', color: muted }}>Click to upload image</span>
                                                        <span style={{ fontSize: '11px', color: wa(fg, 0.3), marginTop: '4px' }}>JPEG, PNG, GIF, WebP  max 2MB</span>
                                                    </>
                                                )}
                                            </label>
                                        </>
                                    ) : (
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ border: `1px solid ${border}`, borderRadius: '8px', overflow: 'hidden', background: inputBg }}>
                                                <img src={banner.image_url} alt={banner.alt || `Banner ${index + 1}`} style={{ width: '100%', height: '80px', objectFit: 'contain', display: 'block' }} />
                                            </div>
                                            <button type="button" onClick={() => handleRemoveBanner(index)}
                                                style={{ position: 'absolute', top: '8px', right: '8px', width: '26px', height: '26px', borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                                                title="Remove banner"></button>
                                        </div>
                                    )}
                                </div>

                                {/* Link + Alt */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: muted, marginBottom: '6px' }}>Link URL (optional)</label>
                                        <input type="url" value={banner.link_url} onChange={(e) => { const n = [...banners]; n[index] = { ...n[index], link_url: e.target.value }; setBanners(n); }} placeholder="https://example.com" style={inpStyle} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: muted, marginBottom: '6px' }}>Alt Text (optional)</label>
                                        <input type="text" value={banner.alt} onChange={(e) => { const n = [...banners]; n[index] = { ...n[index], alt: e.target.value }; setBanners(n); }} placeholder="Banner description" style={inpStyle} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submit */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                    <button type="submit" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, color: '#fff', background: saving ? 'rgba(37,99,235,0.5)' : accent, border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer' }}>
                        {saving && (
                            <svg style={{ width: '14px', height: '14px', animation: 'spin 0.8s linear infinite' }} fill="none" viewBox="0 0 24 24">
                                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                        )}
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </form>

            {/* Notes */}
            <div style={{ padding: '16px 20px', background: light ? 'rgba(37,99,235,0.06)' : 'rgba(37,99,235,0.1)', border: `1px solid rgba(37,99,235,0.2)`, borderRadius: '10px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: accent, marginBottom: '10px' }}>Notes</h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {[
                        'If no series is selected, the system will use automatic fallback (latest ongoing for hero, popular for featured)',
                        'The order of selection determines the display order on the homepage',
                        'Light Novel and Web Novel sections are automatically populated based on series type',
                        'Recommended banner size: 72890px or wider for best display across devices',
                        'Max file size per banner: 2MB (JPEG, PNG, GIF, WebP)',
                    ].map((note, i) => (
                        <li key={i} style={{ fontSize: '12px', color: muted, display: 'flex', gap: '8px' }}>
                            <span style={{ color: accent, flexShrink: 0 }}></span>
                            {note}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default function Misc() {
    return (
        <AdminLayout title="Homepage Config">
            <Head title="Homepage Configuration" />
            <MiscContent />
        </AdminLayout>
    );
}
