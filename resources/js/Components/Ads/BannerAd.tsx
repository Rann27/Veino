import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface BannerAdProps {
    position: 'top' | 'bottom';
    className?: string;
}

interface AdData {
    id: number;
    image_url: string;
    link_url: string;
    advertiser_name: string;
}

const BannerAd: React.FC<BannerAdProps> = ({ position, className = '' }) => {
    const [ads, setAds] = useState<AdData[]>([]);
    const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

    useEffect(() => {
        const fetchAds = async () => {
            try {
                const response = await axios.get('/api/ads/banner/random');
                
                // Check if response has ad data (can be single or array)
                let adsData: AdData[] = [];
                
                if (Array.isArray(response.data)) {
                    adsData = response.data;
                } else if (response.data?.ads && Array.isArray(response.data.ads)) {
                    adsData = response.data.ads;
                } else if (response.data?.ad) {
                    adsData = [response.data.ad];
                } else if (response.data?.image_url) {
                    adsData = [response.data];
                }
                
                // Preload images
                adsData.forEach((ad) => {
                    if (ad.image_url) {
                        const img = new Image();
                        img.onload = () => {
                            setLoadedImages((prev) => new Set(prev).add(ad.id));
                            
                            // Track impression
                            axios.post(`/api/ads/${ad.id}/track-impression`).catch(() => {});
                        };
                        img.src = ad.image_url;
                    }
                });
                
                setAds(adsData);
            } catch (error) {
                // No ad available or user is premium
                console.log('No banner ad available');
            }
        };

        fetchAds();
    }, [position]);

    const handleAdClick = (ad: AdData) => {
        // Track click
        axios.post(`/api/ads/${ad.id}/track-click`).catch(() => {});
        
        // Open link in new tab
        window.open(ad.link_url, '_blank', 'noopener,noreferrer');
    };

    // Filter only loaded ads
    const displayAds = ads.filter(ad => loadedImages.has(ad.id));

    if (displayAds.length === 0) {
        return null;
    }

    return (
        <div className={`w-full flex justify-center py-2 ${className}`}>
            <div className="max-w-7xl w-full px-4 sm:px-6 lg:px-8">
                {/* Mobile: 1 col 2 rows (vertical stack) - Full width */}
                {/* Desktop: 2 cols 1 row (horizontal) - 638px each */}
                <div className="flex flex-col md:flex-row gap-2 md:gap-4 justify-center items-center">
                    {displayAds.slice(0, 2).map((ad) => (
                        <div
                            key={ad.id}
                            className="relative cursor-pointer group w-full md:max-w-[638px] md:w-[638px] flex justify-center"
                            onClick={() => handleAdClick(ad)}
                        >
                            {/* Ad image */}
                            <img
                                src={ad.image_url}
                                alt={ad.advertiser_name}
                                className="rounded-lg shadow-md transition-transform group-hover:scale-[1.01] w-full h-auto"
                                style={{ 
                                    objectFit: 'contain',
                                    maxHeight: '90px'
                                }}
                            />
                            
                            {/* Small AD indicator */}
                            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                AD
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BannerAd;
