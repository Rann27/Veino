import { useState, FormEvent } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface Series {
    id: number;
    title: string;
    slug: string;
}

interface Props {
    allSeries: Series[];
    config: {
        hero_series: number[];
        featured_series: number[];
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
        ...Array(6 - config.featured_series.length).fill(0)
    ].slice(0, 6));
    
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMessage('');

        const payload = {
            hero_series: heroSeries.filter(id => id > 0),
            featured_series: featuredSeries.filter(id => id > 0)
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
                        <p className="text-gray-600 mb-4">Select up to 6 series to display in the featured section</p>
                        
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
                    </ul>
                </div>
            </div>
        </AdminLayout>
    );
}