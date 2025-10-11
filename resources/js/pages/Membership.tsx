import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme, SHINY_PURPLE } from '@/Contexts/ThemeContext';

interface MembershipPackage {
    id: number;
    name: string;
    tier: string;
    price_usd: string;
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

function MembershipContent({ packages, flash, errors }: Props) {
    const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(flash?.error ?? null);

    const page = usePage<{ flash?: { success?: string; error?: string }; errors?: Record<string, string | string[]> }>();

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
        
        if (!selectedPackage || !selectedPayment) {
            setErrorMessage('Please choose a membership package and select a payment method.');
            return;
        }

        setErrorMessage(null);
        router.post(route('membership.purchase'), {
            package_id: selectedPackage,
            payment_method: selectedPayment,
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
                    'We could not start the payment. Please try again.';

                setErrorMessage(message);
            },
            onSuccess: () => {
                setErrorMessage(null);
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
                selectedPayment={selectedPayment}
                setSelectedPayment={setSelectedPayment}
                isProcessing={isProcessing}
                showSuccess={showSuccess}
                setShowSuccess={setShowSuccess}
                handleSubmit={handleSubmit}
                selectedPkg={selectedPkg}
                errorMessage={errorMessage}
                dismissError={() => setErrorMessage(null)}
            />
        </UserLayout>
    );
}

function MembershipInner({ 
    packages, 
    flash, 
    selectedPackage,
    setSelectedPackage,
    selectedPayment,
    setSelectedPayment,
    isProcessing,
    showSuccess,
    setShowSuccess,
    handleSubmit,
    selectedPkg,
    errorMessage,
    dismissError
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
                                    // Use gimmick_price if available, otherwise calculate from discount
                                    const gimmickPrice = pkg.gimmick_price ? parseFloat(pkg.gimmick_price) : null;
                                    const realPrice = parseFloat(pkg.price_usd);
                                    const originalPrice = gimmickPrice && gimmickPrice > realPrice 
                                        ? gimmickPrice.toFixed(2) 
                                        : (pkg.discount_percentage > 0 ? getOriginalPrice(realPrice, pkg.discount_percentage) : null);
                                    
                                    const isSelected = selectedPackage === pkg.id;
                                    const isBestValue = pkg.duration_days === 365;

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
                                                    : 'none'
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
                                            
                                            <div className="mb-3">
                                                <h3 
                                                    className="font-semibold text-lg"
                                                    style={{ color: currentTheme.foreground }}
                                                >
                                                    {pkg.name}
                                                </h3>
                                            </div>
                                            
                                            <div className="flex items-baseline gap-2 mb-3">
                                                {originalPrice && (
                                                    <span 
                                                        className="text-sm line-through opacity-50"
                                                        style={{ color: currentTheme.foreground }}
                                                    >
                                                        ${originalPrice}
                                                    </span>
                                                )}
                                                <span 
                                                    className="text-2xl font-bold"
                                                    style={{ color: SHINY_PURPLE }}
                                                >
                                                    ${pkg.price_usd}
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

                        {/* Step 2: Payment Method */}
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
                                    2
                                </div>
                                <h2 
                                    className="text-xl font-semibold"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    Select Payment Method
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {PAYMENT_METHODS.map((method) => {
                                    const isSelected = selectedPayment === method.id;
                                    return (
                                        <button
                                            key={method.id}
                                            type="button"
                                            onClick={() => setSelectedPayment(method.id)}
                                            className="p-4 rounded-lg border-2 transition-all flex items-center gap-4"
                                            style={{
                                                backgroundColor: isSelected 
                                                    ? `${SHINY_PURPLE}15` 
                                                    : `${currentTheme.foreground}03`,
                                                borderColor: isSelected 
                                                    ? SHINY_PURPLE 
                                                    : `${currentTheme.foreground}20`,
                                            }}
                                        >
                                            <div className="flex-shrink-0">
                                                <img 
                                                    src={method.logo} 
                                                    alt={method.name}
                                                    className="w-12 h-12 object-contain"
                                                    style={{ filter: currentTheme.name === 'dark' ? 'invert(1)' : 'none' }}
                                                />
                                            </div>
                                            <div 
                                                className="text-left font-medium"
                                                style={{ color: currentTheme.foreground }}
                                            >
                                                {method.name}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Buy Button */}
                        <button
                            type="submit"
                            disabled={!selectedPackage || !selectedPayment || isProcessing}
                            className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: SHINY_PURPLE,
                                color: '#fff',
                                boxShadow: selectedPackage && selectedPayment 
                                    ? `0 0 30px ${SHINY_PURPLE}60` 
                                    : 'none'
                            }}
                        >
                            {isProcessing ? 'Processing...' : 'Buy Now'}
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
                                    Total: <span className="font-bold text-xl" style={{ color: SHINY_PURPLE }}>
                                        ${selectedPkg.price_usd}
                                    </span>
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
