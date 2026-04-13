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
    features: { unlock_premium_chapters?: boolean; ad_free?: boolean };
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
        premium_granted?: { days: number; package_name: string; source: string };
    };
    errors?: Record<string, string | string[]>;
}

const getOriginalCoinPrice = (coinPrice: number, discount: number) =>
    discount === 0 ? 0 : Math.round(coinPrice / (1 - discount / 100));

/* ═══════════════════════════════════════════════
   Main Shop Page
   ═══════════════════════════════════════════════ */
function ShopContent({ coinPackages, membershipPackages, activeTab: initialTab, flash, errors }: Props) {
    const { currentTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<'coins' | 'membership'>(
        initialTab === 'membership' ? 'membership' : 'coins'
    );
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
            <div className="min-h-screen" style={{ backgroundColor: currentTheme.background }}>

                {/* ── Hero Banner ── */}
                <div
                    className="relative overflow-hidden"
                    style={{
                        background: activeTab === 'coins'
                            ? `linear-gradient(135deg, rgba(120,53,15,0.45) 0%, rgba(217,119,6,0.25) 40%, ${currentTheme.background} 80%)`
                            : `linear-gradient(135deg, rgba(109,40,217,0.45) 0%, rgba(167,139,250,0.2) 40%, ${currentTheme.background} 80%)`,
                    }}
                >
                    {/* Decorative blobs */}
                    <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
                        style={{ backgroundColor: activeTab === 'coins' ? '#f59e0b' : SHINY_PURPLE }} />
                    <div className="absolute top-4 right-1/3 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none"
                        style={{ backgroundColor: activeTab === 'coins' ? '#fbbf24' : '#c084fc' }} />

                    <div className="relative w-full px-4 sm:px-6 lg:px-10 xl:px-16 pt-8 pb-6">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                            {/* Title */}
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    {activeTab === 'coins' ? (
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl"
                                            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl"
                                            style={{ background: `linear-gradient(135deg, ${SHINY_PURPLE}, #7c3aed)` }}>
                                            <PremiumDiamond size={16} />
                                        </span>
                                    )}
                                    <span className="text-xs font-bold uppercase tracking-widest"
                                        style={{ color: activeTab === 'coins' ? '#f59e0b' : SHINY_PURPLE }}>
                                        {activeTab === 'coins' ? 'Coin Store' : 'Premium Club'}
                                    </span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight"
                                    style={{ color: currentTheme.foreground }}>
                                    {activeTab === 'coins' ? 'Top Up Coins' : 'Membership'}
                                </h1>
                                <p className="text-sm mt-1" style={{ color: `${currentTheme.foreground}55` }}>
                                    {activeTab === 'coins'
                                        ? 'Buy coins to unlock premium chapters instantly'
                                        : 'Unlimited premium access for true readers'}
                                </p>
                            </div>

                            {/* Balance + Tab Switcher */}
                            <div className="flex flex-col sm:items-end gap-3">
                                {userCoins !== undefined && (
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl self-start sm:self-auto"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.06))',
                                            border: '1px solid rgba(245,158,11,0.3)',
                                        }}>
                                        <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-xs font-medium" style={{ color: `${currentTheme.foreground}60` }}>Balance</span>
                                        <span className="text-base font-extrabold text-amber-400">¢{userCoins.toLocaleString()}</span>
                                    </div>
                                )}

                                {/* Tab switcher — fullwidth on mobile, auto on desktop */}
                                <div className="flex w-full sm:w-auto gap-1 p-1 rounded-2xl"
                                    style={{
                                        backgroundColor: `${currentTheme.foreground}08`,
                                        border: `1px solid ${currentTheme.foreground}10`,
                                    }}>
                                    <button onClick={() => switchTab('coins')}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300"
                                        style={{
                                            background: activeTab === 'coins' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
                                            color: activeTab === 'coins' ? '#fff' : `${currentTheme.foreground}55`,
                                            boxShadow: activeTab === 'coins' ? '0 4px 14px rgba(245,158,11,0.4)' : 'none',
                                        }}>
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                        </svg>
                                        Coins
                                    </button>
                                    <button onClick={() => switchTab('membership')}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300"
                                        style={{
                                            backgroundColor: activeTab === 'membership' ? SHINY_PURPLE : 'transparent',
                                            color: activeTab === 'membership' ? '#fff' : `${currentTheme.foreground}55`,
                                            boxShadow: activeTab === 'membership' ? `0 4px 14px ${SHINY_PURPLE}50` : 'none',
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
                        ? <CoinShopTab packages={coinPackages} />
                        : <MembershipTab packages={membershipPackages} flash={flash} errors={errors} />}
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
                            className="relative rounded-2xl text-center transition-all duration-300 overflow-hidden group"
                            style={{
                                background: isSelected
                                    ? 'linear-gradient(160deg, #78350f 0%, #92400e 40%, #b45309 100%)'
                                    : pkg.bonus_premium_days > 0
                                    ? `linear-gradient(160deg, ${SHINY_PURPLE_DIM}, rgba(109,40,217,0.08))`
                                    : `${currentTheme.foreground}05`,
                                border: `1.5px solid ${isSelected ? '#f59e0b' : pkg.bonus_premium_days > 0 ? `${SHINY_PURPLE}30` : `${currentTheme.foreground}10`}`,
                                boxShadow: isSelected
                                    ? '0 12px 32px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.1)'
                                    : '0 2px 8px rgba(0,0,0,0.06)',
                                transform: isSelected ? 'translateY(-4px) scale(1.02)' : undefined,
                            }}>

                            {/* Shine overlay on hover */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)' }} />

                            {/* Package name tag */}
                            <div className="px-3 pt-3 pb-1">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
                                    style={{
                                        background: isSelected ? 'rgba(255,255,255,0.2)' : 'linear-gradient(90deg, #d97706, #f59e0b)',
                                        color: isSelected ? '#fde68a' : '#fff',
                                    }}>
                                    {pkg.name}
                                </span>
                            </div>

                            {/* Bonus % badge */}
                            {bonusPct > 0 && (
                                <div className="absolute top-2 right-2 z-10">
                                    <span className="block px-1.5 py-0.5 rounded-full text-[9px] font-extrabold text-white"
                                        style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                                        +{Math.round(bonusPct)}%
                                    </span>
                                </div>
                            )}

                            {/* Coin icon */}
                            <div className="flex justify-center py-3">
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-full flex items-center justify-center"
                                        style={{
                                            background: isSelected
                                                ? 'radial-gradient(circle at 35% 30%, #fde68a 0%, #f59e0b 50%, #d97706 100%)'
                                                : 'radial-gradient(circle at 35% 30%, rgba(253,230,138,0.5) 0%, rgba(245,158,11,0.25) 60%, rgba(217,119,6,0.1) 100%)',
                                            boxShadow: isSelected
                                                ? '0 4px 16px rgba(245,158,11,0.5), inset 0 -2px 4px rgba(180,83,9,0.3), inset 0 2px 4px rgba(254,243,199,0.4)'
                                                : '0 2px 8px rgba(245,158,11,0.15)',
                                        }}>
                                        <span className="text-xl font-black"
                                            style={{ color: isSelected ? '#78350f' : '#f59e0b', fontFamily: 'serif' }}>
                                            ¢
                                        </span>
                                    </div>
                                    {pkg.bonus_premium_days > 0 && (
                                        <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
                                            style={{ backgroundColor: `${SHINY_PURPLE}`, boxShadow: `0 2px 6px ${SHINY_PURPLE}60` }}>
                                            <PremiumDiamond size={8} />
                                            <span className="text-[8px] font-bold text-white">+{pkg.bonus_premium_days}d</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Coin amount */}
                            <div className="px-2 pb-1">
                                <div className="text-2xl font-extrabold leading-none"
                                    style={{ color: isSelected ? '#fde68a' : '#f59e0b' }}>
                                    ¢{pkg.coin_amount.toLocaleString()}
                                </div>
                                <div className="text-[9px] uppercase tracking-widest mt-0.5"
                                    style={{ color: isSelected ? 'rgba(253,230,138,0.5)' : `${currentTheme.foreground}30` }}>
                                    coins
                                </div>
                            </div>

                            {/* Divider + Price */}
                            <div className="mx-3 my-2" style={{ height: '1px', backgroundColor: isSelected ? 'rgba(255,255,255,0.12)' : `${currentTheme.foreground}08` }} />
                            <div className="px-3 pb-3">
                                <div className="text-lg font-extrabold" style={{ color: isSelected ? '#fff' : currentTheme.foreground }}>
                                    ${pkg.price_usd}
                                </div>
                                <div className="text-[9px] uppercase tracking-widest" style={{ color: isSelected ? 'rgba(255,255,255,0.4)' : `${currentTheme.foreground}30` }}>USD</div>
                            </div>

                            {/* Selected ring pulse */}
                            {isSelected && (
                                <div className="absolute inset-0 rounded-2xl pointer-events-none"
                                    style={{ boxShadow: `inset 0 0 0 1.5px rgba(251,191,36,0.6)` }} />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Checkout Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Payment Methods */}
                <div className="rounded-2xl p-5"
                    style={{ backgroundColor: `${currentTheme.foreground}04`, border: `1px solid ${currentTheme.foreground}08` }}>
                    <p className="text-xs uppercase tracking-widest font-bold mb-4" style={{ color: `${currentTheme.foreground}40` }}>
                        Payment Method
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {/* PayPal */}
                        <button type="button" onClick={() => setPaymentMethod('paypal')}
                            className="relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200"
                            style={{
                                background: paymentMethod === 'paypal'
                                    ? 'linear-gradient(145deg, rgba(37,99,235,0.12), rgba(59,130,246,0.06))'
                                    : `${currentTheme.foreground}03`,
                                border: `1.5px solid ${paymentMethod === 'paypal' ? '#3b82f6' : `${currentTheme.foreground}08`}`,
                                boxShadow: paymentMethod === 'paypal' ? '0 4px 16px rgba(59,130,246,0.2)' : 'none',
                            }}>
                            <img src="/images/paymentlogo/paypal.svg" alt="PayPal" className="h-7 object-contain" />
                            <span className="text-xs font-bold text-blue-400">PayPal</span>
                            <span className="text-[10px]" style={{ color: `${currentTheme.foreground}40` }}>Credit / Debit Card</span>
                            {paymentMethod === 'paypal' && (
                                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </button>

                        {/* OxaPay — coming soon */}
                        <div className="relative group">
                            <div className="flex flex-col items-center gap-2 p-4 rounded-xl opacity-35 cursor-not-allowed"
                                style={{ backgroundColor: `${currentTheme.foreground}03`, border: `1.5px solid ${currentTheme.foreground}08` }}>
                                <img src="/images/paymentlogo/oxapay.svg" alt="OxaPay" className="h-7 object-contain grayscale" />
                                <span className="text-xs font-bold text-gray-400">OxaPay</span>
                                <span className="text-[10px]" style={{ color: `${currentTheme.foreground}25` }}>Cryptocurrency</span>
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                                style={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.08)' }}>
                                ⏳ Coming soon
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#111827]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order summary + CTA */}
                <div className="rounded-2xl p-5 flex flex-col"
                    style={{
                        background: selectedPkg
                            ? 'linear-gradient(145deg, rgba(245,158,11,0.1) 0%, rgba(217,119,6,0.04) 100%)'
                            : `${currentTheme.foreground}04`,
                        border: `1.5px solid ${selectedPkg ? 'rgba(245,158,11,0.35)' : `${currentTheme.foreground}08`}`,
                        transition: 'all 0.3s ease',
                    }}>
                    <p className="text-xs uppercase tracking-widest font-bold mb-4" style={{ color: `${currentTheme.foreground}40` }}>
                        Order Summary
                    </p>

                    {selectedPkg ? (
                        <div className="flex-1 space-y-2.5 mb-5">
                            <div className="flex items-center justify-between">
                                <span className="text-sm" style={{ color: `${currentTheme.foreground}55` }}>Package</span>
                                <span className="text-sm font-semibold" style={{ color: currentTheme.foreground }}>{selectedPkg.name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm" style={{ color: `${currentTheme.foreground}55` }}>Coins</span>
                                <span className="text-sm font-bold text-amber-400">¢{selectedPkg.coin_amount.toLocaleString()}</span>
                            </div>
                            {selectedPkg.bonus_premium_days > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm" style={{ color: `${currentTheme.foreground}55` }}>Bonus</span>
                                    <span className="text-sm font-semibold" style={{ color: SHINY_PURPLE }}>+{selectedPkg.bonus_premium_days}d Premium</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between pt-3"
                                style={{ borderTop: `1px solid ${currentTheme.foreground}10` }}>
                                <span className="font-bold" style={{ color: currentTheme.foreground }}>Total</span>
                                <span className="text-2xl font-extrabold" style={{ color: currentTheme.foreground }}>${selectedPkg.price_usd} <span className="text-xs font-normal opacity-50">USD</span></span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-5 mb-5 gap-2">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1.5px dashed rgba(245,158,11,0.25)' }}>
                                <span className="text-xl font-black text-amber-400/40" style={{ fontFamily: 'serif' }}>¢</span>
                            </div>
                            <p className="text-sm text-center" style={{ color: `${currentTheme.foreground}35` }}>
                                Select a package to continue
                            </p>
                        </div>
                    )}

                    <button type="button" onClick={handlePurchase} disabled={isProcessing || !selectedPackage}
                        className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300"
                        style={{
                            background: selectedPackage
                                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                : `${currentTheme.foreground}08`,
                            color: selectedPackage ? '#fff' : `${currentTheme.foreground}30`,
                            boxShadow: selectedPackage && !isProcessing ? '0 6px 20px rgba(245,158,11,0.4)' : 'none',
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
                        <p className="mt-2.5 text-center text-[11px] flex items-center justify-center gap-1" style={{ color: `${currentTheme.foreground}30` }}>
                            <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Secure payment · SSL encrypted
                        </p>
                    )}
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
        e.preventDefault(); e.stopPropagation();
        if (!selectedPackage) { setErrorMessage('Please choose a membership package.'); return; }
        setShowConfirmModal(true);
    };

    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) { toast.warning('Please enter a voucher code.'); return; }
        if (!selectedPackage) { toast.warning('Please select a membership package first.'); return; }
        const pkg = packages.find(p => p.id === selectedPackage);
        if (!pkg) return;

        setIsApplyingVoucher(true); setVoucherError(null);
        try {
            const response = await fetch(route('voucher.validate'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ code: voucherCode.toUpperCase(), type: 'membership', amount: pkg.coin_price }),
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
        router.post(route('membership.purchase'), {
            package_id: selectedPackage,
            voucher_code: voucherData ? voucherCode.toUpperCase() : null,
        }, {
            preserveScroll: true,
            onStart: () => setIsProcessing(true),
            onError: (formErrors) => {
                const message = extractMessage(formErrors.membership) || extractMessage(formErrors.error) || extractMessage(Object.values(formErrors)[0]) || 'Purchase failed. Please try again.';
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
            {/* Confirm Modal */}
            {showConfirmModal && selectedPkg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }} onClick={() => setShowConfirmModal(false)}>
                    <div className="rounded-3xl p-7 max-w-sm w-full text-center shadow-2xl overflow-hidden backdrop-blur-xl"
                        style={{ backgroundColor: currentTheme.background, border: `2px solid ${SHINY_PURPLE}`, boxShadow: `0 0 60px ${SHINY_PURPLE}50` }}
                        onClick={(e) => e.stopPropagation()}>
                        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4"
                            style={{ background: `radial-gradient(circle, ${SHINY_PURPLE}30, ${SHINY_PURPLE}10)`, boxShadow: `0 0 24px ${SHINY_PURPLE}40` }}>
                            <PremiumDiamond size={28} />
                        </div>
                        <h2 className="text-lg font-extrabold mb-1" style={{ color: currentTheme.foreground }}>Confirm Purchase</h2>
                        <p className="text-sm mb-4" style={{ color: `${currentTheme.foreground}60` }}>
                            <span className="font-bold" style={{ color: SHINY_PURPLE }}>{selectedPkg.name}</span> — {selectedPkg.duration_days} days
                        </p>
                        <div className="rounded-xl p-4 mb-4 text-left space-y-2 text-sm" style={{ backgroundColor: `${currentTheme.foreground}06` }}>
                            {voucherData ? (
                                <>
                                    <div className="flex justify-between"><span style={{ color: `${currentTheme.foreground}50` }}>Original</span><span className="line-through opacity-40" style={{ color: currentTheme.foreground }}>¢{selectedPkg.coin_price.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span className="text-emerald-400">Voucher ({voucherCode})</span><span className="text-emerald-400">−¢{voucherData.discount_amount.toLocaleString()}</span></div>
                                    <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${currentTheme.foreground}10` }}><span className="font-bold" style={{ color: currentTheme.foreground }}>Total</span><span className="text-xl font-extrabold text-amber-400">¢{voucherData.final_amount.toLocaleString()}</span></div>
                                </>
                            ) : (
                                <div className="flex justify-between"><span style={{ color: `${currentTheme.foreground}50` }}>Total Cost</span><span className="text-xl font-extrabold text-amber-400">¢{selectedPkg.coin_price.toLocaleString()}</span></div>
                            )}
                        </div>
                        <p className="text-xs mb-5" style={{ color: `${currentTheme.foreground}40` }}>
                            After purchase: <span className="font-bold text-amber-400">¢{(userCoins - finalCost).toLocaleString()}</span> remaining
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-70" style={{ border: `1px solid ${currentTheme.foreground}15`, color: `${currentTheme.foreground}60` }}>Cancel</button>
                            <button onClick={handleConfirmPurchase} disabled={isProcessing} className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all hover:brightness-110 disabled:opacity-50" style={{ backgroundColor: SHINY_PURPLE, color: '#fff' }}>
                                {isProcessing ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }} onClick={() => setShowSuccess(false)}>
                    <div className="rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl backdrop-blur-xl"
                        style={{ backgroundColor: currentTheme.background, border: `2px solid ${SHINY_PURPLE}`, boxShadow: `0 0 60px ${SHINY_PURPLE}50` }}
                        onClick={(e) => e.stopPropagation()}>
                        <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: `${SHINY_PURPLE}20`, boxShadow: `0 0 30px ${SHINY_PURPLE}50` }}>
                            <PremiumDiamond size={36} />
                        </div>
                        <h2 className="text-2xl font-extrabold mb-2" style={{ color: SHINY_PURPLE }}>Congratulations!</h2>
                        {premiumGranted ? (
                            <>
                                <p className="text-base mb-1" style={{ color: currentTheme.foreground }}><span className="font-bold" style={{ color: SHINY_PURPLE }}>{premiumGranted.days} {premiumGranted.days === 1 ? 'Day' : 'Days'}</span> of Premium</p>
                                <p className="font-semibold mb-3" style={{ color: SHINY_PURPLE }}>Has Been Added!</p>
                                <div className="inline-block px-4 py-1.5 rounded-xl mb-3" style={{ backgroundColor: `${SHINY_PURPLE}15`, border: `1px solid ${SHINY_PURPLE}35` }}>
                                    <p className="text-sm font-semibold" style={{ color: SHINY_PURPLE }}>{premiumGranted.package_name}</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-base mb-1" style={{ color: currentTheme.foreground }}>Your Premium Membership</p>
                                <p className="font-semibold mb-3" style={{ color: SHINY_PURPLE }}>Has Been Activated!</p>
                            </>
                        )}
                        <p className="text-xs mb-6" style={{ color: `${currentTheme.foreground}50` }}>Enjoy unlimited access to all premium chapters and an ad-free experience.</p>
                        <button onClick={() => setShowSuccess(false)} className="w-full py-2.5 rounded-xl font-bold transition-all hover:brightness-110" style={{ backgroundColor: SHINY_PURPLE, color: '#fff' }}>Start Reading ✦</button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {errorMessage && (
                    <div className="rounded-xl px-4 py-3 flex items-center gap-3 mb-6" style={{ border: '1px solid #ef444440', backgroundColor: 'rgba(239,68,68,0.08)' }}>
                        <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                        <p className="flex-1 text-sm text-red-400">{errorMessage}</p>
                        <button type="button" onClick={() => setErrorMessage(null)} className="text-red-400 opacity-50 hover:opacity-100"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                    </div>
                )}

                {/* Two-column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] gap-6 items-start">

                    {/* ── Left: Package Cards ── */}
                    <div>
                        <p className="text-xs uppercase tracking-widest font-bold mb-4" style={{ color: `${currentTheme.foreground}40` }}>
                            Choose Your Plan
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {packages.map((pkg) => {
                                const coinPrice = pkg.coin_price;
                                const originalCoinPrice = pkg.discount_percentage > 0 ? getOriginalCoinPrice(coinPrice, pkg.discount_percentage) : 0;
                                const isSelected = selectedPackage === pkg.id;
                                const isBestValue = pkg.duration_days === 365;
                                const canAfford = userCoins >= coinPrice;

                                return (
                                    <button key={pkg.id} type="button" onClick={() => setSelectedPackage(isSelected ? null : pkg.id)}
                                        className="relative p-5 rounded-2xl text-left transition-all duration-300 overflow-hidden group"
                                        style={{
                                            background: isSelected
                                                ? `linear-gradient(145deg, ${SHINY_PURPLE}18 0%, ${SHINY_PURPLE}08 100%)`
                                                : `${currentTheme.foreground}03`,
                                            border: `1.5px solid ${isSelected ? SHINY_PURPLE : `${currentTheme.foreground}08`}`,
                                            boxShadow: isSelected ? `0 8px 28px ${SHINY_PURPLE}25` : '0 2px 8px rgba(0,0,0,0.04)',
                                            transform: isSelected ? 'translateY(-2px)' : undefined,
                                            opacity: canAfford ? 1 : 0.45,
                                        }}>

                                        {/* Shine */}
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                            style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.04) 0%, transparent 70%)' }} />

                                        {/* Badges */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {isBestValue && (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide" style={{ background: `linear-gradient(90deg, ${SHINY_PURPLE}, #7c3aed)`, color: '#fff' }}>
                                                        ✦ BEST VALUE
                                                    </span>
                                                )}
                                                {!canAfford && (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20">
                                                        NEED MORE COINS
                                                    </span>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: SHINY_PURPLE }}>
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="font-extrabold text-base mb-1" style={{ color: currentTheme.foreground }}>{pkg.name}</h3>
                                        <p className="text-xs mb-3" style={{ color: `${currentTheme.foreground}45` }}>{pkg.duration_days} days of unlimited access</p>

                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-extrabold text-amber-400">¢{coinPrice.toLocaleString()}</span>
                                            {originalCoinPrice > 0 && (
                                                <span className="text-sm line-through mb-1" style={{ color: `${currentTheme.foreground}30` }}>¢{originalCoinPrice.toLocaleString()}</span>
                                            )}
                                        </div>

                                        {pkg.discount_percentage > 0 && (
                                            <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                                                style={{ backgroundColor: `${SHINY_PURPLE}12`, color: SHINY_PURPLE, border: `1px solid ${SHINY_PURPLE}20` }}>
                                                Save {pkg.discount_percentage}%
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
                        <div className="rounded-2xl overflow-hidden"
                            style={{ border: `1px solid ${SHINY_PURPLE}20` }}>
                            <div className="px-5 py-3 flex items-center gap-2"
                                style={{ background: `linear-gradient(90deg, ${SHINY_PURPLE}18, ${SHINY_PURPLE}08)` }}>
                                <PremiumDiamond size={14} />
                                <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: SHINY_PURPLE }}>What You'll Get</span>
                            </div>
                            <div className="px-5 py-4" style={{ backgroundColor: `${currentTheme.foreground}03` }}>
                                <ul className="space-y-2.5">
                                    {[
                                        { icon: '📖', text: 'Unlock all premium chapters' },
                                        { icon: '🚫', text: 'Completely ad-free reading' },
                                        { icon: '⚡', text: 'Priority access to new releases' },
                                    ].map(({ icon, text }) => (
                                        <li key={text} className="flex items-center gap-3 text-sm" style={{ color: currentTheme.foreground }}>
                                            <span className="text-base">{icon}</span>
                                            <span>{text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Coin Balance */}
                        <div className="rounded-2xl p-4 flex items-center justify-between"
                            style={{ backgroundColor: `${currentTheme.foreground}04`, border: `1px solid ${currentTheme.foreground}08` }}>
                            <div>
                                <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: `${currentTheme.foreground}40` }}>Your Balance</p>
                                <p className="text-2xl font-extrabold text-amber-400">¢{userCoins.toLocaleString()}</p>
                            </div>
                            {selectedPkg && !canAffordSelected && (
                                <div className="text-right">
                                    <p className="text-xs text-red-400 mb-2">Need ¢{(finalCost - userCoins).toLocaleString()} more</p>
                                    <a href="/shop?tab=coins" className="inline-block px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:brightness-110"
                                        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                                        Buy Coins
                                    </a>
                                </div>
                            )}
                            {selectedPkg && canAffordSelected && (
                                <div className="text-right">
                                    <p className="text-[10px] uppercase tracking-widest font-medium mb-0.5" style={{ color: `${currentTheme.foreground}35` }}>After purchase</p>
                                    <p className="text-lg font-bold" style={{ color: `${currentTheme.foreground}60` }}>¢{(userCoins - finalCost).toLocaleString()}</p>
                                </div>
                            )}
                        </div>

                        {/* Voucher */}
                        <div className="rounded-2xl p-4" style={{ backgroundColor: `${currentTheme.foreground}04`, border: `1px solid ${currentTheme.foreground}08` }}>
                            <p className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: `${currentTheme.foreground}40` }}>Have a Voucher?</p>
                            {!voucherData ? (
                                <>
                                    <div className="flex gap-2">
                                        <input type="text" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                            placeholder={selectedPackage ? 'Enter code…' : 'Select a plan first'}
                                            disabled={!selectedPackage || isApplyingVoucher}
                                            className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none uppercase disabled:cursor-not-allowed"
                                            style={{
                                                border: `1px solid ${voucherError ? '#ef4444' : `${currentTheme.foreground}12`}`,
                                                backgroundColor: `${currentTheme.foreground}05`,
                                                color: currentTheme.foreground,
                                                opacity: selectedPackage ? 1 : 0.45,
                                            }} />
                                        <button type="button" onClick={handleApplyVoucher} disabled={!voucherCode.trim() || isApplyingVoucher || !selectedPackage}
                                            className="px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                                            style={{ backgroundColor: SHINY_PURPLE, color: '#fff' }}>
                                            {isApplyingVoucher ? '…' : 'Apply'}
                                        </button>
                                    </div>
                                    {voucherError && <p className="mt-1.5 text-xs text-red-400">{voucherError}</p>}
                                </>
                            ) : (
                                <div className="flex items-center justify-between px-3 py-2 rounded-xl"
                                    style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                    <div>
                                        <p className="text-xs font-extrabold text-emerald-400">{voucherCode}</p>
                                        <p className="text-[10px] text-emerald-400 opacity-70">−{voucherData.discount_type === 'percent' ? `${voucherData.discount_value}%` : `¢${voucherData.discount_value}`} applied</p>
                                    </div>
                                    <button type="button" onClick={handleRemoveVoucher} className="text-xs font-bold text-red-400 hover:opacity-70 transition-opacity">Remove</button>
                                </div>
                            )}
                        </div>

                        {/* Buy Button */}
                        <button type="submit" disabled={!selectedPackage || !canAffordSelected || isProcessing}
                            className="w-full py-4 rounded-2xl font-extrabold text-base transition-all duration-300"
                            style={{
                                backgroundColor: SHINY_PURPLE,
                                color: '#fff',
                                boxShadow: selectedPackage && canAffordSelected ? `0 8px 28px ${SHINY_PURPLE}45` : 'none',
                                opacity: (!selectedPackage || !canAffordSelected || isProcessing) ? 0.4 : 1,
                                cursor: (!selectedPackage || !canAffordSelected || isProcessing) ? 'not-allowed' : 'pointer',
                            }}>
                            {isProcessing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    Processing…
                                </span>
                            ) : !selectedPackage ? 'Select a Plan to Continue'
                              : !canAffordSelected ? `Need ¢${(finalCost - userCoins).toLocaleString()} More`
                              : `Buy with ¢${finalCost.toLocaleString()} Coins ✦`}
                        </button>
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
