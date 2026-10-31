import React, { useState, useEffect, useCallback } from 'react';
import { Link, router } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';
import CoverImage from '@/Components/CoverImage';
import { formatRating } from '@/lib/rating';

interface Genre {
  id: number;
  name: string;
}

interface Series {
  id: number;
  title: string;
  slug: string;
  cover_url?: string;
  synopsis?: string;
  rating: number | string | null;
  status: string;
  chapters_count?: number;
  genres: Genre[];
}

interface HeroSectionProps {
  heroSeries: Series[];
}

export default function HeroSection({ heroSeries }: HeroSectionProps) {
  const { currentTheme } = useTheme();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const slideTo = useCallback(
    (index: number) => {
      if (isTransitioning || index === current) return;
      const lastIndex = heroSeries.length - 1;
      const forward = index === 0 && current === lastIndex
        ? true
        : index === lastIndex && current === 0
          ? false
          : index > current;

      setDirection(forward ? 1 : -1);
      setIsTransitioning(true);
      setCurrent(index);
      setTimeout(() => setIsTransitioning(false), 300);
    },
    [current, heroSeries.length, isTransitioning]
  );

  const next = useCallback(() => {
    slideTo((current + 1) % heroSeries.length);
  }, [current, heroSeries.length, slideTo]);

  const prev = useCallback(() => {
    slideTo((current - 1 + heroSeries.length) % heroSeries.length);
  }, [current, heroSeries.length, slideTo]);

  // Auto-play
  useEffect(() => {
    if (heroSeries.length <= 1 || isPaused) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [heroSeries.length, isPaused, next]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.touches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const d = touchStart - touchEnd;
    if (Math.abs(d) > 50) d > 0 ? next() : prev();
    setTouchStart(0);
    setTouchEnd(0);
  };

  if (heroSeries.length === 0) return null;

  const series = heroSeries[current];

  // Theme-aware overlay
  const getOverlayGradient = () => {
    const bg = currentTheme.background;
    return `linear-gradient(90deg, ${bg} 0%, ${bg}F0 30%, ${bg}90 60%, ${bg}40 100%)`;
  };

  return (
    <section
      className="relative w-full overflow-hidden border-b"
      style={{
        backgroundColor: currentTheme.background,
        borderColor: `${currentTheme.foreground}12`,
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative h-[300px] sm:h-[360px] md:h-[400px] lg:h-[430px]">
        {/* Background Cover — full bleed but subdued */}
        {heroSeries.map((s, i) => (
          <div
            key={s.id}
            className="absolute inset-0 transition-opacity duration-300 ease-out"
            style={{ opacity: i === current ? 1 : 0 }}
          >
            {s.cover_url && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${s.cover_url})`,
                  transform: 'scale(1.05)',
                  filter: 'blur(4px) brightness(0.7)',
                }}
              />
            )}
            <div className="absolute inset-0" style={{ background: getOverlayGradient() }} />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, ${currentTheme.background} 0%, transparent 40%)`,
              }}
            />
          </div>
        ))}

        {/* Content — clickable editorial banner */}
        <div
          key={series.id}
          className="relative h-full flex items-center z-10 cursor-pointer"
          onClick={() => router.visit(`/series/${series.slug}`)}
        >
          <div className="w-full px-5 sm:px-8 lg:px-12 xl:px-16">
            <div className="flex items-center max-w-[1400px] mx-auto">
              {/* Left: Info */}
              <div className="flex-1 min-w-0 lg:pr-10 xl:pr-14">
                {/* Genre chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {series.genres.slice(0, 4).map((genre) => (
                    <span
                      key={genre.id}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-lg uppercase tracking-wider"
                      style={{
                        backgroundColor: `${currentTheme.foreground}10`,
                        color: `${currentTheme.foreground}90`,
                        border: `1px solid ${currentTheme.foreground}15`,
                      }}
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>

                {/* Title — quiet editorial typography */}
                <h1
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight mb-2.5 line-clamp-2"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    color: currentTheme.foreground,
                  }}
                >
                  {series.title}
                </h1>

                {/* Synopsis */}
                {series.synopsis && (
                  <p
                    className="text-xs sm:text-sm md:text-base leading-relaxed mb-4 line-clamp-2 sm:line-clamp-3 max-w-2xl"
                    style={{ color: `${currentTheme.foreground}80` }}
                  >
                    {series.synopsis}
                  </p>
                )}

                {/* Meta info row */}
                <div
                  className="flex items-center flex-wrap gap-3 text-xs"
                  style={{ color: `${currentTheme.foreground}70` }}
                >
                  <span className="flex items-center gap-1 font-medium">
                    <span className="text-amber-500">★</span>
                    <span>{formatRating(series.rating)}</span>
                  </span>
                  <span className="opacity-30">•</span>
                  <span className="capitalize">{series.status}</span>
                  {series.chapters_count && (
                    <>
                      <span className="opacity-30">•</span>
                      <span>{series.chapters_count} Chapters</span>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Cover Image (desktop only) — vivid focal point */}
              <div className="hidden lg:flex flex-shrink-0 items-center justify-center">
                <Link href={`/series/${series.slug}`} className="block group/cover" onClick={(e) => e.stopPropagation()}>
                  <div
                    className="relative rounded-lg overflow-hidden border shadow-lg transition-transform duration-200 ease-out group-hover/cover:scale-[1.02]"
                    style={{
                      borderColor: `${currentTheme.foreground}15`,
                    }}
                  >
                    <CoverImage
                      priority
                      src={series.cover_url}
                      alt={series.title}
                      containerClassName="w-48 xl:w-56"
                      hoverScale={false}
                    />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {heroSeries.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="hidden sm:flex absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-lg items-center justify-center transition-opacity opacity-70 hover:opacity-100 border"
              style={{
                backgroundColor: currentTheme.background,
                borderColor: `${currentTheme.foreground}15`,
                color: currentTheme.foreground,
              }}
              aria-label="Previous slide"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="hidden sm:flex absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-lg items-center justify-center transition-opacity opacity-70 hover:opacity-100 border"
              style={{
                backgroundColor: currentTheme.background,
                borderColor: `${currentTheme.foreground}15`,
                color: currentTheme.foreground,
              }}
              aria-label="Next slide"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Slide Indicators */}
        {heroSeries.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {heroSeries.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); slideTo(i); }}
                className="transition-all duration-200 rounded-lg"
                style={{
                  width: i === current ? '20px' : '6px',
                  height: '4px',
                  backgroundColor:
                    i === current ? currentTheme.foreground : `${currentTheme.foreground}30`,
                }}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
