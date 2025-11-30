import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import PremiumDiamond from '@/Components/PremiumDiamond';

interface CoinPackage {
    id: number;
    name: string;
    coin_amount: number;
    bonus_premium_days: number;
    price_usd: string;
}

interface Props {
    packages: CoinPackage[];
}

function BuyCoinsContent({ packages }: Props) {
    const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'cryptomus'>('paypal');
    const [isProcessing, setIsProcessing] = useState(false);
    const { currentTheme } = useTheme();

    const page = usePage<{ 
        auth: { user: { coins: number } | null }; 
    }>();

    const handlePurchase = () => {
        if (!selectedPackage) {
            alert('Please select a coin package');
            return;
        }

        setIsProcessing(true);

        router.post(
            route('payment.purchase'),
            {
                package_id: selectedPackage,
                payment_method: paymentMethod,
            },
            {
                onSuccess: () => {
                    // Redirect akan dihandle oleh controller
                },
                onError: (errors) => {
                    console.error('Purchase error:', errors);
                    alert('Failed to process purchase. Please try again.');
                    setIsProcessing(false);
                },
                onFinish: () => {
                    // Processing state akan di-handle oleh redirect
                }
            }
        );
    };

    return (
        <div 
            className="min-h-screen py-12 px-4 sm:px-6 lg:px-8"
            style={{ backgroundColor: currentTheme.background }}
        >
            <Head title="Buy Coins" />
            
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 
                        className="text-4xl md:text-5xl font-bold mb-4"
                        style={{ color: currentTheme.foreground }}
                    >
                        Buy Coins
                    </h1>
                    <p 
                        className="text-lg max-w-2xl mx-auto opacity-70"
                        style={{ color: currentTheme.foreground }}
                    >
                        Purchase coins to unlock premium features and access exclusive content
                    </p>
                    {page.props.auth.user && page.props.auth.user.coins !== undefined && (
                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30">
                            <span className="text-amber-400 font-semibold">Your Balance:</span>
                            <span className="text-2xl font-bold text-amber-400">¢{page.props.auth.user.coins.toLocaleString()}</span>
                        </div>
                    )}
                </div>

                {/* Coin Packages Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-4 mb-12">
                    {packages.map((pkg: CoinPackage) => {
                        const isSelected = selectedPackage === pkg.id;
                        const priceUsd = parseFloat(pkg.price_usd);
                        const bonusPercentage = ((pkg.coin_amount - priceUsd * 100) / (priceUsd * 100) * 100).toFixed(1);
                        
                        return (
                            <div
                                key={pkg.id}
                                onClick={() => setSelectedPackage(pkg.id)}
                                className={`
                                    relative cursor-pointer rounded-xl p-4 lg:p-4 transition-all duration-300 backdrop-blur-sm
                                    ${isSelected
                                        ? 'bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border-2 border-amber-500 shadow-xl shadow-amber-500/30 scale-105'
                                        : 'border-2 hover:border-amber-500/50 hover:shadow-lg'
                                    }
                                `}
                                style={{
                                    backgroundColor: isSelected ? undefined : `${currentTheme.foreground}15`,
                                    borderColor: isSelected ? undefined : `${currentTheme.foreground}30`
                                }}
                            >
                                {/* Package Name Badge */}
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                                    <span className="px-3 lg:px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold text-[11px] lg:text-xs shadow-lg whitespace-nowrap">
                                        {pkg.name}
                                    </span>
                                </div>

                                {/* Bonus Badge */}
                                {parseFloat(bonusPercentage) > 0 && (
                                    <div className="absolute -top-2 -right-2 z-10">
                                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full text-[10px] lg:text-xs font-bold shadow-lg">
                                            +{bonusPercentage}%
                                        </div>
                                    </div>
                                )}

                                <div className="mt-5 lg:mt-6 text-center">
                                    {/* Coin Amount */}
                                    <div className="mb-2 lg:mb-3">
                                        <div className="text-2xl lg:text-3xl xl:text-4xl font-bold text-amber-400 mb-1">
                                            ¢{pkg.coin_amount.toLocaleString()}
                                        </div>
                                        <div 
                                            className="text-[10px] lg:text-xs opacity-60"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            coins
                                        </div>
                                    </div>

                                    {/* Premium Days Bonus */}
                                    {pkg.bonus_premium_days > 0 && (
                                        <div className="mb-2 lg:mb-3 inline-flex items-center gap-1 px-2 py-0.5 lg:py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
                                            <PremiumDiamond size={12} />
                                            <span className="text-purple-400 text-[10px] lg:text-xs font-semibold">
                                                +{pkg.bonus_premium_days}d
                                            </span>
                                        </div>
                                    )}

                                    {/* Price */}
                                    <div 
                                        className="mt-2 lg:mt-3 pt-2 lg:pt-3 border-t"
                                        style={{ borderColor: `${currentTheme.foreground}20` }}
                                    >
                                        <div 
                                            className="text-xl lg:text-2xl font-bold"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            ${pkg.price_usd}
                                        </div>
                                        <div 
                                            className="text-[10px] lg:text-xs mt-0.5 opacity-60"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            USD
                                        </div>
                                    </div>

                                    {/* Selection Indicator */}
                                    {isSelected && (
                                        <div className="mt-2 lg:mt-3">
                                            <div className="inline-flex items-center gap-1 text-amber-400 font-semibold text-xs lg:text-sm">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <span className="hidden lg:inline">Selected</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Payment Method Selection */}
                {selectedPackage && (
                    <div className="max-w-2xl mx-auto mb-8 animate-fade-in">
                        <div 
                            className="border-2 rounded-2xl p-6 backdrop-blur-sm"
                            style={{
                                backgroundColor: `${currentTheme.foreground}15`,
                                borderColor: `${currentTheme.foreground}30`
                            }}
                        >
                            <h3 
                                className="text-xl font-bold mb-4"
                                style={{ color: currentTheme.foreground }}
                            >
                                Select Payment Method
                            </h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* PayPal */}
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('paypal')}
                                    className={`
                                        relative p-6 rounded-xl transition-all duration-300 backdrop-blur-sm
                                        ${paymentMethod === 'paypal'
                                            ? 'bg-blue-500/20 border-2 border-blue-500 shadow-lg shadow-blue-500/30'
                                            : 'border-2 hover:border-blue-500/50'
                                        }
                                    `}
                                    style={paymentMethod !== 'paypal' ? {
                                        backgroundColor: `${currentTheme.foreground}10`,
                                        borderColor: `${currentTheme.foreground}30`
                                    } : undefined}
                                >
                                    <div className="flex flex-col items-center gap-3">
                                        <img 
                                            src="/images/paymentlogo/paypal.svg" 
                                            alt="PayPal" 
                                            className="h-8"
                                        />
                                        <span className="text-xl font-bold text-blue-400">PayPal</span>
                                        <p 
                                            className="text-sm opacity-60"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            Credit/Debit Card
                                        </p>
                                    </div>
                                    {paymentMethod === 'paypal' && (
                                        <div className="absolute top-2 right-2">
                                            <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </button>

                                {/* Cryptomus */}
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('cryptomus')}
                                    className={`
                                        relative p-6 rounded-xl transition-all duration-300 backdrop-blur-sm
                                        ${paymentMethod === 'cryptomus'
                                            ? 'bg-white/20 border-2 border-white shadow-lg shadow-white/30'
                                            : 'border-2 hover:border-white/50'
                                        }
                                    `}
                                    style={paymentMethod !== 'cryptomus' ? {
                                        backgroundColor: `${currentTheme.foreground}10`,
                                        borderColor: `${currentTheme.foreground}30`
                                    } : undefined}
                                >
                                    <div className="flex flex-col items-center gap-3">
                                        <img 
                                            src="/images/paymentlogo/cryptomus.svg" 
                                            alt="Cryptomus" 
                                            className="h-8"
                                        />
                                        <span className="text-xl font-bold text-white">Cryptomus</span>
                                        <p 
                                            className="text-sm opacity-60"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            Cryptocurrency
                                        </p>
                                    </div>
                                    {paymentMethod === 'cryptomus' && (
                                        <div className="absolute top-2 right-2">
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Purchase Button */}
                {selectedPackage && (
                    <div className="max-w-md mx-auto animate-fade-in">
                        <button
                            type="button"
                            onClick={handlePurchase}
                            disabled={isProcessing}
                            className={`
                                w-full py-4 px-8 rounded-xl font-bold text-lg
                                transition-all duration-300 shadow-xl
                                ${isProcessing
                                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                    : 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 hover:shadow-2xl hover:shadow-amber-500/50 hover:scale-105'
                                }
                                text-white
                            `}
                        >
                            {isProcessing ? (
                                <span className="flex items-center justify-center gap-3">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-3">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Continue to Payment
                                </span>
                            )}
                        </button>
                        
                        {/* Security Note */}
                        <div className="mt-4 text-center">
                            <p 
                                className="text-sm flex items-center justify-center gap-2 opacity-60"
                                style={{ color: currentTheme.foreground }}
                            >
                                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                Secure payment processing
                            </p>
                        </div>
                    </div>
                )}

                {/* Benefits Section */}
                <div className="mt-16 max-w-4xl mx-auto">
                    <h2 
                        className="text-2xl font-bold text-center mb-8"
                        style={{ color: currentTheme.foreground }}
                    >
                        Why Buy Coins?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div 
                            className="border rounded-xl p-6 text-center backdrop-blur-sm"
                            style={{
                                backgroundColor: `${currentTheme.foreground}15`,
                                borderColor: `${currentTheme.foreground}30`
                            }}
                        >
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 mb-4">
                                <PremiumDiamond size={24} />
                            </div>
                            <h3 
                                className="text-lg font-semibold mb-2"
                                style={{ color: currentTheme.foreground }}
                            >
                                Premium Access
                            </h3>
                            <p 
                                className="text-sm opacity-60"
                                style={{ color: currentTheme.foreground }}
                            >
                                Get bonus premium days and unlock exclusive features
                            </p>
                        </div>

                        <div 
                            className="border rounded-xl p-6 text-center backdrop-blur-sm"
                            style={{
                                backgroundColor: `${currentTheme.foreground}15`,
                                borderColor: `${currentTheme.foreground}30`
                            }}
                        >
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 mb-4">
                                <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h3 
                                className="text-lg font-semibold mb-2"
                                style={{ color: currentTheme.foreground }}
                            >
                                Flexible Spending
                            </h3>
                            <p 
                                className="text-sm opacity-60"
                                style={{ color: currentTheme.foreground }}
                            >
                                Use coins for membership, shop items, and more
                            </p>
                        </div>

                        <div 
                            className="border rounded-xl p-6 text-center backdrop-blur-sm"
                            style={{
                                backgroundColor: `${currentTheme.foreground}15`,
                                borderColor: `${currentTheme.foreground}30`
                            }}
                        >
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mb-4">
                                <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h3 
                                className="text-lg font-semibold mb-2"
                                style={{ color: currentTheme.foreground }}
                            >
                                Bonus Rewards
                            </h3>
                            <p 
                                className="text-sm opacity-60"
                                style={{ color: currentTheme.foreground }}
                            >
                                Larger packages come with bigger bonuses
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function BuyCoins(props: Props) {
    return (
        <UserLayout>
            <BuyCoinsContent {...props} />
        </UserLayout>
    );
}