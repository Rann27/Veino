import React from 'react';
import { Head } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme, SHINY_PURPLE } from '@/Contexts/ThemeContext';

function AdvertiseContent() {
    const { currentTheme } = useTheme();

    return (
        <>
            <Head title="Advertise with VeiNovel" />
            
            <div 
                className="min-h-screen py-12"
                style={{ backgroundColor: currentTheme.background }}
            >
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Main Container */}
                    <div 
                        className="rounded-2xl overflow-hidden border-2 shadow-2xl"
                        style={{
                            borderColor: `${SHINY_PURPLE}80`,
                            background: `linear-gradient(155deg, ${SHINY_PURPLE}15 0%, ${currentTheme.background}95 100%)`,
                            boxShadow: `0 20px 60px ${SHINY_PURPLE}30`
                        }}
                    >
                        {/* Header Section with Gradient */}
                        <div 
                            className="relative px-8 py-12 overflow-hidden"
                            style={{
                                background: `linear-gradient(135deg, ${SHINY_PURPLE} 0%, #a855f7 100%)`
                            }}
                        >
                            {/* Decorative circles */}
                            <div className="absolute top-0 right-0 w-64 h-64 opacity-20">
                                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="100" cy="100" r="80" fill="white" opacity="0.3"/>
                                </svg>
                            </div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 opacity-20">
                                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="100" cy="100" r="60" fill="white" opacity="0.3"/>
                                </svg>
                            </div>

                            <div className="relative z-10">
                                <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
                                    Advertise Here
                                </h1>
                                <p className="text-xl text-white/90 font-medium">
                                    Reach thousands of engaged readers on VeiNovel
                                </p>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="px-8 py-10 space-y-8">
                            {/* Introduction */}
                            <div className="space-y-4">
                                <p 
                                    className="text-lg leading-relaxed"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    Welcome to VeiNovel's advertising platform!
                                </p>
                            </div>

                            {/* Available Ad Units */}
                            <div 
                                className="rounded-xl p-6 border-2"
                                style={{
                                    backgroundColor: `${SHINY_PURPLE}08`,
                                    borderColor: `${SHINY_PURPLE}30`
                                }}
                            >
                                <h2 
                                    className="text-2xl font-bold mb-6 flex items-center gap-2"
                                    style={{ color: SHINY_PURPLE }}
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                                    </svg>
                                    Available Advertising Units
                                </h2>

                                <ul 
                                    className="space-y-4"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    <li className="flex items-start gap-3">
                                        <span 
                                            className="text-2xl mt-1"
                                            style={{ color: SHINY_PURPLE }}
                                        >
                                            •
                                        </span>
                                        <div>
                                            <strong className="text-lg" style={{ color: SHINY_PURPLE }}>Banner Ads</strong>
                                            <p className="mt-1">Top and bottom banner placements across the platform</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span 
                                            className="text-2xl mt-1"
                                            style={{ color: SHINY_PURPLE }}
                                        >
                                            •
                                        </span>
                                        <div>
                                            <strong className="text-lg" style={{ color: SHINY_PURPLE }}>Interstitial Ads</strong>
                                            <p className="mt-1">Full-screen advertisements displayed between page transitions</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span 
                                            className="text-2xl mt-1"
                                            style={{ color: SHINY_PURPLE }}
                                        >
                                            •
                                        </span>
                                        <div>
                                            <strong className="text-lg" style={{ color: SHINY_PURPLE }}>In-Text Link Ads</strong>
                                            <p className="mt-1">Contextual text links integrated naturally within chapter content</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            {/* CTA Section */}
                            <div 
                                className="rounded-xl p-8 text-center border-2"
                                style={{
                                    background: `linear-gradient(135deg, ${SHINY_PURPLE}20 0%, ${SHINY_PURPLE}05 100%)`,
                                    borderColor: `${SHINY_PURPLE}50`
                                }}
                            >
                                <h2 
                                    className="text-2xl font-bold mb-4"
                                    style={{ color: SHINY_PURPLE }}
                                >
                                    Interested?
                                </h2>
                                <p 
                                    className="text-lg mb-6 leading-relaxed"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    Contact us to discuss your advertising needs, receive our detailed pricelist, 
                                    and learn how we can help you reach your marketing goals.
                                </p>
                                
                                <div className="space-y-4">
                                    <a
                                        href="mailto:admin@veinovel.com"
                                        className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 hover:shadow-xl"
                                        style={{
                                            background: `linear-gradient(120deg, ${SHINY_PURPLE} 0%, #a855f7 100%)`,
                                            color: '#ffffff',
                                            boxShadow: `0 12px 30px ${SHINY_PURPLE}40`
                                        }}
                                    >
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                                        </svg>
                                        Contact Us: admin@veinovel.com
                                    </a>
                                    
                                    <p 
                                        className="text-sm"
                                        style={{ color: `${currentTheme.foreground}80` }}
                                    >
                                        We typically respond within 24 hours
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function Advertise() {
    return (
        <UserLayout>
            <AdvertiseContent />
        </UserLayout>
    );
}
