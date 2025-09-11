import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';
import AuthLayout from '@/Layouts/AuthLayout';

interface ForgotPasswordProps {
    errors: Record<string, string>;
}

function ForgotPasswordContent({ errors }: ForgotPasswordProps) {
    const { currentTheme } = useTheme();
    const [step, setStep] = useState<'verify' | 'instructions'>('instructions');
    
    const { data, setData, post, processing } = useForm({
        email: '',
        uid: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/password/verify');
    };

    const isDark = currentTheme.name === 'Dark' || currentTheme.name === 'Cool Dark';

    return (
        <div 
            className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
            style={{ backgroundColor: currentTheme.background }}
        >
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                        <svg
                            className="h-6 w-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3.586l6.879-6.88a6 6 0 018.242-.003M13 9a2 2 0 01-2 2"
                            />
                        </svg>
                    </div>
                    <h2 
                        className="mt-6 text-center text-3xl font-bold"
                        style={{ color: currentTheme.foreground }}
                    >
                        Reset Your Password
                    </h2>
                    <p 
                        className="mt-2 text-center text-sm opacity-70"
                        style={{ color: currentTheme.foreground }}
                    >
                        {step === 'instructions' 
                            ? 'Find your User ID (UID) to reset your password'
                            : 'Enter your email and User ID to continue'
                        }
                    </p>
                </div>

                {step === 'instructions' && (
                    <div 
                        className="rounded-lg p-6 border"
                        style={{ 
                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                        }}
                    >
                        <h3 
                            className="text-lg font-semibold mb-4"
                            style={{ color: currentTheme.foreground }}
                        >
                            Where to find your User ID (UID)?
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                    1
                                </div>
                                <p 
                                    className="text-sm opacity-80"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    Check your <strong>profile page</strong> when logged in
                                </p>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                    2
                                </div>
                                <p 
                                    className="text-sm opacity-80"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    Look for an <strong>8-character code</strong> (e.g., ABC12DEF)
                                </p>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                    3
                                </div>
                                <p 
                                    className="text-sm opacity-80"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    If you can't access your account, <strong>contact support</strong>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setStep('verify')}
                            className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
                        >
                            I have my User ID
                        </button>
                    </div>
                )}

                {step === 'verify' && (
                    <form className="mt-8 space-y-6" onSubmit={submit}>
                        <div className="space-y-4">
                            <div>
                                <label 
                                    htmlFor="email" 
                                    className="block text-sm font-medium opacity-80"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                                    style={{ 
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                                        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                                        color: currentTheme.foreground
                                    }}
                                    placeholder="Enter your email address"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label 
                                    htmlFor="uid" 
                                    className="block text-sm font-medium opacity-80"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    User ID (UID)
                                </label>
                                <input
                                    id="uid"
                                    name="uid"
                                    type="text"
                                    required
                                    maxLength={8}
                                    value={data.uid}
                                    onChange={(e) => setData('uid', e.target.value.toUpperCase())}
                                    className="mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm font-mono tracking-wider"
                                    style={{ 
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                                        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                                        color: currentTheme.foreground
                                    }}
                                    placeholder="ABC12DEF"
                                />
                                <p 
                                    className="mt-1 text-xs opacity-60"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    8-character code found in your profile
                                </p>
                                {errors.uid && (
                                    <p className="mt-1 text-sm text-red-600">{errors.uid}</p>
                                )}
                            </div>
                        </div>

                        {(errors.verification || errors.session || errors.user) && (
                            <div className="rounded-md bg-red-50 p-4 border border-red-200">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-800">
                                            {errors.verification || errors.session || errors.user}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex space-x-4">
                            <button
                                type="button"
                                onClick={() => setStep('instructions')}
                                className="flex-1 py-2 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
                                style={{ 
                                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                                    color: currentTheme.foreground,
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)'
                                }}
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                {processing ? 'Verifying...' : 'Verify & Continue'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="text-center">
                    <a
                        href="/login"
                        className="text-sm text-purple-500 hover:text-purple-400 transition-colors duration-200"
                    >
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
