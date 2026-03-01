import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';
import AuthLayout from '@/Layouts/AuthLayout';

interface ForgotPasswordProps {
    errors: Record<string, string>;
}

function ForgotPasswordContent({ errors }: ForgotPasswordProps) {
    const { currentTheme } = useTheme();
    const { props: pageProps } = usePage<{ flash: { otp_sent?: boolean; otp_email?: string } }>();
    const otpSent = pageProps.flash?.otp_sent === true;
    const otpEmail = pageProps.flash?.otp_email ?? '';
    const isDark = currentTheme.name === 'Dark' || currentTheme.name === 'Cool Dark';

    // Step 1: send OTP
    const emailForm = useForm({ email: '' });

    // Step 2: verify OTP
    const otpForm = useForm({ email: '', otp: '' });

    // Sync email to OTP form when otp_sent becomes true
    useEffect(() => {
        if (otpSent && otpEmail) {
            otpForm.setData('email', otpEmail);
        }
    }, [otpSent, otpEmail]);

    const inputStyle = {
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
        color: currentTheme.foreground,
    };

    const cardStyle = {
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
            style={{ backgroundColor: currentTheme.background }}
        >
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div>
                    <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-bold" style={{ color: currentTheme.foreground }}>
                        Reset Your Password
                    </h2>
                    <p className="mt-2 text-center text-sm opacity-70" style={{ color: currentTheme.foreground }}>
                        {otpSent
                            ? 'Check your email for the 6-digit OTP code'
                            : 'Enter your email to receive a reset code'}
                    </p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2">
                    <div className={`h-2 w-16 rounded-full transition-all duration-300 ${!otpSent ? 'bg-purple-500' : 'bg-purple-200'}`} />
                    <div className={`h-2 w-16 rounded-full transition-all duration-300 ${otpSent ? 'bg-purple-500' : 'bg-purple-200'}`} />
                </div>

                {/* Step 1: Email input */}
                {!otpSent && (
                    <form
                        className="space-y-5"
                        onSubmit={(e) => {
                            e.preventDefault();
                            emailForm.post('/password/send-otp');
                        }}
                    >
                        <div>
                            <label className="block text-sm font-medium opacity-80 mb-1" style={{ color: currentTheme.foreground }}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                autoComplete="email"
                                value={emailForm.data.email}
                                onChange={(e) => emailForm.setData('email', e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                style={inputStyle}
                                placeholder="Enter your email address"
                            />
                            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={emailForm.processing}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {emailForm.processing ? 'Sending...' : 'Send OTP Code'}
                        </button>
                    </form>
                )}

                {/* Step 2: OTP input */}
                {otpSent && (
                    <div className="space-y-5">
                        {/* Info card */}
                        <div className="rounded-lg p-4 border" style={cardStyle}>
                            <p className="text-sm" style={{ color: currentTheme.foreground }}>
                                ✉️ OTP sent to <strong>{otpEmail || 'your email'}</strong>.
                                Check your inbox (and spam folder). Valid for <strong>10 minutes</strong>.
                            </p>
                        </div>

                        <form
                            className="space-y-5"
                            onSubmit={(e) => {
                                e.preventDefault();
                                otpForm.post('/password/verify-otp');
                            }}
                        >
                            {/* Hidden email field */}
                            <input type="hidden" value={otpForm.data.email} readOnly />

                            <div>
                                <label className="block text-sm font-medium opacity-80 mb-1" style={{ color: currentTheme.foreground }}>
                                    OTP Code
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    inputMode="numeric"
                                    pattern="[0-9]{6}"
                                    value={otpForm.data.otp}
                                    onChange={(e) => otpForm.setData('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="appearance-none block w-full px-3 py-3 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-center text-3xl font-mono tracking-[0.5em] font-bold"
                                    style={inputStyle}
                                    placeholder="000000"
                                    autoFocus
                                />
                                {errors.otp && <p className="mt-1 text-sm text-red-500">{errors.otp}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={otpForm.processing || otpForm.data.otp.length !== 6}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                {otpForm.processing ? 'Verifying...' : 'Verify OTP'}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    router.post('/password/send-otp', { email: otpEmail });
                                }}
                                disabled={emailForm.processing}
                                className="w-full text-sm text-center opacity-60 hover:opacity-100 transition-opacity duration-200"
                                style={{ color: currentTheme.foreground }}
                            >
                                {emailForm.processing ? 'Resending...' : "Didn't receive the code? Resend"}
                            </button>
                        </form>
                    </div>
                )}

                <div className="text-center">
                    <a href="/login" className="text-sm text-purple-500 hover:text-purple-400 transition-colors duration-200">
                        ← Back to Login
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function ForgotPassword(props: ForgotPasswordProps) {
    return (
        <AuthLayout>
            <Head title="Forgot Password" />
            <ForgotPasswordContent {...props} />
        </AuthLayout>
    );
}
