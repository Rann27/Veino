import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme } from '@/Contexts/ThemeContext';

function NotFoundContent() {
    const { currentTheme } = useTheme();
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    window.location.href = '/';
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <>
            <Head title="Page Not Found - 404" />
            
            <div 
                className="min-h-screen flex items-center justify-center px-4"
                style={{ backgroundColor: currentTheme.background }}
            >
                <div className="max-w-2xl mx-auto text-center">
                    {/* 404 Large Number */}
                    <div 
                        className="text-8xl md:text-9xl font-bold mb-8 opacity-20"
                        style={{ color: currentTheme.foreground }}
                    >
                        404
                    </div>

                    {/* Error Message */}
                    <h1 
                        className="text-3xl md:text-4xl font-bold mb-4"
                        style={{ color: currentTheme.foreground }}
                    >
                        Page Not Found
                    </h1>
                    
                    <p 
                        className="text-lg md:text-xl mb-8 leading-relaxed"
                        style={{ color: `${currentTheme.foreground}80` }}
                    >
                        Sorry, the page you're looking for doesn't exist or has been moved. 
                        The page might have been removed or the URL is incorrect.
                    </p>

                    {/* Countdown Timer */}
                    <div className="mb-8 text-center">
                        <div 
                            className="text-sm font-medium mb-2"
                            style={{ color: `${currentTheme.foreground}80` }}
                        >
                            Redirecting to homepage in:
                        </div>
                        <div 
                            className="text-4xl font-bold"
                            style={{ color: currentTheme.foreground }}
                        >
                            {countdown}
                        </div>
                        <div 
                            className="text-sm mt-2"
                            style={{ color: `${currentTheme.foreground}60` }}
                        >
                            seconds
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/"
                            className="px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                            style={{
                                backgroundColor: currentTheme.foreground,
                                color: currentTheme.background
                            }}
                        >
                            Go to Homepage
                        </Link>
                        
                        <Link
                            href="/explore"
                            className="px-6 py-3 rounded-lg font-semibold border transition-all duration-300 hover:scale-105"
                            style={{
                                borderColor: currentTheme.foreground,
                                color: currentTheme.foreground,
                                backgroundColor: 'transparent'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = currentTheme.foreground;
                                e.currentTarget.style.color = currentTheme.background;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = currentTheme.foreground;
                            }}
                        >
                            Browse Series
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function NotFound() {
    return (
        <UserLayout title="Page Not Found - VeiNovel">
            <NotFoundContent />
        </UserLayout>
    );
}
