import React, { useState, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme, SHINY_PURPLE } from '@/Contexts/ThemeContext';
import { useToast } from '@/Contexts/ToastContext';
import PremiumDiamond from '@/Components/PremiumDiamond';
import { SHINY_PURPLE_DIM } from '@/constants/colors';
import { asTier, TierIcon, ExclusiveCrownIcon, TIER_LABEL, TIER_GRADIENT, TIER_COLOR, TIER_GLOW, EXCLUSIVE_GOLD } from '@/lib/tier';
import { csrfHeaders } from '@/lib/csrf';
import { clearPendingVoucher, pendingVoucher } from '@/lib/voucherHandoff';

/* ─── Interfaces ─── */
interface CoinPackage {
    id: number;
    name: string;
    coin_amount: number;
    bonus_premium_days: number;
    price_usd: string;
}

/** Purple from the membership line, gold for Exclusive. */

/** Crown — the Exclusive tier's mark, as the diamond is Premium's. */
function ExclusiveCrown({ size = 22 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
            <defs>
                <linearGradient id="exclCrown" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f7d774" />
                    <stop offset="45%" stopColor={EXCLUSIVE_GOLD} />
                    <stop offset="100%" stopColor="#c9962a" />
                </linearGradient>
            </defs>
            <path d="M3 8.5l3.6 2.6L12 4l5.4 7.1L21 8.5l-1.7 9.4a1.2 1.2 0 0 1-1.2 1H5.9a1.2 1.2 0 0 1-1.2-1L3 8.5Z"
                fill="url(#exclCrown)" stroke="#fff" strokeWidth="0.5" strokeLinejoin="round" />
            <circle cx="12" cy="15.4" r="1.15" fill="#fff" opacity="0.85" />
        </svg>
    );
}

/**
 * The animated neon sweep. Declared once and reused — a keyframe per card
 * would mean duplicate rules in the document for no gain.
 */
const EXCLUSIVE_STYLES = `
@keyframes veinovelExclusiveSweep {
    0%   { background-position:   0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position:   0% 50%; }
}
@keyframes veinovelExclusiveGlow {
    0%, 100% { opacity: 0.55; }
    50%      { opacity: 1; }
}
.excl-neon {
    background-size: 260% 260%;
    animation: veinovelExclusiveSweep 7s ease-in-out infinite;
}
.excl-glow { animation: veinovelExclusiveGlow 3.4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
    .excl-neon, .excl-glow { animation: none; }
}
`;

interface MembershipPackage {
    id: number;
    name: string;
    tier: string;
    price_usd: string;
    gimmick_price_usd?: string | null;
    coin_price: number;
    gimmick_price?: string | null;
    duration_days: number;
    features: { unlock_premium_chapters?: boolean; ad_free?: boolean };
    discount_percentage: number;
    is_active: boolean;
}

interface PendingPurchase {
    id: number;
    coins_amount: number;
    price_usd: string;
    payment_method: string;
    expires_at: string;
    status_url: string;
}

interface PendingMembershipPurchase {
    id: number;
    tier: string;
    duration_days: number;
    amount_usd: string;
    payment_method: string;
    payment_expires_at: string;
    status_url: string;
}

interface Props {
    coinPackages: CoinPackage[];
    membershipPackages: MembershipPackage[];
    activeTab?: string;
    pendingPurchase?: PendingPurchase | null;
    pendingMembershipPurchase?: PendingMembershipPurchase | null;
    flash?: {
        success?: string;
        error?: string;
        premium_granted?: { days: number; package_name: string; source: string; tier?: string };
        tier_blocked?: { message: string; current_tier: string; expires_at?: string | null };
    };
    errors?: Record<string, string | string[]>;
    paypalFee?: { enabled: boolean; rate: number; fixed: number };
    tierSwitchCarryOverDays?: number;
    currentTier?: string | null;
}

/**
 * Mirrors PaymentFeeCalculator on the server. Grossing up rather than simply
 * adding the fee, because PayPal charges its percentage on the final amount.
 */
function withPaypalFee(price: number, fee?: { enabled: boolean; rate: number; fixed: number }) {
    if (!fee?.enabled) return { subtotal: price, fee: 0, total: price };
    const rate = fee.rate / 100;
    if (rate >= 1) return { subtotal: price, fee: 0, total: price };
    const total = Math.ceil(((price + fee.fixed) / (1 - rate)) * 100) / 100;
    return { subtotal: price, fee: Math.round((total - price) * 100) / 100, total };
}

const getOriginalCoinPrice = (coinPrice: number, discount: number) =>
    discount === 0 ? 0 : Math.round(coinPrice / (1 - discount / 100));

/* ═══════════════════════════════════════════════
   Main Shop Page
   ═══════════════════════════════════════════════ */
