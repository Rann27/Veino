import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';

interface ChartItem {
    chart_item_id: number;
    id: number;
    title: string;
    price_coins: number;
    series_title: string;
}

interface VoucherData {
    voucher_code: string;
    discount_amount: number;
    final_amount: number;
    original_amount: number;
}

interface ShopLayoutProps {
    children: React.ReactNode;
    chartItems?: ChartItem[];
    totalPrice?: number;
    voucherData?: VoucherData | null;
    voucherCode?: string;
}

export default function ShopLayout({ children, chartItems = [], totalPrice = 0, voucherData = null, voucherCode = '' }: ShopLayoutProps) {
    const { currentTheme } = useTheme();
    const { auth } = usePage<any>().props;
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Calculate display price (with voucher discount if applied)
    const displayPrice = voucherData ? voucherData.final_amount : totalPrice;

    // Determine if we're on my-chart page - check the current path
    const isMyChartPage = window.location.pathname === '/my-chart';

    const handleButtonClick = () => {
        if (chartItems.length === 0) {
            alert('Your chart is empty!');
            return;
        }
        
        if (isMyChartPage) {
            // On my-chart page, show checkout modal
            setShowConfirmModal(true);
        } else {
            // On other pages, navigate to my-chart
            router.visit(route('my-chart'));
        }
    };

    const confirmCheckout = () => {
        setIsProcessing(true);
        
        console.log('Starting checkout...', {
            route: route('chart.checkout'),
            voucherCode: voucherData ? voucherCode : null
        });

        router.post(route('chart.checkout'), {
            voucher_code: voucherData ? voucherCode : null,
        }, {
            onSuccess: (page) => {
                console.log('Checkout success', page);
                setShowConfirmModal(false);
                setShowSuccessModal(true);
                setIsProcessing(false);
            },
            onError: (errors) => {
                console.error('Checkout error', errors);
                setIsProcessing(false);
                setShowConfirmModal(false);
                
                const errorMessage = errors?.message || errors?.error || 'Checkout failed. Please try again.';
                alert(errorMessage);
            },
            onFinish: () => {
                console.log('Checkout finished');
            }
        });
    };

    const goToBookshelf = () => {
        router.visit(route('bookshelf'));
    };

    return (
        <>
            {children}

            {/* Sticky Bottom Bar - Chart Summary */}
            {chartItems.length > 0 && (
                <div 
                    className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md border-t"
                    style={{
                        backgroundColor: `${currentTheme.background}95`,
                        borderColor: `${currentTheme.foreground}20`
                    }}
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            {/* Left Side - Items Info */}
                            <div className="flex-1">
                                <p 
                                    className="text-sm sm:text-base font-medium"
                                    style={{ 
                                        fontFamily: 'Poppins, sans-serif',
                                        color: currentTheme.foreground
                                    }}
                                >
                                    {chartItems.length === 1 
                                        ? chartItems[0].title
                                        : `${chartItems.length} items added in the chart`
                                    }
                                </p>
                            </div>

                            {/* Right Side - Price & Checkout Button */}
                            <div className="flex items-center gap-4 sm:gap-6">
                                <div className="text-right">
                                    <p 
                                        className="text-xs text-opacity-70 mb-1"
                                        style={{ 
                                            fontFamily: 'Poppins, sans-serif',
                                            color: currentTheme.foreground
                                        }}
                                    >
                                        Total Price
                                    </p>
                                    <p 
                                        className="text-xl sm:text-2xl font-bold"
                                        style={{ 
                                            fontFamily: 'Poppins, sans-serif',
                                            color: '#f59e0b' // Gold coin color
                                        }}
                                    >
                                        ¢{displayPrice.toLocaleString()}
                                        {voucherData && (
                                            <span className="text-xs ml-2 opacity-70">
                                                (after discount)
                                            </span>
                                        )}
                                    </p>
                                </div>

                                <button
                                    onClick={handleButtonClick}
                                    className="px-6 sm:px-8 py-3 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 hover:opacity-90 whitespace-nowrap"
                                    style={{
                                        backgroundColor: '#f59e0b',
                                        color: 'white',
                                        fontFamily: 'Poppins, sans-serif'
                                    }}
                                >
                                    {isMyChartPage ? 'Checkout now!' : 'View Chart'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => !isProcessing && setShowConfirmModal(false)}
                >
                    <div 
                        className="rounded-lg p-6 sm:p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl border"
                        style={{ 
                            backgroundColor: currentTheme.background,
                            borderColor: `${currentTheme.foreground}20`
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 
                            className="text-2xl font-bold mb-6 text-center"
                            style={{ 
                                fontFamily: 'Poppins, sans-serif',
                                color: currentTheme.foreground
                            }}
                        >
                            Confirm Your Purchase
                        </h3>

                        {/* Items List */}
                        <div className="mb-6 space-y-3">
                            {chartItems.map((item) => (
                                <div 
                                    key={item.chart_item_id}
                                    className="flex justify-between items-center p-3 rounded-lg"
                                    style={{ 
                                        backgroundColor: `${currentTheme.foreground}05`,
                                        borderLeft: `3px solid #f59e0b`
                                    }}
                                >
                                    <div className="flex-1">
                                        <p 
                                            className="font-semibold text-sm sm:text-base"
                                            style={{ 
                                                fontFamily: 'Poppins, sans-serif',
                                                color: currentTheme.foreground
                                            }}
                                        >
                                            {item.title}
                                        </p>
                                        <p 
                                            className="text-xs opacity-70 mt-1"
                                            style={{ 
                                                fontFamily: 'Poppins, sans-serif',
                                                color: currentTheme.foreground
                                            }}
                                        >
                                            {item.series_title}
                                        </p>
                                    </div>
                                    <p 
                                        className="text-lg font-bold ml-4"
                                        style={{ 
                                            fontFamily: 'Poppins, sans-serif',
                                            color: '#f59e0b'
                                        }}
                                    >
                                        ¢{item.price_coins.toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Total */}
                        <div 
                            className="border-t pt-4 mb-6"
                            style={{ borderColor: `${currentTheme.foreground}20` }}
                        >
                            {voucherData && (
                                <div className="flex justify-between items-center mb-2">
                                    <p 
                                        className="text-sm"
                                        style={{ 
                                            fontFamily: 'Poppins, sans-serif',
                                            color: currentTheme.foreground
                                        }}
                                    >
                                        Subtotal
                                    </p>
                                    <p 
                                        className="text-sm"
                                        style={{ 
                                            fontFamily: 'Poppins, sans-serif',
                                            color: currentTheme.foreground
                                        }}
                                    >
                                        ¢{totalPrice.toLocaleString()}
                                    </p>
                                </div>
                            )}
                            {voucherData && (
                                <div className="flex justify-between items-center mb-2">
                                    <p 
                                        className="text-sm font-medium"
                                        style={{ 
                                            fontFamily: 'Poppins, sans-serif',
                                            color: '#10b981'
                                        }}
                                    >
                                        Voucher Discount ({voucherCode})
                                    </p>
                                    <p 
                                        className="text-sm font-medium"
                                        style={{ 
                                            fontFamily: 'Poppins, sans-serif',
                                            color: '#10b981'
                                        }}
                                    >
                                        -¢{voucherData.discount_amount.toLocaleString()}
                                    </p>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <p 
                                    className="text-lg font-semibold"
                                    style={{ 
                                        fontFamily: 'Poppins, sans-serif',
                                        color: currentTheme.foreground
                                    }}
                                >
                                    Total Amount
                                </p>
                                <p 
                                    className="text-2xl font-bold"
                                    style={{ 
                                        fontFamily: 'Poppins, sans-serif',
                                        color: '#f59e0b'
                                    }}
                                >
                                    ¢{displayPrice.toLocaleString()}
                                </p>
                            </div>
                            <p 
                                className="text-sm mt-2 text-right"
                                style={{ 
                                    fontFamily: 'Poppins, sans-serif',
                                    color: `${currentTheme.foreground}70`
                                }}
                            >
                                Your balance: ¢{auth?.user?.coins?.toLocaleString() || 0}
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                disabled={isProcessing}
                                className="flex-1 py-3 rounded-lg font-semibold transition-all duration-200 hover:opacity-80"
                                style={{
                                    backgroundColor: `${currentTheme.foreground}10`,
                                    color: currentTheme.foreground,
                                    fontFamily: 'Poppins, sans-serif'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmCheckout}
                                disabled={isProcessing}
                                className="flex-1 py-3 rounded-lg font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                                style={{
                                    backgroundColor: '#f59e0b',
                                    color: 'white',
                                    fontFamily: 'Poppins, sans-serif'
                                }}
                            >
                                {isProcessing ? 'Processing...' : 'Confirm Purchase'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowSuccessModal(false)}
                >
                    <div 
                        className="rounded-lg p-8 max-w-md w-full shadow-xl border"
                        style={{ 
                            backgroundColor: currentTheme.background,
                            borderColor: `${currentTheme.foreground}20`
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Success Icon */}
                        <div className="flex justify-center mb-6">
                            <div 
                                className="w-16 h-16 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: '#f59e0b20' }}
                            >
                                <svg className="w-8 h-8" style={{ color: '#f59e0b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>

                        <h3 
                            className="text-2xl font-bold text-center mb-2"
                            style={{ 
                                fontFamily: 'Poppins, sans-serif',
                                color: currentTheme.foreground
                            }}
                        >
                            Purchase Successful!
                        </h3>

                        <p 
                            className="text-center mb-6"
                            style={{ 
                                fontFamily: 'Poppins, sans-serif',
                                color: `${currentTheme.foreground}80`
                            }}
                        >
                            Your items have been added to your bookshelf. You can now download them anytime!
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="flex-1 py-3 rounded-lg font-semibold transition-all duration-200 hover:opacity-80"
                                style={{
                                    backgroundColor: `${currentTheme.foreground}10`,
                                    color: currentTheme.foreground,
                                    fontFamily: 'Poppins, sans-serif'
                                }}
                            >
                                Close
                            </button>
                            <button
                                onClick={goToBookshelf}
                                className="flex-1 py-3 rounded-lg font-semibold transition-all duration-200 hover:opacity-90"
                                style={{
                                    backgroundColor: '#f59e0b',
                                    color: 'white',
                                    fontFamily: 'Poppins, sans-serif'
                                }}
                            >
                                Go to Bookshelf
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
