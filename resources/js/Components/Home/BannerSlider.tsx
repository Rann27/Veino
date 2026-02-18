import React, { useRef, useState, useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';

interface Banner {
  image_url: string;
  link_url?: string;
  alt?: string;
}

interface BannerSliderProps {
  banners: Banner[];
}

export default function BannerSlider({ banners }: BannerSliderProps) {
  const { currentTheme } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Auto-scroll on desktop
  useEffect(() => {
    if (isMobile || banners.length <= 3) return;
    const el = scrollRef.current;
    if (!el) return;

    const interval = setInterval(() => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (scrollPosition >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
        setScrollPosition(0);
      } else {
        const next = scrollPosition + 548; // banner width + gap
        el.scrollTo({ left: next, behavior: 'smooth' });
        setScrollPosition(next);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isMobile, banners.length, scrollPosition]);

  if (!banners || banners.length === 0) return null;

  const renderBanner = (banner: Banner, index: number) => {
    const content = (
      <div
        key={index}
        className="flex-shrink-0 overflow-hidden rounded-md"
        style={{
          width: isMobile ? '100%' : '540px',
          height: isMobile ? 'auto' : '50px',
        }}
      >
        <img
          src={banner.image_url}
          alt={banner.alt || `Banner ${index + 1}`}
          className="w-full h-full object-cover"
          style={{ aspectRatio: isMobile ? '540/50' : undefined }}
        />
      </div>
    );

    if (banner.link_url) {
      return (
        <a key={index} href={banner.link_url} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      );
    }
    return content;
  };

  return (
    <section className="relative w-full overflow-hidden" style={{ backgroundColor: currentTheme.background }}>
      {/* Desktop: multiple banners visible with edge vignette */}
      {!isMobile ? (
        <div className="relative">
          {/* Left vignette */}
          <div
            className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
            style={{
              background: `linear-gradient(to right, ${currentTheme.background} 0%, transparent 100%)`,
            }}
          />
          {/* Right vignette */}
          <div
            className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
            style={{
              background: `linear-gradient(to left, ${currentTheme.background} 0%, transparent 100%)`,
            }}
          />

          <div
            ref={scrollRef}
            className="flex items-center justify-center gap-2 py-3 overflow-x-auto scrollbar-hide"
            style={{ scrollBehavior: 'smooth' }}
            onScroll={(e) => setScrollPosition((e.target as HTMLDivElement).scrollLeft)}
          >
            {banners.map(renderBanner)}
          </div>
        </div>
      ) : (
        /* Mobile: single banner, swipeable */
        <div className="px-4 py-3">
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
            {banners.map((banner, i) => (
              <div key={i} className="snap-center flex-shrink-0 w-full">
                {renderBanner(banner, i)}
              </div>
            ))}
          </div>
          {/* Indicators */}
          {banners.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-2">
              {banners.map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: `${currentTheme.foreground}30` }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
