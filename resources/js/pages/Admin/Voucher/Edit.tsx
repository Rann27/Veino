import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface Voucher {
    id: number;
    code: string;
    type: 'membership' | 'ebook' | 'hybrid';
    discount_type: 'percent' | 'flat';
    discount_value: number;
    usage_limit_type: 'per_user' | 'global';
    usage_limit: number;
    expires_at: string | null;
    is_active: boolean;
}

interface Props {
    voucher: Voucher;
}

export default function VoucherEdit({ voucher }: Props) {
    const [formData, setFormData] = useState({
        code: voucher.code,
        type: voucher.type,
        discount_type: voucher.discount_type,
        discount_value: voucher.discount_value.toString(),
        usage_limit_type: voucher.usage_limit_type,
        usage_limit: voucher.usage_limit.toString(),
        expires_at: voucher.expires_at ? voucher.expires_at.slice(0, 16) : '',
        is_active: voucher.is_active,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        router.put(route('admin.voucher.update', voucher.id), formData, {
            onError: (errors) => {
                setErrors(errors);
                setIsSubmitting(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }));
    };

    return (
        <AdminLayout>
            <Head title={`Edit Voucher - ${voucher.code}`} />

            <div className="py-6">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900">Edit Voucher</h1>
                    </div>

                    <div className="bg-white shadow rounded-lg p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Voucher Code */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Voucher Code *
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={handleCodeChange}
                                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase ${
                                        errors.code ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    required
                                />
                                {errors.code && (
                                    <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                                )}
                            </div>

                            {/* Usage Rule */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Usage Rule *
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <select
                                            value={formData.usage_limit_type}
                                            onChange={(e) => setFormData(prev => ({ ...prev, usage_limit_type: e.target.value as 'per_user' | 'global' }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="per_user">N times per user</option>
                                            <option value="global">N times for all users (global)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.usage_limit}
                                            onChange={(e) => setFormData(prev => ({ ...prev, usage_limit: e.target.value }))}
                                            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                errors.usage_limit ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            required
                                        />
                                        {errors.usage_limit && (
                                            <p className="mt-1 text-sm text-red-600">{errors.usage_limit}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expiry Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Expiry Date
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.expires_at}
                                    onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.expires_at ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Leave empty for no expiry date.
                                </p>
                                {errors.expires_at && (
                                    <p className="mt-1 text-sm text-red-600">{errors.expires_at}</p>
                                )}
                            </div>

                            {/* Voucher For */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Voucher For *
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'membership' | 'ebook' | 'hybrid' }))}
                                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.type ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="membership">Membership</option>
                                    <option value="ebook">Ebook</option>
                                    <option value="hybrid">Hybrid (Both Membership & Ebook)</option>
                                </select>
                                {errors.type && (
                                    <p className="mt-1 text-sm text-red-600">{errors.type}</p>
                                )}
                            </div>

                            {/* Discount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Discount *
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <select
                                            value={formData.discount_type}
                                            onChange={(e) => setFormData(prev => ({ ...prev, discount_type: e.target.value as 'percent' | 'flat' }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="percent">Percent (%)</option>
                                            <option value="flat">Flat (¢)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.discount_value}
                                            onChange={(e) => setFormData(prev => ({ ...prev, discount_value: e.target.value }))}
                                            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                errors.discount_value ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            required
                                        />
                                        {errors.discount_value && (
                                            <p className="mt-1 text-sm text-red-600">{errors.discount_value}</p>
                                        )}
                                    </div>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    {formData.discount_type === 'percent' 
                                        ? 'Enter percentage (e.g., 50 for 50% off)'
                                        : 'Enter coin amount (e.g., 100 for ¢100 off)'}
                                </p>
                            </div>

                            {/* Active Status */}
                            <div>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Active
                                    </span>
                                </label>
                                <p className="mt-1 text-xs text-gray-500">
                                    Inactive vouchers cannot be used.
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => router.visit(route('admin.voucher.index'))}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    {isSubmitting && (
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                    <span>{isSubmitting ? 'Updating...' : 'Update Voucher'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
