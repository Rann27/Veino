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
    const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'preferences' | 'privacy'>('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [showThemeModal, setShowThemeModal] = useState(false);
    
    // Profile form
    const [profileData, setProfileData] = useState({
        display_name: user.display_name,
        email: user.email,
        bio: '',
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
        
        router.put('/account/profile', profileData, {
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
        
        router.put('/account/password', passwordData, {
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

    const handlePreferencesSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        router.put('/account/preferences', preferences, {
            onSuccess: () => {
                setIsLoading(false);
            },
            onError: () => {
                setIsLoading(false);
            }
        });
    };

    const handleDeleteAccount = () => {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            router.delete('/account', {
                onSuccess: () => {
                    // Redirect to home
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
        { id: 'account', name: 'Account', icon: 'settings' },
        { id: 'preferences', name: 'Preferences', icon: 'sliders' },
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
                            <nav className="bg-white rounded-lg shadow-sm border p-4 space-y-2">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                                            activeTab === tab.id
                                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">
                                                {tab.icon === 'user' && '👤'}
                                                {tab.icon === 'settings' && '⚙️'}
                                                {tab.icon === 'sliders' && '🎛️'}
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
                            <div className="bg-white rounded-lg shadow-sm border">
                                {/* Profile Tab */}
                                {activeTab === 'profile' && (
                                    <div className="p-6">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
                                        
                                        <form onSubmit={handleProfileSubmit} className="space-y-6">
                                            {/* Avatar */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                                                        <span className="text-2xl text-gray-400">👤</span>
                                                    </div>
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
                                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
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

                                {/* Account Tab */}
                                {activeTab === 'account' && (
                                    <div className="p-6">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Security</h2>
                                        
                                        {/* Account Info */}
                                        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                                            <h3 className="font-medium text-gray-900 mb-2">Account Information</h3>
                                            <div className="space-y-1 text-sm text-gray-600">
                                                <p><span className="font-medium">User ID:</span> #{user.uid}</p>
                                                <p><span className="font-medium">Member since:</span> {formatDate(user.created_at)}</p>
                                            </div>
                                        </div>
                                        
                                        {/* Change Password */}
                                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                            <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.current_password}
                                                    onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.new_password}
                                                    onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.new_password_confirmation}
                                                    onChange={(e) => setPasswordData({...passwordData, new_password_confirmation: e.target.value})}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div className="flex justify-end">
                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                                >
                                                    {isLoading ? 'Updating...' : 'Update Password'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* Preferences Tab */}
                                {activeTab === 'preferences' && (
                                    <div className="p-6">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Reading Preferences</h2>
                                        
                                        <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                                            {/* Notifications */}
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
                                                <div className="space-y-3">
                                                    <label className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={preferences.email_notifications}
                                                            onChange={(e) => setPreferences({...preferences, email_notifications: e.target.checked})}
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700">Email notifications for new chapters</span>
                                                    </label>
                                                    <label className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={preferences.push_notifications}
                                                            onChange={(e) => setPreferences({...preferences, push_notifications: e.target.checked})}
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700">Push notifications</span>
                                                    </label>
                                                    <label className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={preferences.marketing_emails}
                                                            onChange={(e) => setPreferences({...preferences, marketing_emails: e.target.checked})}
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700">Marketing emails and promotions</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Reading Settings */}
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reading Settings</h3>
                                                <div className="space-y-4">
                                                    {/* Theme Selector */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                                                        <button
                                                            onClick={() => setShowThemeModal(true)}
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-between text-left"
                                                        >
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-6 h-6 rounded-full border border-gray-300 bg-gradient-to-r from-white to-gray-100"></div>
                                                                <span className="text-gray-700">Choose theme and colors</span>
                                                            </div>
                                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </button>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Customize your reading experience with different color themes
                                                        </p>
                                                    </div>
                                                    
                                                    {/* Font Size - Note about reader settings */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Reading Preferences</label>
                                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                            <p className="text-sm text-blue-800">
                                                                📖 Advanced reading settings (font size, spacing, width) are available in the reader. 
                                                                Look for the ⚙️ settings button when reading any chapter.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Other Preferences */}
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Preferences</h3>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={preferences.auto_bookmark}
                                                        onChange={(e) => setPreferences({...preferences, auto_bookmark: e.target.checked})}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">Auto-bookmark reading progress</span>
                                                </label>
                                            </div>

                                            <div className="flex justify-end">
                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                                >
                                                    {isLoading ? 'Saving...' : 'Save Preferences'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* Privacy Tab */}
                                {activeTab === 'privacy' && (
                                    <div className="p-6">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy & Data</h2>
                                        
                                        <div className="space-y-6">
                                            {/* Data Export */}
                                            <div className="p-4 border border-gray-200 rounded-lg">
                                                <h3 className="font-semibold text-gray-900 mb-2">Export Your Data</h3>
                                                <p className="text-sm text-gray-600 mb-4">
                                                    Download a copy of all your account data including reading history, bookmarks, and preferences.
                                                </p>
                                                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                                                    Request Data Export
                                                </button>
                                            </div>

                                            {/* Delete Account */}
                                            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
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
