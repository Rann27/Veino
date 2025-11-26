import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme, SHINY_PURPLE } from '@/Contexts/ThemeContext';

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
    packages: MembershipPackage[];
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

const PAYMENT_METHODS = [
    { id: 'paypal', name: 'PayPal', logo: '/images/paymentlogo/paypal.svg' },
    { id: 'cryptomus', name: 'Crypto (USDT)', logo: '/images/paymentlogo/cryptomus.svg' },
];

const getOriginalPrice = (price: number, discount: number): string => {
    if (discount === 0) return '';
    return (price / (1 - discount / 100)).toFixed(2);
};

const getOriginalCoinPrice = (coinPrice: number, discount: number): number => {
    if (discount === 0) return 0;
    return Math.round(coinPrice / (1 - discount / 100));
};

function MembershipContent({ packages, flash, errors }: Props) {
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

    const page = usePage<{ 
        auth: { user: { coins: number } }; 
        flash?: { success?: string; error?: string; premium_granted?: { days: number; package_name: string; source: string } }; 
        errors?: Record<string, string | string[]> 
    }>();

    const extractMessage = (value: unknown): string | undefined => {
        if (!value) {
            return undefined;
        }

        if (Array.isArray(value)) {
            const candidate = value.find((entry) => typeof entry === 'string');
            return candidate as string | undefined;
        }

        return typeof value === 'string' ? value : undefined;
    };

    // Check for premium_granted flash message
    React.useEffect(() => {
        if (flash?.premium_granted) {
            setPremiumGranted(flash.premium_granted);
            setShowSuccess(true);
        }
    }, [flash?.premium_granted]);

    // Check for success parameter in URL
    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
            setShowSuccess(true);
            // Remove query param
            window.history.replaceState({}, '', '/membership');
        }
    }, []);

    // Sync flash errors coming from the server
    React.useEffect(() => {
        if (flash?.error) {
            setErrorMessage(flash.error);
        }
    }, [flash?.error]);

    // Sync validation or custom errors returned by Inertia
    React.useEffect(() => {
        const pageErrors = errors ?? page.props.errors;
        if (pageErrors && Object.keys(pageErrors).length > 0) {
            const potentialMessage =
                extractMessage(pageErrors.membership) ??
                extractMessage(pageErrors.error) ??
                extractMessage(Object.values(pageErrors)[0]);

            if (potentialMessage) {
                setErrorMessage(potentialMessage);
            }
        }
    }, [errors, page.props.errors, flash?.error]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!selectedPackage) {
            setErrorMessage('Please choose a membership package.');
            return;
        }

        // Show confirmation modal instead of direct submit
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
            setVoucherError('Failed to apply voucher. Please try again.');
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
            onStart: () => {
                setIsProcessing(true);
            },
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
            onFinish: () => {
                setIsProcessing(false);
            },
        });
    };

    const selectedPkg = packages.find(p => p.id === selectedPackage);

    return (
        <UserLayout>
            <MembershipInner 
                packages={packages}
                flash={flash}
                selectedPackage={selectedPackage}
                setSelectedPackage={setSelectedPackage}
                isProcessing={isProcessing}
                showSuccess={showSuccess}
                setShowSuccess={setShowSuccess}
                showConfirmModal={showConfirmModal}
                setShowConfirmModal={setShowConfirmModal}
                handleSubmit={handleSubmit}
                handleConfirmPurchase={handleConfirmPurchase}
                selectedPkg={selectedPkg}
                errorMessage={errorMessage}
                dismissError={() => setErrorMessage(null)}
                userCoins={page.props.auth.user.coins}
                premiumGranted={premiumGranted}
                voucherCode={voucherCode}
                setVoucherCode={setVoucherCode}
                voucherData={voucherData}
                voucherError={voucherError}
                handleApplyVoucher={handleApplyVoucher}
                handleRemoveVoucher={handleRemoveVoucher}
                isApplyingVoucher={isApplyingVoucher}
            />
        </UserLayout>
    );
}

