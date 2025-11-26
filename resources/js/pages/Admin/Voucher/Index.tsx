import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface Voucher {
    id: number;
    code: string;
    type: 'membership' | 'ebook' | 'hybrid';
    discount_type: 'percent' | 'flat';
    discount_value: number;
    usage_limit_type: 'per_user' | 'global';
    usage_limit: number;
    usage_count: number;
    expires_at: string | null;
    is_active: boolean;
}

interface Props {
    vouchers: {
        data: Voucher[];
        links: any[];
        current_page: number;
        last_page: number;
    };
}

export default function VoucherIndex({ vouchers }: Props) {
    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this voucher?')) {
            router.delete(route('admin.voucher.destroy', id));
        }
    };

    const getTypeLabel = (type: string) => {
        const labels = {
            membership: 'Membership',
            ebook: 'Ebook',
            hybrid: 'Hybrid (Both)',
        };
        return labels[type as keyof typeof labels] || type;
    };

    const getRuleLabel = (voucher: Voucher) => {
        if (voucher.usage_limit_type === 'per_user') {
            return `${voucher.usage_limit}x per user`;
        }
        return `${voucher.usage_limit}x global (${voucher.usage_count} used)`;
    };

    const getDiscountLabel = (voucher: Voucher) => {
        if (voucher.discount_type === 'percent') {
            return `${voucher.discount_value}%`;
        }
        return `¢${voucher.discount_value}`;
    };

    return (
        <AdminLayout>
            <Head title="Voucher Management" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900">Voucher Management</h1>
                        <Link
                            href={route('admin.voucher.create')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Create Voucher
                        </Link>
                    </div>

                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Voucher Code
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Rule
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Expiry Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Voucher For
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Discount
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
                                    {vouchers.data.map((voucher) => (
                                        <tr key={voucher.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {voucher.code}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {getRuleLabel(voucher)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {voucher.expires_at 
                                                        ? new Date(voucher.expires_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })
                                                        : 'No Expiry'
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    voucher.type === 'membership' ? 'bg-purple-100 text-purple-800' :
                                                    voucher.type === 'ebook' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                    {getTypeLabel(voucher.type)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {getDiscountLabel(voucher)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    voucher.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {voucher.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link
                                                    href={route('admin.voucher.edit', voucher.id)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(voucher.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {vouchers.last_page > 1 && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    {vouchers.current_page > 1 && (
                                        <Link
                                            href={vouchers.links[vouchers.current_page - 1]?.url || '#'}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Previous
                                        </Link>
                                    )}
                                    {vouchers.current_page < vouchers.last_page && (
                                        <Link
                                            href={vouchers.links[vouchers.current_page + 1]?.url || '#'}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Next
                                        </Link>
                                    )}
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Page <span className="font-medium">{vouchers.current_page}</span> of{' '}
                                            <span className="font-medium">{vouchers.last_page}</span>
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            {vouchers.links.map((link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || '#'}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                        link.active
                                                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
