import React, { useState, useEffect, useCallback } from 'react';
import { Link } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';

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
  rating: number;
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const slideTo = useCallback(
    (index: number) => {
      if (isTransitioning || index === current) return;
      setIsTransitioning(true);
      setCurrent(index);
      setTimeout(() => setIsTransitioning(false), 600);
    },
    [current, isTransitioning]
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

  // Theme-aware gradient
  const getOverlayGradient = () => {
    const bg = currentTheme.background;
    return `linear-gradient(90deg, ${bg} 0%, ${bg}E6 25%, ${bg}80 50%, ${bg}40 70%, transparent 100%)`;
  };

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: currentTheme.background }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative h-[320px] sm:h-[380px] md:h-[420px] lg:h-[460px]">
        {/* Background Cover - full bleed */}
        {heroSeries.map((s, i) => (
          <div
            key={s.id}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === current ? 1 : 0 }}
          >
            {s.cover_url && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${s.cover_url})`,
                  transform: 'scale(1.15)',
                  filter: 'blur(2px)',
                }}
              />
            )}
            {/* Dark overlay for readability */}
            <div className="absolute inset-0" style={{ background: getOverlayGradient() }} />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, ${currentTheme.background} 0%, transparent 40%)`,
              }}
            />
          </div>
        ))}

        {/* Content */}
        <div className="relative h-full flex items-center z-10">
          <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-20">
            <div className="flex items-center max-w-[1600px] mx-auto">
              {/* Left: Info — takes most space on desktop */}
              <div className="flex-1 min-w-0 lg:pr-10 xl:pr-16">
                {/* Genre pills */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {series.genres.slice(0, 4).map((genre) => (
                    <span
                      key={genre.id}
                      className="px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-full uppercase tracking-wider"
                      style={{
                        backgroundColor: `${currentTheme.foreground}12`,
                        color: `${currentTheme.foreground}90`,
                        border: `1px solid ${currentTheme.foreground}15`,
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h1
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] xl:text-5xl font-extrabold leading-tight mb-3 line-clamp-2"
                  style={{ color: currentTheme.foreground }}
                >
                  {series.title}
                </h1>

                {/* Synopsis */}
                {series.synopsis && (
                  <p
                    className="text-sm sm:text-base lg:text-lg leading-relaxed mb-5 line-clamp-2 sm:line-clamp-3 max-w-2xl"
                    style={{ color: `${currentTheme.foreground}80` }}
                  >
                    {series.synopsis}
                  </p>
                )}

                {/* Meta info row */}
                <div
                  className="flex items-center flex-wrap gap-4 mb-5"
                  style={{ color: `${currentTheme.foreground}70` }}
                >
                  <span className="flex items-center gap-1 text-sm">
                    <span className="text-yellow-500 text-base">★</span>
                    <span className="font-semibold">{series.rating}</span>
                  </span>
                  <span className="w-1 h-1 rounded-full" style={{ backgroundColor: `${currentTheme.foreground}30` }} />
                  <span className="capitalize text-sm">{series.status}</span>
                  {series.chapters_count && (
                    <>
                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: `${currentTheme.foreground}30` }} />
                      <span className="text-sm">{series.chapters_count} Chapters</span>
                    </>
                  )}
                </div>

                {/* CTA Button */}
                <Link
                  href={`/series/${series.slug}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:shadow-lg"
                  style={{
                    backgroundColor: currentTheme.foreground,
                    color: currentTheme.background,
                  }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
                  </svg>
                  Read Now
                </Link>
              </div>

              {/* Right: Cover Image (desktop only) — prominent display */}
              <div className="hidden lg:flex flex-shrink-0 items-center justify-center">
                <Link href={`/series/${series.slug}`} className="block group/cover">
                  <div
                    className="relative rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover/cover:scale-[1.03]"
                    style={{
                      boxShadow: `0 30px 70px ${currentTheme.foreground}20, 0 0 0 1px ${currentTheme.foreground}08`,
                    }}
                  >
                    {series.cover_url ? (
                      <img
                        src={series.cover_url}
                        alt={series.title}
                        className="w-52 xl:w-60 2xl:w-64 aspect-[2/3] object-cover"
                      />
                    ) : (
                      <div
                        className="w-52 xl:w-60 2xl:w-64 aspect-[2/3] flex items-center justify-center"
                        style={{ backgroundColor: `${currentTheme.foreground}10` }}
                      >
                        <svg className="w-16 h-16" style={{ color: `${currentTheme.foreground}30` }} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                        </svg>
                      </div>
                    )}
                    {/* Reflection/shine effect */}
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 40%)',
                      }}
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
              onClick={prev}
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all opacity-60 hover:opacity-100"
              style={{
                backgroundColor: `${currentTheme.background}80`,
                color: currentTheme.foreground,
                backdropFilter: 'blur(8px)',
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={next}
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all opacity-60 hover:opacity-100"
              style={{
                backgroundColor: `${currentTheme.background}80`,
                color: currentTheme.foreground,
                backdropFilter: 'blur(8px)',
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Slide Indicators */}
        {heroSeries.length > 1 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {heroSeries.map((_, i) => (
              <button
                key={i}
                onClick={() => slideTo(i)}
                className="transition-all duration-300 rounded-full"
                style={{
                  width: i === current ? '24px' : '8px',
                  height: '8px',
                  backgroundColor:
                    i === current ? currentTheme.foreground : `${currentTheme.foreground}30`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
