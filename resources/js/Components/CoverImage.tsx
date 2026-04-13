import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';

interface CoverImageProps {
    src?: string | null;
    alt: string;
    className?: string;
    containerClassName?: string;
    /** Scale up on hover (default: true) */
    hoverScale?: boolean;
    /** Aspect ratio class, e.g. "aspect-[2/3]" (default: "aspect-[2/3]") */
    aspectClass?: string;
}

export default function CoverImage({
    src,
    alt,
    className = '',
    containerClassName = '',
    hoverScale = true,
    aspectClass = 'aspect-[2/3]',
}: CoverImageProps) {
    const { currentTheme } = useTheme();
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    // Reset state when src changes, then check if image is already cached
    useEffect(() => {
        setLoaded(false);
        setError(false);

        // If browser already has the image cached, onLoad won't fire again —
        // check img.complete after a microtask to catch this case.
        if (!src) return;
        const check = () => {
            const img = imgRef.current;
            if (img && img.complete) {
                if (img.naturalWidth > 0) {
                    setLoaded(true);
                } else {
                    setError(true);
                }
            }
        };
        // Use requestAnimationFrame so the img element has time to render
        const raf = requestAnimationFrame(check);
        return () => cancelAnimationFrame(raf);
    }, [src]);

    const hasSrc = src && !error;

    return (
        <div
            className={`${aspectClass} rounded-md overflow-hidden relative ${containerClassName}`}
            style={{ backgroundColor: `${currentTheme.foreground}10` }}
        >
            {/* Skeleton shimmer — shown until image loads */}
            {hasSrc && !loaded && (
                <div
                    className="cover-skeleton absolute inset-0"
                    style={{
                        '--shimmer-base': `${currentTheme.foreground}08`,
                        '--shimmer-shine': `${currentTheme.foreground}18`,
                    } as React.CSSProperties}
                />
            )}

            {hasSrc ? (
                <img
                    ref={imgRef}
                    src={src}
                    alt={alt}
                    loading="lazy"
                    onLoad={() => setLoaded(true)}
                    onError={() => setError(true)}
                    className={[
                        'w-full h-full object-cover',
                        hoverScale ? 'group-hover:scale-110 transition-all duration-300' : 'transition-opacity duration-500',
                        loaded ? 'opacity-100' : 'opacity-0',
                        className,
                    ].join(' ')}
                />
            ) : (
                /* No cover / error placeholder */
                <div
                    className="w-full h-full flex flex-col items-center justify-center gap-1"
                    style={{ color: `${currentTheme.foreground}40` }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-8 h-8 opacity-50"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.2}
                    >
                        <rect x="3" y="3" width="18" height="18" rx="2" strokeLinejoin="round" />
                        <path d="M3 16l5-5 4 4 3-3 6 6" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                    </svg>
                    <span className="text-[10px] font-medium tracking-wide uppercase opacity-60">
                        No Cover
                    </span>
                </div>
            )}
        </div>
    );
}
