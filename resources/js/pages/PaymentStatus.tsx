import React, { useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme } from '@/Contexts/ThemeContext';

interface CoinPurchase {
    id: number;
    user_id: number;
    coin_package_id: number;
    coins_amount: number;
    price_usd: string;
    payment_method: string;
    transaction_id?: string;
    payment_url?: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    created_at: string;
    package?: {
        name: string;
        bonus_premium_days: number;
    };
}

interface Props {
    purchase: CoinPurchase;
}

function PaymentStatusContent({ purchase }: Props) {
    const [hasRefreshed, setHasRefreshed] = useState(false);
    const [hasOpenedPayment, setHasOpenedPayment] = useState(false);
    const [showCongrats, setShowCongrats] = useState(false);

    const page = usePage<{ 
        flash?: { 
            premium_granted?: { 
                days: number; 
                package_name: string; 
                source: string 
            } 
        } 
    }>();

    // Check for premium_granted flash and show modal when status is completed
    useEffect(() => {
        if (purchase.status === 'completed' && page.props.flash?.premium_granted && purchase.package?.bonus_premium_days) {
            setShowCongrats(true);
        }
    }, [purchase.status, page.props.flash, purchase.package]);

    // Auto-open payment URL when page loads (if pending and has payment_url)
    useEffect(() => {
        if (purchase.status === 'pending' && purchase.payment_url && !hasOpenedPayment) {
            setHasOpenedPayment(true);
            window.open(purchase.payment_url, '_blank');
        }
    }, [purchase.payment_url, purchase.status, hasOpenedPayment]);

    // Poll for status updates
    useEffect(() => {
        if (purchase.status === 'pending') {
            const interval = setInterval(() => {
                router.reload({ only: ['purchase'] });
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [purchase.status]);

    // One-time refresh when payment is completed to update navbar
    useEffect(() => {
        if (purchase.status === 'completed' && !hasRefreshed) {
            setHasRefreshed(true);
            // Force reload once to refresh user data in navbar
            router.reload();
        }
    }, [purchase.status, hasRefreshed]);

    const handleContinuePayment = () => {
        if (purchase.payment_url) {
            window.open(purchase.payment_url, '_blank');
        }
    };

    return (
        <UserLayout>
            <PaymentStatusInner 
                purchase={purchase}
                hasRefreshed={hasRefreshed}
                onContinuePayment={handleContinuePayment}
                showCongrats={showCongrats}
                setShowCongrats={setShowCongrats}
                premiumGranted={page.props.flash?.premium_granted}
            />
        </UserLayout>
    );
}

function PaymentStatusInner({ purchase, hasRefreshed, onContinuePayment, showCongrats, setShowCongrats, premiumGranted }: any) {
    const { currentTheme } = useTheme();
    const COIN_COLOR = '#f59e0b';

    const getStatusColor = () => {
        switch (purchase.status) {
            case 'completed':
                return COIN_COLOR;
            case 'pending':
                return '#fbbf24'; // yellow
            case 'failed':
            case 'cancelled':
                return '#ef4444'; // red
            default:
                return currentTheme.foreground;
        }
    };

    const getStatusIcon = () => {
        switch (purchase.status) {
            case 'completed':
                return (
                    <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill={`${COIN_COLOR}40`} />
                        <text x="12" y="16" fontSize="12" fontWeight="bold" fill={COIN_COLOR} textAnchor="middle">¢</text>
                        <circle cx="12" cy="12" r="10" stroke={COIN_COLOR} strokeWidth="2" fill="none" />
                    </svg>
                );
            case 'pending':
                return (
                    <svg className="w-16 h-16 animate-spin" style={{ color: '#fbbf24' }} fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                );
            case 'failed':
            case 'cancelled':
                return (
                    <svg className="w-16 h-16" style={{ color: '#ef4444' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const getStatusMessage = () => {
        switch (purchase.status) {
            case 'completed':
                return {
                    title: 'Payment Successful!',
                    description: 'Your coins have been added to your account.',
                };
            case 'pending':
                return {
                    title: 'Processing Payment...',
                    description: 'Please complete your payment. This page will update automatically.',
                };
            case 'failed':
                return {
                    title: 'Payment Failed',
                    description: 'Your payment could not be processed. Please try again.',
                };
            case 'cancelled':
                return {
                    title: 'Payment Cancelled',
                    description: 'You cancelled the payment process.',
                };
            default:
                return {
                    title: 'Unknown Status',
                    description: 'Please contact support if you need assistance.',
                };
        }
    };

    const message = getStatusMessage();
    const SHINY_PURPLE = '#a78bfa';

    return (
        <>
            <Head title="Payment Status" />

            {/* Congratulations Modal for Premium Bonus */}
            {showCongrats && premiumGranted && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
                    onClick={() => setShowCongrats(false)}
                >
                    <div 
                        className="backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center border-2 shadow-2xl"
                        style={{ 
                            backgroundColor: `${currentTheme.background}F0`,
                            borderColor: SHINY_PURPLE,
                            boxShadow: `0 0 40px ${SHINY_PURPLE}80`
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-6">
                            <div 
                                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4"
                                style={{ 
                                    backgroundColor: `${SHINY_PURPLE}20`,
                                    boxShadow: `0 0 30px ${SHINY_PURPLE}50`
                                }}
                            >
                                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
                                    <defs>
                                        <linearGradient id="bonusDiamond" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" style={{ stopColor: '#c084fc' }} />
                                            <stop offset="50%" style={{ stopColor: '#e879f9' }} />
                                            <stop offset="100%" style={{ stopColor: '#a78bfa' }} />
                                        </linearGradient>
                                    </defs>
                                    <path d="M12 2L3 9L12 22L21 9L12 2Z" fill="url(#bonusDiamond)" />
                                </svg>
                            </div>
                            <h2 
                                className="text-3xl font-bold mb-3"
                                style={{ color: SHINY_PURPLE }}
                            >
                                Bonus Unlocked!
                            </h2>
                            <p 
                                className="text-lg mb-2"
                                style={{ color: currentTheme.foreground }}
                            >
                                <span className="font-bold" style={{ color: SHINY_PURPLE }}>
                                    {premiumGranted.days} {premiumGranted.days === 1 ? 'Day' : 'Days'}
                                </span>
                                {' '}of Premium
                            </p>
                            <p 
                                className="text-xl font-semibold mb-4"
                                style={{ color: SHINY_PURPLE }}
                            >
                                Has Been Added to Your Account!
                            </p>
                            <div 
                                className="inline-block px-4 py-2 rounded-lg mb-4"
                                style={{ 
                                    backgroundColor: `${SHINY_PURPLE}20`,
                                    borderColor: SHINY_PURPLE,
                                    border: '1px solid'
                                }}
                            >
                                <p 
                                    className="text-sm font-semibold"
                                    style={{ color: SHINY_PURPLE }}
                                >
                                    {premiumGranted.package_name}
                                </p>
                            </div>
                            <p 
                                className="text-sm opacity-70"
                                style={{ color: currentTheme.foreground }}
                            >
                                Enjoy unlimited access to all premium chapters and an ad-free reading experience.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCongrats(false)}
                            className="w-full py-3 rounded-lg font-semibold transition-all"
                            style={{ 
                                backgroundColor: SHINY_PURPLE,
                                color: '#fff'
                            }}
                        >
                            Awesome!
                        </button>
                    </div>
                </div>
            )}
            
            <div 
                className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center"
                style={{ backgroundColor: currentTheme.background }}
            >
                <div className="max-w-2xl w-full">
                    {/* Status Card */}
                    <div 
                        className="rounded-2xl p-8 border-2 text-center"
                        style={{
                            backgroundColor: `${currentTheme.background}F0`,
                            borderColor: getStatusColor(),
                            boxShadow: `0 0 40px ${getStatusColor()}40`
                        }}
                    >
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            {getStatusIcon()}
                        </div>

                        {/* Title */}
                        <h1 
                            className="text-3xl font-bold mb-3"
                            style={{ color: getStatusColor() }}
                        >
                            {message.title}
                        </h1>

                        {/* Description */}
                        <p 
                            className="text-lg mb-8 opacity-70"
                            style={{ color: currentTheme.foreground }}
                        >
                            {message.description}
                        </p>

                        {/* Transaction Details */}
                        <div 
                            className="rounded-xl p-6 mb-6"
                            style={{
                                backgroundColor: `${currentTheme.foreground}05`,
                                borderColor: `${currentTheme.foreground}20`
                            }}
                        >
                            <h3 
                                className="text-sm font-semibold mb-4 opacity-70"
                                style={{ color: currentTheme.foreground }}
                            >
                                Transaction Details
                            </h3>
                            
                            <div className="space-y-3">
                                {/* Coins Amount */}
                                <div className="flex justify-between items-center">
                                    <span 
                                        className="text-sm opacity-70"
                                        style={{ color: currentTheme.foreground }}
                                    >
                                        Coins Purchased
                                    </span>
                                    <span 
                                        className="text-lg font-bold"
                                        style={{ color: COIN_COLOR }}
                                    >
                                        ¢{purchase.coins_amount.toLocaleString()}
                                    </span>
                                </div>

                                {/* Bonus Premium Days */}
                                {purchase.package?.bonus_premium_days && purchase.package.bonus_premium_days > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span 
                                            className="text-sm opacity-70"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            Bonus Premium
                                        </span>
                                        <span 
                                            className="text-sm font-semibold flex items-center gap-2"
                                            style={{ color: '#a78bfa' }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 2L3 9L12 22L21 9L12 2Z" fill="currentColor" />
                                            </svg>
                                            {purchase.package.bonus_premium_days} day{purchase.package.bonus_premium_days > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                )}

                                {/* Divider */}
                                <div 
                                    className="border-t pt-3"
                                    style={{ borderColor: `${currentTheme.foreground}20` }}
                                >
                                    {/* Package Name */}
                                    <div className="flex justify-between items-center mb-2">
                                        <span 
                                            className="text-sm opacity-70"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            Package
                                        </span>
                                        <span 
                                            className="text-sm font-medium"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            {purchase.package?.name || 'N/A'}
                                        </span>
                                    </div>

                                    {/* Amount Paid */}
                                    <div className="flex justify-between items-center mb-2">
                                        <span 
                                            className="text-sm opacity-70"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            Amount Paid
                                        </span>
                                        <span 
                                            className="text-sm font-semibold"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            ${purchase.price_usd}
                                        </span>
                                    </div>

                                    {/* Payment Method */}
                                    <div className="flex justify-between items-center mb-2">
                                        <span 
                                            className="text-sm opacity-70"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            Payment Method
                                        </span>
                                        <span 
                                            className="text-sm font-medium capitalize"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            {purchase.payment_method}
                                        </span>
                                    </div>

                                    {/* Transaction ID */}
                                    {purchase.transaction_id && (
                                        <div className="flex justify-between items-center">
                                            <span 
                                                className="text-sm opacity-70"
                                                style={{ color: currentTheme.foreground }}
                                            >
                                                Transaction ID
                                            </span>
                                            <span 
                                                className="text-xs font-mono opacity-70"
                                                style={{ color: currentTheme.foreground }}
                                            >
                                                {purchase.transaction_id.substring(0, 20)}...
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            {purchase.status === 'pending' && purchase.payment_url && (
                                <button
                                    onClick={onContinuePayment}
                                    className="px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl"
                                    style={{
                                        backgroundColor: COIN_COLOR,
                                        color: '#fff'
                                    }}
                                >
                                    Continue to Payment
                                </button>
                            )}

                            {purchase.status === 'completed' && (
                                <button
                                    onClick={() => router.visit('/')}
                                    className="px-6 py-3 rounded-lg font-semibold transition-all"
                                    style={{
                                        backgroundColor: COIN_COLOR,
                                        color: '#fff'
                                    }}
                                >
                                    Start Reading
                                </button>
                            )}
                            
                            {(purchase.status === 'failed' || purchase.status === 'cancelled') && (
                                <button
                                    onClick={() => router.visit('/buy-coins')}
                                    className="px-6 py-3 rounded-lg font-semibold transition-all"
                                    style={{
                                        backgroundColor: COIN_COLOR,
                                        color: '#fff'
                                    }}
                                >
                                    Try Again
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Help Text */}
                    {purchase.status === 'pending' && (
                        <p 
                            className="text-center text-sm mt-6 opacity-50"
                            style={{ color: currentTheme.foreground }}
                        >
                            Having trouble? Contact us on{' '}
                            <a 
                                href="https://discord.gg/5HcJf7p3ZG" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="underline hover:opacity-70"
                                style={{ color: '#5865F2' }}
                            >
                                Discord
                            </a>
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}

export default function PaymentStatus(props: Props) {
    return <PaymentStatusContent {...props} />;
}
