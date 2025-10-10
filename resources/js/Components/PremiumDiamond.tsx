import React from 'react';

interface PremiumDiamondProps {
    size?: number;
    className?: string;
}

/**
 * Shiny Purple Diamond Icon for Premium indicators
 */
export const PremiumDiamond: React.FC<PremiumDiamondProps> = ({ size = 16, className = '' }) => {
    const uniqueId = `diamond-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
        <svg 
            className={className}
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none"
        >
            <defs>
                <linearGradient id={uniqueId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#c084fc', stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: '#e879f9', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
                </linearGradient>
            </defs>
            <path 
                d="M12 2L3 9L12 22L21 9L12 2Z" 
                fill={`url(#${uniqueId})`}
                stroke="#fff"
                strokeWidth="0.5"
            />
            <path 
                d="M12 2L12 22M3 9L21 9M7 5.5L17 5.5M7 9L12 22M17 9L12 22" 
                stroke="#fff" 
                strokeWidth="0.3" 
                opacity="0.6"
            />
        </svg>
    );
};

export default PremiumDiamond;
