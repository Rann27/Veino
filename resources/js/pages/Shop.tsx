import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme, SHINY_PURPLE } from '@/Contexts/ThemeContext';
import { useToast } from '@/Contexts/ToastContext';
import PremiumDiamond from '@/Components/PremiumDiamond';
import { SHINY_PURPLE_DIM } from '@/constants/colors';

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

    const switchTab = (tab: 'coins' | 'membership') => {
        setActiveTab(tab);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.replaceState({}, '', url.toString());
    };

    return (
        <>
            <Head title="Shop" />
            <div className="min-h-screen pt-20" style={{ backgroundColor: currentTheme.background }}>
                <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">

                    {/* ─── Header ─── */}
                    <div className="mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1
                                    className="text-2xl sm:text-3xl font-extrabold page-title"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    Shop
                                </h1>
                                <p className="text-sm mt-0.5" style={{ color: `${currentTheme.foreground}55` }}>
                                    Unlock premium chapters and more
                                </p>
                            </div>

                            {/* Balance badge */}
                            {page.props.auth.user && page.props.auth.user.coins !== undefined && (
                                <div
                                    className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl self-start sm:self-auto"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(251,191,36,0.06))',
                                        border: '1px solid rgba(245,158,11,0.25)',
                                    }}
                                >
                                    <svg className="w-5 h-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: `${currentTheme.foreground}50` }}>Balance</p>
                                        <p className="text-base font-bold text-amber-400 leading-none">¢{page.props.auth.user.coins.toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ─── Tab Switcher ─── */}
                    <div className="flex mb-8 gap-1 p-1 rounded-2xl w-full sm:w-auto sm:inline-flex"
                        style={{
                            backgroundColor: `${currentTheme.foreground}06`,
                            border: `1px solid ${currentTheme.foreground}08`,
                        }}
                    >
                        <button
                            onClick={() => switchTab('coins')}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
                            style={{
                                background: activeTab === 'coins'
                                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                    : 'transparent',
                                color: activeTab === 'coins' ? '#fff' : `${currentTheme.foreground}60`,
                                boxShadow: activeTab === 'coins' ? '0 4px 12px rgba(245,158,11,0.35)' : 'none',
                            }}
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                            </svg>
                            Coins
                        </button>
                        <button
                            onClick={() => switchTab('membership')}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
                            style={{
                                backgroundColor: activeTab === 'membership' ? SHINY_PURPLE : 'transparent',
                                color: activeTab === 'membership' ? '#fff' : `${currentTheme.foreground}60`,
                                boxShadow: activeTab === 'membership' ? `0 4px 12px ${SHINY_PURPLE}50` : 'none',
                            }}
                        >
                            <PremiumDiamond size={14} />
                            Membership
                        </button>
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
   Tab 1 — Coins
   ═══════════════════════════════════════════════ */

function CoinShopTab({ packages }: { packages: CoinPackage[] }) {
    const { currentTheme } = useTheme();
    const { toast } = useToast();
    const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'oxapay'>('paypal');
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePurchase = () => {
        if (!selectedPackage) {
            toast.warning('Please select a coin package first.');
            return;
        }
        setIsProcessing(true);
        router.post(
            route('payment.purchase'),
            { package_id: selectedPackage, payment_method: paymentMethod },
            {
                onSuccess: () => {},
                onError: () => {
                    toast.error('Failed to process purchase. Please try again.');
                    setIsProcessing(false);
                },
                onFinish: () => {},
            }
        );
    };

    const selectedPkg = packages.find(p => p.id === selectedPackage);

    return (
        <div className="w-full">
            {/* ─── Section label ─── */}
            <div className="flex items-center gap-3 mb-5">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                >
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-base font-bold" style={{ color: currentTheme.foreground }}>Choose a Package</h2>
                    <p className="text-xs" style={{ color: `${currentTheme.foreground}50` }}>Select the amount of coins you'd like to purchase</p>
                </div>
            </div>

            {/* ─── Package Grid ─── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
                {packages.map((pkg) => {
                    const isSelected = selectedPackage === pkg.id;
                    const priceUsd = parseFloat(pkg.price_usd);
                    const baseCoins = priceUsd * 100;
                    const bonusPct = baseCoins > 0 ? ((pkg.coin_amount - baseCoins) / baseCoins * 100) : 0;
                    const hasBonus = bonusPct > 0;

                    return (
                        <button
                            key={pkg.id}
                            type="button"
                            onClick={() => setSelectedPackage(pkg.id)}
                            className="relative rounded-2xl pt-6 pb-4 px-3 text-center transition-all duration-300 group"
                            style={{
                                background: isSelected
                                    ? 'linear-gradient(145deg, rgba(245,158,11,0.18), rgba(251,191,36,0.08))'
                                    : pkg.bonus_premium_days > 0
                                    ? SHINY_PURPLE_DIM
                                    : `${currentTheme.foreground}04`,
                                border: `1.5px solid ${
                                    isSelected ? '#f59e0b'
                                    : pkg.bonus_premium_days > 0 ? `${SHINY_PURPLE}25`
                                    : `${currentTheme.foreground}08`
                                }`,
                                boxShadow: isSelected ? '0 8px 24px rgba(245,158,11,0.25)' : 'none',
                                transform: isSelected ? 'translateY(-3px)' : undefined,
                            }}
                        >
                            {/* Name badge */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                                <span className="px-3 py-0.5 rounded-full text-white font-bold text-[10px] tracking-wide shadow-sm"
                                    style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b)' }}
                                >
                                    {pkg.name}
                                </span>
                            </div>

                            {/* Bonus % badge */}
                            {hasBonus && (
                                <div className="absolute -top-2 -right-2 z-10">
                                    <div className="bg-emerald-500 text-white px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-md">
                                        +{bonusPct.toFixed(0)}%
                                    </div>
                                </div>
                            )}

                            {/* Coin icon */}
                            <div className="flex justify-center mb-2">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                                    style={{
                                        background: isSelected
                                            ? 'linear-gradient(135deg, #fde68a, #f59e0b)'
                                            : 'rgba(245,158,11,0.12)',
                                    }}
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"
                                        style={{ color: isSelected ? '#92400e' : '#f59e0b' }}
                                    >
                                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>

                            {/* Coin amount */}
                            <div className="text-2xl font-extrabold text-amber-400 leading-none mb-0.5">
                                ¢{pkg.coin_amount.toLocaleString()}
                            </div>
                            <div className="text-[9px] uppercase tracking-widest mb-2" style={{ color: `${currentTheme.foreground}35` }}>coins</div>

                            {/* Premium bonus */}
                            {pkg.bonus_premium_days > 0 && (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full mb-2"
                                    style={{ backgroundColor: `${SHINY_PURPLE}15`, border: `1px solid ${SHINY_PURPLE}25` }}
                                >
                                    <PremiumDiamond size={10} />
                                    <span className="text-[9px] font-bold" style={{ color: SHINY_PURPLE }}>+{pkg.bonus_premium_days}d</span>
                                </div>
                            )}

                            {/* Price */}
                            <div className="pt-2 mt-1" style={{ borderTop: `1px solid ${currentTheme.foreground}08` }}>
                                <div className="text-base font-bold" style={{ color: currentTheme.foreground }}>${pkg.price_usd}</div>
                                <div className="text-[9px] uppercase tracking-wider" style={{ color: `${currentTheme.foreground}35` }}>USD</div>
                            </div>

                            {/* Selected check */}
                            {isSelected && (
                                <div className="absolute bottom-2 right-2">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center"
                                        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                                    >
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ─── Bottom section: Payment + Summary ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Payment Methods — always visible */}
                <div
                    className="rounded-2xl p-5"
                    style={{
                        backgroundColor: `${currentTheme.foreground}04`,
                        border: `1px solid ${currentTheme.foreground}08`,
                    }}
                >
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: currentTheme.foreground }}>
                        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Payment Method
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {/* PayPal */}
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('paypal')}
                            className="relative p-4 rounded-xl transition-all duration-200"
                            style={{
                                backgroundColor: paymentMethod === 'paypal' ? `${currentTheme.foreground}08` : `${currentTheme.foreground}03`,
                                border: `1.5px solid ${paymentMethod === 'paypal' ? '#60a5fa' : `${currentTheme.foreground}08`}`,
                                boxShadow: paymentMethod === 'paypal' ? '0 4px 14px rgba(96,165,250,0.2)' : 'none',
                            }}
                        >
                            <div className="flex flex-col items-center gap-1.5">
                                <img src="/images/paymentlogo/paypal.svg" alt="PayPal" className="h-6" />
                                <span className="text-sm font-bold text-blue-400">PayPal</span>
                                <span className="text-[10px]" style={{ color: `${currentTheme.foreground}45` }}>Credit / Debit</span>
                            </div>
                            {paymentMethod === 'paypal' && (
                                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-400 flex items-center justify-center">
                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </button>

                        {/* OxaPay — coming soon */}
                        <div className="relative group">
                            <div
                                className="p-4 rounded-xl opacity-40 cursor-not-allowed"
                                style={{
                                    backgroundColor: `${currentTheme.foreground}03`,
                                    border: `1.5px solid ${currentTheme.foreground}08`,
                                }}
                            >
                                <div className="flex flex-col items-center gap-1.5">
                                    <img src="/images/paymentlogo/oxapay.svg" alt="OxaPay" className="h-6 grayscale" />
                                    <span className="text-sm font-bold text-gray-400">OxaPay</span>
                                    <span className="text-[10px]" style={{ color: `${currentTheme.foreground}30` }}>Crypto</span>
                                </div>
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-[11px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                                style={{ backgroundColor: '#1e293b' }}
                            >
                                Coming soon
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1e293b]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order summary + Buy button */}
                <div
                    className="rounded-2xl p-5 flex flex-col"
                    style={{
                        background: selectedPkg
                            ? 'linear-gradient(145deg, rgba(245,158,11,0.08), rgba(251,191,36,0.03))'
                            : `${currentTheme.foreground}04`,
                        border: `1.5px solid ${selectedPkg ? 'rgba(245,158,11,0.3)' : `${currentTheme.foreground}08`}`,
                    }}
                >
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: currentTheme.foreground }}>
                        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Order Summary
                    </h3>

                    {selectedPkg ? (
                        <div className="flex-1 space-y-3 mb-5">
                            <div className="flex justify-between items-center text-sm">
                                <span style={{ color: `${currentTheme.foreground}60` }}>Package</span>
                                <span className="font-semibold" style={{ color: currentTheme.foreground }}>{selectedPkg.name}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span style={{ color: `${currentTheme.foreground}60` }}>Coins</span>
                                <span className="font-bold text-amber-400">¢{selectedPkg.coin_amount.toLocaleString()}</span>
                            </div>
                            {selectedPkg.bonus_premium_days > 0 && (
                                <div className="flex justify-between items-center text-sm">
                                    <span style={{ color: `${currentTheme.foreground}60` }}>Bonus</span>
                                    <span className="font-semibold" style={{ color: SHINY_PURPLE }}>+{selectedPkg.bonus_premium_days}d Premium</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-2" style={{ borderTop: `1px solid ${currentTheme.foreground}10` }}>
                                <span className="font-semibold text-sm" style={{ color: currentTheme.foreground }}>Total</span>
                                <span className="text-xl font-extrabold" style={{ color: currentTheme.foreground }}>${selectedPkg.price_usd}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center py-6 mb-5">
                            <p className="text-sm text-center" style={{ color: `${currentTheme.foreground}40` }}>
                                Select a package above to see your order summary
                            </p>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handlePurchase}
                        disabled={isProcessing || !selectedPackage}
                        className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                            background: selectedPackage
                                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                : `${currentTheme.foreground}10`,
                            color: selectedPackage ? '#fff' : `${currentTheme.foreground}40`,
                            boxShadow: selectedPackage ? '0 6px 20px rgba(245,158,11,0.4)' : 'none',
                        }}
                    >
                        {isProcessing ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Processing...
                            </span>
                        ) : selectedPackage ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                </svg>
                                Continue to Payment
                            </span>
                        ) : 'Select a Package'}
                    </button>

                    <p className="mt-2.5 text-center text-[11px] flex items-center justify-center gap-1" style={{ color: `${currentTheme.foreground}35` }}>
                        <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Secure payment processing
                    </p>
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
    const { toast } = useToast();
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
        if (Array.isArray(value)) return value.find((e) => typeof e === 'string') as string | undefined;
        return typeof value === 'string' ? value : undefined;
    };

    useEffect(() => {
        if (flash?.premium_granted) { setPremiumGranted(flash.premium_granted); setShowSuccess(true); }
    }, [flash?.premium_granted]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') { setShowSuccess(true); window.history.replaceState({}, '', '/shop?tab=membership'); }
    }, []);

    useEffect(() => { if (flash?.error) setErrorMessage(flash.error); }, [flash?.error]);

    useEffect(() => {
        const pageErrors = errors ?? page.props.errors;
        if (pageErrors && Object.keys(pageErrors).length > 0) {
            const msg = extractMessage(pageErrors.membership) ?? extractMessage(pageErrors.error) ?? extractMessage(Object.values(pageErrors)[0]);
            if (msg) setErrorMessage(msg);
        }
    }, [errors, page.props.errors]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selectedPackage) { setErrorMessage('Please choose a membership package.'); return; }
        setShowConfirmModal(true);
    };

    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) { toast.warning('Please enter a voucher code.'); return; }
        if (!selectedPackage) { toast.warning('Please select a membership package first.'); return; }
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
                body: JSON.stringify({ code: voucherCode.toUpperCase(), type: 'membership', amount: selectedPkg.coin_price }),
            });
            const data = await response.json();
            if (data.success) {
                setVoucherData(data.data);
                setVoucherError(null);
                toast.success(`Saved ¢${data.data.discount_amount.toLocaleString()}!`, `Voucher "${voucherCode.toUpperCase()}" Applied`);
            } else {
                setVoucherError(data.message);
                setVoucherData(null);
                toast.error(data.message || 'Invalid or expired voucher code.', 'Invalid Voucher');
            }
        } catch {
            setVoucherError('Failed to validate voucher. Please try again.');
            setVoucherData(null);
            toast.error('Failed to validate voucher. Please check your connection.');
        } finally {
            setIsApplyingVoucher(false);
        }
    };

    const handleRemoveVoucher = () => { setVoucherCode(''); setVoucherData(null); setVoucherError(null); };

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
                const message = extractMessage(formErrors.membership) || extractMessage(formErrors.error) || extractMessage(Object.values(formErrors)[0]) || 'We could not process your purchase. Please try again.';
                setErrorMessage(message);
            },
            onSuccess: () => { setErrorMessage(null); setShowSuccess(true); },
            onFinish: () => setIsProcessing(false),
        });
    };

    const selectedPkg = packages.find(p => p.id === selectedPackage);
    const finalCost = voucherData ? voucherData.final_amount : selectedPkg?.coin_price ?? 0;
    const canAffordSelected = selectedPkg ? userCoins >= finalCost : true;

    return (
        <div className="w-full">
            {/* ─── Confirm Modal ─── */}
            {showConfirmModal && selectedPkg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }} onClick={() => setShowConfirmModal(false)}>
                    <div
                        className="backdrop-blur-lg rounded-3xl p-7 max-w-sm w-full text-center shadow-2xl overflow-hidden"
                        style={{ backgroundColor: currentTheme.background, border: `2px solid ${SHINY_PURPLE}`, boxShadow: `0 0 50px ${SHINY_PURPLE}60` }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4"
                            style={{ background: `radial-gradient(circle, ${SHINY_PURPLE}30 0%, ${SHINY_PURPLE}10 100%)`, boxShadow: `0 0 24px ${SHINY_PURPLE}40` }}
                        >
                            <PremiumDiamond size={28} />
                        </div>
                        <h2 className="text-lg font-bold mb-1" style={{ color: currentTheme.foreground }}>Confirm Purchase</h2>
                        <p className="text-sm mb-4" style={{ color: `${currentTheme.foreground}65` }}>
                            Purchase <span className="font-semibold" style={{ color: SHINY_PURPLE }}>{selectedPkg.name}</span> membership?
                        </p>
                        <div className="rounded-xl p-4 mb-4 text-left text-sm space-y-2" style={{ backgroundColor: `${currentTheme.foreground}06` }}>
                            <div className="flex justify-between">
                                <span style={{ color: `${currentTheme.foreground}55` }}>Duration</span>
                                <span className="font-semibold" style={{ color: currentTheme.foreground }}>{selectedPkg.duration_days} days</span>
                            </div>
                            {voucherData ? (
                                <>
                                    <div className="flex justify-between">
                                        <span style={{ color: `${currentTheme.foreground}55` }}>Original</span>
                                        <span className="line-through opacity-40" style={{ color: currentTheme.foreground }}>¢{selectedPkg.coin_price.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: '#10b981' }}>Voucher ({voucherCode})</span>
                                        <span style={{ color: '#10b981' }}>−¢{voucherData.discount_amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${currentTheme.foreground}10` }}>
                                        <span className="font-semibold" style={{ color: currentTheme.foreground }}>Total</span>
                                        <span className="font-bold text-lg text-amber-400">¢{voucherData.final_amount.toLocaleString()}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex justify-between pt-1" style={{ borderTop: `1px solid ${currentTheme.foreground}10` }}>
                                    <span className="font-semibold" style={{ color: currentTheme.foreground }}>Total</span>
                                    <span className="font-bold text-lg text-amber-400">¢{selectedPkg.coin_price.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                        <p className="text-xs mb-4" style={{ color: `${currentTheme.foreground}55` }}>
                            Balance after: <span className="font-bold text-amber-400">¢{(userCoins - finalCost).toLocaleString()}</span>
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-70" style={{ border: `1px solid ${currentTheme.foreground}20`, color: `${currentTheme.foreground}70` }}>
                                Cancel
                            </button>
                            <button onClick={handleConfirmPurchase} disabled={isProcessing} className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all hover:brightness-110 disabled:opacity-50" style={{ backgroundColor: SHINY_PURPLE, color: '#fff' }}>
                                {isProcessing ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Success Modal ─── */}
            {showSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }} onClick={() => setShowSuccess(false)}>
                    <div
                        className="backdrop-blur-lg rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
                        style={{ backgroundColor: currentTheme.background, border: `2px solid ${SHINY_PURPLE}`, boxShadow: `0 0 50px ${SHINY_PURPLE}60` }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: `${SHINY_PURPLE}20`, boxShadow: `0 0 30px ${SHINY_PURPLE}50` }}>
                            <PremiumDiamond size={36} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2" style={{ color: SHINY_PURPLE }}>Congratulations!</h2>
                        {premiumGranted ? (
                            <>
                                <p className="text-base mb-1" style={{ color: currentTheme.foreground }}>
                                    <span className="font-bold" style={{ color: SHINY_PURPLE }}>{premiumGranted.days} {premiumGranted.days === 1 ? 'Day' : 'Days'}</span> of Premium
                                </p>
                                <p className="text-lg font-semibold mb-3" style={{ color: SHINY_PURPLE }}>Has Been Added!</p>
                                <div className="inline-block px-4 py-1.5 rounded-xl mb-3" style={{ backgroundColor: `${SHINY_PURPLE}15`, border: `1px solid ${SHINY_PURPLE}40` }}>
                                    <p className="text-sm font-semibold" style={{ color: SHINY_PURPLE }}>{premiumGranted.package_name}</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-base mb-1" style={{ color: currentTheme.foreground }}>Your Premium Membership</p>
                                <p className="text-lg font-semibold mb-3" style={{ color: SHINY_PURPLE }}>Has Been Activated!</p>
                            </>
                        )}
                        <p className="text-xs mb-6" style={{ color: `${currentTheme.foreground}55` }}>
                            Enjoy unlimited access to all premium chapters and an ad-free experience.
                        </p>
                        <button onClick={() => setShowSuccess(false)} className="w-full py-2.5 rounded-xl font-bold transition-all hover:brightness-110" style={{ backgroundColor: SHINY_PURPLE, color: '#fff' }}>
                            Start Reading
                        </button>
                    </div>
                </div>
            )}

            {/* ─── Main layout: two-column on lg+ ─── */}
            <form onSubmit={handleSubmit}>
                {/* Error Banner */}
                {errorMessage && (
                    <div className="rounded-xl px-4 py-3 flex items-start gap-3 mb-6" style={{ border: '1px solid #ef4444', backgroundColor: 'rgba(239,68,68,0.08)' }}>
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" strokeLinecap="round" />
                        </svg>
                        <p className="flex-1 text-sm text-red-400">{errorMessage}</p>
                        <button type="button" onClick={() => setErrorMessage(null)} className="text-red-400 opacity-60 hover:opacity-100">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-6">

                    {/* ── Left: Package Cards ── */}
                    <div
                        className="rounded-2xl p-5 sm:p-6"
                        style={{ backgroundColor: `${currentTheme.foreground}04`, border: `1px solid ${currentTheme.foreground}08` }}
                    >
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: SHINY_PURPLE, color: '#fff' }}>1</div>
                            <div>
                                <h2 className="text-sm font-bold" style={{ color: currentTheme.foreground }}>Choose Your Package</h2>
                                <p className="text-xs" style={{ color: `${currentTheme.foreground}45` }}>All packages include ad-free reading</p>
                            </div>
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
                                            boxShadow: isSelected ? `0 0 20px ${SHINY_PURPLE}25` : 'none',
                                            opacity: canAfford ? 1 : 0.5,
                                            transform: isSelected ? 'translateY(-2px)' : undefined,
                                        }}
                                    >
                                        {/* Badges */}
                                        {isBestValue && (
                                            <div className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: SHINY_PURPLE, color: '#fff' }}>
                                                BEST VALUE
                                            </div>
                                        )}
                                        {!canAfford && (
                                            <div className="absolute -top-2.5 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">
                                                NEED MORE COINS
                                            </div>
                                        )}

                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-bold text-sm" style={{ color: currentTheme.foreground }}>{pkg.name}</h3>
                                            {isSelected && (
                                                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: SHINY_PURPLE }}>
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-baseline gap-2 mb-1">
                                            {originalCoinPrice > 0 && (
                                                <span className="text-xs line-through opacity-35" style={{ color: currentTheme.foreground }}>
                                                    ¢{originalCoinPrice.toLocaleString()}
                                                </span>
                                            )}
                                            <span className="text-2xl font-extrabold text-amber-400">¢{coinPrice.toLocaleString()}</span>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs" style={{ color: `${currentTheme.foreground}50` }}>
                                                {pkg.duration_days} days
                                            </span>
                                            {pkg.discount_percentage > 0 && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: `${SHINY_PURPLE}15`, color: SHINY_PURPLE }}>
                                                    -{pkg.discount_percentage}%
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Right: Sidebar ── */}
                    <div className="flex flex-col gap-4">

                        {/* What You'll Get — always visible */}
                        <div
                            className="rounded-2xl p-5"
                            style={{
                                background: `linear-gradient(145deg, ${SHINY_PURPLE}10, ${SHINY_PURPLE}05)`,
                                border: `1px solid ${SHINY_PURPLE}20`,
                            }}
                        >
                            <h4 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: SHINY_PURPLE }}>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                What You'll Get
                            </h4>
                            <ul className="space-y-2">
                                {[
                                    'Unlock all premium chapters instantly',
                                    'Completely ad-free reading experience',
                                    'Priority access to new releases',
                                ].map((benefit) => (
                                    <li key={benefit} className="flex items-center gap-2 text-sm" style={{ color: currentTheme.foreground }}>
                                        <svg className="w-4 h-4 flex-shrink-0" style={{ color: SHINY_PURPLE }} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        {benefit}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Coin Balance — always visible */}
                        <div
                            className="rounded-2xl p-4"
                            style={{ backgroundColor: `${currentTheme.foreground}04`, border: `1px solid ${currentTheme.foreground}08` }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: `${currentTheme.foreground}45` }}>Your Coin Balance</p>
                                    <p className="text-2xl font-extrabold text-amber-400">¢{userCoins.toLocaleString()}</p>
                                </div>
                                {selectedPkg && !canAffordSelected && (
                                    <div className="text-right">
                                        <p className="text-xs text-red-400 mb-1.5">Need ¢{(finalCost - userCoins).toLocaleString()} more</p>
                                        <a href="/shop?tab=coins" className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:brightness-110"
                                            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' }}
                                        >
                                            Buy Coins
                                        </a>
                                    </div>
                                )}
                                {selectedPkg && canAffordSelected && (
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase tracking-wider font-medium mb-0.5" style={{ color: `${currentTheme.foreground}40` }}>After purchase</p>
                                        <p className="text-base font-bold" style={{ color: `${currentTheme.foreground}70` }}>¢{(userCoins - finalCost).toLocaleString()}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Voucher — always visible */}
                        <div
                            className="rounded-2xl p-4"
                            style={{ backgroundColor: `${currentTheme.foreground}04`, border: `1px solid ${currentTheme.foreground}08` }}
                        >
                            <h3 className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: `${currentTheme.foreground}45` }}>
                                Have a Voucher Code?
                            </h3>
                            {!voucherData ? (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={voucherCode}
                                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                        placeholder={selectedPackage ? 'Enter code...' : 'Select a package first'}
                                        disabled={!selectedPackage || isApplyingVoucher}
                                        className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-1 uppercase disabled:cursor-not-allowed"
                                        style={{
                                            border: `1px solid ${voucherError ? '#ef4444' : `${currentTheme.foreground}12`}`,
                                            backgroundColor: `${currentTheme.foreground}04`,
                                            color: currentTheme.foreground,
                                            opacity: selectedPackage ? 1 : 0.5,
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleApplyVoucher}
                                        disabled={!voucherCode.trim() || isApplyingVoucher || !selectedPackage}
                                        className="px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                                        style={{ backgroundColor: SHINY_PURPLE, color: '#fff' }}
                                    >
                                        {isApplyingVoucher ? '...' : 'Apply'}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                    <div>
                                        <p className="text-xs font-bold text-emerald-400">{voucherCode}</p>
                                        <p className="text-xs text-emerald-400 opacity-75">
                                            −{voucherData.discount_type === 'percent' ? `${voucherData.discount_value}%` : `¢${voucherData.discount_value}`} off
                                        </p>
                                    </div>
                                    <button type="button" onClick={handleRemoveVoucher} className="text-xs font-semibold text-red-400 hover:opacity-70 transition-opacity">Remove</button>
                                </div>
                            )}
                            {voucherError && <p className="mt-1.5 text-xs text-red-400">{voucherError}</p>}
                            {!selectedPackage && (
                                <p className="mt-1.5 text-xs" style={{ color: `${currentTheme.foreground}35` }}>Select a package to apply a voucher</p>
                            )}
                        </div>

                        {/* Buy Button */}
                        <button
                            type="submit"
                            disabled={!selectedPackage || !canAffordSelected || isProcessing}
                            className="w-full py-3.5 rounded-2xl font-bold text-base transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: SHINY_PURPLE,
                                color: '#fff',
                                boxShadow: selectedPackage && canAffordSelected ? `0 8px 24px ${SHINY_PURPLE}45` : 'none',
                            }}
                        >
                            {isProcessing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Processing...
                                </span>
                            ) : !selectedPackage ? 'Select a Package' :
                               !canAffordSelected ? `Need ¢${(finalCost - userCoins).toLocaleString()} More` :
                               `Buy with ¢${finalCost.toLocaleString()} Coins`}
                        </button>

                        {selectedPkg && canAffordSelected && (
                            <p className="text-center text-xs" style={{ color: `${currentTheme.foreground}40` }}>
                                {selectedPkg.duration_days} days • ¢{finalCost.toLocaleString()} coins deducted
                            </p>
                        )}
                    </div>
                </div>
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
