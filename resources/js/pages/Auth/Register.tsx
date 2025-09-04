import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { useTheme } from '@/Contexts/ThemeContext';

function RegisterContent() {
    const { currentTheme } = useTheme();
    const [formData, setFormData] = useState({
        display_name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({}); // Clear previous errors

        router.post(route('register'), formData, {
            onError: (errors) => {
                console.error('Registration errors:', errors);
                setErrors(errors);
                setProcessing(false);
            },
            onSuccess: () => {
                setProcessing(false);
                // Don't need to do anything here as redirect is handled by controller
            },
            onFinish: () => {
                setProcessing(false);
            }
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
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
            <Head title="Create Account - VeiNovel" />
            
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
                        Create your account
                    </h2>
                </div>

                {/* Registration Form */}
                <form 
                    onSubmit={handleSubmit} 
                    className="rounded-xl shadow-lg p-8 space-y-6"
                    style={{
                        backgroundColor: currentTheme.background,
                        border: `1px solid ${currentTheme.foreground}20`
                    }}
                >
                    {/* Display Name */}
                    <div>
                        <label 
                            htmlFor="display_name" 
                            className="block text-sm font-medium mb-2"
                            style={{ color: currentTheme.foreground }}
                        >
                            Display Name
                        </label>
                        <input
                            id="display_name"
                            name="display_name"
                            type="text"
                            required
                            value={formData.display_name}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors ${
                                errors.display_name ? 'border-red-500' : ''
                            }`}
                            style={{
                                backgroundColor: currentTheme.background,
                                borderColor: errors.display_name ? '#ef4444' : `${currentTheme.foreground}30`,
                                color: currentTheme.foreground
                            }}
                            placeholder="Enter your display name"
                        />
                        {errors.display_name && (
                            <p className="mt-1 text-sm text-red-500">{errors.display_name}</p>
                        )}
                    </div>

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
                            placeholder="Create a password"
                        />
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label 
                            htmlFor="password_confirmation" 
                            className="block text-sm font-medium mb-2"
                            style={{ color: currentTheme.foreground }}
                        >
                            Confirm Password
                        </label>
                        <input
                            id="password_confirmation"
                            name="password_confirmation"
                            type="password"
                            required
                            value={formData.password_confirmation}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors ${
                                errors.password_confirmation ? 'border-red-500' : ''
                            }`}
                            style={{
                                backgroundColor: currentTheme.background,
                                borderColor: errors.password_confirmation ? '#ef4444' : `${currentTheme.foreground}30`,
                                color: currentTheme.foreground
                            }}
                            placeholder="Confirm your password"
                        />
                        {errors.password_confirmation && (
                            <p className="mt-1 text-sm text-red-500">{errors.password_confirmation}</p>
                        )}
                    </div>

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
                                Creating account...
                            </div>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                {/* Login Link */}
                <div className="text-center">
                    <p style={{ color: `${currentTheme.foreground}80` }}>
                        Already have an account?{' '}
                        <Link
                            href={route('login')}
                            className="font-medium hover:opacity-70 transition-opacity"
                            style={{ color: currentTheme.foreground }}
                        >
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function Register() {
    return (
        <AuthLayout>
            <RegisterContent />
        </AuthLayout>
    );
}
