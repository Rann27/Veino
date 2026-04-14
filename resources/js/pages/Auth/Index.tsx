import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { useTheme, SHINY_PURPLE } from '@/Contexts/ThemeContext';

/* ─── Interfaces ─── */
interface AuthProps {
    tab?: string;
    errors?: Record<string, string>;
    flash?: {
        success?: string;
        error?: string;
    };
}

/* ═══════════════════════════════════════════════
   Combined Auth Page — Login & Register
   ═══════════════════════════════════════════════ */

function AuthContent({ tab: initialTab, errors: inertiaErrors }: AuthProps) {
    const { currentTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<'login' | 'register'>(
        initialTab === 'register' ? 'register' : 'login'
    );
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Password visibility toggles
    const [showLoginPw, setShowLoginPw]       = useState(false);
    const [showRegPw, setShowRegPw]           = useState(false);
    const [showRegConfirmPw, setShowRegConfirmPw] = useState(false);

    // Login form
    const [loginData, setLoginData] = useState({
        email: '',
        password: '',
        remember: false,
    });

    // Register form
    const [registerData, setRegisterData] = useState({
        display_name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    // Sync Inertia errors
    useEffect(() => {
        if (inertiaErrors && Object.keys(inertiaErrors).length > 0) {
            setErrors(inertiaErrors);
        }
    }, [inertiaErrors]);

    // Update URL when switching tabs
    const switchTab = (tab: 'login' | 'register') => {
        setActiveTab(tab);
        setErrors({});
        const url = new URL(window.location.href);
        if (tab === 'register') {
            url.searchParams.set('tab', 'register');
        } else {
            url.searchParams.delete('tab');
        }
        window.history.replaceState({}, '', url.toString());
    };

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        router.post(route('login.attempt'), loginData, {
            onError: (errs) => {
                setErrors(errs as Record<string, string>);
                setProcessing(false);
            },
            onSuccess: () => {
                setProcessing(false);
            },
        });
    };

    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        router.post(route('register'), registerData, {
            onError: (errs) => {
                setErrors(errs as Record<string, string>);
                setProcessing(false);
            },
            onSuccess: () => {
                setProcessing(false);
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    const clearError = (field: string) => {
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // Input style helper
    const inputStyle = (hasError: boolean) => ({
        backgroundColor: `${currentTheme.foreground}06`,
        borderColor: hasError ? '#ef4444' : `${currentTheme.foreground}18`,
        color: currentTheme.foreground,
    });

    return (
        <div
            className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
            style={{ backgroundColor: currentTheme.background }}
        >
            <Head title={activeTab === 'login' ? 'Login' : 'Register'} />

            <div className="max-w-md w-full">
                {/* Brand */}
                <Link href="/" className="block text-center mb-10">
                    <h1
                        className="text-3xl font-bold tracking-tight"
                        style={{
                            fontFamily: 'Poppins, sans-serif',
                            color: currentTheme.foreground,
                        }}
                    >
                        VEINOVEL
                    </h1>
                </Link>

                {/* Tab Switcher */}
                <div
                    className="flex rounded-xl p-1 mb-6"
                    style={{
                        backgroundColor: `${currentTheme.foreground}08`,
                        border: `1px solid ${currentTheme.foreground}0A`,
                    }}
                >
                    <button
                        type="button"
                        onClick={() => switchTab('login')}
                        className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300"
                        style={{
                            backgroundColor: activeTab === 'login'
                                ? currentTheme.foreground
                                : 'transparent',
                            color: activeTab === 'login'
                                ? currentTheme.background
                                : `${currentTheme.foreground}50`,
                        }}
                    >
                        Login
                    </button>
                    <button
                        type="button"
                        onClick={() => switchTab('register')}
                        className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300"
                        style={{
                            backgroundColor: activeTab === 'register'
                                ? currentTheme.foreground
                                : 'transparent',
                            color: activeTab === 'register'
                                ? currentTheme.background
                                : `${currentTheme.foreground}50`,
                        }}
                    >
                        Register
                    </button>
                </div>

                {/* Form Card */}
                <div
                    className="rounded-2xl p-8"
                    style={{
                        backgroundColor: `${currentTheme.foreground}04`,
                        border: `1px solid ${currentTheme.foreground}10`,
                    }}
                >
                    {/* Heading */}
                    <h2
                        className="text-2xl font-bold mb-6"
                        style={{ color: currentTheme.foreground }}
                    >
                        {activeTab === 'login' ? 'Login' : 'Register'}
                    </h2>

                    {/* ─── Login Form ─── */}
                    {activeTab === 'login' && (
                        <form onSubmit={handleLoginSubmit} className="space-y-5">
                            {/* General Error */}
                            {errors.email && errors.email.toLowerCase().includes('credentials') && (
                                <div
                                    className="p-3 rounded-lg text-sm flex items-center gap-2"
                                    style={{
                                        backgroundColor: '#ef444415',
                                        border: '1px solid #ef444430',
                                        color: '#ef4444',
                                    }}
                                >
                                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.email}
                                </div>
                            )}

                            {/* Email */}
                            <div>
                                <label
                                    htmlFor="login-email"
                                    className="block text-sm font-medium mb-1.5"
                                    style={{ color: `${currentTheme.foreground}90` }}
                                >
                                    Email
                                </label>
                                <input
                                    id="login-email"
                                    name="email"
                                    type="email"
                                    required
                                    value={loginData.email}
                                    onChange={(e) => {
                                        setLoginData(prev => ({ ...prev, email: e.target.value }));
                                        clearError('email');
                                    }}
                                    className="w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors"
                                    style={{
                                        ...inputStyle(!!errors.email && !errors.email.toLowerCase().includes('credentials')),
                                        '--tw-ring-color': `${currentTheme.foreground}30`,
                                    } as React.CSSProperties}
                                    placeholder="you@example.com"
                                />
                                {errors.email && !errors.email.toLowerCase().includes('credentials') && (
                                    <p className="mt-1 text-xs" style={{ color: '#ef4444' }}>{errors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label
                                    htmlFor="login-password"
                                    className="block text-sm font-medium mb-1.5"
                                    style={{ color: `${currentTheme.foreground}90` }}
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="login-password"
                                        name="password"
                                        type={showLoginPw ? 'text' : 'password'}
                                        required
                                        value={loginData.password}
                                        onChange={(e) => {
                                            setLoginData(prev => ({ ...prev, password: e.target.value }));
                                            clearError('password');
                                        }}
                                        className="w-full px-3.5 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors"
                                        style={{
                                            ...inputStyle(!!errors.password),
                                            '--tw-ring-color': `${currentTheme.foreground}30`,
                                        } as React.CSSProperties}
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowLoginPw(v => !v)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 transition-opacity hover:opacity-70"
                                        style={{ color: `${currentTheme.foreground}50` }}
                                        tabIndex={-1}
                                        aria-label={showLoginPw ? 'Hide password' : 'Show password'}
                                    >
                                        {showLoginPw ? (
                                            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-xs" style={{ color: '#ef4444' }}>{errors.password}</p>
                                )}
                            </div>

                            {/* Remember + Forgot */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        name="remember"
                                        type="checkbox"
                                        checked={loginData.remember}
                                        onChange={(e) => setLoginData(prev => ({ ...prev, remember: e.target.checked }))}
                                        className="rounded"
                                        style={{ accentColor: currentTheme.foreground }}
                                    />
                                    <span
                                        className="text-sm"
                                        style={{ color: `${currentTheme.foreground}70` }}
                                    >
                                        Remember me
                                    </span>
                                </label>
                                <Link
                                    href="/password/forgot"
                                    className="text-sm font-medium hover:opacity-70 transition-opacity"
                                    style={{ color: `${currentTheme.foreground}80` }}
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    backgroundColor: currentTheme.foreground,
                                    color: currentTheme.background,
                                }}
                            >
                                {processing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Logging in...
                                    </span>
                                ) : (
                                    'Login'
                                )}
                            </button>
                        </form>
                    )}

                    {/* ─── Register Form ─── */}
                    {activeTab === 'register' && (
                        <form onSubmit={handleRegisterSubmit} className="space-y-5">
                            {/* Display Name */}
                            <div>
                                <label
                                    htmlFor="reg-name"
                                    className="block text-sm font-medium mb-1.5"
                                    style={{ color: `${currentTheme.foreground}90` }}
                                >
                                    Display Name
                                </label>
                                <input
                                    id="reg-name"
                                    name="display_name"
                                    type="text"
                                    required
                                    value={registerData.display_name}
                                    onChange={(e) => {
                                        setRegisterData(prev => ({ ...prev, display_name: e.target.value }));
                                        clearError('display_name');
                                    }}
                                    className="w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors"
                                    style={{
                                        ...inputStyle(!!errors.display_name),
                                        '--tw-ring-color': `${currentTheme.foreground}30`,
                                    } as React.CSSProperties}
                                    placeholder="Your display name"
                                />
                                {errors.display_name && (
                                    <p className="mt-1 text-xs" style={{ color: '#ef4444' }}>{errors.display_name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label
                                    htmlFor="reg-email"
                                    className="block text-sm font-medium mb-1.5"
                                    style={{ color: `${currentTheme.foreground}90` }}
                                >
                                    Email
                                </label>
                                <input
                                    id="reg-email"
                                    name="email"
                                    type="email"
                                    required
                                    value={registerData.email}
                                    onChange={(e) => {
                                        setRegisterData(prev => ({ ...prev, email: e.target.value }));
                                        clearError('email');
                                    }}
                                    className="w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors"
                                    style={{
                                        ...inputStyle(!!errors.email),
                                        '--tw-ring-color': `${currentTheme.foreground}30`,
                                    } as React.CSSProperties}
                                    placeholder="you@example.com"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-xs" style={{ color: '#ef4444' }}>{errors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label
                                    htmlFor="reg-password"
                                    className="block text-sm font-medium mb-1.5"
                                    style={{ color: `${currentTheme.foreground}90` }}
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="reg-password"
                                        name="password"
                                        type={showRegPw ? 'text' : 'password'}
                                        required
                                        value={registerData.password}
                                        onChange={(e) => {
                                            setRegisterData(prev => ({ ...prev, password: e.target.value }));
                                            clearError('password');
                                        }}
                                        className="w-full px-3.5 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors"
                                        style={{
                                            ...inputStyle(!!errors.password),
                                            '--tw-ring-color': `${currentTheme.foreground}30`,
                                        } as React.CSSProperties}
                                        placeholder="Create a password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowRegPw(v => !v)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 transition-opacity hover:opacity-70"
                                        style={{ color: `${currentTheme.foreground}50` }}
                                        tabIndex={-1}
                                        aria-label={showRegPw ? 'Hide password' : 'Show password'}
                                    >
                                        {showRegPw ? (
                                            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-xs" style={{ color: '#ef4444' }}>{errors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label
                                    htmlFor="reg-confirm"
                                    className="block text-sm font-medium mb-1.5"
                                    style={{ color: `${currentTheme.foreground}90` }}
                                >
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="reg-confirm"
                                        name="password_confirmation"
                                        type={showRegConfirmPw ? 'text' : 'password'}
                                        required
                                        value={registerData.password_confirmation}
                                        onChange={(e) => {
                                            setRegisterData(prev => ({ ...prev, password_confirmation: e.target.value }));
                                            clearError('password_confirmation');
                                        }}
                                        className="w-full px-3.5 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors"
                                        style={{
                                            ...inputStyle(!!errors.password_confirmation),
                                            '--tw-ring-color': `${currentTheme.foreground}30`,
                                        } as React.CSSProperties}
                                        placeholder="Confirm your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowRegConfirmPw(v => !v)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 transition-opacity hover:opacity-70"
                                        style={{ color: `${currentTheme.foreground}50` }}
                                        tabIndex={-1}
                                        aria-label={showRegConfirmPw ? 'Hide password' : 'Show password'}
                                    >
                                        {showRegConfirmPw ? (
                                            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password_confirmation && (
                                    <p className="mt-1 text-xs" style={{ color: '#ef4444' }}>{errors.password_confirmation}</p>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    backgroundColor: currentTheme.foreground,
                                    color: currentTheme.background,
                                }}
                            >
                                {processing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Creating account...
                                    </span>
                                ) : (
                                    'Register'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AuthPage(props: AuthProps) {
    return (
        <AuthLayout>
            <AuthContent {...props} />
        </AuthLayout>
    );
}