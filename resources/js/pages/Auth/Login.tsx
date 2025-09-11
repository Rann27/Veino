import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { useTheme } from '@/Contexts/ThemeContext';

function LoginContent() {
    const { currentTheme } = useTheme();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        remember: false,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        router.post(route('login'), formData, {
            onError: (errors) => {
                setErrors(errors);
                setProcessing(false);
            },
            onSuccess: () => {
                setProcessing(false);
            },
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    return (
        <div 
            className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
            style={{ backgroundColor: currentTheme.background }}
        >
            <Head title="Sign In - VeiNovel" />
            
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <Link href={route('home')} className="inline-block mb-8">
                        <h1 
                            className="text-3xl font-bold"
                            style={{ color: currentTheme.foreground }}
                        >
                            VEINOVEL
                        </h1>
                    </Link>
                    <h2 
                        className="text-3xl font-bold mb-2"
                        style={{ color: currentTheme.foreground }}
                    >
                        Welcome back
                    </h2>
                    <p style={{ color: `${currentTheme.foreground}80` }}>
                        Sign in to continue your reading journey
                    </p>
                </div>

                {/* Login Form */}
                <form 
                    onSubmit={handleSubmit} 
                    className="rounded-xl shadow-lg p-8 space-y-6"
                    style={{
                        backgroundColor: currentTheme.background,
                        border: `1px solid ${currentTheme.foreground}20`
                    }}
                >
                    {/* Email */}
                    <div>
                        <label 
                            htmlFor="email" 
                            className="block text-sm font-medium mb-2"
                            style={{ color: currentTheme.foreground }}
                        >
                            Email Address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors ${
                                errors.email ? 'border-red-500' : ''
                            }`}
                            style={{
                                backgroundColor: currentTheme.background,
                                borderColor: errors.email ? '#ef4444' : `${currentTheme.foreground}30`,
                                color: currentTheme.foreground
                            }}
                            placeholder="Enter your email"
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <label 
                            htmlFor="password" 
                            className="block text-sm font-medium mb-2"
                            style={{ color: currentTheme.foreground }}
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors ${
                                errors.password ? 'border-red-500' : ''
                            }`}
                            style={{
                                backgroundColor: currentTheme.background,
                                borderColor: errors.password ? '#ef4444' : `${currentTheme.foreground}30`,
                                color: currentTheme.foreground
                            }}
                            placeholder="Enter your password"
                        />
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                        )}
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center">
                        <label className="flex items-center">
                            <input
                                name="remember"
                                type="checkbox"
                                checked={formData.remember}
                                onChange={handleChange}
                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            />
                            <span 
                                className="ml-2 text-sm"
                                style={{ color: `${currentTheme.foreground}80` }}
                            >
                                Remember me
                            </span>
                        </label>
                    </div>

                    {/* General Error Message */}
                    {errors.general && (
                        <div 
                            className="p-3 border rounded-lg"
                            style={{
                                backgroundColor: '#fef2f2',
                                borderColor: '#fecaca'
                            }}
                        >
                            <p className="text-sm text-red-600">{errors.general}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={processing}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium transition-colors ${
                            processing ? 'cursor-not-allowed opacity-50' : 'hover:opacity-90'
                        }`}
                        style={{
                            backgroundColor: processing ? `${currentTheme.foreground}50` : currentTheme.foreground,
                            color: currentTheme.background
                        }}
                    >
                        {processing ? (
                            <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                            </div>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* Forgot Password Link */}
                <div className="text-center">
                    <p style={{ color: `${currentTheme.foreground}80` }}>
                        <Link
                            href="/password/forgot"
                            className="font-medium hover:opacity-70 transition-opacity"
                            style={{ color: currentTheme.foreground }}
                        >
                            Forgot your password?
                        </Link>
                    </p>
                </div>

                {/* Register Link */}
                <div className="text-center">
                    <p style={{ color: `${currentTheme.foreground}80` }}>
                        Don't have an account?{' '}
                        <Link
                            href={route('register')}
                            className="font-medium hover:opacity-70 transition-opacity"
                            style={{ color: currentTheme.foreground }}
                        >
                            Create one here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function Login() {
    return (
        <AuthLayout>
            <LoginContent />
        </AuthLayout>
    );
}
