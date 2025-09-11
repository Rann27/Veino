import React from 'react';
import { Head } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme } from '@/Contexts/ThemeContext';

function PrivacyContent() {
    const { currentTheme } = useTheme();

    return (
        <>
            <Head title="Privacy Policy - VeiNovel" />
            
            <div className="min-h-screen py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div 
                        className="rounded-2xl p-8 mb-8 text-center border"
                        style={{
                            backgroundColor: `${currentTheme.foreground}05`,
                            borderColor: `${currentTheme.foreground}10`
                        }}
                    >
                        <h1 
                            className="text-4xl font-bold mb-4"
                            style={{ 
                                fontFamily: 'Poppins, sans-serif',
                                color: currentTheme.foreground 
                            }}
                        >
                            Privacy Policy
                        </h1>
                        <p 
                            className="text-lg"
                            style={{ 
                                fontFamily: 'Poppins, sans-serif',
                                color: `${currentTheme.foreground}80` 
                            }}
                        >
                            Last updated: September 9, 2025
                        </p>
                    </div>

                    {/* Content */}
                    <div 
                        className="backdrop-blur-md rounded-2xl p-8 border"
                        style={{
                            backgroundColor: `${currentTheme.background}90`,
                            borderColor: `${currentTheme.foreground}10`
                        }}
                    >
                        <div className="prose max-w-none">
                            <p className="mb-6" style={{ color: currentTheme.foreground }}>
                                This Privacy Policy explains how we collect, use, disclose, and protect information about you when you access or use our website, services, and related features (collectively, the "Site").
                            </p>
                            
                            <p className="mb-8" style={{ color: currentTheme.foreground }}>
                                By using the Site, you agree to this Privacy Policy. If you do not agree, please do not use the Site.
                            </p>

                            <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2" style={{ 
                                fontFamily: 'Poppins, sans-serif',
                                color: currentTheme.foreground,
                                borderColor: `${currentTheme.foreground}20`
                            }}>
                                1) Who We Are & Contact
                            </h2>
                            <p className="mb-6" style={{ color: currentTheme.foreground }}>
                                We operate a fan-translation (FanTL) reading platform with user accounts and community features. For any privacy questions or requests, please contact us via the <strong>Contact</strong> page or email: <span className="px-2 py-1 rounded font-semibold" style={{ backgroundColor: `${currentTheme.foreground}15`, color: currentTheme.foreground }}>support@veinovel.com</span>.
                            </p>

                            <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2" style={{ 
                                fontFamily: 'Poppins, sans-serif',
                                color: currentTheme.foreground,
                                borderColor: `${currentTheme.foreground}20`
                            }}>
                                2) Information We Collect
                            </h2>
                            <ul className="mb-8 ml-6 space-y-3" style={{ color: currentTheme.foreground }}>
                                <li><strong>Account Information:</strong> Username, email address, password (hashed), and profile settings</li>
                                <li><strong>Reading Data:</strong> Chapter progress, bookmarks, reading preferences, and history</li>
                                <li><strong>Technical Data:</strong> IP address, browser information, device type, and access logs</li>
                                <li><strong>Cookies:</strong> Essential cookies for authentication and preferences</li>
                                <li><strong>Payment Data:</strong> Transaction records (processed via third-party providers)</li>
                            </ul>

                            <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2" style={{ 
                                fontFamily: 'Poppins, sans-serif',
                                color: currentTheme.foreground,
                                borderColor: `${currentTheme.foreground}20`
                            }}>
                                3) How We Use Your Information
                            </h2>
                            <ul className="mb-8 ml-6 space-y-2" style={{ color: currentTheme.foreground }}>
                                <li><strong>Service Delivery:</strong> Account management, content access, reading progress tracking</li>
                                <li><strong>Security:</strong> Fraud prevention, account protection, and system security</li>
                                <li><strong>Improvement:</strong> Site analytics, performance monitoring, and feature development</li>
                                <li><strong>Communication:</strong> Important updates, security notices, and policy changes</li>
                            </ul>

                            <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2" style={{ 
                                fontFamily: 'Poppins, sans-serif',
                                color: currentTheme.foreground,
                                borderColor: `${currentTheme.foreground}20`
                            }}>
                                4) Data Protection & Security
                            </h2>
                            <p className="mb-8" style={{ color: currentTheme.foreground }}>
                                We implement industry-standard security measures including encrypted data transmission, secure password hashing, and regular security audits. However, no online service is 100% secure, so please use strong passwords and keep your account information confidential.
                            </p>

                            <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2" style={{ 
                                fontFamily: 'Poppins, sans-serif',
                                color: currentTheme.foreground,
                                borderColor: `${currentTheme.foreground}20`
                            }}>
                                5) Your Rights
                            </h2>
                            <ul className="mb-8 ml-6 space-y-2" style={{ color: currentTheme.foreground }}>
                                <li><strong>Access:</strong> Request a copy of your personal data</li>
                                <li><strong>Correction:</strong> Update inaccurate or incomplete information</li>
                                <li><strong>Deletion:</strong> Request removal of your personal data</li>
                                <li><strong>Portability:</strong> Receive your data in a portable format</li>
                            </ul>

                            <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2" style={{ 
                                fontFamily: 'Poppins, sans-serif',
                                color: currentTheme.foreground,
                                borderColor: `${currentTheme.foreground}20`
                            }}>
                                6) Children's Privacy
                            </h2>
                            <p className="mb-8" style={{ color: currentTheme.foreground }}>
                                The Site is <strong>not intended for children under 13</strong>. We do not knowingly collect personal information from children. If you believe a child has provided personal information, contact us to remove it.
                            </p>

                            <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2" style={{ 
                                fontFamily: 'Poppins, sans-serif',
                                color: currentTheme.foreground,
                                borderColor: `${currentTheme.foreground}20`
                            }}>
                                7) Changes to This Policy
                            </h2>
                            <p className="mb-8" style={{ color: currentTheme.foreground }}>
                                We may update this Policy from time to time. The "Last updated" date shows the latest revision. Continued use of the Site after changes means you accept the updated Policy.
                            </p>

                            <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2" style={{ 
                                fontFamily: 'Poppins, sans-serif',
                                color: currentTheme.foreground,
                                borderColor: `${currentTheme.foreground}20`
                            }}>
                                8) Contact Us
                            </h2>
                            <div 
                                className="p-6 rounded-lg border-l-4"
                                style={{
                                    backgroundColor: `${currentTheme.foreground}08`,
                                    borderColor: currentTheme.foreground
                                }}
                            >
                                <p style={{ color: currentTheme.foreground }}>
                                    For privacy inquiries or requests, please contact us at: <strong>support@veinovel.com</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function Privacy() {
    return (
        <UserLayout>
            <PrivacyContent />
        </UserLayout>
    );
}
