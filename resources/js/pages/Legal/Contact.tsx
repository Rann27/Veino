import React from 'react';
import { Head } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme } from '@/Contexts/ThemeContext';

function ContactContent() {
    const { currentTheme } = useTheme();

    return (
        <>
            <Head title="Contact Us - VeiNovel" />
            
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
                            Contact Us
                        </h1>
                    </div>

                    {/* Content */}
                    <div 
                        className="backdrop-blur-md rounded-2xl p-8 border"
                        style={{
                            backgroundColor: `${currentTheme.background}90`,
                            borderColor: `${currentTheme.foreground}10`
                        }}
                    >
                        <div className="text-center">
                            <div 
                                className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
                                style={{
                                    backgroundColor: `${currentTheme.foreground}10`
                                }}
                            >
                                <svg 
                                    className="w-10 h-10" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>

                            <p className="text-2xl mb-4" style={{ 
                                fontFamily: 'Poppins, sans-serif',
                                color: currentTheme.foreground 
                            }}>
                                Have questions or inquiries?
                            </p>

                            <p className="text-lg mb-8" style={{ color: `${currentTheme.foreground}80` }}>
                                We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                            </p>

                            <div 
                                className="p-8 rounded-2xl border-2 border-dashed inline-block"
                                style={{
                                    backgroundColor: `${currentTheme.foreground}05`,
                                    borderColor: `${currentTheme.foreground}20`
                                }}
                            >
                                <p className="text-xl font-semibold mb-2" style={{ 
                                    fontFamily: 'Poppins, sans-serif',
                                    color: currentTheme.foreground 
                                }}>
                                    Email Us
                                </p>
                                <a 
                                    href="mailto:support@veinovel.com"
                                    className="text-2xl font-bold hover:underline transition-all duration-200"
                                    style={{ 
                                        color: currentTheme.foreground,
                                        fontFamily: 'Poppins, sans-serif'
                                    }}
                                >
                                    support@veinovel.com
                                </a>
                            </div>

                            <div className="mt-8 text-sm" style={{ color: `${currentTheme.foreground}60` }}>
                                <p>We typically respond within 24-48 hours</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function Contact() {
    return (
        <UserLayout>
            <ContactContent />
        </UserLayout>
    );
}
