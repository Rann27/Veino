import React from 'react';
import { Head, Link } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';

interface User {
    id: number;
    display_name: string;
    email: string;
    uid: string;
    coin_balance: number;
    created_at: string;
}

interface RecentReading {
    series_slug: string;
    series_title: string;
    chapter_number: number;
    chapter_title: string;
    last_read: string;
    progress?: number;
}

interface Props {
    user: User;
    recentReadings?: RecentReading[];
    readingStats?: {
        totalChaptersRead: number;
        totalSeriesFollowed: number;
        totalCoinsSpent: number;
        readingStreak: number;
    };
}

export default function Dashboard({ user, recentReadings = [], readingStats }: Props) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        if (diffInHours < 48) return 'Yesterday';
        return Math.floor(diffInHours / 24) + ' days ago';
    };

    return (
        <UserLayout>
            <Head title="My Account - Veinovel" />
            
            <div className="min-h-screen bg-gray-50 pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user.display_name}!</h1>
                        <p className="text-gray-600">Manage your reading journey and account settings</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Quick Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-6 rounded-lg shadow-sm border">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-sm font-medium text-gray-600">Chapters Read</p>
                                            <p className="text-2xl font-bold text-gray-900">{readingStats?.totalChaptersRead || 0}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-lg shadow-sm border">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-sm font-medium text-gray-600">Series Following</p>
                                            <p className="text-2xl font-bold text-gray-900">{readingStats?.totalSeriesFollowed || 0}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-lg shadow-sm border">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-yellow-100 rounded-lg">
                                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-sm font-medium text-gray-600">Coins Balance</p>
                                            <p className="text-2xl font-bold text-gray-900">{user.coin_balance}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-lg shadow-sm border">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-sm font-medium text-gray-600">Reading Streak</p>
                                            <p className="text-2xl font-bold text-gray-900">{readingStats?.readingStreak || 0} days</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Continue Reading */}
                            <div className="bg-white rounded-lg shadow-sm border">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900">Continue Reading</h2>
                                </div>
                                <div className="p-6">
                                    {recentReadings.length > 0 ? (
                                        <div className="space-y-4">
                                            {recentReadings.slice(0, 5).map((reading, index) => (
                                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                    <div className="flex-1">
                                                        <h3 className="font-medium text-gray-900 mb-1">{reading.series_title}</h3>
                                                        <p className="text-sm text-gray-600 mb-2">
                                                            Chapter {reading.chapter_number}: {reading.chapter_title}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Last read {getTimeAgo(reading.last_read)}
                                                        </p>
                                                        {reading.progress && (
                                                            <div className="mt-2">
                                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                                    <div 
                                                                        className="bg-blue-600 h-2 rounded-full" 
                                                                        style={{ width: `${reading.progress}%` }}
                                                                    ></div>
                                                                </div>
                                                                <p className="text-xs text-gray-500 mt-1">{reading.progress}% complete</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Link
                                                        href={route('chapters.show', [reading.series_slug, reading.chapter_number])}
                                                        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                    >
                                                        Continue
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No recent reading</h3>
                                            <p className="text-gray-600 mb-4">Start exploring amazing stories!</p>
                                            <Link
                                                href={route('explore')}
                                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Explore Series
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Account Info */}
                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Display Name</p>
                                        <p className="font-medium text-gray-900">{user.display_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">User ID</p>
                                        <p className="font-medium text-gray-900">#{user.uid}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="font-medium text-gray-900">{user.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Member Since</p>
                                        <p className="font-medium text-gray-900">{formatDate(user.created_at)}</p>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <Link
                                        href={route('account.settings')}
                                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center block"
                                    >
                                        Edit Profile
                                    </Link>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                                <div className="space-y-3">
                                    <Link
                                        href={route('account.library')}
                                        className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">My Library</p>
                                            <p className="text-sm text-gray-600">View followed series</p>
                                        </div>
                                    </Link>

                                    <Link
                                        href={route('account.bookmarks')}
                                        className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="p-2 bg-green-100 rounded-lg mr-3">
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Bookmarks</p>
                                            <p className="text-sm text-gray-600">Saved chapters</p>
                                        </div>
                                    </Link>

                                    <Link
                                        href={route('account.coins')}
                                        className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                                            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Coin Shop</p>
                                            <p className="text-sm text-gray-600">Buy coins</p>
                                        </div>
                                    </Link>
                                </div>
                            </div>

                            {/* Coin Balance Card */}
                            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg shadow-sm p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-1">Coin Balance</h3>
                                        <p className="text-3xl font-bold">{user.coin_balance}</p>
                                        <p className="text-yellow-100 text-sm">Available coins</p>
                                    </div>
                                    <div className="text-right">
                                        <svg className="w-12 h-12 text-yellow-200" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <Link
                                        href={route('account.coins')}
                                        className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
                                    >
                                        Buy More Coins
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
