import { useState, FormEvent, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';

interface Series {
    id: number;
    title: string;
    slug: string;
}

interface BannerData {
    image_path: string;
    image_url: string;
    link_url: string;
    alt: string;
}

interface Props {
    allSeries: Series[];
    config: {
        hero_series: number[];
        featured_series: number[];
        banners: BannerData[];
    };
    [key: string]: any;
}

export default function Misc() {
    const { allSeries, config } = usePage<Props>().props;
    
    const [heroSeries, setHeroSeries] = useState<number[]>([
        ...config.hero_series,
        ...Array(5 - config.hero_series.length).fill(0)
    ].slice(0, 5));
    
    const [featuredSeries, setFeaturedSeries] = useState<number[]>([
        ...config.featured_series,
        ...Array(8 - config.featured_series.length).fill(0)
    ].slice(0, 8));

    const emptyBanner: BannerData = { image_path: '', image_url: '', link_url: '', alt: '' };
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
            onSuccess: () => {
                setSuccessMessage('Configuration saved successfully!');
                setSaving(false);
                setTimeout(() => setSuccessMessage(''), 3000);
            },
            onError: () => {
                setSaving(false);
            }
        });
    };

    const handleFileUpload = async (index: number, file: File) => {
        setUploadingIndex(index);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await axios.post('/admin/misc/upload-banner', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const newBanners = [...banners];
            newBanners[index] = {
                ...newBanners[index],
                image_path: response.data.image_path,
                image_url: response.data.image_url,
            };
            setBanners(newBanners);
        } catch (error) {
            alert('Failed to upload image. Max size is 2MB. Allowed: jpeg, png, jpg, gif, webp.');
        } finally {
            setUploadingIndex(null);
        }
    };

    const handleRemoveBanner = async (index: number) => {
        const banner = banners[index];
        if (banner.image_path) {
            try {
                await axios.delete('/admin/misc/delete-banner', {
                    data: { image_path: banner.image_path },
                });
            } catch {
                // Silent fail — image may already be gone
            }
        }
        const newBanners = [...banners];
        newBanners[index] = { ...emptyBanner };
        setBanners(newBanners);
        // Reset file input
        if (fileInputRefs.current[index]) {
            fileInputRefs.current[index]!.value = '';
        }
    };

    const updateHeroSeries = (index: number, value: string) => {
        const newHero = [...heroSeries];
        newHero[index] = parseInt(value) || 0;
        setHeroSeries(newHero);
    };

    const updateFeaturedSeries = (index: number, value: string) => {
        const newFeatured = [...featuredSeries];
        newFeatured[index] = parseInt(value) || 0;
        setFeaturedSeries(newFeatured);
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6">Homepage Configuration</h1>

                {successMessage && (
                    <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                        {successMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Hero Series Section */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Hero Section (Slider)</h2>
                        <p className="text-gray-600 mb-4">Select up to 5 series to display in the hero slider</p>
                        
                        <div className="space-y-3">
                            {heroSeries.map((seriesId, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <label className="w-16 flex-shrink-0 text-sm font-medium text-gray-700">
                                        Slot {index + 1}:
                                    </label>
                                    <select
                                        value={seriesId}
                                        onChange={(e) => updateHeroSeries(index, e.target.value)}
                                        className="flex-1 min-w-0 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="0">-- None --</option>
                                        {allSeries.map(series => (
                                            <option key={series.id} value={series.id}>
                                                {series.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Featured Series Section */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Featured Series</h2>
                        <p className="text-gray-600 mb-4">Select up to 8 series to display in the featured section</p>
                        
                        <div className="space-y-3">
                            {featuredSeries.map((seriesId, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <label className="w-16 flex-shrink-0 text-sm font-medium text-gray-700">
                                        Slot {index + 1}:
                                    </label>
                                    <select
                                        value={seriesId}
                                        onChange={(e) => updateFeaturedSeries(index, e.target.value)}
                                        className="flex-1 min-w-0 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="0">-- None --</option>
                                        {allSeries.map(series => (
                                            <option key={series.id} value={series.id}>
                                                {series.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Banner Slider Section */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Banner Slider</h2>
                        <p className="text-gray-600 mb-4">Upload up to 5 promotional banners for the homepage slider (recommended size: 728×90 or wider, max 2MB each)</p>
                        
                        <div className="space-y-4">
                            {banners.map((banner, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-semibold text-gray-700">Banner {index + 1}</span>
                                        {banner.image_path && (
                                            <span className="text-xs text-green-600 font-medium">● Active</span>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        {/* File Upload */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Banner Image *</label>
                                            {!banner.image_url ? (
                                                <div className="relative">
                                                    <input
                                                        ref={(el) => { fileInputRefs.current[index] = el; }}
                                                        type="file"
                                                        accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleFileUpload(index, file);
                                                        }}
                                                        className="hidden"
                                                        id={`banner-file-${index}`}
                                                    />
                                                    <label
                                                        htmlFor={`banner-file-${index}`}
                                                        className={`flex items-center justify-center w-full border-2 border-dashed rounded-lg py-8 cursor-pointer transition-colors ${
                                                            uploadingIndex === index
                                                                ? 'border-blue-400 bg-blue-50'
                                                                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {uploadingIndex === index ? (
                                                            <div className="text-center">
                                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                                                <p className="text-sm text-blue-600">Uploading...</p>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center">
                                                                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                <p className="text-sm text-gray-600">Click to upload image</p>
                                                                <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, WebP — max 2MB</p>
                                                            </div>
                                                        )}
                                                    </label>
                                                </div>
                                            ) : (
                                                <div className="relative group">
                                                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                                        <img
                                                            src={banner.image_url}
                                                            alt={banner.alt || `Banner ${index + 1}`}
                                                            className="w-full h-24 object-contain"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveBanner(index)}
                                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Remove banner"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Link URL + Alt Text */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Link URL (optional)</label>
                                                <input
                                                    type="url"
                                                    value={banner.link_url}
                                                    onChange={(e) => {
                                                        const newBanners = [...banners];
                                                        newBanners[index] = { ...newBanners[index], link_url: e.target.value };
                                                        setBanners(newBanners);
                                                    }}
                                                    placeholder="https://example.com"
                                                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Alt Text (optional)</label>
                                                <input
                                                    type="text"
                                                    value={banner.alt}
                                                    onChange={(e) => {
                                                        const newBanners = [...banners];
                                                        newBanners[index] = { ...newBanners[index], alt: e.target.value };
                                                        setBanners(newBanners);
                                                    }}
                                                    placeholder="Banner description"
                                                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </form>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Note:</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• If no series is selected, the system will use automatic fallback (latest ongoing for hero, popular for featured)</li>
                        <li>• The order of selection determines the display order on the homepage</li>
                        <li>• Light Novel and Web Novel sections are automatically populated based on series type</li>
                        <li>• Banner images should be hosted externally (e.g., CDN or image hosting service)</li>
                        <li>• Recommended banner size: 728×90px or wider for best display across devices</li>
                        <li>• Max file size per banner: 2MB (JPEG, PNG, GIF, WebP)</li>
                    </ul>
                </div>
            </div>
        </AdminLayout>
    );
}