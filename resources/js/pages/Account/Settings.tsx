import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import ThemeSelectorModal from '@/Components/ThemeSelectorModal';
import { useTheme } from '@/Contexts/ThemeContext';

interface User {
    id: number;
    display_name: string;
    email: string;
    uid: string;
    created_at: string;
}

interface Props {
    user: User;
}

function SettingsContent({ user }: Props) {
    const { currentTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'privacy'>('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [showThemeModal, setShowThemeModal] = useState(false);
    
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
    
    // Preferences
    const [preferences, setPreferences] = useState({
        email_notifications: true,
        push_notifications: false,
        marketing_emails: false,
        reading_mode: 'light',
        font_size: 'medium',
        auto_bookmark: true,
    });

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        router.put(route('account.profile.update'), profileData, {
            onSuccess: () => {
                setIsLoading(false);
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

    const handleDeleteAccount = () => {
        const password = prompt('Please enter your password to confirm account deletion:');
        if (password && confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            router.delete(route('account.delete'), {
                data: { password },
                onSuccess: () => {
                    // Redirect will be handled by the backend
                },
            });
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const tabs = [
        { id: 'profile', name: 'Profile', icon: 'user' },
        { id: 'security', name: 'Security', icon: 'settings' },
        { id: 'privacy', name: 'Privacy', icon: 'shield' },
    ];

    return (
        <>
            <Head title="Account Settings - Veinovel" />
            
            <div 
                className="min-h-screen pt-20"
                style={{ backgroundColor: currentTheme.background }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 
                            className="text-3xl font-bold mb-2"
                            style={{ color: currentTheme.foreground }}
                        >
                            Account Settings
                        </h1>
                        <p style={{ color: `${currentTheme.foreground}80` }}>
                            Manage your account preferences and security settings
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar Navigation */}
                        <div className="lg:col-span-1">
                            <nav 
                                className="rounded-lg shadow-sm border p-4 space-y-2"
                                style={{ 
                                    backgroundColor: currentTheme.background,
                                    borderColor: `${currentTheme.foreground}20`
                                }}
                            >
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className="w-full text-left px-4 py-3 rounded-lg transition-colors"
                                        style={{
                                            backgroundColor: activeTab === tab.id 
                                                ? `${currentTheme.foreground}10` 
                                                : 'transparent',
                                            color: activeTab === tab.id 
                                                ? currentTheme.foreground 
                                                : `${currentTheme.foreground}70`,
                                            border: activeTab === tab.id 
                                                ? `1px solid ${currentTheme.foreground}20` 
                                                : '1px solid transparent'
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">
                                                {tab.icon === 'user' && '👤'}
                                                {tab.icon === 'settings' && '🔒'}
                                                {tab.icon === 'shield' && '🛡️'}
                                            </span>
                                            {tab.name}
                                        </div>
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-3">
                            <div 
                                className="rounded-lg shadow-sm border"
                                style={{ 
                                    backgroundColor: currentTheme.background,
                                    borderColor: `${currentTheme.foreground}20`
                                }}
                            >
                                {/* Profile Tab */}
                                {activeTab === 'profile' && (
                                    <div className="p-6">
                                        <h2 
                                            className="text-2xl font-bold mb-6"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            Profile Information
                                        </h2>
                                        
                                        <form onSubmit={handleProfileSubmit} className="space-y-6">
                                            {/* Avatar */}
                                            <div>
                                                <label 
                                                    className="block text-sm font-medium mb-2"
                                                    style={{ color: `${currentTheme.foreground}80` }}
                                                >
                                                    Profile Picture
                                                </label>
                                                <div className="flex items-center gap-4">
                                                {(user as any).avatar_url || profileData.avatar ? (
                                                    <img 
                                                        src={profileData.avatar ? URL.createObjectURL(profileData.avatar) : (user as any).avatar_url}
                                                        alt="Profile Avatar"
                                                        className="w-20 h-20 rounded-full object-cover border-2"
                                                        style={{ borderColor: `${currentTheme.foreground}20` }}
                                                    />
                                                ) : (
                                                    <div 
                                                        className="w-20 h-20 rounded-full flex items-center justify-center"
                                                        style={{ backgroundColor: `${currentTheme.foreground}10` }}
                                                    >
                                                        <span 
                                                            className="text-2xl"
                                                            style={{ color: `${currentTheme.foreground}60` }}
                                                        >
                                                            👤
                                                        </span>
                                                    </div>
                                                )}
                                                    <div>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => setProfileData({...profileData, avatar: e.target.files?.[0] || null})}
                                                            className="hidden"
                                                            id="avatar"
                                                        />
                                                        <label
                                                            htmlFor="avatar"
                                                            className="px-4 py-2 rounded-lg hover:opacity-80 transition-colors cursor-pointer"
                                                            style={{ 
                                                                backgroundColor: `${currentTheme.foreground}10`,
                                                                color: currentTheme.foreground
                                                            }}
                                                        >
                                                            Change Picture
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Display Name */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                                                <input
                                                    type="text"
                                                    value={profileData.display_name}
                                                    onChange={(e) => setProfileData({...profileData, display_name: e.target.value})}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            {/* Email */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                                <input
                                                    type="email"
                                                    value={profileData.email}
                                                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            {/* User ID (UID) */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    User ID (UID)
                                                    <span className="text-xs text-gray-500 ml-2">Used for password recovery</span>
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={user.uid}
                                                        readOnly
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono tracking-wider"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => navigator.clipboard.writeText(user.uid)}
                                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                                        title="Copy to clipboard"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Keep this code safe! You'll need it if you forget your password.
                                                </p>
                                            </div>

                                            {/* Bio */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                                                <textarea
                                                    rows={4}
                                                    value={profileData.bio}
                                                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                                                    placeholder="Tell us about yourself..."
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div className="flex justify-end">
                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                                >
                                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* Security Tab */}
                                {activeTab === 'security' && (
                                    <div className="p-6">
                                        <h2 
                                            className="text-2xl font-bold mb-6"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            Account Security
                                        </h2>
                                        
                                        {/* Account Info */}
                                        <div 
                                            className="mb-8 p-4 rounded-lg"
                                            style={{ 
                                                backgroundColor: `${currentTheme.foreground}05`,
                                                border: `1px solid ${currentTheme.foreground}10`
                                            }}
                                        >
                                            <h3 
                                                className="font-medium mb-2"
                                                style={{ color: currentTheme.foreground }}
                                            >
                                                Account Information
                                            </h3>
                                            <div 
                                                className="space-y-1 text-sm"
                                                style={{ color: `${currentTheme.foreground}70` }}
                                            >
                                                <p><span className="font-medium">User ID:</span> #{user.uid}</p>
                                                <p><span className="font-medium">Member since:</span> {formatDate(user.created_at)}</p>
                                            </div>
                                        </div>
                                        
                                        {/* Change Password */}
                                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                            <h3 
                                                className="text-lg font-semibold"
                                                style={{ color: currentTheme.foreground }}
                                            >
                                                Change Password
                                            </h3>
                                            
                                            <div>
                                                <label 
                                                    className="block text-sm font-medium mb-2"
                                                    style={{ color: `${currentTheme.foreground}80` }}
                                                >
                                                    Current Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={passwordData.current_password}
                                                    onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                    style={{ 
                                                        backgroundColor: `${currentTheme.foreground}05`,
                                                        borderColor: `${currentTheme.foreground}20`,
                                                        color: currentTheme.foreground
                                                    }}
                                                />
                                            </div>

                                            <div>
                                                <label 
                                                    className="block text-sm font-medium mb-2"
                                                    style={{ color: `${currentTheme.foreground}80` }}
                                                >
                                                    New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={passwordData.new_password}
                                                    onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                    style={{ 
                                                        backgroundColor: `${currentTheme.foreground}05`,
                                                        borderColor: `${currentTheme.foreground}20`,
                                                        color: currentTheme.foreground
                                                    }}
                                                />
                                            </div>

                                            <div>
                                                <label 
                                                    className="block text-sm font-medium mb-2"
                                                    style={{ color: `${currentTheme.foreground}80` }}
                                                >
                                                    Confirm New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={passwordData.new_password_confirmation}
                                                    onChange={(e) => setPasswordData({...passwordData, new_password_confirmation: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                    style={{ 
                                                        backgroundColor: `${currentTheme.foreground}05`,
                                                        borderColor: `${currentTheme.foreground}20`,
                                                        color: currentTheme.foreground
                                                    }}
                                                />
                                            </div>

                                            <div className="flex justify-end">
                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-colors"
                                                >
                                                    {isLoading ? 'Updating...' : 'Update Password'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* Privacy Tab */}
                                {activeTab === 'privacy' && (
                                    <div className="p-6">
                                        <h2 
                                            className="text-2xl font-bold mb-6"
                                            style={{ color: currentTheme.foreground }}
                                        >
                                            Privacy & Data
                                        </h2>
                                        
                                        <div className="space-y-6">
                                            {/* Delete Account */}
                                            <div 
                                                className="p-4 border rounded-lg"
                                                style={{ 
                                                    borderColor: '#ef4444',
                                                    backgroundColor: '#fef2f2'
                                                }}
                                            >
                                                <h3 className="font-semibold text-red-900 mb-2">Delete Account</h3>
                                                <p className="text-sm text-red-700 mb-4">
                                                    Permanently delete your account and all associated data. This action cannot be undone.
                                                </p>
                                                <button
                                                    onClick={handleDeleteAccount}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                                >
                                                    Delete Account
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Theme Selector Modal */}
            <ThemeSelectorModal 
                isOpen={showThemeModal} 
                onClose={() => setShowThemeModal(false)} 
            />
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
