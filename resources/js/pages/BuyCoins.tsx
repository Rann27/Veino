import { Head, Link, router, usePage } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useState, useEffect } from 'react';
import PurchaseConfirmationModal from '@/Components/PurchaseConfirmationModal';
import SuccessModal from '@/Components/SuccessModal';
import { useTheme } from '@/Contexts/ThemeContext';

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

function BuyCoinsContent({ coinPackages }: Props) {
    const { flash, auth } = usePage<any>().props;
    const { currentTheme } = useTheme();
    
    // Remove the fallback as we now use theme context
    
    const [isLoading, setIsLoading] = useState<number | null>(null);
    const [paypalConfig, setPaypalConfig] = useState<any>(null);
    const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState<{coinAmount: number, newBalance: number} | null>(null);

    // Fetch PayPal configuration
    useEffect(() => {
        if (auth?.user) {
            fetch('/payment/paypal-config', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin'
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('PayPal config loaded:', data);
                    setPaypalConfig(data);
                })
                .catch(error => {
                    console.error('Failed to fetch PayPal config:', error);
                    // Set default config to prevent errors
                    setPaypalConfig({ configured: false });
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
            alert('PayPal payment gateway is not configured yet. Please contact administrator to set up PayPal credentials in .env file.');
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
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    return_url: window.location.origin + '/payment/success',
                    cancel_url: window.location.origin + '/payment/cancel',
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                // Close confirmation modal
                setShowConfirmModal(false);
                
                // Always redirect to PayPal for live mode
                console.log('Redirecting to PayPal:', data.payment_url);
                window.location.href = data.payment_url;
            } else {
                console.error('Payment initiation failed:', data);
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
        <>
            <Head title="Buy Coins" />
            <div 
                className="min-h-screen"
                style={{ backgroundColor: currentTheme.background }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Flash Messages */}
                    {flash?.success && (
                        <div 
                            className="mb-6 border rounded-lg p-4"
                            style={{
                                backgroundColor: `${currentTheme.foreground}10`,
                                borderColor: `${currentTheme.foreground}30`
                            }}
                        >
                            <p 
                                className="text-sm font-medium"
                                style={{ color: currentTheme.foreground }}
                            >
                                {flash.success}
                            </p>
                        </div>
                    )}

                    {flash?.error && (
                        <div 
                            className="mb-6 border rounded-lg p-4"
                            style={{
                                backgroundColor: '#fee2e2',
                                borderColor: '#fecaca'
                            }}
                        >
                            <p className="text-sm font-medium text-red-800">{flash.error}</p>
                        </div>
                    )}

                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 
                            className="text-4xl font-bold mb-4"
                            style={{ 
                                fontFamily: 'Poppins, sans-serif',
                                color: currentTheme.foreground
                            }}
                        >
                            Buy Coins
                        </h1>
                        <p 
                            className="text-xl max-w-2xl mx-auto"
                            style={{ color: `${currentTheme.foreground}80` }}
                        >
                            Purchase coins to unlock premium chapters!
                        </p>
                    </div>

                    {/* Coin Packages */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
                        {coinPackages && coinPackages.length > 0 ? (
                            coinPackages.filter(pkg => pkg.is_active).map((pkg, index) => {
                                const priceValue = typeof pkg.price_usd === 'string' ? parseFloat(pkg.price_usd) : pkg.price_usd;
                                
                                return (
                                    <div 
                                        key={pkg.id} 
                                        className="border-2 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:opacity-90"
                                        style={{
                                            backgroundColor: currentTheme.background,
                                            borderColor: `${currentTheme.foreground}20`
                                        }}
                                    >
                                        <div className="text-center">
                                            {/* Icon */}
                                            <div 
                                                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                                                style={{ backgroundColor: `${currentTheme.foreground}15` }}
                                            >
                                                <svg 
                                                    className="w-8 h-8" 
                                                    fill="currentColor" 
                                                    viewBox="0 0 20 20"
                                                    style={{ color: currentTheme.foreground }}
                                                >
                                                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                                                </svg>
                                            </div>

                                            {/* Package Info */}
                                            <h3 
                                                className="text-lg font-semibold mb-2"
                                                style={{ 
                                                    fontFamily: 'Poppins, sans-serif',
                                                    color: currentTheme.foreground
                                                }}
                                            >
                                                {pkg.name}
                                            </h3>

                                            <div className="mb-6">
                                                <span 
                                                    className="text-3xl font-bold"
                                                    style={{ 
                                                        fontFamily: 'Poppins, sans-serif',
                                                        color: currentTheme.foreground
                                                    }}
                                                >
                                                    {pkg.coin_amount?.toLocaleString() || '0'}
                                                </span>
                                                <span 
                                                    className="text-lg ml-1"
                                                    style={{ color: `${currentTheme.foreground}70` }}
                                                >
                                                    Coins
                                                </span>
                                            </div>

                                            <div className="mb-8">
                                                <span 
                                                    className="text-2xl font-bold"
                                                    style={{ 
                                                        fontFamily: 'Poppins, sans-serif',
                                                        color: currentTheme.foreground
                                                    }}
                                                >
                                                    ${priceValue.toFixed(2)}
                                                </span>
                                            </div>

                                            {/* Purchase Button */}
                                            <button 
                                                onClick={() => handlePurchase(pkg)}
                                                disabled={isLoading === pkg.id}
                                                className="w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:opacity-80"
                                                style={{ 
                                                    fontFamily: 'Poppins, sans-serif',
                                                    backgroundColor: currentTheme.foreground,
                                                    color: currentTheme.background
                                                }}
                                            >
                                                {isLoading === pkg.id ? 'Processing...' : 'Purchase'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <div>
                                    <svg 
                                        className="w-16 h-16 mx-auto mb-4" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                        style={{ color: `${currentTheme.foreground}40` }}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                                    </svg>
                                    <h3 
                                        className="text-lg font-medium mb-2"
                                        style={{ color: currentTheme.foreground }}
                                    >
                                        No coin packages available
                                    </h3>
                                    <p style={{ color: `${currentTheme.foreground}70` }}>
                                        Please contact administrator to set up coin packages.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* How It Works Section */}
                    <div 
                        className="rounded-2xl p-8 border"
                        style={{
                            backgroundColor: `${currentTheme.foreground}05`,
                            borderColor: `${currentTheme.foreground}20`
                        }}
                    >
                        <h2 
                            className="text-2xl font-bold text-center mb-8"
                            style={{ 
                                fontFamily: 'Poppins, sans-serif',
                                color: currentTheme.foreground
                            }}
                        >
                            How It Works
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div 
                                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                                    style={{ backgroundColor: `${currentTheme.foreground}15` }}
                                >
                                    <span 
                                        className="text-xl font-bold"
                                        style={{ color: currentTheme.foreground }}
                                    >
                                        1
                                    </span>
                                </div>
                                <h3 
                                    className="text-lg font-semibold mb-2"
                                    style={{ 
                                        fontFamily: 'Poppins, sans-serif',
                                        color: currentTheme.foreground
                                    }}
                                >
                                    Choose Package
                                </h3>
                                <p style={{ color: `${currentTheme.foreground}80` }}>
                                    Select the coin package that suits your reading needs
                                </p>
                            </div>
                            <div className="text-center">
                                <div 
                                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                                    style={{ backgroundColor: `${currentTheme.foreground}15` }}
                                >
                                    <span 
                                        className="text-xl font-bold"
                                        style={{ color: currentTheme.foreground }}
                                    >
                                        2
                                    </span>
                                </div>
                                <h3 
                                    className="text-lg font-semibold mb-2"
                                    style={{ 
                                        fontFamily: 'Poppins, sans-serif',
                                        color: currentTheme.foreground
                                    }}
                                >
                                    Secure Payment
                                </h3>
                                <p style={{ color: `${currentTheme.foreground}80` }}>
                                    Pay securely using PayPal or credit card
                                </p>
                            </div>
                            <div className="text-center">
                                <div 
                                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                                    style={{ backgroundColor: `${currentTheme.foreground}15` }}
                                >
                                    <span 
                                        className="text-xl font-bold"
                                        style={{ color: currentTheme.foreground }}
                                    >
                                        3
                                    </span>
                                </div>
                                <h3 
                                    className="text-lg font-semibold mb-2"
                                    style={{ 
                                        fontFamily: 'Poppins, sans-serif',
                                        color: currentTheme.foreground
                                    }}
                                >
                                    Unlock Content
                                </h3>
                                <p style={{ color: `${currentTheme.foreground}80` }}>
                                    Use coins to unlock premium chapters instantly
                                </p>
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
        </>
    );
}

export default function BuyCoins(props: Props) {
    return (
        <UserLayout>
            <BuyCoinsContent {...props} />
        </UserLayout>
    );
}