function MembershipInner({ 
    packages, 
    flash, 
    selectedPackage,
    setSelectedPackage,
    isProcessing,
    showSuccess,
    setShowSuccess,
    showConfirmModal,
    setShowConfirmModal,
    handleSubmit,
    handleConfirmPurchase,
    selectedPkg,
    errorMessage,
    dismissError,
    userCoins,
    premiumGranted,
    voucherCode,
    setVoucherCode,
    voucherData,
    voucherError,
    handleApplyVoucher,
    handleRemoveVoucher,
    isApplyingVoucher
}: any) {
    const { currentTheme } = useTheme();

    return (
        <>
            <Head title="Premium Membership" />
            
            <div 
                className="min-h-screen py-12 px-4 sm:px-6 lg:px-8"
                style={{ backgroundColor: currentTheme.background }}
            >
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 
                            className="text-4xl font-bold mb-4"
                            style={{ color: currentTheme.foreground }}
                        >
                            Premium Membership
                        </h1>
                        <p 
                            className="text-lg opacity-70"
                            style={{ color: currentTheme.foreground }}
                        >
                            Unlock unlimited reading experience
                        </p>
                    </div>

                    {/* Confirmation Modal */}
                    {showConfirmModal && selectedPkg && (
                        <div 
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
                            onClick={() => setShowConfirmModal(false)}
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
                                            <text x="12" y="18" fontSize="24" fontWeight="bold" fill={SHINY_PURPLE} textAnchor="middle">¢</text>
                                        </svg>
                                    </div>
                                    <h2 
                                        className="text-2xl font-bold mb-3"
                                        style={{ color: SHINY_PURPLE }}
                                    >
                                        Confirm Purchase
                                    </h2>
                                    <p 
                                        className="text-lg mb-4"
                                        style={{ color: currentTheme.foreground }}
                                    >
                                        Are you sure you want to purchase <span className="font-semibold" style={{ color: SHINY_PURPLE }}>{selectedPkg.name}</span> membership?
                                    </p>
                                    
                                    {/* Package Details */}
                                    <div 
                                        className="rounded-lg p-4 mb-4 text-left"
                                        style={{ 
                                            backgroundColor: `${currentTheme.foreground}10`,
                                            borderColor: `${currentTheme.foreground}20`
                                        }}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span style={{ color: currentTheme.foreground }} className="opacity-70">Duration:</span>
                                            <span style={{ color: currentTheme.foreground }} className="font-semibold">{selectedPkg.duration_days} days</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span style={{ color: currentTheme.foreground }} className="opacity-70">Cost:</span>
                                            <span style={{ color: '#f59e0b' }} className="font-bold text-xl">¢{selectedPkg.coin_price.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <p 
                                        className="text-sm opacity-70 mb-2"
                                        style={{ color: currentTheme.foreground }}
                                    >
                                        Your current balance: <span className="font-semibold" style={{ color: '#f59e0b' }}>¢{userCoins.toLocaleString()}</span>
                                    </p>
                                    {userCoins >= selectedPkg.coin_price && (
                                        <p 
                                            className="text-sm opacity-70"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            After purchase: <span className="font-semibold" style={{ color: '#f59e0b' }}>¢{(userCoins - selectedPkg.coin_price).toLocaleString()}</span>
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowConfirmModal(false)}
                                        className="flex-1 py-3 rounded-lg font-semibold transition-all border-2"
                                        style={{
                                            borderColor: `${currentTheme.foreground}40`,
                                            color: currentTheme.foreground
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleConfirmPurchase}
                                        disabled={isProcessing}
                                        className="flex-1 py-3 rounded-lg font-semibold transition-all"
                                        style={{
                                            backgroundColor: SHINY_PURPLE,
                                            color: '#fff',
                                            opacity: isProcessing ? 0.5 : 1
                                        }}
                                    >
                                        {isProcessing ? 'Processing...' : 'Confirm Purchase'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Success Popup */}
                    {showSuccess && (
                        <div 
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
                            onClick={() => setShowSuccess(false)}
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
                                                <linearGradient id="successDiamond" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" style={{ stopColor: '#c084fc' }} />
                                                    <stop offset="50%" style={{ stopColor: '#e879f9' }} />
                                                    <stop offset="100%" style={{ stopColor: '#a78bfa' }} />
                                                </linearGradient>
                                            </defs>
                                            <path d="M12 2L3 9L12 22L21 9L12 2Z" fill="url(#successDiamond)" />
                                        </svg>
                                    </div>
                                    <h2 
                                        className="text-3xl font-bold mb-3"
                                        style={{ color: SHINY_PURPLE }}
                                    >
                                        Congratulations!
                                    </h2>
                                    
                                    {premiumGranted ? (
                                        <>
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
                                        </>
                                    ) : (
                                        <>
                                            <p 
                                                className="text-lg mb-2"
                                                style={{ color: currentTheme.foreground }}
                                            >
                                                Your Premium Membership
                                            </p>
                                            <p 
                                                className="text-xl font-semibold mb-4"
                                                style={{ color: SHINY_PURPLE }}
                                            >
                                                Has Been Activated!
                                            </p>
                                        </>
                                    )}
                                    
                                    <p 
                                        className="text-sm opacity-70"
                                        style={{ color: currentTheme.foreground }}
                                    >
                                        Enjoy unlimited access to all premium chapters and an ad-free reading experience.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowSuccess(false)}
                                    className="w-full py-3 rounded-lg font-semibold transition-all"
                                    style={{ 
                                        backgroundColor: SHINY_PURPLE,
                                        color: '#fff'
                                    }}
                                >
                                    Start Reading
                                </button>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {errorMessage && (
                            <div 
                                className="rounded-xl border px-4 py-3 flex items-start gap-3"
                                style={{
                                    borderColor: '#ef4444',
                                    backgroundColor: 'rgba(239, 68, 68, 0.12)'
                                }}
                            >
                                <svg className="w-5 h-5 mt-0.5" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" fill="none" />
                                    <path d="M12 7v6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                                    <circle cx="12" cy="16.5" r="1" fill="#ef4444" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-sm" style={{ color: '#ef4444' }}>
                                        {errorMessage}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={dismissError}
                                    className="text-sm font-semibold"
                                    style={{ color: '#ef4444' }}
                                >
                                    Close
                                </button>
                            </div>
                        )}
                        {/* Step 1: Choose Package */}
                        <div 
                            className="rounded-xl p-6 border"
                            style={{ 
                                backgroundColor: `${currentTheme.foreground}05`,
                                borderColor: `${currentTheme.foreground}20`
                            }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
                                    style={{ 
                                        backgroundColor: SHINY_PURPLE,
                                        color: '#fff'
                                    }}
                                >
                                    1
                                </div>
                                <h2 
                                    className="text-xl font-semibold"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    Choose Your Package
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {packages.map((pkg: MembershipPackage) => {
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
                                            className="relative p-5 rounded-lg border-2 transition-all text-left"
                                            style={{
                                                backgroundColor: isSelected 
                                                    ? `${SHINY_PURPLE}15` 
                                                    : `${currentTheme.foreground}03`,
                                                borderColor: isSelected 
                                                    ? SHINY_PURPLE 
                                                    : `${currentTheme.foreground}20`,
                                                boxShadow: isSelected 
                                                    ? `0 0 20px ${SHINY_PURPLE}40` 
                                                    : 'none',
                                                opacity: canAfford ? 1 : 0.6
                                            }}
                                        >
                                            {isBestValue && (
                                                <div 
                                                    className="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-bold"
                                                    style={{ 
                                                        backgroundColor: SHINY_PURPLE,
                                                        color: '#fff'
                                                    }}
                                                >
                                                    BEST VALUE
                                                </div>
                                            )}
                                            
                                            {!canAfford && (
                                                <div 
                                                    className="absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-bold"
                                                    style={{ 
                                                        backgroundColor: '#ef4444',
                                                        color: '#fff'
                                                    }}
                                                >
                                                    INSUFFICIENT COINS
                                                </div>
                                            )}
                                            
                                            <div className="mb-3">
                                                <h3 
                                                    className="font-semibold text-lg"
                                                    style={{ color: currentTheme.foreground }}
                                                >
                                                    {pkg.name}
                                                </h3>
                                            </div>
                                            
                                            <div className="flex items-baseline gap-2 mb-3">
                                                {originalCoinPrice > 0 && (
                                                    <span 
                                                        className="text-sm line-through opacity-50"
                                                        style={{ color: currentTheme.foreground }}
                                                    >
                                                        ¢{originalCoinPrice.toLocaleString()}
                                                    </span>
                                                )}
                                                <span 
                                                    className="text-2xl font-bold"
                                                    style={{ color: '#f59e0b' }}
                                                >
                                                    ¢{coinPrice.toLocaleString()}
                                                </span>
                                            </div>

                                            {pkg.discount_percentage > 0 && (
                                                <div 
                                                    className="inline-block px-2 py-1 rounded text-xs font-semibold mb-3"
                                                    style={{ 
                                                        backgroundColor: `${SHINY_PURPLE}20`,
                                                        color: SHINY_PURPLE
                                                    }}
                                                >
                                                    Save {pkg.discount_percentage}%
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Benefits */}
                            {selectedPkg && (
                                <div 
                                    className="mt-6 p-4 rounded-lg"
                                    style={{ backgroundColor: `${SHINY_PURPLE}10` }}
                                >
                                    <h4 
                                        className="font-semibold mb-3 flex items-center gap-2"
                                        style={{ color: SHINY_PURPLE }}
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        What You'll Get:
                                    </h4>
                                    <ul className="space-y-2">
                                        <li 
                                            className="flex items-center gap-2"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            <svg className="w-5 h-5 flex-shrink-0" style={{ color: SHINY_PURPLE }} fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span>Unlock all premium chapters instantly</span>
                                        </li>
                                        <li 
                                            className="flex items-center gap-2"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            <svg className="w-5 h-5 flex-shrink-0" style={{ color: SHINY_PURPLE }} fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span>Enjoy completely ad-free reading experience</span>
                                        </li>
                                        <li 
                                            className="flex items-center gap-2"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            <svg className="w-5 h-5 flex-shrink-0" style={{ color: SHINY_PURPLE }} fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span>Premium badge & exclusive member perks</span>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Coin Balance Info */}
                        <div 
                            className="rounded-xl p-6 border"
                            style={{ 
                                backgroundColor: `${currentTheme.foreground}05`,
                                borderColor: `${currentTheme.foreground}20`
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 
                                        className="text-sm opacity-70 mb-1"
                                        style={{ color: currentTheme.foreground }}
                                    >
                                        Your Coin Balance
                                    </h3>
                                    <p 
                                        className="text-3xl font-bold"
                                        style={{ color: '#f59e0b' }}
                                    >
                                        ¢{userCoins.toLocaleString()}
                                    </p>
                                </div>
                                {selectedPkg && userCoins < selectedPkg.coin_price && (
                                    <div>
                                        <p 
                                            className="text-sm mb-2"
                                            style={{ color: '#ef4444' }}
                                        >
                                            Need ¢{(selectedPkg.coin_price - userCoins).toLocaleString()} more
                                        </p>
                                        <a
                                            href="/buy-coins"
                                            className="inline-block px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                                            style={{
                                                backgroundColor: '#f59e0b',
                                                color: '#fff'
                                            }}
                                        >
                                            Buy Coins
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Voucher Section */}
                        {selectedPkg && (
                            <div 
                                className="rounded-xl p-6 border"
                                style={{ 
                                    backgroundColor: `${currentTheme.foreground}05`,
                                    borderColor: `${currentTheme.foreground}20`
                                }}
                            >
                                <h3 
                                    className="text-sm font-semibold mb-3"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    Have a Voucher Code?
                                </h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={voucherCode}
                                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                        placeholder="Enter voucher code"
                                        disabled={!!voucherData || isApplyingVoucher}
                                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 uppercase"
                                        style={{
                                            borderColor: voucherError ? '#ef4444' : `${currentTheme.foreground}30`,
                                            backgroundColor: currentTheme.background,
                                            color: currentTheme.foreground,
                                        }}
                                    />
                                    {!voucherData ? (
                                        <button
                                            type="button"
                                            onClick={handleApplyVoucher}
                                            disabled={!voucherCode.trim() || isApplyingVoucher}
                                            className="px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{
                                                backgroundColor: SHINY_PURPLE,
                                                color: '#fff'
                                            }}
                                        >
                                            {isApplyingVoucher ? 'Applying...' : 'Apply'}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleRemoveVoucher}
                                            className="px-6 py-2 rounded-lg font-semibold transition-all"
                                            style={{
                                                backgroundColor: '#ef4444',
                                                color: '#fff'
                                            }}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                {voucherError && (
                                    <p className="mt-2 text-sm" style={{ color: '#ef4444' }}>
                                        {voucherError}
                                    </p>
                                )}
                                {voucherData && (
                                    <div 
                                        className="mt-3 p-3 rounded-lg"
                                        style={{ backgroundColor: '#10b98120', borderLeft: `4px solid #10b981` }}
                                    >
                                        <p className="text-sm font-semibold" style={{ color: '#10b981' }}>
                                            ✓ Voucher Applied: {voucherData.discount_type === 'percent' 
                                                ? `${voucherData.discount_value}% off` 
                                                : `¢${voucherData.discount_value} off`}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Buy Button */}
                        <button
                            type="submit"
                            disabled={!selectedPackage || (selectedPkg && userCoins < selectedPkg.coin_price) || isProcessing}
                            className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: SHINY_PURPLE,
                                color: '#fff',
                                boxShadow: selectedPackage && selectedPkg && userCoins >= selectedPkg.coin_price
                                    ? `0 0 30px ${SHINY_PURPLE}60` 
                                    : 'none'
                            }}
                        >
                            {isProcessing ? 'Processing...' : 
                             !selectedPackage ? 'Select a Package' :
                             selectedPkg && userCoins < selectedPkg.coin_price ? 'Insufficient Coins' :
                             'Buy with Coins'}
                        </button>

                        {selectedPkg && (
                            <div 
                                className="text-center p-4 rounded-lg"
                                style={{ backgroundColor: `${currentTheme.foreground}05` }}
                            >
                                <p 
                                    className="text-sm opacity-70"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    Total: <span className="font-bold text-xl" style={{ color: '#f59e0b' }}>
                                        ¢{voucherData ? voucherData.final_amount.toLocaleString() : selectedPkg.coin_price.toLocaleString()}
                                    </span>
                                    {voucherData && (
                                        <span className="text-xs ml-2" style={{ color: '#10b981' }}>
                                            ({voucherData.discount_type === 'percent' 
                                                ? `${voucherData.discount_value}%` 
                                                : `¢${voucherData.discount_value}`} off with voucher applied)
                                        </span>
                                    )}
                                </p>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </>
    );
}

export default function Membership(props: Props) {
    return <MembershipContent {...props} />;
}
