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
    status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
    starts_at?: string;
    expires_at?: string;
    completed_at?: string;
    created_at: string;
    package?: {
        name: string;
    };
}

interface Props {
    history: MembershipHistory;
}

function MembershipStatusContent({ history }: Props) {
    const [hasRefreshed, setHasRefreshed] = useState(false);

    // Poll for status updates
    useEffect(() => {
        if (history.status === 'pending') {
            const interval = setInterval(() => {
                router.reload({ only: ['history'] });
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [history.status]);

    // One-time refresh when payment is completed to update navbar
    useEffect(() => {
        if (history.status === 'completed' && !hasRefreshed) {
            setHasRefreshed(true);
            // Force reload once to refresh user data in navbar
            router.reload();
        }
    }, [history.status, hasRefreshed]);

    return (
        <UserLayout>
            <MembershipStatusInner 
                history={history}
                hasRefreshed={hasRefreshed}
            />
        </UserLayout>
    );
}

function MembershipStatusInner({ history, hasRefreshed }: any) {
    const { currentTheme } = useTheme();

    const getStatusColor = () => {
        switch (history.status) {
            case 'completed':
                return SHINY_PURPLE;
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
        switch (history.status) {
            case 'completed':
                return (
                    <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none">
                        <defs>
                            <linearGradient id="statusDiamond" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#c084fc' }} />
                                <stop offset="50%" style={{ stopColor: '#e879f9' }} />
                                <stop offset="100%" style={{ stopColor: '#a78bfa' }} />
                            </linearGradient>
                        </defs>
                        <circle cx="12" cy="12" r="10" fill={`${SHINY_PURPLE}20`} />
                        <path d="M12 2L3 9L12 22L21 9L12 2Z" fill="url(#statusDiamond)" transform="scale(0.6) translate(8, 4)" />
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
        switch (history.status) {
            case 'completed':
                return {
                    title: 'Payment Successful!',
                    description: 'Your Premium Membership has been activated successfully.',
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

    return (
        <>
            <Head title="Transaction Status" />
            
            <div 
                className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center"
                style={{ backgroundColor: currentTheme.background }}
            >
                <div 
                    className="max-w-2xl w-full backdrop-blur-lg rounded-2xl p-8 border shadow-2xl"
                    style={{ 
                        backgroundColor: `${currentTheme.background}F0`,
                        borderColor: `${currentTheme.foreground}20`
                    }}
                >
                    {/* Status Icon */}
                    <div className="flex justify-center mb-6">
                        {getStatusIcon()}
                    </div>

                    {/* Status Message */}
                    <div className="text-center mb-8">
                        <h1 
                            className="text-3xl font-bold mb-3"
                            style={{ color: getStatusColor() }}
                        >
                            {message.title}
                        </h1>
                        <p 
                            className="text-lg opacity-70"
                            style={{ color: currentTheme.foreground }}
                        >
                            {message.description}
                        </p>
                    </div>

                    {/* Transaction Details */}
                    <div 
                        className="rounded-xl p-6 mb-6 space-y-3"
                        style={{ backgroundColor: `${currentTheme.foreground}05` }}
                    >
                        <h2 
                            className="font-semibold text-lg mb-4"
                            style={{ color: currentTheme.foreground }}
                        >
                            Transaction Details
                        </h2>
                        
                        <div className="flex justify-between">
                            <span 
                                className="opacity-70"
                                style={{ color: currentTheme.foreground }}
                            >
                                Invoice Number:
                            </span>
                            <span 
                                className="font-mono font-semibold"
                                style={{ color: SHINY_PURPLE }}
                            >
                                {history.invoice_number}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span 
                                className="opacity-70"
                                style={{ color: currentTheme.foreground }}
                            >
                                Package:
                            </span>
                            <span 
                                className="font-semibold"
                                style={{ color: currentTheme.foreground }}
                            >
                                {history.duration_days} Days Premium
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span 
                                className="opacity-70"
                                style={{ color: currentTheme.foreground }}
                            >
                                Amount:
                            </span>
                            <span 
                                className="font-bold text-lg"
                                style={{ color: SHINY_PURPLE }}
                            >
                                ${history.amount_usd}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span 
                                className="opacity-70"
                                style={{ color: currentTheme.foreground }}
                            >
                                Payment Method:
                            </span>
                            <span 
                                className="font-semibold capitalize"
                                style={{ color: currentTheme.foreground }}
                            >
                                {history.payment_method}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span 
                                className="opacity-70"
                                style={{ color: currentTheme.foreground }}
                            >
                                Status:
                            </span>
                            <span 
                                className="font-semibold capitalize px-3 py-1 rounded-full text-sm"
                                style={{ 
                                    backgroundColor: `${getStatusColor()}20`,
                                    color: getStatusColor()
                                }}
                            >
                                {history.status}
                            </span>
                        </div>

                        {history.transaction_id && (
                            <div className="flex justify-between">
                                <span 
                                    className="opacity-70"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    Payment ID:
                                </span>
                                <span 
                                    className="font-mono text-sm"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    {history.transaction_id}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        {/* Single button for all states */}
                        <button
                            onClick={() => {
                                if (history.status === 'completed') {
                                    window.location.href = '/';
                                } else {
                                    router.visit('/membership');
                                }
                            }}
                            className="w-full py-3 rounded-lg font-semibold transition-all duration-300 hover:transform hover:scale-105 hover:shadow-lg"
                            style={{
                                backgroundColor: history.status === 'completed' ? SHINY_PURPLE : 'transparent',
                                border: `2px solid ${history.status === 'completed' ? SHINY_PURPLE : currentTheme.foreground}`,
                                color: history.status === 'completed' ? 'white' : currentTheme.foreground
                            }}
                            onMouseEnter={(e) => {
                                if (history.status === 'completed') {
                                    e.currentTarget.style.backgroundColor = '#9333ea'; // Darker purple on hover
                                    e.currentTarget.style.borderColor = '#9333ea';
                                } else {
                                    e.currentTarget.style.backgroundColor = `${currentTheme.foreground}10`;
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (history.status === 'completed') {
                                    e.currentTarget.style.backgroundColor = SHINY_PURPLE;
                                    e.currentTarget.style.borderColor = SHINY_PURPLE;
                                } else {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }
                            }}
                        >
                            {history.status === 'completed' ? 'Back to Home' : 'Back to Membership'}
                        </button>
                    </div>

                    {/* Help Text */}
                    {history.status === 'pending' && (
                        <p 
                            className="text-center text-sm mt-6 opacity-70"
                            style={{ color: currentTheme.foreground }}
                        >
                            Having trouble? Contact our support team for assistance.
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}

export default function MembershipStatus(props: Props) {
    return <MembershipStatusContent {...props} />;
}
