import React from 'react';
import axios from 'axios';

interface InTextAdProps {
    adId: number;
    caption: string;
    linkUrl: string;
}

const InTextAd: React.FC<InTextAdProps> = ({ adId, caption, linkUrl }) => {
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        
        // Track click
        axios.post(`/api/ads/${adId}/track-click`).catch(() => {});
        
        // Open link in new tab
        window.open(linkUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <span className="inline-flex items-center gap-1 my-2">
            <a
                href={linkUrl}
                onClick={handleClick}
                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                target="_blank"
                rel="noopener noreferrer"
            >
                {caption}
            </a>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
                AD
            </span>
        </span>
    );
};

export default InTextAd;
