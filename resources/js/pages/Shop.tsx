import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme, SHINY_PURPLE } from '@/Contexts/ThemeContext';
import PremiumDiamond from '@/Components/PremiumDiamond';

/* ─── Interfaces ─── */
interface CoinPackage {
    id: number;
    name: string;
    coin_amount: number;
    bonus_premium_days: number;
    price_usd: string;
}

interface MembershipPackage {
    id: number;
    name: string;
    tier: string;
    price_usd: string;
    coin_price: number;
    gimmick_price?: string | null;
    duration_days: number;
    features: {
        unlock_premium_chapters?: boolean;
        ad_free?: boolean;
    };
    discount_percentage: number;
    is_active: boolean;
}

interface Props {
    coinPackages: CoinPackage[];
    membershipPackages: MembershipPackage[];
    activeTab?: string;
    flash?: {
        success?: string;
        error?: string;
        premium_granted?: {
            days: number;
            package_name: string;
            source: string;
        };
    };
    errors?: Record<string, string | string[]>;
}

/* ─── Helpers ─── */
const getOriginalCoinPrice = (coinPrice: number, discount: number): number => {
    if (discount === 0) return 0;
    return Math.round(coinPrice / (1 - discount / 100));
};

/* ═══════════════════════════════════════════════
   Main Shop Page
   ═══════════════════════════════════════════════ */

