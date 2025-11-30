import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import ShopLayout from '@/Layouts/ShopLayout';
import { useTheme } from '@/Contexts/ThemeContext';

interface ChartItem {
    chart_item_id: number;
    id: number;
    title: string;
    cover_url: string;
    price_coins: number;
    series_title: string;
    series_slug: string;
}

interface Props {
    chartItems: ChartItem[];
    totalPrice: number;
    onVoucherChange?: (data: any, code: string) => void;
}

function MyChartContent({ chartItems, totalPrice, onVoucherChange }: Props) {
    const { currentTheme } = useTheme();
    
    // Voucher state
    const [voucherCode, setVoucherCode] = useState('');
    const [voucherData, setVoucherData] = useState<any>(null);
    const [voucherError, setVoucherError] = useState('');
    const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);

    const removeFromChart = (chartItemId: number) => {
        if (confirm('Remove this item from chart?')) {
            router.delete(route('chart.remove'), {
                data: { chart_item_id: chartItemId },
                preserveScroll: true
            });
        }
    };

    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) {
            alert('⚠️ Please enter a voucher code');
            return;
        }

        if (chartItems.length === 0) {
            alert('⚠️ Your chart is empty. Please add items before applying a voucher.');
            return;
        }

        setIsApplyingVoucher(true);
        setVoucherError('');

        try {
            const response = await fetch(route('voucher.validate'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    code: voucherCode.toUpperCase(),
                    type: 'ebook',
                    amount: totalPrice,
                }),
            });

            // Always try to parse JSON (even for errors)
            const data = await response.json();

            if (data.success) {
                setVoucherData(data.data);
                setVoucherError('');
                onVoucherChange?.(data.data, voucherCode.toUpperCase());
                alert(`✅ Voucher "${voucherCode.toUpperCase()}" applied successfully!\n💰 You saved ¢${data.data.discount_amount.toLocaleString()}`);
            } else {
                // Backend returned error (400, 404, etc.)
                setVoucherError(data.message || 'Invalid voucher');
                setVoucherData(null);
                alert(`❌ ${data.message || 'Invalid or expired voucher code'}`);
            }
        } catch (error) {
            // Network error or JSON parse error
            console.error('Voucher validation error:', error);
            setVoucherError('Failed to validate voucher');
            setVoucherData(null);
            alert('❌ Failed to validate voucher. Please check your connection and try again.');
        } finally {
            setIsApplyingVoucher(false);
        }
    };

    const handleRemoveVoucher = () => {
        setVoucherCode('');
        setVoucherData(null);
        setVoucherError('');
        onVoucherChange?.(null, '');
    };

    return (
        <>
            <Head title="My Chart" />

                <div className="min-h-screen pb-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {/* Header */}
                        <h1 
                            className="text-3xl md:text-4xl font-bold mb-8"
                            style={{ 
                                fontFamily: 'Poppins, sans-serif',
                                color: currentTheme.foreground
                            }}
                        >
                            My Chart
                        </h1>

                        {chartItems.length > 0 ? (
                            <div className="space-y-4">
                                {chartItems.map((item) => (
                                    <div 
                                        key={item.chart_item_id}
                                        className="border rounded-lg p-4 flex gap-4 hover:shadow-lg transition-shadow duration-200"
                                        style={{ borderColor: `${currentTheme.foreground}20` }}
                                    >
                                        {/* Cover */}
                                        <div className="w-20 sm:w-24 flex-shrink-0">
                                            <img
                                                src={item.cover_url}
                                                alt={item.title}
                                                className="w-full rounded-lg"
                                                onError={(e) => {
                                                    e.currentTarget.src = '/images/default-cover.jpg';
                                                }}
                                            />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 
                                                className="text-lg font-bold mb-1 truncate"
                                                style={{ 
                                                    fontFamily: 'Poppins, sans-serif',
                                                    color: currentTheme.foreground
                                                }}
                                            >
                                                {item.title}
                                            </h3>

                                            <Link
                                                href={route('epub-novels.show', item.series_slug)}
                                                className="text-sm opacity-70 hover:opacity-100 hover:underline inline-block mb-3"
                                                style={{ 
                                                    fontFamily: 'Poppins, sans-serif',
                                                    color: currentTheme.foreground
                                                }}
                                            >
                                                {item.series_title}
                                            </Link>

                                            <div className="flex items-center justify-between">
                                                <p 
                                                    className="text-xl font-bold"
                                                    style={{ 
                                                        fontFamily: 'Poppins, sans-serif',
                                                        color: '#f59e0b'
                                                    }}
                                                >
                                                    ¢{item.price_coins.toLocaleString()}
                                                </p>

                                                <button
                                                    onClick={() => removeFromChart(item.chart_item_id)}
                                                    className="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-80"
                                                    style={{
                                                        backgroundColor: `${currentTheme.foreground}10`,
                                                        color: currentTheme.foreground,
                                                        fontFamily: 'Poppins, sans-serif'
                                                    }}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Voucher Section */}
                                <div 
                                    className="border rounded-lg p-6"
                                    style={{ borderColor: `${currentTheme.foreground}20` }}
                                >
                                    <h3 
                                        className="text-lg font-bold mb-4"
                                        style={{ 
                                            fontFamily: 'Poppins, sans-serif',
                                            color: currentTheme.foreground
                                        }}
                                    >
                                        Have a voucher code?
                                    </h3>

                                    {!voucherData ? (
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                value={voucherCode}
                                                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                                placeholder="Enter voucher code"
                                                className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                style={{ 
                                                    fontFamily: 'Poppins, sans-serif',
                                                    borderColor: `${currentTheme.foreground}30`,
                                                    backgroundColor: currentTheme.background,
                                                    color: currentTheme.foreground
                                                }}
                                                disabled={isApplyingVoucher}
                                            />
                                            <button
                                                onClick={handleApplyVoucher}
                                                disabled={isApplyingVoucher || !voucherCode.trim()}
                                                className="px-6 py-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
                                                style={{
                                                    backgroundColor: '#f59e0b',
                                                    color: 'white',
                                                    fontFamily: 'Poppins, sans-serif'
                                                }}
                                            >
                                                {isApplyingVoucher ? 'Checking...' : 'Apply'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p 
                                                    className="text-sm opacity-70 mb-1"
                                                    style={{ 
                                                        fontFamily: 'Poppins, sans-serif',
                                                        color: currentTheme.foreground
                                                    }}
                                                >
                                                    Applied Voucher
                                                </p>
                                                <p 
                                                    className="text-xl font-bold"
                                                    style={{ 
                                                        fontFamily: 'Poppins, sans-serif',
                                                        color: '#10b981'
                                                    }}
                                                >
                                                    {voucherCode}
                                                </p>
                                                <p 
                                                    className="text-sm opacity-70 mt-1"
                                                    style={{ 
                                                        fontFamily: 'Poppins, sans-serif',
                                                        color: currentTheme.foreground
                                                    }}
                                                >
                                                    Discount: -¢{voucherData.discount_amount.toLocaleString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleRemoveVoucher}
                                                className="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-80"
                                                style={{
                                                    backgroundColor: `${currentTheme.foreground}10`,
                                                    color: currentTheme.foreground,
                                                    fontFamily: 'Poppins, sans-serif'
                                                }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <svg 
                                    className="w-24 h-24 mx-auto mb-4 opacity-30"
                                    style={{ color: currentTheme.foreground }}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>

                                <h2 
                                    className="text-2xl font-bold mb-2"
                                    style={{ 
                                        fontFamily: 'Poppins, sans-serif',
                                        color: currentTheme.foreground
                                    }}
                                >
                                    Your chart is empty
                                </h2>

                                <p 
                                    className="text-base opacity-70 mb-6"
                                    style={{ 
                                        fontFamily: 'Poppins, sans-serif',
                                        color: currentTheme.foreground
                                    }}
                                >
                                    Browse our collection and add some items!
                                </p>

                                <Link
                                    href={route('epub-novels.index')}
                                    className="inline-block px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:opacity-90"
                                    style={{
                                        backgroundColor: '#f59e0b',
                                        color: 'white',
                                        fontFamily: 'Poppins, sans-serif'
                                    }}
                                >
                                    Browse Epub Novels
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
        </>
    );
}

export default function MyChart(props: Props) {
    const [voucherData, setVoucherData] = React.useState<any>(null);
    const [voucherCode, setVoucherCode] = React.useState('');

    return (
        <UserLayout>
            <ShopLayout 
                chartItems={props.chartItems} 
                totalPrice={props.totalPrice}
                voucherData={voucherData}
                voucherCode={voucherCode}
            >
                <MyChartContent 
                    {...props} 
                    onVoucherChange={(data: any, code: string) => {
                        setVoucherData(data);
                        setVoucherCode(code);
                    }}
                />
            </ShopLayout>
        </UserLayout>
    );
}
