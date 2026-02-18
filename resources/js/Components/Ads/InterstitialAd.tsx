import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';

interface InterstitialAdProps {
    chapterId: number;
    onClose?: () => void;
}

interface AdData {
    id: number;
    image_url: string;
    link_url: string;
    advertiser_name: string;
}

const SHINY_PURPLE = '#a78bfa';

const InterstitialAd: React.FC<InterstitialAdProps> = ({ chapterId, onClose }) => {
    const [adData, setAdData] = useState<AdData | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [canClose, setCanClose] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        const fetchAd = async () => {
            // Counter logic: Show every 3 chapter visits
            const counterKey = 'interstitial_chapter_counter';
            const currentCount = parseInt(localStorage.getItem(counterKey) || '0', 10);
            const newCount = currentCount + 1;
            
            localStorage.setItem(counterKey, newCount.toString());
            
            // Only show if counter reaches 3
            if (newCount < 3) {
                return;
            }
            
            // Reset counter
            localStorage.setItem(counterKey, '0');
            
            // Check if already shown in this session for this chapter
            const sessionKey = `interstitial_shown_chapter_${chapterId}`;
            if (sessionStorage.getItem(sessionKey)) {
                return; // Already shown
            }

            try {
                const response = await axios.get('/api/ads/interstitial/random');
                
                // Check if response has ad data
                const adData = response.data?.ad || response.data;
                
                if (adData && adData.image_url) {
                    // Preload image
                    const img = new Image();
                    img.onload = () => {
                        setImageLoaded(true);
                        setAdData(adData);
                        setIsVisible(true);
                        
                        // Track impression
                        axios.post(`/api/ads/${adData.id}/track-impression`).catch(() => {});
                        
                        // Mark as shown in session
                        sessionStorage.setItem(sessionKey, 'true');
                        
                        // Enable close button after 500ms
                        setTimeout(() => {
                            setCanClose(true);
                        }, 500);
                    };
                    img.src = adData.image_url;
                } else {
                    console.log('No interstitial ad available');
                }
            } catch (error) {
                // No ad available or user is premium
                console.log('No interstitial ad available', error);
            }
        };

        fetchAd();
    }, [chapterId]);

    const handleClose = () => {
        setIsVisible(false);
        if (onClose) {
            onClose();
        }
    };

    const handleRemoveAds = () => {
        // Redirect to membership page
        router.visit('/shop?tab=membership');
    };

    const handleAdClick = () => {
        if (adData) {
            // Track click
            axios.post(`/api/ads/${adData.id}/track-click`).catch(() => {});
            
            // Open link in new tab
            window.open(adData.link_url, '_blank', 'noopener,noreferrer');
        }
    };

    if (!isVisible || !adData || !imageLoaded) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Blur backdrop - NOT CLICKABLE */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                style={{ cursor: 'default' }}
            />
            
            {/* Ad container */}
            <div className="relative z-10 max-w-4xl mx-auto p-4">
                {/* Action buttons */}
                {canClose && (
                    <div className="flex items-center justify-end gap-3 mb-3">
                        {/* Remove this ad button */}
                        <button
                            onClick={handleRemoveAds}
                            className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 shadow-lg"
                            style={{
                                background: `linear-gradient(135deg, ${SHINY_PURPLE} 0%, #c084fc 100%)`,
                                color: '#ffffff',
                                boxShadow: `0 4px 20px ${SHINY_PURPLE}50`
                            }}
                        >
                            Remove this ad
                        </button>
                        
                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 bg-white rounded-lg font-medium transition-all hover:bg-gray-100 shadow-lg flex items-center gap-2"
                        >
                            <svg 
                                className="w-4 h-4" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M6 18L18 6M6 6l12 12" 
                                />
                            </svg>
                            Close
                        </button>
                    </div>
                )}
                
                {/* Ad image with white stroke and purple glow */}
                <div 
                    className="relative bg-white rounded-lg overflow-hidden cursor-pointer"
                    onClick={handleAdClick}
                    style={{
                        border: '4px solid white',
                        boxShadow: `0 0 30px ${SHINY_PURPLE}80, 0 0 60px ${SHINY_PURPLE}40, 0 10px 40px rgba(0,0,0,0.3)`
                    }}
                >
                    <img
                        src={adData.image_url}
                        alt={adData.advertiser_name}
                        className="w-full h-auto max-h-[80vh] object-contain"
                    />
                    
                    {/* Small text indicator */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="text-white text-xs text-center">
                            Advertisement - Click to learn more
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterstitialAd;
