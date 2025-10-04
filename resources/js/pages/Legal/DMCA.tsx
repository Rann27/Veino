import React from 'react';
import { Head } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme } from '@/Contexts/ThemeContext';

function DMCAContent() {
    const { currentTheme } = useTheme();

    return (
        <>
            <Head title="DMCA - VeiNovel" />
            
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
                            DMCA Notice
                        </h1>
                        <p 
                            className="text-lg"
                            style={{ 
                                fontFamily: 'Poppins, sans-serif',
                                color: `${currentTheme.foreground}80` 
                            }}
                        >
                            Digital Millennium Copyright Act Compliance
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
                            <p className="mb-6 text-lg leading-relaxed" style={{ color: currentTheme.foreground }}>
                                veinovel.com complies with the Digital Millennium Copyright Act (17 U.S.C. § 512). If you believe your copyrighted work has been posted on veinovel.com without authorization, please send a written DMCA notice to our Designated Agent at <strong>support@veinovel.com</strong> (or via our Contact page) that includes:
                            </p>

                            <div 
                                className="bg-opacity-50 p-6 rounded-lg mb-6 border-l-4"
                                style={{
                                    backgroundColor: `${currentTheme.foreground}08`,
                                    borderColor: currentTheme.foreground
                                }}
                            >
                                <h3 className="text-xl font-semibold mb-4" style={{ 
                                    fontFamily: 'Poppins, sans-serif',
                                    color: currentTheme.foreground 
                                }}>
                                    Required Information for DMCA Notice:
                                </h3>
                                <ul className="space-y-3" style={{ color: currentTheme.foreground }}>
                                    <li><strong>1.</strong> Identification of the copyrighted work claimed to have been infringed</li>
                                    <li><strong>2.</strong> Specific infringing URLs or content location on our site</li>
                                    <li><strong>3.</strong> Your contact information (name, address, phone, email)</li>
                                    <li><strong>4.</strong> A good-faith statement that use is not authorized by copyright owner</li>
                                    <li><strong>5.</strong> An accuracy/authority statement made under penalty of perjury</li>
                                    <li><strong>6.</strong> Your physical or electronic signature</li>
                                </ul>
                            </div>

                            <p className="mb-6" style={{ color: currentTheme.foreground }}>
                                Upon receipt of a valid notice, we may remove or disable access to the material and, where applicable, terminate repeat infringers.
                            </p>

                            <p className="mb-6" style={{ color: currentTheme.foreground }}>
                                If your content was removed in error, you may submit a counter-notification; unless we receive notice of court action from the complainant within 10–14 business days, we may restore the material.
                            </p>

                            <div 
                                className="p-6 rounded-lg border"
                                style={{
                                    backgroundColor: `${currentTheme.foreground}05`,
                                    borderColor: `${currentTheme.foreground}20`
                                }}
                            >
                                <p className="text-sm" style={{ color: `${currentTheme.foreground}80` }}>
                                    <strong>Disclaimer:</strong> This page is provided for transparency and legal compliance. It does not constitute legal advice. For specific legal questions, please consult with a qualified attorney.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function DMCA() {
    return (
        <UserLayout>
            <DMCAContent />
        </UserLayout>
    );
}
