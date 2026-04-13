import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme } from '@/Contexts/ThemeContext';

interface User {
    id: number;
    display_name: string;
    email: string;
    uid: string;
    created_at: string;
    avatar_url?: string;
    bio?: string;
}

interface Props {
    user: User;
}

function SettingsContent({ user }: Props) {
    const { currentTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
    const [isLoading, setIsLoading] = useState(false);

    // Profile form
    const [profileData, setProfileData] = useState({
        display_name: user.display_name,
        email: user.email,
        bio: (user as any).bio || '',
        avatar: null as File | null,
    });

    // Password form
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData();
        formData.append('display_name', profileData.display_name);
        formData.append('email', profileData.email);
        formData.append('bio', profileData.bio);

        if (profileData.avatar) {
            formData.append('avatar', profileData.avatar);
        }

        formData.append('_method', 'PUT');

        router.post(route('account.profile.update'), formData, {
            onSuccess: () => {
                setIsLoading(false);
                setProfileData({
                    ...profileData,
                    avatar: null,
                });
            },
            onError: () => {
                setIsLoading(false);
            }
        });
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        router.put(route('account.password.update'), passwordData, {
            onSuccess: () => {
                setIsLoading(false);
                setPasswordData({
                    current_password: '',
                    new_password: '',
                    new_password_confirmation: '',
                });
            },
            onError: () => {
                setIsLoading(false);
            }
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Input style helper
    const inputStyle = {
        backgroundColor: `${currentTheme.foreground}05`,
        borderColor: `${currentTheme.foreground}20`,
        color: currentTheme.foreground,
    };

    const tabs = [
        {
            id: 'profile' as const,
            name: 'Profile',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            ),
        },
        {
            id: 'security' as const,
            name: 'Security',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
            ),
        },
    ];

    return (
        <>
            <Head title="Account Settings - Veinovel" />

            <div
                className="min-h-screen py-8 px-4 sm:px-6 lg:px-8"
                style={{ backgroundColor: currentTheme.background }}
            >
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1
                            className="text-3xl font-bold mb-2"
                            style={{
                                color: currentTheme.foreground,
                                fontFamily: 'Poppins, sans-serif',
                            }}
                        >
                            Settings
                        </h1>
                        <p
                            className="text-sm"
                            style={{ color: `${currentTheme.foreground}60` }}
                        >
                            Manage your account preferences and security
                        </p>
                    </div>

                    {/* Tab Navigation */}
                    <div
                        className="flex gap-1 p-1 rounded-xl mb-8"
                        style={{ backgroundColor: `${currentTheme.foreground}06` }}
                    >
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200"
                                style={{
                                    backgroundColor: activeTab === tab.id
                                        ? `${currentTheme.foreground}10`
                                        : 'transparent',
                                    color: activeTab === tab.id
                                        ? currentTheme.foreground
                                        : `${currentTheme.foreground}55`,
                                }}
                            >
                                {tab.icon}
                                {tab.name}
                            </button>
                        ))}
                    </div>

                    {/* ─── Profile Tab ─── */}
                    {activeTab === 'profile' && (
                        <div
                            className="rounded-2xl p-6 sm:p-8 border"
                            style={{
                                backgroundColor: `${currentTheme.foreground}04`,
                                borderColor: `${currentTheme.foreground}10`,
                            }}
                        >
                            <h2
                                className="text-xl font-bold mb-6"
                                style={{ color: currentTheme.foreground }}
                            >
                                Profile Information
                            </h2>

                            <form onSubmit={handleProfileSubmit} className="space-y-6">
                                {/* Avatar */}
                                <div>
                                    <label
                                        className="block text-sm font-medium mb-3"
                                        style={{ color: `${currentTheme.foreground}80` }}
                                    >
                                        Profile Picture
                                    </label>
                                    <div className="flex items-center gap-5">
                                        <div
                                            className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
                                            style={{
                                                backgroundColor: `${currentTheme.foreground}08`,
                                                border: `2px solid ${currentTheme.foreground}15`,
                                            }}
                                        >
                                            {(user as any).avatar_url || profileData.avatar ? (
                                                <img
                                                    src={profileData.avatar ? URL.createObjectURL(profileData.avatar) : (user as any).avatar_url}
                                                    alt="Avatar"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: `${currentTheme.foreground}30` }}>
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                    <circle cx="12" cy="7" r="4" />
                                                </svg>
                                            )}
                                        </div>
                                        <div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setProfileData({ ...profileData, avatar: e.target.files?.[0] || null })}
                                                className="hidden"
                                                id="avatar"
                                            />
                                            <label
                                                htmlFor="avatar"
                                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border cursor-pointer transition-opacity hover:opacity-80"
                                                style={{
                                                    backgroundColor: `${currentTheme.foreground}08`,
                                                    borderColor: `${currentTheme.foreground}15`,
                                                    color: currentTheme.foreground,
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                                    <polyline points="21 15 16 10 5 21" />
                                                </svg>
                                                Change Picture
                                            </label>
                                            {profileData.avatar && (
                                                <p className="text-xs mt-1.5" style={{ color: `${currentTheme.foreground}50` }}>
                                                    {profileData.avatar.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Display Name */}
                                <div>
                                    <label
                                        htmlFor="display_name"
                                        className="block text-sm font-medium mb-2"
                                        style={{ color: `${currentTheme.foreground}80` }}
                                    >
                                        Display Name
                                    </label>
                                    <input
                                        id="display_name"
                                        type="text"
                                        value={profileData.display_name}
                                        onChange={(e) => setProfileData({ ...profileData, display_name: e.target.value })}
                                        className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors"
                                        style={{
                                            ...inputStyle,
                                            '--tw-ring-color': `${currentTheme.foreground}30`,
                                        } as React.CSSProperties}
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium mb-2"
                                        style={{ color: `${currentTheme.foreground}80` }}
                                    >
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                        className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors"
                                        style={{
                                            ...inputStyle,
                                            '--tw-ring-color': `${currentTheme.foreground}30`,
                                        } as React.CSSProperties}
                                    />
                                </div>

                                {/* User ID (UID) */}
                                <div>
                                    <label
                                        className="block text-sm font-medium mb-2"
                                        style={{ color: `${currentTheme.foreground}80` }}
                                    >
                                        <span>User ID (UID)</span>
                                        <span
                                            className="text-xs ml-2"
                                            style={{ color: `${currentTheme.foreground}45` }}
                                        >
                                            Used for password recovery
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={user.uid}
                                            readOnly
                                            className="w-full px-4 py-2.5 border rounded-xl text-sm font-mono tracking-wider"
                                            style={{
                                                backgroundColor: `${currentTheme.foreground}04`,
                                                borderColor: `${currentTheme.foreground}15`,
                                                color: `${currentTheme.foreground}70`,
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => navigator.clipboard.writeText(user.uid)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-md transition-opacity hover:opacity-70"
                                            style={{ color: `${currentTheme.foreground}40` }}
                                            title="Copy to clipboard"
                                        >
                                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p
                                        className="text-xs mt-1.5"
                                        style={{ color: `${currentTheme.foreground}45` }}
                                    >
                                        Keep this code safe! You'll need it if you forget your password.
                                    </p>
                                </div>

                                {/* Bio */}
                                <div>
                                    <label
                                        htmlFor="bio"
                                        className="block text-sm font-medium mb-2"
                                        style={{ color: `${currentTheme.foreground}80` }}
                                    >
                                        Bio
                                    </label>
                                    <textarea
                                        id="bio"
                                        rows={4}
                                        value={profileData.bio}
                                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                        placeholder="Tell us about yourself..."
                                        className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors resize-none"
                                        style={{
                                            ...inputStyle,
                                            '--tw-ring-color': `${currentTheme.foreground}30`,
                                        } as React.CSSProperties}
                                    />
                                </div>

                                {/* Submit */}
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{
                                            backgroundColor: currentTheme.foreground,
                                            color: currentTheme.background,
                                        }}
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                                                    <polyline points="17 21 17 13 7 13 7 21" />
                                                    <polyline points="7 3 7 8 15 8" />
                                                </svg>
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ─── Security Tab ─── */}
                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            {/* Account Info Card */}
                            <div
                                className="rounded-2xl p-6 sm:p-8 border"
                                style={{
                                    backgroundColor: `${currentTheme.foreground}04`,
                                    borderColor: `${currentTheme.foreground}10`,
                                }}
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: `${currentTheme.foreground}60` }}>
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 16v-4" />
                                        <path d="M12 8h.01" />
                                    </svg>
                                    <h3
                                        className="text-lg font-bold"
                                        style={{ color: currentTheme.foreground }}
                                    >
                                        Account Information
                                    </h3>
                                </div>
                                <div
                                    className="space-y-2 text-sm"
                                    style={{ color: `${currentTheme.foreground}70` }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-medium w-28">User ID</span>
                                        <span
                                            className="font-mono px-2 py-0.5 rounded-md"
                                            style={{
                                                backgroundColor: `${currentTheme.foreground}06`,
                                                color: currentTheme.foreground,
                                            }}
                                        >
                                            #{user.uid}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-medium w-28">Member since</span>
                                        <span>{formatDate(user.created_at)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Change Password Card */}
                            <div
                                className="rounded-2xl p-6 sm:p-8 border"
                                style={{
                                    backgroundColor: `${currentTheme.foreground}04`,
                                    borderColor: `${currentTheme.foreground}10`,
                                }}
                            >
                                <div className="flex items-center gap-2 mb-6">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: `${currentTheme.foreground}60` }}>
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <h3
                                        className="text-lg font-bold"
                                        style={{ color: currentTheme.foreground }}
                                    >
                                        Change Password
                                    </h3>
                                </div>

                                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                                    <div>
                                        <label
                                            htmlFor="current_password"
                                            className="block text-sm font-medium mb-2"
                                            style={{ color: `${currentTheme.foreground}80` }}
                                        >
                                            Current Password
                                        </label>
                                        <input
                                            id="current_password"
                                            type="password"
                                            value={passwordData.current_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                            className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors"
                                            style={{
                                                ...inputStyle,
                                                '--tw-ring-color': `${currentTheme.foreground}30`,
                                            } as React.CSSProperties}
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="new_password"
                                            className="block text-sm font-medium mb-2"
                                            style={{ color: `${currentTheme.foreground}80` }}
                                        >
                                            New Password
                                        </label>
                                        <input
                                            id="new_password"
                                            type="password"
                                            value={passwordData.new_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                            className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors"
                                            style={{
                                                ...inputStyle,
                                                '--tw-ring-color': `${currentTheme.foreground}30`,
                                            } as React.CSSProperties}
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="new_password_confirmation"
                                            className="block text-sm font-medium mb-2"
                                            style={{ color: `${currentTheme.foreground}80` }}
                                        >
                                            Confirm New Password
                                        </label>
                                        <input
                                            id="new_password_confirmation"
                                            type="password"
                                            value={passwordData.new_password_confirmation}
                                            onChange={(e) => setPasswordData({ ...passwordData, new_password_confirmation: e.target.value })}
                                            className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors"
                                            style={{
                                                ...inputStyle,
                                                '--tw-ring-color': `${currentTheme.foreground}30`,
                                            } as React.CSSProperties}
                                        />
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{
                                                backgroundColor: currentTheme.foreground,
                                                color: currentTheme.background,
                                            }}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                    </svg>
                                                    Update Password
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default function Settings(props: Props) {
    return (
        <UserLayout>
            <SettingsContent {...props} />
        </UserLayout>
    );
}