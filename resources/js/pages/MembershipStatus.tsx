import React, { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme, SHINY_PURPLE } from '@/Contexts/ThemeContext';

interface MembershipHistory {
    id: number;
    invoice_number: string;
    transaction_id?: string;
    tier: string;
    duration_days: number;
    amount_usd: string;
    payment_method: string;
    payment_url?: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
    starts_at?: string;
    expires_at?: string;
    completed_at?: string;
    created_at: string;
    package?: { name: string };
}

interface Props {
    history: MembershipHistory;
}

function MembershipStatusContent({ history }: Props) {
    const [hasRefreshed, setHasRefreshed] = useState(false);
    const [hasOpenedPayment, setHasOpenedPayment] = useState(false);

    // Auto-open payment gateway in new tab when first landing on pending status page
    useEffect(() => {
        if (history.status === 'pending' && history.payment_url && !hasOpenedPayment) {
            setHasOpenedPayment(true);
            window.open(history.payment_url, '_blank');
        }
    }, [history.payment_url, history.status, hasOpenedPayment]);

    // Poll every 3s while pending
    useEffect(() => {
        if (history.status !== 'pending') return;
        const interval = setInterval(() => {
            router.reload({ only: ['history'] });
        }, 3000);
        return () => clearInterval(interval);
    }, [history.status]);

    // One-time full reload when completed to refresh navbar membership badge
    useEffect(() => {
        if (history.status === 'completed' && !hasRefreshed) {
            setHasRefreshed(true);
            router.reload();
        }
    }, [history.status, hasRefreshed]);

    const handleContinuePayment = () => {
        if (history.payment_url) {
            window.open(history.payment_url, '_blank');
        }
    };

    return (
        <UserLayout>
            <MembershipStatusInner history={history} onContinuePayment={handleContinuePayment} />
        </UserLayout>
    );
}