function ShopContent({ coinPackages, membershipPackages, activeTab: initialTab, pendingPurchase, pendingMembershipPurchase, flash, errors, paypalFee, tierSwitchCarryOverDays = 0, currentTier = null }: Props) {
    const { currentTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<'coins' | 'membership'>(
        initialTab === 'membership' ? 'membership' : 'coins'
    );
    const [showPendingModal, setShowPendingModal] = useState(!!pendingPurchase);
    const [showPendingMembershipModal, setShowPendingMembershipModal] = useState(!!pendingMembershipPurchase);
    const page = usePage<{ auth: { user: { coins: number } | null } }>();

    const switchTab = (tab: 'coins' | 'membership') => {
        setActiveTab(tab);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.replaceState({}, '', url.toString());
    };

    const userCoins = page.props.auth.user?.coins;

    return (
        <>
            <Head title="Shop — Veinovel" />

            {/* Pending transaction modal */}
            {showPendingModal && pendingPurchase && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                    onClick={() => setShowPendingModal(false)}
                >
                    <div
                        className="rounded-lg p-6 max-w-sm w-full border"
                        style={{
                            backgroundColor: currentTheme.background,
                            borderColor: '#f59e0b40',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: 'rgba(245,158,11,0.12)' }}>
                                <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-lg font-bold text-center mb-1 text-amber-500">
                            Pending Transaction
                        </h2>
                        <p className="text-xs text-center mb-5" style={{ color: `${currentTheme.foreground}70` }}>
                            You have an unfinished payment of{' '}
                            <span className="font-semibold text-amber-500">
                                ¢{pendingPurchase.coins_amount.toLocaleString()}
                            </span>
                            {' '}(${pendingPurchase.price_usd} via{' '}
                            <span className="capitalize font-medium">{pendingPurchase.payment_method}</span>).
                            Please complete or cancel it before starting a new one.
                        </p>

                        <div className="flex flex-col gap-2.5">
                            <button
                                onClick={() => router.visit(pendingPurchase.status_url)}
                                className="w-full py-2.5 rounded-lg font-bold text-sm transition-opacity hover:opacity-90"
                                style={{ backgroundColor: '#f59e0b', color: '#000' }}
                            >
                                Continue Payment
                            </button>
                            <button
                                onClick={() => setShowPendingModal(false)}
                                className="w-full py-2.5 rounded-lg font-medium text-sm border transition-opacity hover:opacity-80"
                                style={{
                                    backgroundColor: 'transparent',
                                    color: `${currentTheme.foreground}70`,
                                    borderColor: `${currentTheme.foreground}15`,
                                }}
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pending membership transaction modal */}
            {showPendingMembershipModal && pendingMembershipPurchase && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                    onClick={() => setShowPendingMembershipModal(false)}
                >
                    <div
                        className="rounded-lg p-6 max-w-sm w-full border"
                        style={{
                            backgroundColor: currentTheme.background,
                            borderColor: `${SHINY_PURPLE}40`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: `${SHINY_PURPLE}15` }}>
                                <svg className="w-6 h-6" style={{ color: SHINY_PURPLE }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-lg font-bold text-center mb-1" style={{ color: SHINY_PURPLE }}>
                            Pending Membership
                        </h2>
                        <p className="text-xs text-center mb-5" style={{ color: `${currentTheme.foreground}70` }}>
                            You have an unfinished membership payment of{' '}
                            <span className="font-semibold" style={{ color: SHINY_PURPLE }}>
                                ${pendingMembershipPurchase.amount_usd}
                            </span>
                            {' '}via <span className="capitalize font-medium">{pendingMembershipPurchase.payment_method}</span>.
                            Please complete or cancel it before starting a new one.
                        </p>

                        <div className="flex flex-col gap-2.5">
                            <button
                                onClick={() => router.visit(pendingMembershipPurchase.status_url)}
                                className="w-full py-2.5 rounded-lg font-bold text-sm transition-opacity hover:opacity-90"
                                style={{ backgroundColor: '#a78bfa', color: '#000' }}
                            >
                                Continue Payment
                            </button>
                            <button
                                onClick={() => setShowPendingMembershipModal(false)}
                                className="w-full py-2.5 rounded-lg font-medium text-sm border transition-opacity hover:opacity-80"
                                style={{
                                    backgroundColor: 'transparent',
                                    color: `${currentTheme.foreground}70`,
                                    borderColor: `${currentTheme.foreground}15`,
                                }}
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-screen" style={{ backgroundColor: currentTheme.background }}>

                {/* ── Hero Banner ── */}
                <div
                    className="border-b"
                    style={{
                        backgroundColor: `${currentTheme.foreground}04`,
                        borderColor: `${currentTheme.foreground}15`,
                    }}
                >
                    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-6">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                            {/* Title */}
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    {activeTab === 'coins' ? (
                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg"
                                            style={{ backgroundColor: '#f59e0b15', color: '#f59e0b' }}>
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg"
                                            style={{ backgroundColor: `${SHINY_PURPLE}15`, color: SHINY_PURPLE }}>
                                            <PremiumDiamond size={15} />
                                        </span>
                                    )}
                                    <span className="text-xs font-bold uppercase tracking-widest"
                                        style={{ color: activeTab === 'coins' ? '#f59e0b' : SHINY_PURPLE }}>
                                        {activeTab === 'coins' ? 'Coin Store' : 'Premium Club'}
                                    </span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                                    style={{ color: currentTheme.foreground }}>
                                    {activeTab === 'coins' ? 'Top Up Coins' : 'Membership'}
                                </h1>
                                <p className="text-xs sm:text-sm mt-0.5" style={{ color: `${currentTheme.foreground}70` }}>
                                    {activeTab === 'coins'
                                        ? 'Buy coins to unlock premium chapters instantly'
                                        : 'Unlimited premium access for true readers'}
                                </p>
                            </div>

                            {/* Balance + Tab Switcher */}
                            <div className="flex flex-col sm:items-end gap-3">
                                {userCoins !== undefined && (
                                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg self-start sm:self-auto border"
                                        style={{
                                            backgroundColor: `${currentTheme.foreground}08`,
                                            borderColor: `${currentTheme.foreground}15`,
                                        }}>
                                        <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-xs font-medium" style={{ color: `${currentTheme.foreground}70` }}>Balance</span>
                                        <span className="text-sm font-bold text-amber-500">¢{userCoins.toLocaleString()}</span>
                                    </div>
                                )}

                                {/* Tab switcher — fullwidth on mobile, auto on desktop */}
                                <div className="flex w-full sm:w-auto gap-1 p-1 rounded-lg border"
                                    style={{
                                        backgroundColor: `${currentTheme.foreground}08`,
                                        borderColor: `${currentTheme.foreground}15`,
                                    }}>
                                    <button onClick={() => switchTab('coins')}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-150"
                                        style={{
                                            backgroundColor: activeTab === 'coins' ? '#f59e0b' : 'transparent',
                                            color: activeTab === 'coins' ? '#000' : `${currentTheme.foreground}70`,
                                        }}>
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                        </svg>
                                        Coins
                                    </button>
                                    <button onClick={() => switchTab('membership')}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-150"
                                        style={{
                                            backgroundColor: activeTab === 'membership' ? '#a78bfa' : 'transparent',
                                            color: activeTab === 'membership' ? '#000' : `${currentTheme.foreground}70`,
                                        }}>
                                        <PremiumDiamond size={13} />
                                        Membership
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Tab Content ── */}
                <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">
                    {activeTab === 'coins'
                        ? <CoinShopTab packages={coinPackages} paypalFee={paypalFee} />
                        : <MembershipTab packages={membershipPackages} flash={flash} errors={errors} paypalFee={paypalFee} tierSwitchCarryOverDays={tierSwitchCarryOverDays} currentTier={currentTier} />}
                </div>
            </div>
        </>
    );
}

/* ═══════════════════════════════════════════════
   Tab 1 — Coins
   ═══════════════════════════════════════════════ */
function CoinShopTab({ packages, paypalFee }: { packages: CoinPackage[]; paypalFee?: Props['paypalFee'] }) {
    const { currentTheme } = useTheme();
    const { toast } = useToast();
    const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'oxapay'>('paypal');
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePurchase = () => {
        if (!selectedPackage) { toast.warning('Please select a coin package first.'); return; }
        setIsProcessing(true);
        router.post(route('payment.purchase'),
            { package_id: selectedPackage, payment_method: paymentMethod },
            {
                onError: () => { toast.error('Failed to process purchase. Please try again.'); setIsProcessing(false); },
                onFinish: () => {},
            }
        );
    };

    const selectedPkg = packages.find(p => p.id === selectedPackage);
    const coinPriceUsd = selectedPkg ? parseFloat(selectedPkg.price_usd) : 0;
    // PayPal grosses up server-side, so the panel has to show the same number
    // the buyer will actually be billed.
    const coinCharge = paymentMethod === 'paypal'
        ? withPaypalFee(coinPriceUsd, paypalFee)
        : { fee: 0, total: coinPriceUsd };

    return (
        <div className="w-full">
            {/* ── Package Grid ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
                {packages.map((pkg) => {
                    const isSelected = selectedPackage === pkg.id;
                    const priceUsd = parseFloat(pkg.price_usd);
                    const baseCoins = priceUsd * 100;
                    const bonusPct = baseCoins > 0 ? ((pkg.coin_amount - baseCoins) / baseCoins * 100) : 0;

                    return (
                        <button key={pkg.id} type="button" onClick={() => setSelectedPackage(isSelected ? null : pkg.id)}
                            className="relative rounded-lg text-center transition-colors duration-150 overflow-hidden"
                            style={{
                                backgroundColor: isSelected
                                    ? `${currentTheme.foreground}0C`
                                    : `${currentTheme.foreground}08`,
                                border: `1.5px solid ${isSelected ? '#f59e0b' : `${currentTheme.foreground}15`}`,
                            }}>

                            {/* Package name tag */}
                            <div className="px-3 pt-3 pb-1">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
                                    style={{
                                        backgroundColor: isSelected ? 'rgba(245,158,11,0.18)' : `${currentTheme.foreground}10`,
                                        color: isSelected ? '#f59e0b' : currentTheme.foreground,
                                    }}>
                                    {pkg.name}
                                </span>
                            </div>

                            {/* Bonus % badge */}
                            {bonusPct > 0 && (
                                <div className="absolute top-2 right-2 z-10">
                                    <span className="block px-1.5 py-0.5 rounded-full text-[9px] font-extrabold text-white"
                                        style={{ backgroundColor: '#10b981' }}>
                                        +{Math.round(bonusPct)}%
                                    </span>
                                </div>
                            )}

                            {/* Coin icon */}
                            <div className="flex justify-center py-3">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center border"
                                        style={{
                                            backgroundColor: isSelected ? 'rgba(245,158,11,0.18)' : 'rgba(245,158,11,0.10)',
                                            borderColor: isSelected ? '#f59e0b50' : 'rgba(245,158,11,0.25)',
                                        }}>
                                        <span className="text-lg font-black text-amber-500" style={{ fontFamily: 'serif' }}>
                                            ¢
                                        </span>
                                    </div>
                                    {pkg.bonus_premium_days > 0 && (
                                        <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
                                            style={{ backgroundColor: SHINY_PURPLE }}>
                                            <PremiumDiamond size={8} />
                                            <span className="text-[8px] font-bold text-white">+{pkg.bonus_premium_days}d</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Coin amount */}
                            <div className="px-2 pb-1">
                                <div className="text-xl font-extrabold leading-none text-amber-500">
                                    ¢{pkg.coin_amount.toLocaleString()}
                                </div>
                                <div className="text-[9px] uppercase tracking-widest mt-0.5"
                                    style={{ color: `${currentTheme.foreground}70` }}>
                                    coins
                                </div>
                            </div>

                            {/* Divider + Price */}
                            <div className="mx-3 my-2" style={{ height: '1px', backgroundColor: `${currentTheme.foreground}15` }} />
                            <div className="px-3 pb-3">
                                <div className="text-base font-extrabold" style={{ color: currentTheme.foreground }}>
                                    ${pkg.price_usd}
                                </div>
                                <div className="text-[9px] uppercase tracking-widest" style={{ color: `${currentTheme.foreground}70` }}>USD</div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── Checkout Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Payment Methods */}
                <div className="rounded-lg p-5 border"
                    style={{ backgroundColor: `${currentTheme.foreground}08`, borderColor: `${currentTheme.foreground}15` }}>
                    <p className="text-xs uppercase tracking-widest font-bold mb-4" style={{ color: currentTheme.foreground }}>
                        Payment Method
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {/* PayPal */}
                        <button type="button" onClick={() => setPaymentMethod('paypal')}
                            className="relative flex flex-col items-center gap-2 p-4 rounded-lg transition-colors duration-150"
                            style={{
                                backgroundColor: paymentMethod === 'paypal' ? `${currentTheme.foreground}0C` : `${currentTheme.foreground}04`,
                                border: `1.5px solid ${paymentMethod === 'paypal' ? '#3b82f6' : `${currentTheme.foreground}15`}`,
                            }}>
                            <img src="/images/paymentlogo/paypal.svg" alt="PayPal" className="h-7 object-contain" />
                            <span className="text-xs font-bold text-blue-400">PayPal</span>
                            <span className="text-[10px]" style={{ color: `${currentTheme.foreground}70` }}>Credit / Debit Card</span>
                            {paymentMethod === 'paypal' && (
                                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </button>

                        {/* OxaPay */}
                        <button type="button" onClick={() => setPaymentMethod('oxapay')}
                            className="relative flex flex-col items-center gap-2 p-4 rounded-lg transition-colors duration-150"
                            style={{
                                backgroundColor: paymentMethod === 'oxapay' ? `${currentTheme.foreground}0C` : `${currentTheme.foreground}04`,
                                border: `1.5px solid ${paymentMethod === 'oxapay' ? '#10b981' : `${currentTheme.foreground}15`}`,
                            }}>
                            <img src="/images/paymentlogo/oxapay.svg" alt="OxaPay" className="h-7 object-contain" />
                            <span className="text-xs font-bold text-emerald-500">OxaPay</span>
                            <span className="text-[10px]" style={{ color: `${currentTheme.foreground}70` }}>Cryptocurrency</span>
                            {paymentMethod === 'oxapay' && (
                                <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center bg-emerald-500">
                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    </div>
                </div>

                {/* Order summary + CTA */}
                <div className="rounded-lg p-5 border flex flex-col"
                    style={{
                        backgroundColor: `${currentTheme.foreground}08`,
                        borderColor: selectedPkg ? '#f59e0b50' : `${currentTheme.foreground}15`,
                    }}>
                    <p className="text-xs uppercase tracking-widest font-bold mb-4" style={{ color: `${currentTheme.foreground}70` }}>
                        Order Summary
                    </p>

                    {selectedPkg ? (
                        <div className="flex-1 space-y-2.5 mb-5">
                            <div className="flex items-center justify-between">
                                <span className="text-sm" style={{ color: `${currentTheme.foreground}70` }}>Package</span>
                                <span className="text-sm font-semibold" style={{ color: currentTheme.foreground }}>{selectedPkg.name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm" style={{ color: `${currentTheme.foreground}70` }}>Coins</span>
                                <span className="text-sm font-bold text-amber-500">¢{selectedPkg.coin_amount.toLocaleString()}</span>
                            </div>
                            {selectedPkg.bonus_premium_days > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm" style={{ color: `${currentTheme.foreground}70` }}>Bonus</span>
                                    <span className="text-sm font-semibold" style={{ color: SHINY_PURPLE }}>+{selectedPkg.bonus_premium_days}d Premium</span>
                                </div>
                            )}
                            {paymentMethod === 'paypal' && paypalFee?.enabled && (
                                <>
                                    <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${currentTheme.foreground}15` }}>
                                        <span className="text-sm" style={{ color: `${currentTheme.foreground}70` }}>Subtotal</span>
                                        <span className="text-sm" style={{ color: currentTheme.foreground }}>${coinPriceUsd.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm" style={{ color: `${currentTheme.foreground}70` }}>
                                            PayPal fee <span className="opacity-60">({paypalFee.rate}% + ${paypalFee.fixed.toFixed(2)})</span>
                                        </span>
                                        <span className="text-sm" style={{ color: currentTheme.foreground }}>+${coinCharge.fee.toFixed(2)}</span>
                                    </div>
                                </>
                            )}
                            <div className="flex items-center justify-between pt-3"
                                style={{ borderTop: `1px solid ${currentTheme.foreground}15` }}>
                                <span className="font-bold" style={{ color: currentTheme.foreground }}>Total</span>
                                <span className="text-xl font-extrabold" style={{ color: currentTheme.foreground }}>${coinCharge.total.toFixed(2)} <span className="text-xs font-normal opacity-50">USD</span></span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-5 mb-5 gap-2">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center border"
                                style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)' }}>
                                <span className="text-xl font-black text-amber-500/40" style={{ fontFamily: 'serif' }}>¢</span>
                            </div>
                            <p className="text-xs text-center" style={{ color: `${currentTheme.foreground}70` }}>
                                Select a package to continue
                            </p>
                        </div>
                    )}

                    <button type="button" onClick={handlePurchase} disabled={isProcessing || !selectedPackage}
                        className="w-full py-3 rounded-lg font-bold text-sm transition-opacity"
                        style={{
                            backgroundColor: selectedPackage ? '#f59e0b' : `${currentTheme.foreground}08`,
                            color: selectedPackage ? '#000' : `${currentTheme.foreground}30`,
                            cursor: !selectedPackage || isProcessing ? 'not-allowed' : 'pointer',
                        }}>
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
                        ) : 'Select a Package First'}
                    </button>

                    {selectedPkg && (
                        <p className="mt-2.5 text-center text-[11px] flex items-center justify-center gap-1" style={{ color: `${currentTheme.foreground}70` }}>
                            <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Secure payment · SSL encrypted
                        </p>
                    )}
                </div>
            </div>

            {/* ── What's Coins? ── */}
            <div className="mt-8 rounded-lg p-6 border"
                style={{ backgroundColor: `${currentTheme.foreground}08`, borderColor: `${currentTheme.foreground}15` }}>
                <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(245,158,11,0.15)' }}>
                        <span className="text-sm font-black text-amber-500" style={{ fontFamily: 'serif' }}>¢</span>
                    </div>
                    <h3 className="text-base font-bold" style={{ color: currentTheme.foreground }}>What's Coins?</h3>
                </div>

                <p className="text-sm leading-relaxed mb-5" style={{ color: `${currentTheme.foreground}70` }}>
                    Coins are the base currency of Veinovel. Top up once and spend them however you like — no subscription required.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Use 1: Membership */}
                    <a
                        href="/shop?tab=membership"
                        className="flex items-start gap-3 p-3.5 rounded-lg border transition-opacity hover:opacity-80 group"
                        style={{ backgroundColor: `${currentTheme.foreground}04`, borderColor: `${currentTheme.foreground}10` }}
                    >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: `${SHINY_PURPLE}15`, border: `1px solid ${SHINY_PURPLE}30` }}>
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L3 9L12 22L21 9L12 2Z" fill={SHINY_PURPLE} stroke={SHINY_PURPLE} strokeWidth="0.5"/>
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold group-hover:underline" style={{ color: SHINY_PURPLE }}>Buy Membership</p>
                            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: `${currentTheme.foreground}70` }}>
                                Unlock all premium chapters for a set period.
                            </p>
                        </div>
                    </a>

                    {/* Use 2: Chapters */}
                    <div className="flex items-start gap-3 p-3.5 rounded-lg border"
                        style={{ backgroundColor: `${currentTheme.foreground}04`, borderColor: `${currentTheme.foreground}10` }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                            <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-amber-500">Unlock Chapters</p>
                            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: `${currentTheme.foreground}70` }}>
                                Buy individual premium chapters permanently — no membership needed.
                            </p>
                        </div>
                    </div>

                    {/* Use 3: Ebook */}
                    <a
                        href="/epub-novels"
                        className="flex items-start gap-3 p-3.5 rounded-lg border transition-opacity hover:opacity-80 group"
                        style={{ backgroundColor: `${currentTheme.foreground}04`, borderColor: `${currentTheme.foreground}10` }}
                    >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-emerald-500 group-hover:underline">Buy Ebooks</p>
                            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: `${currentTheme.foreground}70` }}>
                                Download EPUB &amp; PDF novels to keep forever.
                            </p>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════
   Tab 2 — Membership
   ═══════════════════════════════════════════════ */
function MembershipTab({ packages, flash, errors, paypalFee, tierSwitchCarryOverDays = 0, currentTier = null }: {
    packages: MembershipPackage[];
    flash?: Props['flash'];
    errors?: Props['errors'];
    paypalFee?: Props['paypalFee'];
    tierSwitchCarryOverDays?: number;
    currentTier?: string | null;
}) {
    const { currentTheme } = useTheme();
    const { toast } = useToast();
    const page = usePage<{
        auth: { user: { coins: number; membership_expires_at?: string | null } };
        flash?: { success?: string; error?: string; premium_granted?: { days: number; package_name: string; source: string }; tier_blocked?: { message: string } };
        errors?: Record<string, string | string[]>;
    }>();

    const userCoins = page.props.auth.user.coins;
    const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'coins' | 'paypal' | 'oxapay'>('coins');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    // Which tier the celebration should wear.
    const [successTier, setSuccessTier] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    // Set when the picked plan would downgrade an active Exclusive membership.
    const [blockedPkg, setBlockedPkg] = useState<MembershipPackage | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(flash?.error ?? null);
    const [premiumGranted, setPremiumGranted] = useState<{ days: number; package_name: string; source: string } | null>(null);
    const [voucherCode, setVoucherCode] = useState('');
    const [voucherData, setVoucherData] = useState<any>(null);
    const [voucherError, setVoucherError] = useState<string | null>(null);
    const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);

    // Premium is a strict subset of Premium Exclusive, so buying it while
    // Exclusive is active buys a downgrade — and grantMembership() would halve
    // the remaining days on the way down. The server refuses it too.
    const wouldDowngrade = (pkg: MembershipPackage) =>
        currentTier === 'exclusive' && asTier(pkg.tier) === 'premium';

    const rawExpiry = page.props.auth.user?.membership_expires_at;
    const exclusiveExpiryLabel = rawExpiry
        ? new Date(rawExpiry).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
        : null;

    const isRealCurrency = paymentMethod !== 'coins';

    const extractMessage = (value: unknown): string | undefined => {
        if (!value) return undefined;
        if (Array.isArray(value)) return value.find((e) => typeof e === 'string') as string | undefined;
        return typeof value === 'string' ? value : undefined;
    };

    // Clear voucher when switching away from coins
    const handlePaymentMethodChange = (method: 'coins' | 'paypal' | 'oxapay') => {
        setPaymentMethod(method);
        if (method !== 'coins') {
            setVoucherCode('');
            setVoucherData(null);
            setVoucherError(null);
        }
    };

    useEffect(() => {
        if (flash?.premium_granted) { setPremiumGranted(flash.premium_granted); setSuccessTier(flash.premium_granted.tier ?? 'premium'); setShowSuccess(true); }
    }, [flash?.premium_granted]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') { setShowSuccess(true); window.history.replaceState({}, '', '/shop?tab=membership'); }
    }, []);

    useEffect(() => { if (flash?.error) setErrorMessage(flash.error); }, [flash?.error]);

    // The client blocks this before it is sent, so a server refusal means the
    // membership changed underneath us — another tab, or a slow click.
    useEffect(() => {
        if (!flash?.tier_blocked) return;
        const pkg = packages.find(p => p.id === selectedPackage) ?? packages.find(p => asTier(p.tier) === 'premium');
        if (pkg) { setBlockedPkg(pkg); setErrorMessage(null); setShowConfirmModal(false); }
    }, [flash?.tier_blocked]);

    useEffect(() => {
        const pageErrors = errors ?? page.props.errors;
        if (pageErrors && Object.keys(pageErrors).length > 0) {
            const msg = extractMessage(pageErrors.membership) ?? extractMessage(pageErrors.error) ?? extractMessage(Object.values(pageErrors)[0]);
            if (msg) setErrorMessage(msg);
        }
    }, [errors, page.props.errors]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!selectedPackage) { setErrorMessage('Please choose a membership package.'); return; }
        const pkg = packages.find(p => p.id === selectedPackage);
        if (pkg && wouldDowngrade(pkg)) { setBlockedPkg(pkg); return; }
        setShowConfirmModal(true);
    };

    // A code handed over from the homepage strip or the monthly modal
    // (?voucher=CODE, or remembered across a sign-in). Pre-filled, coins
    // selected since vouchers only apply to coin purchases, and applied as
    // soon as a package is picked.
    const autoVoucher = useRef<string | null>(null);
    useEffect(() => {
        const code = pendingVoucher();
        if (!code) return;
        autoVoucher.current = code;
        setVoucherCode(code);
        setPaymentMethod('coins');
        toast.info('Pick a package and it will be applied automatically.', `Voucher ${code} ready`);
    }, []);

    // Applies on package pick for a handed-over code, and re-applies when the
    // package changes under an applied voucher: the discount is a percentage
    // of the package price, so the old figure would be wrong.
    useEffect(() => {
        if (!selectedPackage || !voucherCode.trim() || paymentMethod !== 'coins') return;
        if (!autoVoucher.current && !voucherData) return;
        autoVoucher.current = null;
        clearPendingVoucher();
        applyVoucher(voucherCode, selectedPackage);
    }, [selectedPackage]);

    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) { toast.warning('Please enter a voucher code.'); return; }
        if (!selectedPackage) { toast.warning('Please select a membership package first.'); return; }
        await applyVoucher(voucherCode, selectedPackage);
    };

    const applyVoucher = async (code: string, packageId: number) => {
        const pkg = packages.find(p => p.id === packageId);
        if (!pkg) return;

        setIsApplyingVoucher(true); setVoucherError(null);
        try {
            const response = await fetch(route('voucher.validate'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...csrfHeaders(),
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ code: code.toUpperCase(), type: 'membership', amount: pkg.coin_price }),
            });
            const data = await response.json();
            if (data.success) {
                setVoucherData(data.data); setVoucherError(null);
                toast.success(`Saved ¢${data.data.discount_amount.toLocaleString()}!`, `Voucher Applied`);
            } else {
                setVoucherError(data.message); setVoucherData(null);
                toast.error(data.message || 'Invalid voucher.', 'Invalid Voucher');
            }
        } catch {
            setVoucherError('Failed to validate. Please try again.'); setVoucherData(null);
        } finally { setIsApplyingVoucher(false); }
    };

    const handleRemoveVoucher = () => { setVoucherCode(''); setVoucherData(null); setVoucherError(null); };

    const handleConfirmPurchase = () => {
        if (!selectedPackage) return;
        setErrorMessage(null); setShowConfirmModal(false);

        const payload: Record<string, any> = {
            package_id: selectedPackage,
            payment_method: paymentMethod,
        };

        // Voucher only for coins
        if (paymentMethod === 'coins' && voucherData) {
            payload.voucher_code = voucherCode.toUpperCase();
        }

        router.post(route('membership.purchase'), payload, {
            preserveScroll: paymentMethod === 'coins',
            onStart: () => setIsProcessing(true),
            onError: (formErrors) => {
                const message = extractMessage(formErrors.membership) || extractMessage(formErrors.error) || extractMessage(Object.values(formErrors)[0]) || 'Purchase failed. Please try again.';
                setErrorMessage(message);
                setIsProcessing(false);
            },
            onSuccess: () => {
                if (paymentMethod === 'coins') { setErrorMessage(null); setSuccessTier(selectedPkg?.tier ?? 'premium'); setShowSuccess(true); }
                setIsProcessing(false);
            },
            onFinish: () => {},
        });
    };

    const selectedPkg = packages.find(p => p.id === selectedPackage);
    const finalCost = voucherData ? voucherData.final_amount : selectedPkg?.coin_price ?? 0;
    const canAffordSelected = isRealCurrency ? true : (selectedPkg ? userCoins >= finalCost : true);

    const priceUsd = selectedPkg ? parseFloat(selectedPkg.price_usd) : 0;
    const gimmickUsd = selectedPkg?.gimmick_price_usd ? parseFloat(selectedPkg.gimmick_price_usd) : 0;
    const usdSavePct = gimmickUsd > priceUsd ? Math.round(((gimmickUsd - priceUsd) / gimmickUsd) * 100) : 0;
    // Only PayPal passes the fee on; coins and OxaPay bill face value.
    const payTotal = paymentMethod === 'paypal'
        ? withPaypalFee(priceUsd, paypalFee)
        : { subtotal: priceUsd, fee: 0, total: priceUsd };

    // Every confirmation surface dresses itself for the tier being bought, so
    // the buyer never has to read the package name to know what they picked.
    const pkgTier = asTier(selectedPkg?.tier);
    const pkgAccent = TIER_COLOR[pkgTier];
    const isExclusivePkg = pkgTier === 'exclusive';

    return (
        <div className="w-full">
            {/* ── Downgrade Blocked Modal ── */}
            {blockedPkg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                    onClick={() => setBlockedPkg(null)}>
                    <div className="rounded-lg p-6 max-w-sm w-full text-center border"
                        style={{ backgroundColor: currentTheme.background, borderColor: `${EXCLUSIVE_GOLD}55` }}
                        onClick={(e) => e.stopPropagation()}>
                        <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3"
                            style={{ backgroundColor: `${EXCLUSIVE_GOLD}18` }}>
                            <ExclusiveCrownIcon size={26} />
                        </div>

                        <h2 className="text-base font-extrabold mb-1.5" style={{ color: currentTheme.foreground }}>
                            You're already on a higher plan
                        </h2>

                        <p className="text-xs leading-relaxed mb-4" style={{ color: `${currentTheme.foreground}70` }}>
                            <span className="font-bold" style={{ color: EXCLUSIVE_GOLD }}>Premium Exclusive</span> is active on your
                            account and already includes everything in{' '}
                            <span className="font-semibold" style={{ color: currentTheme.foreground }}>{blockedPkg.name}</span>.
                            Buying it now would replace your plan with the lower tier.
                        </p>

                        <div className="rounded-lg p-3 mb-4 text-xs border" style={{ backgroundColor: `${EXCLUSIVE_GOLD}0F`, borderColor: `${EXCLUSIVE_GOLD}25` }}>
                            <span style={{ color: `${currentTheme.foreground}70` }}>Your plan runs until </span>
                            <span className="font-bold" style={{ color: EXCLUSIVE_GOLD }}>
                                {exclusiveExpiryLabel ?? 'your current expiry date'}
                            </span>
                        </div>

                        <p className="text-[11px] mb-4" style={{ color: `${currentTheme.foreground}70` }}>
                            To add more time, renew Premium Exclusive instead.
                        </p>

                        <button onClick={() => setBlockedPkg(null)}
                            className="w-full py-2.5 rounded-lg font-bold text-sm transition-opacity hover:opacity-90"
                            style={{ backgroundColor: EXCLUSIVE_GOLD, color: '#3b2a00' }}>
                            Got it
                        </button>
                    </div>
                </div>
            )}

            {/* ── Confirm Modal ── */}
            {showConfirmModal && selectedPkg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowConfirmModal(false)}>
                    <div className="rounded-lg p-6 max-w-sm w-full text-center border"
                        style={{ backgroundColor: currentTheme.background, borderColor: isExclusivePkg ? `${EXCLUSIVE_GOLD}60` : `${SHINY_PURPLE}60` }}
                        onClick={(e) => e.stopPropagation()}>
                        <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3"
                            style={{ backgroundColor: `${pkgAccent}20` }}>
                            <TierIcon tier={pkgTier} size={24} />
                        </div>
                        <h2 className="text-base font-extrabold mb-1" style={{ color: currentTheme.foreground }}>Confirm Purchase</h2>
                        <p className="text-xs mb-4" style={{ color: `${currentTheme.foreground}70` }}>
                            <span className="font-bold" style={{ color: pkgAccent }}>{selectedPkg.name}</span> — {selectedPkg.duration_days} days
                        </p>

                        <div className="rounded-lg p-3.5 mb-4 text-left space-y-2 text-xs border" style={{ backgroundColor: `${currentTheme.foreground}06`, borderColor: `${currentTheme.foreground}12` }}>
                            {isRealCurrency ? (
                                <>
                                    {gimmickUsd > priceUsd && (
                                        <div className="flex justify-between">
                                            <span style={{ color: `${currentTheme.foreground}70` }}>Regular Price</span>
                                            <span className="line-through opacity-40" style={{ color: currentTheme.foreground }}>${gimmickUsd.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-2" style={{ borderTop: gimmickUsd > priceUsd ? `1px solid ${currentTheme.foreground}12` : undefined }}>
                                        <span className="font-bold" style={{ color: currentTheme.foreground }}>Total</span>
                                        <span className="text-lg font-extrabold" style={{ color: pkgAccent }}>${priceUsd.toFixed(2)} <span className="text-xs font-normal opacity-50">USD</span></span>
                                    </div>
                                    <p className="text-[11px] pt-1" style={{ color: `${currentTheme.foreground}70` }}>
                                        You'll be redirected to {paymentMethod === 'paypal' ? 'PayPal' : 'OxaPay'} to complete your payment.
                                    </p>
                                </>
                            ) : voucherData ? (
                                <>
                                    <div className="flex justify-between"><span style={{ color: `${currentTheme.foreground}70` }}>Original</span><span className="line-through opacity-40" style={{ color: currentTheme.foreground }}>¢{selectedPkg.coin_price.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span className="text-emerald-500">Voucher ({voucherCode})</span><span className="text-emerald-500">−¢{voucherData.discount_amount.toLocaleString()}</span></div>
                                    <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${currentTheme.foreground}12` }}><span className="font-bold" style={{ color: currentTheme.foreground }}>Total</span><span className="text-lg font-extrabold text-amber-500">¢{voucherData.final_amount.toLocaleString()}</span></div>
                                </>
                            ) : (
                                <div className="flex justify-between"><span style={{ color: `${currentTheme.foreground}70` }}>Total Cost</span><span className="text-lg font-extrabold text-amber-500">¢{selectedPkg.coin_price.toLocaleString()}</span></div>
                            )}
                        </div>

                        {!isRealCurrency && (
                            <p className="text-xs mb-4" style={{ color: `${currentTheme.foreground}70` }}>
                                After purchase: <span className="font-bold text-amber-500">¢{(userCoins - finalCost).toLocaleString()}</span> remaining
                            </p>
                        )}

                        <div className="flex gap-2.5">
                            <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-2 rounded-lg font-medium text-xs border transition-opacity hover:opacity-80" style={{ borderColor: `${currentTheme.foreground}15`, color: `${currentTheme.foreground}70` }}>Cancel</button>
                            <button onClick={handleConfirmPurchase} disabled={isProcessing} className="flex-1 py-2 rounded-lg font-bold text-xs transition-opacity hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: pkgAccent, color: isExclusivePkg ? '#3b2a00' : '#000' }}>
                                {isProcessing ? 'Processing...' : isRealCurrency ? 'Continue →' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Success Modal ── */}
            {/* Dressed to match whichever tier was bought, so an Exclusive
                purchase is not congratulated in Premium's colours. */}
            {showSuccess && (() => {
                const boughtTier = asTier(successTier);
                const isExcl = boughtTier === 'exclusive';
                const accent = isExcl ? EXCLUSIVE_GOLD : SHINY_PURPLE;

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowSuccess(false)}>
                        <div className="rounded-lg p-6 max-w-sm w-full text-center border"
                            style={{ backgroundColor: currentTheme.background, borderColor: `${accent}60` }}
                            onClick={(e) => e.stopPropagation()}>
                            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3"
                                style={{ backgroundColor: `${accent}18` }}>
                                <TierIcon tier={boughtTier === 'basic' ? 'premium' : boughtTier} size={30} />
                            </div>
                            <h2 className="text-xl font-extrabold mb-1.5" style={{ color: accent }}>Congratulations!</h2>

                            {premiumGranted ? (
                                <>
                                    <p className="text-sm mb-0.5" style={{ color: currentTheme.foreground }}>
                                        <span className="font-bold" style={{ color: accent }}>{premiumGranted.days} {premiumGranted.days === 1 ? 'Day' : 'Days'}</span> of {TIER_LABEL[boughtTier === 'basic' ? 'premium' : boughtTier]}
                                    </p>
                                    <p className="text-xs font-semibold mb-3" style={{ color: accent }}>Has Been Added!</p>
                                    <div className="inline-block px-3 py-1 rounded-lg mb-3 border" style={{ backgroundColor: `${accent}12`, borderColor: `${accent}30` }}>
                                        <p className="text-xs font-semibold" style={{ color: accent }}>{premiumGranted.package_name}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm mb-0.5" style={{ color: currentTheme.foreground }}>
                                        Your {TIER_LABEL[boughtTier === 'basic' ? 'premium' : boughtTier]} Membership
                                    </p>
                                    <p className="text-xs font-semibold mb-3" style={{ color: accent }}>Has Been Activated!</p>
                                </>
                            )}

                            <p className="text-xs mb-5" style={{ color: `${currentTheme.foreground}70` }}>
                                {isExcl
                                    ? 'Every premium chapter, every EPUB volume, and no ads — all yours.'
                                    : 'Enjoy unlimited access to all premium chapters and an ad-free experience.'}
                            </p>
                            <button onClick={() => setShowSuccess(false)} className="w-full py-2.5 rounded-lg font-bold text-sm transition-opacity hover:opacity-90"
                                style={{ backgroundColor: accent, color: isExcl ? '#1a1206' : '#000' }}>
                                Start Reading {isExcl ? '♛' : '✦'}
                            </button>
                        </div>
                    </div>
                );
            })()}

            <form onSubmit={handleSubmit}>
                {errorMessage && (
                    <div className="rounded-lg px-4 py-3 flex items-center gap-3 mb-6" style={{ border: '1px solid #ef444440', backgroundColor: 'rgba(239,68,68,0.08)' }}>
                        <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                        <p className="flex-1 text-sm text-red-400">{errorMessage}</p>
                        <button type="button" onClick={() => setErrorMessage(null)} className="text-red-400 opacity-50 hover:opacity-100"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] gap-6 items-start">

                    {/* ── Left: Package Cards ── */}
                    <div>
                        <style>{EXCLUSIVE_STYLES}</style>
                        <p className="text-xs uppercase tracking-widest font-bold mb-4" style={{ color: `${currentTheme.foreground}70` }}>
                            Choose Your Plan
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {packages.map((pkg) => {
                                const coinPrice = pkg.coin_price;
                                const originalCoinPrice = pkg.discount_percentage > 0 ? getOriginalCoinPrice(coinPrice, pkg.discount_percentage) : 0;
                                const pkgPriceUsd = parseFloat(pkg.price_usd);
                                const pkgGimmickUsd = pkg.gimmick_price_usd ? parseFloat(pkg.gimmick_price_usd) : 0;
                                const pkgUsdSavePct = pkgGimmickUsd > pkgPriceUsd ? Math.round(((pkgGimmickUsd - pkgPriceUsd) / pkgGimmickUsd) * 100) : 0;
                                const isSelected = selectedPackage === pkg.id;
                                const isBestValue = pkg.duration_days === 365;
                                const canAfford = isRealCurrency ? true : userCoins >= coinPrice;

                                // Exclusive gets its own card: full width across the grid
                                if (pkg.tier === 'exclusive') {
                                    return (
                                        <button key={pkg.id} type="button" onClick={() => setSelectedPackage(isSelected ? null : pkg.id)}
                                            className="excl-neon relative sm:col-span-2 p-5 rounded-lg text-left transition-shadow duration-150"
                                            style={{
                                                // Exclusive is Premium *plus* something, so its mark has to keep the
                                                // Premium violet rather than replace it with gold. Three layers: the
                                                // card tint, an opaque base under it, and the sweeping gradient —
                                                // the first two clipped to the padding box so the gradient is only
                                                // ever visible as the border. .excl-neon animates its position.
                                                border: '1px solid transparent',
                                                backgroundImage: [
                                                    `linear-gradient(${currentTheme.foreground}${isSelected ? '0C' : '08'}, ${currentTheme.foreground}${isSelected ? '0C' : '08'})`,
                                                    `linear-gradient(${currentTheme.background}, ${currentTheme.background})`,
                                                    TIER_GRADIENT.exclusive,
                                                ].join(', '),
                                                backgroundOrigin: 'border-box',
                                                backgroundClip: 'padding-box, padding-box, border-box',
                                                backgroundSize: 'auto, auto, 260% 260%',
                                                boxShadow: isSelected ? TIER_GLOW.exclusive : 'none',
                                                opacity: canAfford ? 1 : 0.45,
                                            }}>

                                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide"
                                                            style={{ backgroundColor: `${EXCLUSIVE_GOLD}20`, color: EXCLUSIVE_GOLD, border: `1px solid ${EXCLUSIVE_GOLD}40` }}>
                                                            ♛ EXCLUSIVE
                                                        </span>
                                                        {!isRealCurrency && !canAfford && (
                                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20">
                                                                NEED MORE COINS
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 mb-1">
                                                        <ExclusiveCrown size={20} />
                                                        <h3 className="font-extrabold text-base sm:text-lg" style={{ color: currentTheme.foreground }}>{pkg.name}</h3>
                                                    </div>
                                                    <p className="text-xs mb-1" style={{ color: `${currentTheme.foreground}70` }}>
                                                        {pkg.duration_days} days · everything in Premium, plus every EPUB volume free
                                                    </p>
                                                </div>

                                                <div className="text-right flex-shrink-0">
                                                    {isRealCurrency ? (
                                                        <>
                                                            <div className="flex items-end gap-2 justify-end">
                                                                <span className="text-2xl sm:text-3xl font-extrabold" style={{ color: EXCLUSIVE_GOLD }}>${pkgPriceUsd.toFixed(2)}</span>
                                                                {pkgGimmickUsd > pkgPriceUsd && (
                                                                    <span className="text-xs line-through mb-1" style={{ color: `${currentTheme.foreground}50` }}>${pkgGimmickUsd.toFixed(2)}</span>
                                                                )}
                                                            </div>
                                                            {pkgUsdSavePct > 0 && (
                                                                <div className="mt-1 inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold"
                                                                    style={{ backgroundColor: `${EXCLUSIVE_GOLD}18`, color: EXCLUSIVE_GOLD, border: `1px solid ${EXCLUSIVE_GOLD}30` }}>
                                                                    Save {pkgUsdSavePct}%
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-end gap-2 justify-end">
                                                                <span className="text-2xl sm:text-3xl font-extrabold" style={{ color: EXCLUSIVE_GOLD }}>¢{coinPrice.toLocaleString()}</span>
                                                                {originalCoinPrice > 0 && (
                                                                    <span className="text-xs line-through mb-1" style={{ color: `${currentTheme.foreground}50` }}>¢{originalCoinPrice.toLocaleString()}</span>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                    {isSelected && (
                                                        <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold" style={{ color: EXCLUSIVE_GOLD }}>
                                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                            Selected
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                }

                                return (
                                    <button key={pkg.id} type="button" onClick={() => setSelectedPackage(isSelected ? null : pkg.id)}
                                        className="relative p-5 rounded-lg text-left transition-colors duration-150 border"
                                        style={{
                                            backgroundColor: isSelected
                                                ? `${currentTheme.foreground}0C`
                                                : `${currentTheme.foreground}08`,
                                            borderColor: isSelected ? SHINY_PURPLE : `${currentTheme.foreground}15`,
                                            opacity: canAfford ? 1 : 0.45,
                                        }}>

                                        {/* Badges */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {isBestValue && (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide"
                                                        style={{ backgroundColor: `${SHINY_PURPLE}20`, color: SHINY_PURPLE, border: `1px solid ${SHINY_PURPLE}40` }}>
                                                        ✦ BEST VALUE
                                                    </span>
                                                )}
                                                {!isRealCurrency && !canAfford && (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20">
                                                        NEED MORE COINS
                                                    </span>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: SHINY_PURPLE }}>
                                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="font-extrabold text-base mb-1" style={{ color: currentTheme.foreground }}>{pkg.name}</h3>
                                        <p className="text-xs mb-3" style={{ color: `${currentTheme.foreground}70` }}>{pkg.duration_days} days of unlimited access</p>

                                        {/* Price display — switches based on payment method */}
                                        {isRealCurrency ? (
                                            <div>
                                                <div className="flex items-end gap-2">
                                                    <span className="text-2xl font-extrabold" style={{ color: SHINY_PURPLE }}>${pkgPriceUsd.toFixed(2)}</span>
                                                    {pkgGimmickUsd > pkgPriceUsd && (
                                                        <span className="text-xs line-through mb-1" style={{ color: `${currentTheme.foreground}50` }}>${pkgGimmickUsd.toFixed(2)}</span>
                                                    )}
                                                </div>
                                                {pkgUsdSavePct > 0 && (
                                                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                                        style={{ backgroundColor: `${SHINY_PURPLE}12`, color: SHINY_PURPLE, border: `1px solid ${SHINY_PURPLE}25` }}>
                                                        Save {pkgUsdSavePct}%
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex items-end gap-2">
                                                    <span className="text-2xl font-extrabold text-amber-500">¢{coinPrice.toLocaleString()}</span>
                                                    {originalCoinPrice > 0 && (
                                                        <span className="text-xs line-through mb-1" style={{ color: `${currentTheme.foreground}50` }}>¢{originalCoinPrice.toLocaleString()}</span>
                                                    )}
                                                </div>
                                                {pkg.discount_percentage > 0 && (
                                                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                                        style={{ backgroundColor: `${SHINY_PURPLE}12`, color: SHINY_PURPLE, border: `1px solid ${SHINY_PURPLE}25` }}>
                                                        Save {pkg.discount_percentage}%
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Right Sidebar ── */}
                    <div className="flex flex-col gap-4">

                        {/* What You'll Get */}
                        <div className={`rounded-lg overflow-hidden${isExclusivePkg ? ' excl-neon' : ' border'}`}
                            style={isExclusivePkg ? {
                                // Same violet-and-gold edge as the plan card, so the perks panel
                                // reads as belonging to the tier it is describing.
                                border: '1px solid transparent',
                                backgroundImage: `linear-gradient(${currentTheme.background}, ${currentTheme.background}), ${TIER_GRADIENT.exclusive}`,
                                backgroundOrigin: 'border-box',
                                backgroundClip: 'padding-box, border-box',
                                backgroundSize: 'auto, 260% 260%',
                            } : { borderColor: `${SHINY_PURPLE}30` }}>
                            <div className="px-4 py-2.5 flex items-center gap-2 border-b"
                                style={{
                                    backgroundColor: isExclusivePkg ? `${EXCLUSIVE_GOLD}12` : `${SHINY_PURPLE}12`,
                                    borderColor: isExclusivePkg ? `${EXCLUSIVE_GOLD}25` : `${SHINY_PURPLE}20`,
                                }}>
                                <TierIcon tier={pkgTier} size={14} />
                                <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: pkgAccent }}>
                                    {isExclusivePkg ? "What You'll Get — Exclusive" : "What You'll Get"}
                                </span>
                            </div>
                            <div className="px-4 py-3.5" style={{ backgroundColor: `${currentTheme.foreground}04` }}>
                                <ul className="space-y-2">
                                    {(isExclusivePkg
                                        ? ['All in Premium', 'Access Exclusive Epubs download']
                                        : ['Unlock all premium chapters', 'Completely ad-free reading', 'Access to EPUB downloads']
                                    ).map((text) => (
                                        <li key={text} className="flex items-center gap-2.5 text-xs" style={{ color: currentTheme.foreground }}>
                                            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                                                <circle cx="8" cy="8" r="8" fill={`${pkgAccent}25`} />
                                                <path d="M4.5 8l2.5 2.5 4.5-5" stroke={pkgAccent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <span>{text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* ── Payment Method Selector ── */}
                        <div className="rounded-lg overflow-hidden border" style={{ borderColor: `${currentTheme.foreground}15` }}>
                            <div className="px-4 py-2.5 border-b" style={{ backgroundColor: `${currentTheme.foreground}06`, borderColor: `${currentTheme.foreground}15` }}>
                                <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: `${currentTheme.foreground}70` }}>Payment Method</p>
                            </div>
                            <div className="p-2.5 grid grid-cols-3 gap-2" style={{ backgroundColor: `${currentTheme.foreground}02` }}>
                                {/* Coins */}
                                <button type="button" onClick={() => handlePaymentMethodChange('coins')}
                                    className="relative flex flex-col items-center gap-1 p-2.5 rounded-lg transition-colors duration-150"
                                    style={{
                                        backgroundColor: paymentMethod === 'coins' ? `${currentTheme.foreground}0C` : `${currentTheme.foreground}04`,
                                        border: `1.5px solid ${paymentMethod === 'coins' ? SHINY_PURPLE : `${currentTheme.foreground}10`}`,
                                    }}>
                                    <span className="text-base font-black text-amber-500" style={{ fontFamily: 'serif' }}>¢</span>
                                    <span className="text-[10px] font-bold" style={{ color: paymentMethod === 'coins' ? SHINY_PURPLE : `${currentTheme.foreground}70` }}>Coins</span>
                                    {paymentMethod === 'coins' && (
                                        <div className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full flex items-center justify-center" style={{ backgroundColor: SHINY_PURPLE }}>
                                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        </div>
                                    )}
                                </button>

                                {/* PayPal */}
                                <button type="button" onClick={() => handlePaymentMethodChange('paypal')}
                                    className="relative flex flex-col items-center gap-1 p-2.5 rounded-lg transition-colors duration-150"
                                    style={{
                                        backgroundColor: paymentMethod === 'paypal' ? `${currentTheme.foreground}0C` : `${currentTheme.foreground}04`,
                                        border: `1.5px solid ${paymentMethod === 'paypal' ? '#3b82f6' : `${currentTheme.foreground}10`}`,
                                    }}>
                                    <img src="/images/paymentlogo/paypal.svg" alt="PayPal" className="h-5 object-contain" />
                                    <span className="text-[10px] font-bold text-blue-400">PayPal</span>
                                    {paymentMethod === 'paypal' && (
                                        <div className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center">
                                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        </div>
                                    )}
                                </button>

                                {/* OxaPay */}
                                <button type="button" onClick={() => handlePaymentMethodChange('oxapay')}
                                    className="relative flex flex-col items-center gap-1 p-2.5 rounded-lg transition-colors duration-150"
                                    style={{
                                        backgroundColor: paymentMethod === 'oxapay' ? `${currentTheme.foreground}0C` : `${currentTheme.foreground}04`,
                                        border: `1.5px solid ${paymentMethod === 'oxapay' ? '#10b981' : `${currentTheme.foreground}10`}`,
                                    }}>
                                    <img src="/images/paymentlogo/oxapay.svg" alt="OxaPay" className="h-5 object-contain" />
                                    <span className="text-[10px] font-bold text-emerald-500">OxaPay</span>
                                    {paymentMethod === 'oxapay' && (
                                        <div className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full flex items-center justify-center bg-emerald-500">
                                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        </div>
                                    )}
                                </button>
                            </div>

                            {/* Real-currency note */}
                            {isRealCurrency && (
                                <div className="px-3 pb-2.5 flex items-center gap-1.5">
                                    <svg className="w-3 h-3 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                    <p className="text-[10px]" style={{ color: `${currentTheme.foreground}70` }}>
                                        Secure payment · Vouchers not applicable for real currency
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* ── Coins method: Balance + Voucher ── */}
                        {!isRealCurrency && (
                            <>
                                <div className="rounded-lg p-3.5 border flex items-center justify-between"
                                    style={{ backgroundColor: `${currentTheme.foreground}08`, borderColor: `${currentTheme.foreground}15` }}>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest font-bold mb-0.5" style={{ color: `${currentTheme.foreground}70` }}>Your Balance</p>
                                        <p className="text-xl font-extrabold text-amber-500">¢{userCoins.toLocaleString()}</p>
                                    </div>
                                    {selectedPkg && !canAffordSelected && (
                                        <div className="text-right">
                                            <p className="text-xs text-red-400 mb-1">Need ¢{(finalCost - userCoins).toLocaleString()} more</p>
                                            <a href="/shop?tab=coins" className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold text-black transition-opacity hover:opacity-90"
                                                style={{ backgroundColor: '#f59e0b' }}>
                                                Buy Coins
                                            </a>
                                        </div>
                                    )}
                                    {selectedPkg && canAffordSelected && (
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase tracking-widest font-medium mb-0.5" style={{ color: `${currentTheme.foreground}70` }}>After purchase</p>
                                            <p className="text-base font-bold" style={{ color: `${currentTheme.foreground}70` }}>¢{(userCoins - finalCost).toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Voucher */}
                                <div className="rounded-lg p-3.5 border" style={{ backgroundColor: `${currentTheme.foreground}08`, borderColor: `${currentTheme.foreground}15` }}>
                                    <p className="text-[10px] uppercase tracking-widest font-bold mb-2.5" style={{ color: `${currentTheme.foreground}70` }}>Have a Voucher?</p>
                                    {!voucherData ? (
                                        <>
                                            <div className="flex gap-2">
                                                <input type="text" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                                    placeholder={selectedPackage ? 'Enter code…' : 'Select a plan first'}
                                                    disabled={!selectedPackage || isApplyingVoucher}
                                                    className="flex-1 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none uppercase disabled:cursor-not-allowed"
                                                    style={{
                                                        border: `1px solid ${voucherError ? '#ef4444' : `${currentTheme.foreground}15`}`,
                                                        backgroundColor: `${currentTheme.foreground}04`,
                                                        color: currentTheme.foreground,
                                                        opacity: selectedPackage ? 1 : 0.45,
                                                    }} />
                                                <button type="button" onClick={handleApplyVoucher} disabled={!voucherCode.trim() || isApplyingVoucher || !selectedPackage}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-opacity disabled:opacity-40"
                                                    style={{ backgroundColor: SHINY_PURPLE, color: '#000' }}>
                                                    {isApplyingVoucher ? '…' : 'Apply'}
                                                </button>
                                            </div>
                                            {voucherError && <p className="mt-1.5 text-xs text-red-400">{voucherError}</p>}
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-between px-3 py-2 rounded-lg border"
                                            style={{ backgroundColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)' }}>
                                            <div>
                                                <p className="text-xs font-extrabold text-emerald-500">{voucherCode}</p>
                                                <p className="text-[10px] text-emerald-500 opacity-80">−{voucherData.discount_type === 'percent' ? `${voucherData.discount_value}%` : `¢${voucherData.discount_value}`} applied</p>
                                            </div>
                                            <button type="button" onClick={handleRemoveVoucher} className="text-xs font-bold text-red-400 hover:opacity-70 transition-opacity">Remove</button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* ── Real currency: USD summary ── */}
                        {isRealCurrency && selectedPkg && (
                            <div className="rounded-lg p-3.5 border" style={{ backgroundColor: `${currentTheme.foreground}08`, borderColor: `${SHINY_PURPLE}30` }}>
                                <p className="text-[10px] uppercase tracking-widest font-bold mb-2.5" style={{ color: SHINY_PURPLE }}>Order Summary</p>
                                <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between">
                                        <span style={{ color: `${currentTheme.foreground}70` }}>Plan</span>
                                        <span className="font-semibold" style={{ color: currentTheme.foreground }}>{selectedPkg.name}</span>
                                    </div>
                                    {gimmickUsd > priceUsd && (
                                        <div className="flex justify-between">
                                            <span style={{ color: `${currentTheme.foreground}70` }}>Regular Price</span>
                                            <span className="line-through opacity-40" style={{ color: currentTheme.foreground }}>${gimmickUsd.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {usdSavePct > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-emerald-500">Discount</span>
                                            <span className="text-emerald-500">−{usdSavePct}%</span>
                                        </div>
                                    )}
                                    {paymentMethod === 'paypal' && paypalFee?.enabled && (
                                        <>
                                            <div className="flex justify-between pt-1.5" style={{ borderTop: `1px solid ${currentTheme.foreground}15` }}>
                                                <span style={{ color: `${currentTheme.foreground}70` }}>Subtotal</span>
                                                <span style={{ color: currentTheme.foreground }}>${priceUsd.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span style={{ color: `${currentTheme.foreground}70` }}>
                                                    PayPal fee <span className="opacity-60">({paypalFee.rate}% + ${paypalFee.fixed.toFixed(2)})</span>
                                                </span>
                                                <span style={{ color: currentTheme.foreground }}>+${payTotal.fee.toFixed(2)}</span>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex justify-between pt-1.5" style={{ borderTop: `1px solid ${currentTheme.foreground}15` }}>
                                        <span className="font-bold" style={{ color: currentTheme.foreground }}>Total</span>
                                        <span className="text-lg font-extrabold" style={{ color: SHINY_PURPLE }}>${payTotal.total.toFixed(2)} <span className="text-[10px] font-normal opacity-50">USD</span></span>
                                    </div>

                                    {currentTier && selectedPkg.tier !== currentTier && tierSwitchCarryOverDays > 0 && (
                                        <p className="pt-1.5 text-[11px] leading-relaxed" style={{ color: `${currentTheme.foreground}70` }}>
                                            Switching tiers: half your unused days carry over — <strong style={{ color: EXCLUSIVE_GOLD }}>+{tierSwitchCarryOverDays} day{tierSwitchCarryOverDays === 1 ? '' : 's'}</strong> added.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Submit Button ── */}
                        <button type="submit" disabled={!selectedPackage || !canAffordSelected || isProcessing}
                            className="w-full py-3 rounded-lg font-bold text-sm transition-opacity"
                            style={{
                                backgroundColor: SHINY_PURPLE,
                                color: '#000',
                                opacity: (!selectedPackage || !canAffordSelected || isProcessing) ? 0.35 : 1,
                                cursor: (!selectedPackage || !canAffordSelected || isProcessing) ? 'not-allowed' : 'pointer',
                            }}>
                            {isProcessing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    Redirecting…
                                </span>
                            ) : !selectedPackage ? 'Select a Plan to Continue'
                              : !canAffordSelected ? `Need ¢${(finalCost - userCoins).toLocaleString()} More`
                              : isRealCurrency
                                ? `Pay $${priceUsd.toFixed(2)} with ${paymentMethod === 'paypal' ? 'PayPal' : 'OxaPay'} →`
                                : `Buy with ¢${finalCost.toLocaleString()} Coins ✦`}
                        </button>

                        {selectedPkg && (
                            <p className="text-center text-[11px] flex items-center justify-center gap-1" style={{ color: `${currentTheme.foreground}70` }}>
                                <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                Secure payment · SSL encrypted
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
