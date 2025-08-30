import { Head, Link, router, usePage } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useState, useEffect } from 'react';
import PurchaseConfirmationModal from '@/Components/PurchaseConfirmationModal';
import SuccessModal from '@/Components/SuccessModal';

interface CoinPackage {
    id: number;
    name: string;
    coin_amount: number;
    price_usd: number | string;
    is_active: boolean;
}

interface Props {
    coinPackages: CoinPackage[];
}

export default function BuyCoins({ coinPackages }: Props) {
    const { flash, auth } = usePage<any>().props;
    const [isLoading, setIsLoading] = useState<number | null>(null);
    const [paypalConfig, setPaypalConfig] = useState<any>(null);
    const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState<{coinAmount: number, newBalance: number} | null>(null);

    // Fetch PayPal configuration
    useEffect(() => {
        if (auth?.user) {
            fetch('/payment/paypal-config')
                .then(response => response.json())
                .then(data => {
                    console.log('PayPal config loaded:', data);
                    setPaypalConfig(data);
                })
                .catch(error => {
                    console.error('Failed to fetch PayPal config:', error);
                });
        }
    }, [auth]);

    const handlePurchase = async (pkg: CoinPackage) => {
        if (!auth?.user) {
            router.visit('/login');
            return;
        }

        console.log('PayPal config status:', paypalConfig);

        // Check if PayPal is configured
        if (!paypalConfig?.configured) {
            alert('PayPal payment gateway is not configured yet. Please contact administrator to set up PayPal Client ID and Secret.');
            return;
        }

        // Show confirmation modal
        setSelectedPackage(pkg);
        setShowConfirmModal(true);
    };

    const handleConfirmPurchase = async () => {
        if (!selectedPackage) return;

        setIsLoading(selectedPackage.id);

        try {
            // Initiate actual payment process
            const response = await fetch(`/payment/initiate/${selectedPackage.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    return_url: window.location.origin + '/payment/success',
                    cancel_url: window.location.origin + '/payment/cancel',
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Close confirmation modal
                setShowConfirmModal(false);
                
                if (paypalConfig?.mode === 'live') {
                    // In live mode, redirect to PayPal
                    window.location.href = data.payment_url;
                } else {
                    // For sandbox/demo, simulate success and show success modal
                    setSuccessData({
                        coinAmount: selectedPackage.coin_amount,
                        newBalance: (auth.user.coins || 0) + selectedPackage.coin_amount
                    });
                    setShowSuccessModal(true);
                    
                    // Simulate the success redirect for demo
                    setTimeout(() => {
                        window.location.href = `/payment/success?paymentId=${data.payment_id}&PayerID=demo_payer&token=demo_token&pkg_id=${selectedPackage.id}`;
                    }, 2000);
                }
            } else {
                alert(data.error || 'Failed to initiate payment');
                setShowConfirmModal(false);
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('An error occurred while processing payment');
            setShowConfirmModal(false);
        } finally {
            setIsLoading(null);
            setSelectedPackage(null);
        }
    };

    // Handle success message from flash data
    useEffect(() => {
        if (flash?.success && flash.success.includes('coins have been added')) {
            // Extract coin amount from flash message
            const match = flash.success.match(/(\d+(?:,\d+)*) coins/);
            if (match) {
                const coinAmount = parseInt(match[1].replace(/,/g, ''));
                setSuccessData({
                    coinAmount: coinAmount,
                    newBalance: auth.user?.coins || 0
                });
                setShowSuccessModal(true);
            }
        }
    }, [flash]);

    return (
        <UserLayout>
            <Head title="Buy Coins" />
            <div className="min-h-screen bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Flash Messages */}
                    {flash?.success && (
                        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-green-800">{flash.success}</p>
                        </div>
                    )}

                    {flash?.error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-red-800">{flash.error}</p>
                        </div>
                    )}

                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Buy Coins
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Purchase coins to unlock premium chapters and support your favorite authors
                        </p>
                    </div>

                    {/* Coin Packages */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
                        {coinPackages && coinPackages.length > 0 ? (
                            coinPackages.filter(pkg => pkg.is_active).map((pkg, index) => {
                                const priceValue = typeof pkg.price_usd === 'string' ? parseFloat(pkg.price_usd) : pkg.price_usd;
                                const isPopular = index === 1;
                                
                                return (
                                    <div 
                                        key={pkg.id} 
                                        className={`relative bg-white rounded-2xl border-2 p-8 shadow-lg hover:shadow-xl transition-all duration-300 ${
                                            isPopular
                                                ? 'border-yellow-400 ring-4 ring-yellow-400/20 scale-105' 
                                                : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                    >
                                        {isPopular && (
                                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                                                    MOST POPULAR
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className="text-center">
                                            {/* Icon */}
                                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                                                </svg>
                                            </div>

                                            {/* Package Info */}
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                                {pkg.name}
                                            </h3>

                                            <div className="mb-6">
                                                <span className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                                    {pkg.coin_amount?.toLocaleString() || '0'}
                                                </span>
                                                <span className="text-lg text-gray-600 ml-1">Coins</span>
                                            </div>

                                            <div className="mb-8">
                                                <span className="text-2xl font-bold text-blue-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                                    ${priceValue.toFixed(2)}
                                                </span>
                                            </div>

                                            {/* Purchase Button */}
                                            <button 
                                                onClick={() => handlePurchase(pkg)}
                                                disabled={isLoading === pkg.id}
                                                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                    isPopular
                                                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600 shadow-lg hover:shadow-xl'
                                                        : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-md hover:shadow-lg'
                                                }`}
                                                style={{ fontFamily: 'Poppins, sans-serif' }}
                                            >
                                                {isLoading === pkg.id ? 'Processing...' : 'Purchase'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <div className="text-gray-500">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                                    </svg>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No coin packages available</h3>
                                    <p className="text-gray-600">Please contact administrator to set up coin packages.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* How It Works Section */}
                    <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            How It Works
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-xl font-bold text-blue-600">1</span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    Choose Package
                                </h3>
                                <p className="text-gray-600">Select the coin package that suits your reading needs</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-xl font-bold text-blue-600">2</span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    Secure Payment
                                </h3>
                                <p className="text-gray-600">Pay securely using PayPal or credit card</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-xl font-bold text-blue-600">3</span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    Unlock Content
                                </h3>
                                <p className="text-gray-600">Use coins to unlock premium chapters instantly</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Purchase Confirmation Modal */}
            {selectedPackage && (
                <PurchaseConfirmationModal
                    isOpen={showConfirmModal}
                    onClose={() => {
                        setShowConfirmModal(false);
                        setSelectedPackage(null);
                        setIsLoading(null);
                    }}
                    onConfirm={handleConfirmPurchase}
                    coinAmount={selectedPackage.coin_amount}
                    price={typeof selectedPackage.price_usd === 'string' ? parseFloat(selectedPackage.price_usd) : selectedPackage.price_usd}
                    isLoading={isLoading === selectedPackage.id}
                />
            )}

            {/* Success Modal */}
            {successData && (
                <SuccessModal
                    isOpen={showSuccessModal}
                    onClose={() => {
                        setShowSuccessModal(false);
                        setSuccessData(null);
                    }}
                    coinAmount={successData.coinAmount}
                    newBalance={successData.newBalance}
                />
            )}
        </UserLayout>
    );
}