function MembershipStatusInner({ history, onContinuePayment }: { history: MembershipHistory; onContinuePayment: () => void }) {
    const { currentTheme } = useTheme();

    const getStatusColor = () => {
        switch (history.status) {
            case 'completed': return SHINY_PURPLE;
            case 'pending':   return '#fbbf24';
            case 'failed':
            case 'cancelled': return '#ef4444';
            default:          return currentTheme.foreground;
        }
    };

    const getStatusIcon = () => {
        switch (history.status) {
            case 'completed':
                return (
                    <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none">
                        <defs>
                            <linearGradient id="memberDiamond" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#c084fc' }} />
                                <stop offset="50%" style={{ stopColor: '#e879f9' }} />
                                <stop offset="100%" style={{ stopColor: '#a78bfa' }} />
                            </linearGradient>
                        </defs>
                        <circle cx="12" cy="12" r="10" fill={`${SHINY_PURPLE}20`} />
                        <path d="M9 12l2 2 4-4" stroke={SHINY_PURPLE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
            default: return null;
        }
    };

    const getStatusMessage = () => {
        switch (history.status) {
            case 'completed':
                return {
                    title: 'Payment Successful!',
                    description: 'Your Premium Membership has been activated. Enjoy unlimited access!',
                };
            case 'pending':
                return {
                    title: 'Processing Payment…',
                    description: history.payment_url
                        ? `You'll be redirected to ${history.payment_method === 'paypal' ? 'PayPal' : 'OxaPay'} to complete your payment.`
                        : 'Waiting for payment confirmation. This page will update automatically.',
                };
            case 'failed':
                return {
                    title: 'Payment Failed',
                    description: 'Your payment could not be processed. Please try again.',
                };
            case 'cancelled':
                return {
                    title: 'Payment Cancelled',
                    description: 'The payment was cancelled. You can try again anytime.',
                };
            default:
                return {
                    title: 'Unknown Status',
                    description: 'Please contact support if you need assistance.',
                };
        }
    };

    const message = getStatusMessage();
    const isPending = history.status === 'pending';
    const isCompleted = history.status === 'completed';
    const isFailed = history.status === 'failed' || history.status === 'cancelled';

    const getDurationLabel = (days: number) => {
        if (days >= 365) return `${Math.round(days / 365)} Year`;
        if (days >= 30)  return `${Math.round(days / 30)} Month${Math.round(days / 30) > 1 ? 's' : ''}`;
        return `${days} Days`;
    };

    const getMethodLabel = (method: string) => {
        if (method === 'paypal') return 'PayPal';
        if (method === 'oxapay') return 'OxaPay (Crypto)';
        return method;
    };

    return (
        <>
            <Head title="Transaction Status" />

            <div
                className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center"
                style={{ backgroundColor: currentTheme.background }}
            >
                <div
                    className="max-w-lg w-full rounded-2xl p-8 border shadow-2xl"
                    style={{
                        backgroundColor: `${currentTheme.background}F0`,
                        borderColor: isPending ? `${SHINY_PURPLE}30` : isCompleted ? `${SHINY_PURPLE}40` : `${currentTheme.foreground}20`,
                        boxShadow: isPending || isCompleted ? `0 0 40px ${SHINY_PURPLE}15` : undefined,
                    }}
                >
                    {/* Glowing purple top bar */}
                    <div
                        className="h-1 rounded-full mb-8 -mx-8 -mt-8 rounded-t-2xl"
                        style={{
                            background: isCompleted
                                ? `linear-gradient(90deg, #a78bfa, #e879f9, #a78bfa)`
                                : isPending
                                    ? `linear-gradient(90deg, ${SHINY_PURPLE}60, #e879f930, ${SHINY_PURPLE}60)`
                                    : `${currentTheme.foreground}20`,
                        }}
                    />

                    {/* Icon */}
                    <div className="flex justify-center mb-5">
                        {getStatusIcon()}
                    </div>

                    {/* Title + description */}
                    <div className="text-center mb-7">
                        <h1 className="text-2xl font-bold mb-2" style={{ color: getStatusColor() }}>
                            {message.title}
                        </h1>
                        <p className="text-sm opacity-60" style={{ color: currentTheme.foreground }}>
                            {message.description}
                        </p>
                    </div>

                    {/* Transaction details card */}
                    <div
                        className="rounded-xl p-5 mb-6 space-y-3 text-sm"
                        style={{ backgroundColor: `${currentTheme.foreground}06`, border: `1px solid ${currentTheme.foreground}0A` }}
                    >
                        <p className="text-xs font-semibold uppercase tracking-wider opacity-40 mb-4" style={{ color: currentTheme.foreground }}>
                            Transaction Details
                        </p>

                        {history.package?.name && (
                            <Row label="Package" style={{ color: currentTheme.foreground }}>
                                <span className="font-semibold" style={{ color: SHINY_PURPLE }}>
                                    {history.package.name}
                                </span>
                            </Row>
                        )}

                        <Row label="Duration" style={{ color: currentTheme.foreground }}>
                            <span className="font-semibold" style={{ color: currentTheme.foreground }}>
                                ✦ {getDurationLabel(history.duration_days)} Premium
                            </span>
                        </Row>

                        <Row label="Amount Paid" style={{ color: currentTheme.foreground }}>
                            <span className="font-bold text-base" style={{ color: SHINY_PURPLE }}>
                                ${history.amount_usd}
                            </span>
                        </Row>

                        <Row label="Payment Method" style={{ color: currentTheme.foreground }}>
                            <span className="font-semibold" style={{ color: currentTheme.foreground }}>
                                {getMethodLabel(history.payment_method)}
                            </span>
                        </Row>

                        <div style={{ height: '1px', backgroundColor: `${currentTheme.foreground}10` }} />

                        <Row label="Invoice" style={{ color: currentTheme.foreground }}>
                            <span className="font-mono text-xs opacity-70" style={{ color: currentTheme.foreground }}>
                                {history.invoice_number}
                            </span>
                        </Row>

                        <Row label="Status" style={{ color: currentTheme.foreground }}>
                            <span
                                className="font-semibold capitalize px-2.5 py-0.5 rounded-full text-xs"
                                style={{ backgroundColor: `${getStatusColor()}20`, color: getStatusColor() }}
                            >
                                {history.status}
                            </span>
                        </Row>

                        {history.transaction_id && (
                            <div className="flex flex-col gap-1">
                                <span className="opacity-50 text-sm" style={{ color: currentTheme.foreground }}>Payment ID</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs opacity-60 break-all" style={{ color: currentTheme.foreground }}>
                                        {history.transaction_id}
                                    </span>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(history.transaction_id!)}
                                        title="Copy"
                                        className="flex-shrink-0 opacity-40 hover:opacity-80 transition-opacity"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: currentTheme.foreground }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}

                        {isCompleted && history.expires_at && (
                            <Row label="Expires" style={{ color: currentTheme.foreground }}>
                                <span className="font-semibold text-xs" style={{ color: currentTheme.foreground }}>
                                    {new Date(history.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </Row>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-3">
                        {isPending && history.payment_url && (
                            <button
                                onClick={onContinuePayment}
                                className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]"
                                style={{
                                    background: `linear-gradient(135deg, #a78bfa, #e879f9)`,
                                    color: 'white',
                                    boxShadow: `0 4px 20px ${SHINY_PURPLE}40`,
                                }}
                            >
                                Continue to Payment →
                            </button>
                        )}

                        {isPending && !history.payment_url && (
                            <div
                                className="w-full py-3 rounded-xl text-center text-sm font-medium animate-pulse"
                                style={{ backgroundColor: `${SHINY_PURPLE}15`, color: SHINY_PURPLE }}
                            >
                                Waiting for confirmation…
                            </div>
                        )}

                        {isCompleted && (
                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 hover:scale-[1.01]"
                                style={{
                                    background: `linear-gradient(135deg, #a78bfa, #e879f9)`,
                                    color: 'white',
                                    boxShadow: `0 4px 20px ${SHINY_PURPLE}40`,
                                }}
                            >
                                Start Reading ✦
                            </button>
                        )}

                        <button
                            onClick={() => router.visit('/shop?tab=membership')}
                            className="w-full py-2.5 rounded-xl font-medium text-sm transition-all hover:opacity-70"
                            style={{
                                backgroundColor: 'transparent',
                                border: `1.5px solid ${currentTheme.foreground}20`,
                                color: `${currentTheme.foreground}70`,
                            }}
                        >
                            {isFailed ? 'Try Again' : 'Back to Shop'}
                        </button>
                    </div>

                    {/* Help text */}
                    {isPending && (
                        <p className="text-center text-xs mt-5 opacity-40" style={{ color: currentTheme.foreground }}>
                            Having trouble? Contact us on{' '}
                            <a href="https://discord.gg/vudY5kMk4s" className="underline" target="_blank" rel="noopener">Discord</a>
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}

function Row({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="opacity-50 flex-shrink-0" style={style}>{label}</span>
            <span className="text-right">{children}</span>
        </div>
    );
}

export default function MembershipStatus(props: Props) {
    return <MembershipStatusContent {...props} />;
}
