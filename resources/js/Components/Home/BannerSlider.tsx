import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isJumpingRef = useRef(false);
  const dragStateRef = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const bannerCount = banners.length;
  const displayedBanners = bannerCount > 1 ? [...banners, ...banners, ...banners] : banners;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const getStep = useCallback(() => {
    const el = scrollRef.current;
    const firstSlide = el?.querySelector<HTMLElement>('[data-banner-slide]');
    if (!el || !firstSlide) return 0;

    const gap = Number.parseFloat(window.getComputedStyle(el).columnGap || '16') || 16;
    return firstSlide.offsetWidth + gap;
  }, []);

  const scrollToGlobal = useCallback((globalIndex: number, behavior: ScrollBehavior = 'smooth') => {
    const el = scrollRef.current;
    const step = getStep();
    const firstSlide = el?.querySelector<HTMLElement>('[data-banner-slide]');
    if (!el || !step || !firstSlide) return;

    const left = globalIndex * step - (el.clientWidth - firstSlide.offsetWidth) / 2;
    el.scrollTo({ left, behavior });
  }, [getStep]);

  const getCenteredGlobalIndex = useCallback(() => {
    const el = scrollRef.current;
    const step = getStep();
    const firstSlide = el?.querySelector<HTMLElement>('[data-banner-slide]');
    if (!el || !step || !firstSlide) return bannerCount;

    const centeredOffset = el.scrollLeft + (el.clientWidth - firstSlide.offsetWidth) / 2;
    return Math.round(centeredOffset / step);
  }, [bannerCount, getStep]);

  const snapToNearest = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (bannerCount <= 1) return;
    scrollToGlobal(getCenteredGlobalIndex(), behavior);
  }, [bannerCount, getCenteredGlobalIndex, scrollToGlobal]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (bannerCount <= 1) return;

    timerRef.current = setInterval(() => {
      if (dragStateRef.current.isDown) return;
      scrollToGlobal(getCenteredGlobalIndex() + 1);
    }, 4500);
  }, [bannerCount, getCenteredGlobalIndex, scrollToGlobal]);

  useEffect(() => {
    if (bannerCount <= 1) return;

    const rafId = requestAnimationFrame(() => {
      scrollToGlobal(bannerCount, 'auto');
    });

    resetTimer();

    return () => {
      cancelAnimationFrame(rafId);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [bannerCount, isMobile, resetTimer, scrollToGlobal]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || bannerCount <= 1) return;

    const handleScroll = () => {
      if (isJumpingRef.current) return;

      const step = getStep();
      if (!step) return;

      const setWidth = bannerCount * step;
      if (el.scrollLeft < setWidth * 0.5) {
        isJumpingRef.current = true;
        el.scrollLeft += setWidth;
        isJumpingRef.current = false;
      } else if (el.scrollLeft > setWidth * 1.5) {
        isJumpingRef.current = true;
        el.scrollLeft -= setWidth;
        isJumpingRef.current = false;
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [bannerCount, getStep]);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || event.button !== 0) return;

    const el = scrollRef.current;
    if (!el) return;

    event.preventDefault();
    dragStateRef.current = {
      isDown: true,
      startX: event.clientX,
      scrollLeft: el.scrollLeft,
      moved: false,
    };
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStateRef.current.isDown) return;

      const walk = moveEvent.clientX - dragStateRef.current.startX;
      if (Math.abs(walk) > 6) {
        dragStateRef.current.moved = true;
      }
      el.scrollLeft = dragStateRef.current.scrollLeft - walk;
    };

    const handleMouseUp = () => {
      const shouldSnap = dragStateRef.current.moved;
      dragStateRef.current.isDown = false;
      setIsDragging(false);

      if (shouldSnap) {
        snapToNearest();
      }
      resetTimer();

      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (dragStateRef.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      dragStateRef.current.moved = false;
    }
  };

  if (!banners || bannerCount === 0) return null;

  const renderBanner = (banner: Banner, index: number) => {
    const image = (
      <img
        src={banner.image_url}
        alt={banner.alt || `Banner ${index + 1}`}
        className="block h-full w-full select-none object-cover"
        draggable={false}
      />
    );

    return (
      <div
        key={`${index}-${banner.image_url}`}
        data-banner-slide
        className="flex-shrink-0 overflow-hidden rounded-lg"
        style={{
          width: isMobile ? '100%' : 'min(720px, 78vw)',
          aspectRatio: '2 / 1',
          scrollSnapAlign: isDragging ? 'none' : 'center',
        }}
      >
        {banner.link_url ? (
          <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
            {image}
          </a>
        ) : (
          image
        )}
      </div>
    );
  };

  return (
    <section className="relative w-full overflow-hidden" style={{ backgroundColor: currentTheme.background }}>
      <div className="relative">
        <div
          className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-32"
          style={{
            background: `linear-gradient(to right, ${currentTheme.background} 0%, transparent 100%)`,
          }}
        />
        <div
          className="pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-32"
          style={{
            background: `linear-gradient(to left, ${currentTheme.background} 0%, transparent 100%)`,
          }}
        />

        <div
          ref={scrollRef}
          className="scrollbar-hide flex items-center gap-4 overflow-x-auto py-4"
          style={{
            scrollBehavior: isDragging ? 'auto' : 'smooth',
            scrollSnapType: isDragging ? 'none' : 'x mandatory',
            cursor: isMobile ? 'auto' : isDragging ? 'grabbing' : 'grab',
            paddingLeft: isMobile ? '1rem' : 'max(1rem, calc((100vw - 720px) / 2))',
            paddingRight: isMobile ? '1rem' : 'max(1rem, calc((100vw - 720px) / 2))',
            userSelect: 'none',
          }}
          onMouseDown={handleMouseDown}
          onClickCapture={handleClickCapture}
        >
          {displayedBanners.map(renderBanner)}
        </div>
      </div>
    </section>
  );
}
