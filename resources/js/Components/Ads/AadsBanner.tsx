import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';

interface PageProps {
    auth?: {
        user?: {
            id: number;
            display_name: string;
            email: string;
            coins: number;
            membership_tier: 'basic' | 'premium';
            membership_expires_at?: string;
        };
    };
    [key: string]: any;
}

interface AadsBannerProps {
    position?: 'top' | 'bottom';
}

export default function AadsBanner({ position = 'top' }: AadsBannerProps) {
    const { auth } = usePage<PageProps>().props;
    const [isMobile, setIsMobile] = useState(false);

    // Premium users don't see ads
    if (auth?.user?.membership_tier === 'premium') {
        return null;
    }

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // A-ads banner configuration
    const bannerConfig = {
        desktop: {
            top: { id: '2422391', width: '728px', height: '90px', size: '728x90' },
            bottom: { id: '2422394', width: '728px', height: '90px', size: '728x90' }
        },
        mobile: {
            top: { id: '2422392', width: '320px', height: '50px', size: '320x50' },
            bottom: { id: '2422395', width: '320px', height: '50px', size: '320x50' }
        }
    };

    const config = isMobile 
        ? bannerConfig.mobile[position]
        : bannerConfig.desktop[position];

    return (
        <div className="aads-banner my-4">
            <div 
                id="frame" 
                style={{ 
                    width: config.width, 
                    margin: 'auto', 
                    zIndex: 99998, 
                    height: 'auto' 
                }}
            >
                <iframe 
                    data-aa={config.id}
                    src={`//ad.a-ads.com/${config.id}/?size=${config.size}`}
                    style={{ 
                        border: 0, 
                        padding: 0, 
                        width: config.width, 
                        height: config.height, 
                        overflow: 'hidden', 
                        display: 'block', 
                        margin: 'auto' 
                    }}
                    title={`A-ads Banner ${position}`}
                />
            </div>
        </div>
    );
}