function ShopContent({ coinPackages, membershipPackages, activeTab: initialTab, flash, errors }: Props) {
    const { currentTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<'coins' | 'membership'>(
        (initialTab === 'membership') ? 'membership' : 'coins'
    );

    const page = usePage<{
        auth: { user: { coins: number } | null };
        flash?: { success?: string; error?: string; premium_granted?: { days: number; package_name: string; source: string } };
        errors?: Record<string, string | string[]>;
    }>();

    // Update URL without reload when switching tabs
    const switchTab = (tab: 'coins' | 'membership') => {
        setActiveTab(tab);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.replaceState({}, '', url.toString());
    };

    return (
        <>
            <Head title="Shop" />

            <div className="min-h-screen" style={{ backgroundColor: currentTheme.background }}>
                <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">

                    {/* ─── Header ─── */}
                    <div className="mb-8 text-center">
                        <h1
                            className="text-2xl sm:text-3xl font-extrabold mb-1"
                            style={{ color: currentTheme.foreground }}
                        >
                            Shop
                        </h1>
                        <p className="text-sm sm:text-base" style={{ color: `${currentTheme.foreground}60` }}>
                            Power-up your reading experience
                        </p>

                        {/* Balance badge */}
                        {page.props.auth.user && page.props.auth.user.coins !== undefined && (
                            <div
                                className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-full"
                                style={{
                                    backgroundColor: `${currentTheme.foreground}06`,
                                    border: `1px solid ${currentTheme.foreground}12`,
                                }}
                            >
                                <span className="text-sm font-medium" style={{ color: `${currentTheme.foreground}70` }}>
                                    Your Balance
                                </span>
                                <span className="text-xl font-bold text-amber-400">
                                    ¢{page.props.auth.user.coins.toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ─── Tab Switcher ─── */}
                    <div className="flex justify-center mb-8">
                        <div
                            className="inline-flex rounded-2xl p-1"
                            style={{
                                backgroundColor: `${currentTheme.foreground}06`,
                                border: `1px solid ${currentTheme.foreground}08`,
                            }}
                        >
                            <button
                                onClick={() => switchTab('coins')}
                                className="relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
                                style={{
                                    backgroundColor: activeTab === 'coins' ? currentTheme.foreground : 'transparent',
                                    color: activeTab === 'coins' ? currentTheme.background : `${currentTheme.foreground}60`,
                                }}
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                </svg>
                                Buy Coins
                            </button>
                            <button
                                onClick={() => switchTab('membership')}
                                className="relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
                                style={{
                                    backgroundColor: activeTab === 'membership' ? SHINY_PURPLE : 'transparent',
                                    color: activeTab === 'membership' ? '#ffffff' : `${currentTheme.foreground}60`,
                                }}
                            >
                                <PremiumDiamond size={14} />
                                Membership
                            </button>
                        </div>
                    </div>

                    {/* ─── Tab Content ─── */}
                    {activeTab === 'coins' ? (
                        <CoinShopTab packages={coinPackages} />
                    ) : (
                        <MembershipTab packages={membershipPackages} flash={flash} errors={errors} />
                    )}
                </div>
            </div>
        </>
    );
}

/* ═══════════════════════════════════════════════
   Tab 1 — Coin Shop
   ═══════════════════════════════════════════════ */

function CoinShopTab({ packages }: { packages: CoinPackage[] }) {
    const { currentTheme } = useTheme();
    const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'cryptomus'>('paypal');
    const [isProcessing, setIsProcessing] = useState(false);

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
                onSuccess: () => {},
                onError: (errors) => {
                    console.error('Purchase error:', errors);
                    alert('Failed to process purchase. Please try again.');
                    setIsProcessing(false);
                },
                onFinish: () => {}
            }
        );
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Coin Packages Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
                {packages.map((pkg) => {
                    const isSelected = selectedPackage === pkg.id;
                    const priceUsd = parseFloat(pkg.price_usd);
                    const bonusPercentage = ((pkg.coin_amount - priceUsd * 100) / (priceUsd * 100) * 100).toFixed(1);

                    return (
                        <button
                            key={pkg.id}
                            type="button"
                            onClick={() => setSelectedPackage(pkg.id)}
                            className={`
                                relative rounded-2xl p-4 text-center transition-all duration-300 group
                                ${isSelected
                                    ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-400/20 -translate-y-1'
                                    : 'hover:shadow-md hover:-translate-y-0.5'
                                }
                            `}
                            style={{
                                backgroundColor: isSelected ? `${currentTheme.foreground}08` : `${currentTheme.foreground}04`,
                                border: `1px solid ${isSelected ? '#fbbf24' : `${currentTheme.foreground}08`}`,
                            }}
                        >
                            {/* Package Name Badge */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                <span
                                    className="px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold text-[11px] shadow-sm whitespace-nowrap"
                                >
                                    {pkg.name}
                                </span>
                            </div>

                            {/* Bonus Badge */}
                            {parseFloat(bonusPercentage) > 0 && (
                                <div className="absolute -top-2 -right-2 z-10">
                                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                                        +{bonusPercentage}%
                                    </div>
                                </div>
                            )}

                            <div className="mt-5">
                                {/* Coin Amount */}
                                <div className="mb-2">
                                    <div className="text-2xl xl:text-3xl font-bold text-amber-400 mb-0.5">
                                        ¢{pkg.coin_amount.toLocaleString()}
                                    </div>
                                    <div className="text-[10px] uppercase tracking-wider" style={{ color: `${currentTheme.foreground}40` }}>
                                        coins
                                    </div>
                                </div>

                                {/* Premium Days Bonus */}
                                {pkg.bonus_premium_days > 0 && (
                                    <div className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/25">
                                        <PremiumDiamond size={11} />
                                        <span className="text-purple-400 text-[10px] font-semibold">
                                            +{pkg.bonus_premium_days}d
                                        </span>
                                    </div>
                                )}

                                {/* Price */}
                                <div
                                    className="mt-2 pt-2"
                                    style={{ borderTop: `1px solid ${currentTheme.foreground}08` }}
                                >
                                    <div className="text-xl font-bold" style={{ color: currentTheme.foreground }}>
                                        ${pkg.price_usd}
                                    </div>
                                    <div className="text-[10px] uppercase tracking-wider" style={{ color: `${currentTheme.foreground}40` }}>
                                        USD
                                    </div>
                                </div>

                                {/* Selection tick */}
                                {isSelected && (
                                    <div className="mt-2">
                                        <svg className="w-5 h-5 mx-auto text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Payment Method Selection */}
            {selectedPackage && (
                <div className="max-w-2xl mx-auto mb-8">
                    <div
                        className="rounded-2xl p-5"
                        style={{
                            backgroundColor: `${currentTheme.foreground}04`,
                            border: `1px solid ${currentTheme.foreground}08`,
                        }}
                    >
                        <h3
                            className="text-base font-semibold mb-4"
                            style={{ color: currentTheme.foreground }}
                        >
                            Select Payment Method
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* PayPal */}
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('paypal')}
                                className={`
                                    relative p-5 rounded-xl transition-all duration-300
                                    ${paymentMethod === 'paypal'
                                        ? 'ring-2 ring-blue-400 shadow-md shadow-blue-400/15'
                                        : 'hover:shadow-sm'
                                    }
                                `}
                                style={{
                                    backgroundColor: paymentMethod === 'paypal' ? `${currentTheme.foreground}08` : `${currentTheme.foreground}04`,
                                    border: `1px solid ${paymentMethod === 'paypal' ? '#60a5fa' : `${currentTheme.foreground}08`}`,
                                }}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <img src="/images/paymentlogo/paypal.svg" alt="PayPal" className="h-7" />
                                    <span className="text-base font-bold text-blue-400">PayPal</span>
                                    <span className="text-xs" style={{ color: `${currentTheme.foreground}50` }}>Credit/Debit Card</span>
                                </div>
                                {paymentMethod === 'paypal' && (
                                    <div className="absolute top-2 right-2">
                                        <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </button>

                            {/* Cryptomus */}
                            <div className="relative group">
                                <button
                                    type="button"
                                    disabled
                                    className="relative p-5 rounded-xl transition-all duration-300 opacity-50 cursor-not-allowed w-full"
                                    style={{
                                        backgroundColor: `${currentTheme.foreground}04`,
                                        border: `1px solid ${currentTheme.foreground}08`,
                                    }}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <img src="/images/paymentlogo/cryptomus.svg" alt="Cryptomus" className="h-7 grayscale" />
                                        <span className="text-base font-bold text-gray-400">Cryptomus</span>
                                        <span className="text-xs" style={{ color: `${currentTheme.foreground}30` }}>Cryptocurrency</span>
                                    </div>
                                </button>
                                {/* Tooltip on hover */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                    Temporarily unavailable
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                        <div className="border-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Purchase Button */}
            {selectedPackage && (
                <div className="max-w-md mx-auto mb-12">
                    <button
                        type="button"
                        onClick={handlePurchase}
                        disabled={isProcessing}
                        className={`
                            w-full py-3.5 px-8 rounded-xl font-bold text-base transition-all duration-300 shadow-lg
                            ${isProcessing
                                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                : 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 hover:shadow-xl hover:shadow-amber-500/30 hover:scale-[1.02]'
                            }
                            text-white
                        `}
                    >
                        {isProcessing ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Continue to Payment
                            </span>
                        )}
                    </button>
                    <p className="mt-3 text-center text-xs flex items-center justify-center gap-1.5" style={{ color: `${currentTheme.foreground}40` }}>
                        <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Secure payment processing
                    </p>
                </div>
            )}

            {/* ─── Why Buy Coins ─── */}
            <div className="max-w-4xl mx-auto">
                <h2
                    className="text-lg font-bold text-center mb-5"
                    style={{ color: currentTheme.foreground }}
                >
                    Why Buy Coins?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        {
                            icon: <PremiumDiamond size={22} />,
                            iconBg: 'rgba(168,139,250,0.15)',
                            title: 'Premium Access',
                            desc: 'Get bonus premium days and unlock exclusive features',
                        },
                        {
                            icon: (
                                <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                </svg>
                            ),
                            iconBg: 'rgba(251,191,36,0.15)',
                            title: 'Flexible Spending',
                            desc: 'Use coins for membership, shop items, and more',
                        },
                        {
                            icon: (
                                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                </svg>
                            ),
                            iconBg: 'rgba(74,222,128,0.15)',
                            title: 'Bonus Rewards',
                            desc: 'Larger packages come with bigger bonuses',
                        },
                    ].map((item) => (
                        <div
                            key={item.title}
                            className="rounded-2xl p-5 text-center"
                            style={{
                                backgroundColor: `${currentTheme.foreground}04`,
                                border: `1px solid ${currentTheme.foreground}08`,
                            }}
                        >
                            <div
                                className="inline-flex items-center justify-center w-11 h-11 rounded-full mb-3"
                                style={{ backgroundColor: item.iconBg }}
                            >
                                {item.icon}
                            </div>
                            <h3 className="font-semibold text-sm mb-1" style={{ color: currentTheme.foreground }}>
                                {item.title}
                            </h3>
                            <p className="text-xs" style={{ color: `${currentTheme.foreground}55` }}>
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════
   Tab 2 — Membership
   ═══════════════════════════════════════════════ */

function MembershipTab({ packages, flash, errors }: {
    packages: MembershipPackage[];
    flash?: Props['flash'];
    errors?: Props['errors'];
}) {
    const { currentTheme } = useTheme();
    const page = usePage<{
        auth: { user: { coins: number } };
        flash?: { success?: string; error?: string; premium_granted?: { days: number; package_name: string; source: string } };
        errors?: Record<string, string | string[]>;
    }>();

    const userCoins = page.props.auth.user.coins;

    const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(flash?.error ?? null);
    const [premiumGranted, setPremiumGranted] = useState<{ days: number; package_name: string; source: string } | null>(null);
    const [voucherCode, setVoucherCode] = useState('');
    const [voucherData, setVoucherData] = useState<any>(null);
    const [voucherError, setVoucherError] = useState<string | null>(null);
    const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);

    const extractMessage = (value: unknown): string | undefined => {
        if (!value) return undefined;
        if (Array.isArray(value)) {
            const c = value.find((e) => typeof e === 'string');
            return c as string | undefined;
        }
        return typeof value === 'string' ? value : undefined;
    };

    useEffect(() => {
        if (flash?.premium_granted) {
            setPremiumGranted(flash.premium_granted);
            setShowSuccess(true);
        }
    }, [flash?.premium_granted]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
            setShowSuccess(true);
            window.history.replaceState({}, '', '/shop?tab=membership');
        }
    }, []);

    useEffect(() => {
        if (flash?.error) setErrorMessage(flash.error);
    }, [flash?.error]);

    useEffect(() => {
        const pageErrors = errors ?? page.props.errors;
        if (pageErrors && Object.keys(pageErrors).length > 0) {
            const msg =
                extractMessage(pageErrors.membership) ??
                extractMessage(pageErrors.error) ??
                extractMessage(Object.values(pageErrors)[0]);
            if (msg) setErrorMessage(msg);
        }
    }, [errors, page.props.errors]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selectedPackage) {
            setErrorMessage('Please choose a membership package.');
            return;
        }
        setShowConfirmModal(true);
    };

    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) {
            setVoucherError('Please enter a voucher code.');
            alert('⚠️ Please enter a voucher code');
            return;
        }
        if (!selectedPackage) {
            setVoucherError('Please select a package first.');
            alert('⚠️ Please select a membership package first');
            return;
        }
        const selectedPkg = packages.find(p => p.id === selectedPackage);
        if (!selectedPkg) return;

        setIsApplyingVoucher(true);
        setVoucherError(null);

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
                    type: 'membership',
                    amount: selectedPkg.coin_price,
                }),
            });
            const data = await response.json();

            if (data.success) {
                setVoucherData(data.data);
                setVoucherError(null);
                alert(`✅ Voucher "${voucherCode.toUpperCase()}" applied successfully!\n💰 You saved ¢${data.data.discount_amount.toLocaleString()}`);
            } else {
                setVoucherError(data.message);
                setVoucherData(null);
                alert(`❌ ${data.message || 'Invalid or expired voucher code'}`);
            }
        } catch (error) {
            console.error('Voucher validation error:', error);
            setVoucherError('Failed to validate voucher. Please try again.');
            setVoucherData(null);
            alert('❌ Failed to validate voucher. Please check your connection and try again.');
        } finally {
            setIsApplyingVoucher(false);
        }
    };

    const handleRemoveVoucher = () => {
        setVoucherCode('');
        setVoucherData(null);
        setVoucherError(null);
    };

    const handleConfirmPurchase = () => {
        if (!selectedPackage) return;
        setErrorMessage(null);
        setShowConfirmModal(false);

        router.post(route('membership.purchase'), {
            package_id: selectedPackage,
            voucher_code: voucherData ? voucherCode.toUpperCase() : null,
        }, {
            preserveScroll: true,
            onStart: () => setIsProcessing(true),
            onError: (formErrors) => {
                const message =
                    extractMessage(formErrors.membership) ||
                    extractMessage(formErrors.error) ||
                    extractMessage(Object.values(formErrors)[0]) ||
                    'We could not process your purchase. Please try again.';
                setErrorMessage(message);
            },
            onSuccess: () => {
                setErrorMessage(null);
                setShowSuccess(true);
            },
            onFinish: () => setIsProcessing(false),
        });
    };

    const selectedPkg = packages.find(p => p.id === selectedPackage);

    return (
        <div className="max-w-4xl mx-auto">
            {/* ─── Confirm Modal ─── */}
            {showConfirmModal && selectedPkg && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                    onClick={() => setShowConfirmModal(false)}
                >
                    <div
                        className="backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center border-2 shadow-2xl"
                        style={{
                            backgroundColor: `${currentTheme.background}F0`,
                            borderColor: SHINY_PURPLE,
                            boxShadow: `0 0 40px ${SHINY_PURPLE}80`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-6">
                            <div
                                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
                                style={{ backgroundColor: `${SHINY_PURPLE}20`, boxShadow: `0 0 30px ${SHINY_PURPLE}50` }}
                            >
                                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
                                    <text x="12" y="18" fontSize="24" fontWeight="bold" fill={SHINY_PURPLE} textAnchor="middle">¢</text>
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold mb-2" style={{ color: SHINY_PURPLE }}>Confirm Purchase</h2>
                            <p className="text-sm mb-4" style={{ color: currentTheme.foreground }}>
                                Purchase <span className="font-semibold" style={{ color: SHINY_PURPLE }}>{selectedPkg.name}</span> membership?
                            </p>

                            <div className="rounded-lg p-4 mb-4 text-left text-sm" style={{ backgroundColor: `${currentTheme.foreground}08` }}>
                                <div className="flex justify-between mb-2">
                                    <span style={{ color: `${currentTheme.foreground}70` }}>Duration:</span>
                                    <span className="font-semibold" style={{ color: currentTheme.foreground }}>{selectedPkg.duration_days} days</span>
                                </div>
                                {voucherData ? (
                                    <>
                                        <div className="flex justify-between mb-2">
                                            <span style={{ color: `${currentTheme.foreground}70` }}>Original Price:</span>
                                            <span className="line-through opacity-50" style={{ color: currentTheme.foreground }}>¢{selectedPkg.coin_price.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between mb-2">
                                            <span className="font-medium" style={{ color: '#10b981' }}>Voucher Discount ({voucherCode}):</span>
                                            <span className="font-medium" style={{ color: '#10b981' }}>-¢{voucherData.discount_amount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${currentTheme.foreground}12` }}>
                                            <span className="font-semibold" style={{ color: currentTheme.foreground }}>Final Cost:</span>
                                            <span className="font-bold text-lg" style={{ color: '#f59e0b' }}>¢{voucherData.final_amount.toLocaleString()}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex justify-between">
                                        <span style={{ color: `${currentTheme.foreground}70` }}>Cost:</span>
                                        <span className="font-bold text-lg" style={{ color: '#f59e0b' }}>¢{selectedPkg.coin_price.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            <p className="text-xs mb-1" style={{ color: `${currentTheme.foreground}70` }}>
                                Your balance: <span className="font-semibold" style={{ color: '#f59e0b' }}>¢{userCoins.toLocaleString()}</span>
                            </p>
                            {userCoins >= (voucherData ? voucherData.final_amount : selectedPkg.coin_price) && (
                                <p className="text-xs" style={{ color: `${currentTheme.foreground}70` }}>
                                    After purchase: <span className="font-semibold" style={{ color: '#f59e0b' }}>¢{(userCoins - (voucherData ? voucherData.final_amount : selectedPkg.coin_price)).toLocaleString()}</span>
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all"
                                style={{ border: `1px solid ${currentTheme.foreground}30`, color: currentTheme.foreground }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmPurchase}
                                disabled={isProcessing}
                                className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all"
                                style={{ backgroundColor: SHINY_PURPLE, color: '#fff', opacity: isProcessing ? 0.5 : 1 }}
                            >
                                {isProcessing ? 'Processing...' : 'Confirm Purchase'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Success Modal ─── */}
            {showSuccess && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                    onClick={() => setShowSuccess(false)}
                >
                    <div
                        className="backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center border-2 shadow-2xl"
                        style={{ backgroundColor: `${currentTheme.background}F0`, borderColor: SHINY_PURPLE, boxShadow: `0 0 40px ${SHINY_PURPLE}80` }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-6">
                            <div
                                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
                                style={{ backgroundColor: `${SHINY_PURPLE}20`, boxShadow: `0 0 30px ${SHINY_PURPLE}50` }}
                            >
                                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
                                    <defs>
                                        <linearGradient id="successDiamond" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" style={{ stopColor: '#c084fc' }} />
                                            <stop offset="50%" style={{ stopColor: '#e879f9' }} />
                                            <stop offset="100%" style={{ stopColor: '#a78bfa' }} />
                                        </linearGradient>
                                    </defs>
                                    <path d="M12 2L3 9L12 22L21 9L12 2Z" fill="url(#successDiamond)" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold mb-2" style={{ color: SHINY_PURPLE }}>Congratulations!</h2>

                            {premiumGranted ? (
                                <>
                                    <p className="text-base mb-1" style={{ color: currentTheme.foreground }}>
                                        <span className="font-bold" style={{ color: SHINY_PURPLE }}>{premiumGranted.days} {premiumGranted.days === 1 ? 'Day' : 'Days'}</span> of Premium
                                    </p>
                                    <p className="text-lg font-semibold mb-3" style={{ color: SHINY_PURPLE }}>Has Been Added to Your Account!</p>
                                    <div className="inline-block px-4 py-1.5 rounded-lg mb-3" style={{ backgroundColor: `${SHINY_PURPLE}20`, border: `1px solid ${SHINY_PURPLE}` }}>
                                        <p className="text-sm font-semibold" style={{ color: SHINY_PURPLE }}>{premiumGranted.package_name}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-base mb-1" style={{ color: currentTheme.foreground }}>Your Premium Membership</p>
                                    <p className="text-lg font-semibold mb-3" style={{ color: SHINY_PURPLE }}>Has Been Activated!</p>
                                </>
                            )}

                            <p className="text-xs" style={{ color: `${currentTheme.foreground}70` }}>
                                Enjoy unlimited access to all premium chapters and an ad-free reading experience.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowSuccess(false)}
                            className="w-full py-2.5 rounded-lg font-semibold transition-all"
                            style={{ backgroundColor: SHINY_PURPLE, color: '#fff' }}
                        >
                            Start Reading
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Banner */}
                {errorMessage && (
                    <div
                        className="rounded-xl px-4 py-3 flex items-start gap-3"
                        style={{ border: '1px solid #ef4444', backgroundColor: 'rgba(239,68,68,0.1)' }}
                    >
                        <svg className="w-5 h-5 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" fill="none" />
                            <path d="M12 7v6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="12" cy="16.5" r="1" fill="#ef4444" />
                        </svg>
                        <p className="flex-1 text-sm" style={{ color: '#ef4444' }}>{errorMessage}</p>
                        <button type="button" onClick={() => setErrorMessage(null)} className="text-sm font-semibold" style={{ color: '#ef4444' }}>Close</button>
                    </div>
                )}

                {/* Package Cards */}
                <div
                    className="rounded-2xl p-5 sm:p-6"
                    style={{ backgroundColor: `${currentTheme.foreground}04`, border: `1px solid ${currentTheme.foreground}08` }}
                >
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: SHINY_PURPLE, color: '#fff' }}>1</div>
                        <h2 className="text-base font-semibold" style={{ color: currentTheme.foreground }}>Choose Your Package</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {packages.map((pkg) => {
                            const coinPrice = pkg.coin_price;
                            const originalCoinPrice = pkg.discount_percentage > 0 ? getOriginalCoinPrice(coinPrice, pkg.discount_percentage) : 0;
                            const isSelected = selectedPackage === pkg.id;
                            const isBestValue = pkg.duration_days === 365;
                            const canAfford = userCoins >= coinPrice;

                            return (
                                <button
                                    key={pkg.id}
                                    type="button"
                                    onClick={() => setSelectedPackage(pkg.id)}
                                    className="relative p-4 rounded-xl text-left transition-all duration-300"
                                    style={{
                                        backgroundColor: isSelected ? `${SHINY_PURPLE}10` : `${currentTheme.foreground}03`,
                                        border: `1.5px solid ${isSelected ? SHINY_PURPLE : `${currentTheme.foreground}10`}`,
                                        boxShadow: isSelected ? `0 0 16px ${SHINY_PURPLE}30` : 'none',
                                        opacity: canAfford ? 1 : 0.55,
                                    }}
                                >
                                    {isBestValue && (
                                        <div className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: SHINY_PURPLE, color: '#fff' }}>
                                            BEST VALUE
                                        </div>
                                    )}
                                    {!canAfford && (
                                        <div className="absolute -top-2.5 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: '#ef4444', color: '#fff' }}>
                                            INSUFFICIENT COINS
                                        </div>
                                    )}

                                    <h3 className="font-semibold text-sm mb-2" style={{ color: currentTheme.foreground }}>{pkg.name}</h3>

                                    <div className="flex items-baseline gap-2 mb-2">
                                        {originalCoinPrice > 0 && (
                                            <span className="text-xs line-through opacity-40" style={{ color: currentTheme.foreground }}>
                                                ¢{originalCoinPrice.toLocaleString()}
                                            </span>
                                        )}
                                        <span className="text-xl font-bold" style={{ color: '#f59e0b' }}>
                                            ¢{coinPrice.toLocaleString()}
                                        </span>
                                    </div>

                                    {pkg.discount_percentage > 0 && (
                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: `${SHINY_PURPLE}15`, color: SHINY_PURPLE }}>
                                            Save {pkg.discount_percentage}%
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Benefits */}
                    {selectedPkg && (
                        <div className="mt-5 p-4 rounded-xl" style={{ backgroundColor: `${SHINY_PURPLE}08` }}>
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2" style={{ color: SHINY_PURPLE }}>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                What You'll Get:
                            </h4>
                            <ul className="space-y-1.5 text-sm">
                                {['Unlock all premium chapters instantly', 'Enjoy completely ad-free reading experience'].map((t) => (
                                    <li key={t} className="flex items-center gap-2" style={{ color: currentTheme.foreground }}>
                                        <svg className="w-4 h-4 flex-shrink-0" style={{ color: SHINY_PURPLE }} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span>{t}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Coin Balance */}
                <div
                    className="rounded-2xl p-5"
                    style={{ backgroundColor: `${currentTheme.foreground}04`, border: `1px solid ${currentTheme.foreground}08` }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: `${currentTheme.foreground}50` }}>Your Coin Balance</h3>
                            <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>¢{userCoins.toLocaleString()}</p>
                        </div>
                        {selectedPkg && userCoins < selectedPkg.coin_price && (
                            <div className="text-right">
                                <p className="text-xs mb-1.5" style={{ color: '#ef4444' }}>Need ¢{(selectedPkg.coin_price - userCoins).toLocaleString()} more</p>
                                <a
                                    href="/shop?tab=coins"
                                    className="inline-block px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                    style={{ backgroundColor: '#f59e0b', color: '#fff' }}
                                >
                                    Buy Coins
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Voucher */}
                {selectedPkg && (
                    <div
                        className="rounded-2xl p-5"
                        style={{ backgroundColor: `${currentTheme.foreground}04`, border: `1px solid ${currentTheme.foreground}08` }}
                    >
                        <h3 className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: `${currentTheme.foreground}50` }}>
                            Have a Voucher Code?
                        </h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={voucherCode}
                                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                placeholder="Enter voucher code"
                                disabled={!!voucherData || isApplyingVoucher}
                                className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 uppercase"
                                style={{
                                    border: `1px solid ${voucherError ? '#ef4444' : `${currentTheme.foreground}12`}`,
                                    backgroundColor: `${currentTheme.foreground}04`,
                                    color: currentTheme.foreground,
                                }}
                            />
                            {!voucherData ? (
                                <button
                                    type="button"
                                    onClick={handleApplyVoucher}
                                    disabled={!voucherCode.trim() || isApplyingVoucher}
                                    className="px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ backgroundColor: SHINY_PURPLE, color: '#fff' }}
                                >
                                    {isApplyingVoucher ? 'Applying...' : 'Apply'}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleRemoveVoucher}
                                    className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                                    style={{ backgroundColor: '#ef4444', color: '#fff' }}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                        {voucherError && <p className="mt-2 text-xs" style={{ color: '#ef4444' }}>{voucherError}</p>}
                        {voucherData && (
                            <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: '#10b98118', borderLeft: '4px solid #10b981' }}>
                                <p className="text-xs font-semibold" style={{ color: '#10b981' }}>
                                    ✓ Voucher Applied: {voucherData.discount_type === 'percent'
                                        ? `${voucherData.discount_value}% off`
                                        : `¢${voucherData.discount_value} off`}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={!selectedPackage || (selectedPkg && userCoins < selectedPkg.coin_price) || isProcessing}
                    className="w-full py-3.5 rounded-xl font-bold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                        backgroundColor: SHINY_PURPLE,
                        color: '#fff',
                        boxShadow: selectedPackage && selectedPkg && userCoins >= selectedPkg.coin_price
                            ? `0 0 24px ${SHINY_PURPLE}50`
                            : 'none',
                    }}
                >
                    {isProcessing ? 'Processing...' :
                     !selectedPackage ? 'Select a Package' :
                     selectedPkg && userCoins < selectedPkg.coin_price ? 'Insufficient Coins' :
                     'Buy with Coins'}
                </button>

                {selectedPkg && (
                    <div className="text-center p-3 rounded-xl" style={{ backgroundColor: `${currentTheme.foreground}04` }}>
                        <p className="text-xs" style={{ color: `${currentTheme.foreground}60` }}>
                            Total: <span className="font-bold text-base" style={{ color: '#f59e0b' }}>
                                ¢{voucherData ? voucherData.final_amount.toLocaleString() : selectedPkg.coin_price.toLocaleString()}
                            </span>
                            {voucherData && (
                                <span className="text-[10px] ml-1.5" style={{ color: '#10b981' }}>
                                    ({voucherData.discount_type === 'percent'
                                        ? `${voucherData.discount_value}%`
                                        : `¢${voucherData.discount_value}`} off)
                                </span>
                            )}
                        </p>
                    </div>
                )}
            </form>
        </div>
    );
}

/* ═══════════════════════════════════════════════
   Export
   ═══════════════════════════════════════════════ */

export default function Shop(props: Props) {
    return (
        <UserLayout>
            <ShopContent {...props} />
        </UserLayout>
    );
}
