import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme } from '@/Contexts/ThemeContext';

interface Genre {
  id: number;
  name: string;
}

interface NativeLanguage {
  id: number;
  name: string;
  code: string;
}

interface Chapter {
  id: number;
  title: string;
  chapter_number: number;
  volume?: number;
  is_premium: boolean;
}

interface Series {
  id: number;
  title: string;
  alternative_title?: string;
  slug: string;
  cover_url?: string;
  synopsis?: string;
  author?: string;
  artist?: string;
  rating: number;
  status: string;
  created_at: string;
  updated_at: string;
  chapters_count?: number;
  native_language: NativeLanguage;
  genres: Genre[];
  // Backend includes latest 1-2 chapters as `chapters` relation; keep optional for safety
  chapters?: Chapter[];
  latest_chapters?: Chapter[]; // legacy/comment
}

interface HomeProps {
  heroSeries: Series[];
  popularSeries: Series[];
  latestUpdates: Series[];
  newSeries: Series[];
}

function HomeContent({ heroSeries, popularSeries, latestUpdates, newSeries }: HomeProps) {
  const [currentHero, setCurrentHero] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [hasMovedMouse, setHasMovedMouse] = useState(false);
  const { currentTheme } = useTheme();

  // Helper function to format chapter display
  const formatChapterDisplay = (chapter: Chapter): string => {
    if (chapter.volume) {
      return `Vol ${chapter.volume} Ch ${chapter.chapter_number}`;
    }
    return `Chapter ${chapter.chapter_number}`;
  };

  // Auto slide functionality
  useEffect(() => {
    if (heroSeries.length <= 1) return;
    
    const interval = setInterval(() => {
      if (!isDragging) {
        setCurrentHero((prev) => (prev + 1) % heroSeries.length);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [heroSeries.length, isDragging]);

  const nextHero = () => {
    setCurrentHero((prev) => (prev + 1) % heroSeries.length);
  };

  const prevHero = () => {
    setCurrentHero((prev) => (prev - 1 + heroSeries.length) % heroSeries.length);
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setCurrentX(e.clientX);
    setHasMovedMouse(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCurrentX(e.clientX);
    const deltaX = Math.abs(e.clientX - startX);
    if (deltaX > 5) {
      setHasMovedMouse(true);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && hasMovedMouse) {
      const deltaX = currentX - startX;
      const threshold = 50;
      
      if (deltaX > threshold) {
        prevHero();
      } else if (deltaX < -threshold) {
        nextHero();
      }
    }
    
    if (isDragging) {
      setIsDragging(false);
      setHasMovedMouse(false);
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
    setHasMovedMouse(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentX(e.touches[0].clientX);
    const deltaX = Math.abs(e.touches[0].clientX - startX);
    if (deltaX > 5) {
      setHasMovedMouse(true);
    }
  };

  const handleTouchEnd = () => {
    if (isDragging && hasMovedMouse) {
      const deltaX = currentX - startX;
      const threshold = 50;
      
      if (deltaX > threshold) {
        prevHero();
      } else if (deltaX < -threshold) {
        nextHero();
      }
    }
    
    if (isDragging) {
      setIsDragging(false);
      setHasMovedMouse(false);
    }
  };

  const handleHeroClick = () => {
    if (!hasMovedMouse && heroSeries[currentHero]) {
      window.location.href = `/series/${heroSeries[currentHero].slug}`;
    }
  };

  // Generate theme-specific gradients
  const getThemeGradients = () => {
    const themeName = currentTheme.name.toLowerCase();
    
    switch (themeName) {
      case 'light':
        return {
          background: 'linear-gradient(135deg, #DADADA 0%, #F5F5F5 100%)',
          overlay: 'linear-gradient(135deg, rgba(218, 218, 218, 0.7) 0%, rgba(245, 245, 245, 0.7) 100%)'
        };
      case 'dark':
        return {
          background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
          overlay: 'linear-gradient(135deg, rgba(44, 62, 80, 0.95) 0%, rgba(52, 73, 94, 0.95) 100%)'
        };
      case 'sepia':
        return {
          background: 'linear-gradient(135deg, #8b4513 0%, #d2691e 100%)',
          overlay: 'linear-gradient(135deg, rgba(139, 69, 19, 0.9) 0%, rgba(210, 105, 30, 0.9) 100%)'
        };
      case 'cool dark':
        return {
          background: 'linear-gradient(135deg, #1e1e2e 0%, #313244 100%)',
          overlay: 'linear-gradient(135deg, rgba(30, 30, 46, 0.95) 0%, rgba(49, 50, 68, 0.95) 100%)'
        };
      case 'frost':
        return {
          background: 'linear-gradient(135deg, #4682b4 0%, #87ceeb 100%)',
          overlay: 'linear-gradient(135deg, rgba(70, 130, 180, 0.9) 0%, rgba(135, 206, 235, 0.9) 100%)'
        };
      case 'solarized':
        return {
          background: 'linear-gradient(135deg, #b58900 0%, #cb4b16 100%)',
          overlay: 'linear-gradient(135deg, rgba(181, 137, 0, 0.9) 0%, rgba(203, 75, 22, 0.9) 100%)'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #DADADA 0%, #F5F5F5 100%)',
          overlay: 'linear-gradient(135deg, rgba(218, 218, 218, 0.7) 0%, rgba(245, 245, 245, 0.7) 100%)'
        };
    }
  };

  // Get text color based on theme for hero section
  const getHeroTextColor = () => {
    const themeName = currentTheme.name.toLowerCase();
    return themeName === 'light' ? '#2d3748' : 'white'; // Dark text for light theme, white for others
  };

  const themeGradients = getThemeGradients();
  const heroTextColor = getHeroTextColor();

  return (
    <>
      <Head>
        <title>Home</title>
        <meta name="description" content="Find your favorite novels here!" />
        <meta name="keywords" content="english novels, web novels, online reading, premium stories, fiction, romance, fantasy, light novels, webnovel platform" />
        
        {/* Open Graph */}
        <meta property="og:title" content="VeiNovel" />
        <meta property="og:description" content="Discover amazing English novels from talented authors worldwide. Premium reading experience with our innovative coin system." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="VeiNovel" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="VeiNovel - Premium English Novels" />
        <meta name="twitter:description" content="Discover amazing English novels from talented authors worldwide." />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="author" content="VeiNovel" />
        <link rel="canonical" href="https://veinovel.com" />
      </Head>

      {/* Hero Slider */}
      {heroSeries.length > 0 && (
        <section 
          className="relative h-72 sm:h-80 md:h-96 overflow-hidden cursor-pointer select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleHeroClick}
        >
          {/* Background Cover Image - Zoomed */}
          {heroSeries[currentHero].cover_url && (
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${heroSeries[currentHero].cover_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transform: 'scale(1.1)',
                filter: 'blur(0px)'
              }}
            />
          )}
          
          {/* Background overlay with 20% opacity */}
          <div 
            className="absolute inset-0"
            style={{
              background: themeGradients.overlay,
              opacity: 0.2
            }}
          />
          
          {/* Side fade gradients */}
          <div 
            className="absolute inset-y-0 left-0 w-32 sm:w-48 md:w-64"
            style={{
              background: `linear-gradient(to right, ${currentTheme.background} 0%, transparent 100%)`
            }}
          />
          <div 
            className="absolute inset-y-0 right-0 w-32 sm:w-48 md:w-64"
            style={{
              background: `linear-gradient(to left, ${currentTheme.background} 0%, transparent 100%)`
            }}
          />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="w-full flex items-center justify-between gap-8">
              {/* Content Left */}
              <div className="flex-1 z-10" style={{ color: heroTextColor }}>
                {/* Genre Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {heroSeries[currentHero].genres.slice(0, 3).map((genre) => (
                    <span
                      key={genre.id}
                      className="px-2 py-1 text-xs font-medium rounded-full"
                      style={{
                        backgroundColor: currentTheme.name.toLowerCase() === 'light' 
                          ? 'rgba(45, 55, 72, 0.15)' 
                          : 'rgba(255, 255, 255, 0.2)',
                        color: heroTextColor
                      }}
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 leading-tight">
                  {heroSeries[currentHero].title}
                </h1>
                
                {heroSeries[currentHero].synopsis && (
                  <p 
                    className="text-sm sm:text-base mb-4 line-clamp-3 leading-relaxed max-w-2xl"
                    style={{ 
                      opacity: currentTheme.name.toLowerCase() === 'light' ? 0.7 : 0.9 
                    }}
                  >
                    {heroSeries[currentHero].synopsis}
                  </p>
                )}
                
                <div 
                  className="flex items-center gap-4 text-sm"
                  style={{ 
                    opacity: currentTheme.name.toLowerCase() === 'light' ? 0.6 : 0.8 
                  }}
                >
                  <span>★ {heroSeries[currentHero].rating}</span>
                  <span>•</span>
                  <span>{heroSeries[currentHero].status}</span>
                </div>
              </div>

              {/* Cover Image Right */}
              <div className="hidden md:block">
                {heroSeries[currentHero].cover_url && (
                  <img
                    src={heroSeries[currentHero].cover_url}
                    alt={heroSeries[currentHero].title}
                    className="w-32 h-44 lg:w-40 lg:h-56 object-cover rounded-lg shadow-lg"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Dots Indicator */}
          {heroSeries.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
              {heroSeries.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentHero(index);
                  }}
                  className="w-2 h-2 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: index === currentHero 
                      ? currentTheme.background 
                      : `${currentTheme.background}50`,
                    boxShadow: `0 0 0 1px ${currentTheme.background}30`
                  }}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Popular Series */}
      <section 
        className="py-8 sm:py-12"
        style={{ backgroundColor: currentTheme.background }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 
            className="text-xl sm:text-2xl font-bold mb-6"
            style={{ color: currentTheme.foreground }}
          >
            Popular Series
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {popularSeries.map((series) => (
              <Link
                key={series.id}
                href={`/series/${series.slug}`}
                className="group"
              >
                <div 
                  className="rounded-lg p-4 sm:p-5 transition-all duration-300 hover:scale-105 hover:shadow-lg h-full flex flex-col min-h-[280px]"
                  style={{
                    backgroundColor: currentTheme.name === 'Light' 
                      ? 'rgba(248, 250, 252, 0.8)' 
                      : currentTheme.name === 'Dark'
                      ? 'rgba(30, 41, 59, 0.6)'
                      : currentTheme.name === 'Sepia'
                      ? 'rgba(244, 236, 216, 0.6)'
                      : currentTheme.name === 'Cool Dark'
                      ? 'rgba(49, 50, 68, 0.6)'
                      : currentTheme.name === 'Frost'
                      ? 'rgba(205, 220, 237, 0.6)'
                      : currentTheme.name === 'Solarized'
                      ? 'rgba(253, 246, 227, 0.6)'
                      : 'rgba(30, 41, 59, 0.6)',
                    border: `1px solid ${currentTheme.foreground}10`
                  }}
                >
                  <div className="aspect-[2/3] bg-gray-200 rounded-md mb-3 overflow-hidden">
                    {series.cover_url ? (
                      <img
                        src={series.cover_url}
                        alt={series.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-xs"
                        style={{ color: `${currentTheme.foreground}60` }}
                      >
                        No Cover
                      </div>
                    )}
                  </div>
                  
                  <h3 
                    className="font-semibold text-sm md:text-base line-clamp-2 mb-3 leading-tight"
                    style={{ color: currentTheme.foreground }}
                  >
                    {series.title}
                  </h3>

                  {/* Latest Chapters (use actual is_premium flags) */}
                  <div className="mb-3 flex-1 space-y-1">
                    {(() => {
                      const chs = (series.chapters || []).slice(0, 2); // use server-provided list
                      // Fallback to synthetic chapters if none provided
                      if (chs.length === 0) {
                        const latestNum = series.chapters_count || 1;
                        return [
                          { chapter_number: latestNum, is_premium: false },
                          latestNum > 1 ? { chapter_number: latestNum - 1, is_premium: false } : null,
                        ]
                          .filter(Boolean)
                          .map((c: any, idx: number) => (
                            <div
                              key={`fallback-${idx}`}
                              className="flex items-center justify-between gap-2 p-1 rounded hover:bg-opacity-20 transition-all cursor-pointer"
                              style={{ backgroundColor: `${currentTheme.foreground}05` }}
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/series/${series.slug}/chapter/${c.chapter_number}`;
                              }}
                            >
                              <span
                                className="text-sm font-medium"
                                style={{ color: currentTheme.foreground }}
                              >
                                {formatChapterDisplay(c)}
                              </span>
                              {c.is_premium && (
                                <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          ));
                      }

                      const chsDesc = [...chs].sort((a, b) => b.chapter_number - a.chapter_number);
                      return chsDesc.map((c) => (
                        <div
                          key={c.id ?? c.chapter_number}
                          className="flex items-center justify-between gap-2 p-1 rounded hover:bg-opacity-20 transition-all cursor-pointer"
                          style={{ backgroundColor: `${currentTheme.foreground}05` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/series/${series.slug}/chapter/${c.chapter_number}`;
                          }}
                        >
                          <span
                            className="text-sm font-medium"
                            style={{ color: currentTheme.foreground }}
                          >
                            {formatChapterDisplay(c)}
                          </span>
                          {c.is_premium && (
                            <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center mt-auto">
                    <span className="text-yellow-500 text-sm">★</span>
                    <span 
                      className="text-sm ml-1"
                      style={{ color: `${currentTheme.foreground}80` }}
                    >
                      {series.rating}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Updates */}
      <section 
        className="py-8 sm:py-12"
        style={{ backgroundColor: currentTheme.background }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 
            className="text-xl sm:text-2xl font-bold mb-6"
            style={{ color: currentTheme.foreground }}
          >
            Latest Updates
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {latestUpdates.map((series) => (
              <Link
                key={series.id}
                href={`/series/${series.slug}`}
                className="group"
              >
                <div 
                  className="rounded-lg p-4 sm:p-5 transition-all duration-300 hover:scale-105 hover:shadow-lg h-full flex flex-col min-h-[280px]"
                  style={{
                    backgroundColor: currentTheme.name === 'Light' 
                      ? 'rgba(248, 250, 252, 0.8)' 
                      : currentTheme.name === 'Dark'
                      ? 'rgba(30, 41, 59, 0.6)'
                      : currentTheme.name === 'Sepia'
                      ? 'rgba(244, 236, 216, 0.6)'
                      : currentTheme.name === 'Cool Dark'
                      ? 'rgba(49, 50, 68, 0.6)'
                      : currentTheme.name === 'Frost'
                      ? 'rgba(205, 220, 237, 0.6)'
                      : currentTheme.name === 'Solarized'
                      ? 'rgba(253, 246, 227, 0.6)'
                      : 'rgba(30, 41, 59, 0.6)',
                    border: `1px solid ${currentTheme.foreground}10`
                  }}
                >
                  <div className="aspect-[2/3] bg-gray-200 rounded-md mb-3 overflow-hidden">
                    {series.cover_url ? (
                      <img
                        src={series.cover_url}
                        alt={series.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-xs"
                        style={{ color: `${currentTheme.foreground}60` }}
                      >
                        No Cover
                      </div>
                    )}
                  </div>
                  
                  <h3 
                    className="font-semibold text-sm md:text-base line-clamp-2 mb-3 leading-tight"
                    style={{ color: currentTheme.foreground }}
                  >
                    {series.title}
                  </h3>

                  {/* Latest Chapters (use actual is_premium flags) */}
                  <div className="mb-3 flex-1 space-y-1">
                    {(() => {
                      const chs = (series.chapters || []).slice(0, 2);
                      if (chs.length === 0) {
                        const latestNum = series.chapters_count || 1;
                        return [
                          { chapter_number: latestNum, is_premium: false },
                          latestNum > 1 ? { chapter_number: latestNum - 1, is_premium: false } : null,
                        ]
                          .filter(Boolean)
                          .map((c: any, idx: number) => (
                            <div
                              key={`fallback-lu-${idx}`}
                              className="flex items-center justify-between gap-2 p-1 rounded hover:bg-opacity-20 transition-all cursor-pointer"
                              style={{ backgroundColor: `${currentTheme.foreground}05` }}
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/series/${series.slug}/chapter/${c.chapter_number}`;
                              }}
                            >
                              <span
                                className="text-sm font-medium"
                                style={{ color: currentTheme.foreground }}
                              >
                                {formatChapterDisplay(c)}
                              </span>
                              {c.is_premium && (
                                <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          ));
                      }

                      const chsDesc = [...chs].sort((a, b) => b.chapter_number - a.chapter_number);
                      return chsDesc.map((c) => (
                        <div
                          key={c.id ?? c.chapter_number}
                          className="flex items-center justify-between gap-2 p-1 rounded hover:bg-opacity-20 transition-all cursor-pointer"
                          style={{ backgroundColor: `${currentTheme.foreground}05` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/series/${series.slug}/chapter/${c.chapter_number}`;
                          }}
                        >
                          <span
                            className="text-sm font-medium"
                            style={{ color: currentTheme.foreground }}
                          >
                            {formatChapterDisplay(c)}
                          </span>
                          {c.is_premium && (
                            <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center mt-auto">
                    <span className="text-yellow-500 text-sm">★</span>
                    <span 
                      className="text-sm ml-1"
                      style={{ color: `${currentTheme.foreground}80` }}
                    >
                      {series.rating}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New Series */}
      <section 
        className="py-8 sm:py-12"
        style={{ backgroundColor: currentTheme.background }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 
            className="text-xl sm:text-2xl font-bold mb-6"
            style={{ color: currentTheme.foreground }}
          >
            New Series
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {newSeries.map((series) => (
              <Link
                key={series.id}
                href={`/series/${series.slug}`}
                className="group"
              >
                <div 
                  className="rounded-lg p-4 sm:p-5 transition-all duration-300 hover:scale-105 hover:shadow-lg h-full flex flex-col min-h-[280px]"
                  style={{
                    backgroundColor: currentTheme.name === 'Light' 
                      ? 'rgba(248, 250, 252, 0.8)' 
                      : currentTheme.name === 'Dark'
                      ? 'rgba(30, 41, 59, 0.6)'
                      : currentTheme.name === 'Sepia'
                      ? 'rgba(244, 236, 216, 0.6)'
                      : currentTheme.name === 'Cool Dark'
                      ? 'rgba(49, 50, 68, 0.6)'
                      : currentTheme.name === 'Frost'
                      ? 'rgba(205, 220, 237, 0.6)'
                      : currentTheme.name === 'Solarized'
                      ? 'rgba(253, 246, 227, 0.6)'
                      : 'rgba(30, 41, 59, 0.6)',
                    border: `1px solid ${currentTheme.foreground}10`
                  }}
                >
                  <div className="aspect-[2/3] bg-gray-200 rounded-md mb-3 overflow-hidden">
                    {series.cover_url ? (
                      <img
                        src={series.cover_url}
                        alt={series.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-xs"
                        style={{ color: `${currentTheme.foreground}60` }}
                      >
                        No Cover
                      </div>
                    )}
                  </div>
                  
                  <h3 
                    className="font-semibold text-sm md:text-base line-clamp-2 mb-3 leading-tight"
                    style={{ color: currentTheme.foreground }}
                  >
                    {series.title}
                  </h3>

                  {/* Latest Chapters (use actual is_premium flags) */}
                  <div className="mb-3 flex-1 space-y-1">
                    {(() => {
                      const chs = (series.chapters || []).slice(0, 2);
                      if (chs.length === 0) {
                        const latestNum = series.chapters_count || 1;
                        return [
                          { chapter_number: latestNum, is_premium: false },
                          latestNum > 1 ? { chapter_number: latestNum - 1, is_premium: false } : null,
                        ]
                          .filter(Boolean)
                          .map((c: any, idx: number) => (
                            <div
                              key={`fallback-new-${idx}`}
                              className="flex items-center justify-between gap-2 p-1 rounded hover:bg-opacity-20 transition-all cursor-pointer"
                              style={{ backgroundColor: `${currentTheme.foreground}05` }}
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/series/${series.slug}/chapter/${c.chapter_number}`;
                              }}
                            >
                              <span
                                className="text-sm font-medium"
                                style={{ color: currentTheme.foreground }}
                              >
                                {formatChapterDisplay(c)}
                              </span>
                              {c.is_premium && (
                                <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          ));
                      }

                      const chsDesc = [...chs].sort((a, b) => b.chapter_number - a.chapter_number);
                      return chsDesc.map((c) => (
                        <div
                          key={c.id ?? c.chapter_number}
                          className="flex items-center justify-between gap-2 p-1 rounded hover:bg-opacity-20 transition-all cursor-pointer"
                          style={{ backgroundColor: `${currentTheme.foreground}05` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/series/${series.slug}/chapter/${c.chapter_number}`;
                          }}
                        >
                          <span
                            className="text-sm font-medium"
                            style={{ color: currentTheme.foreground }}
                          >
                            {formatChapterDisplay(c)}
                          </span>
                          {c.is_premium && (
                            <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center mt-auto">
                    <span className="text-yellow-500 text-sm">★</span>
                    <span 
                      className="text-sm ml-1"
                      style={{ color: `${currentTheme.foreground}80` }}
                    >
                      {series.rating}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default function Home(props: HomeProps) {
  return (
    <UserLayout title="Veinovel - Read Best Web Novels">
      <HomeContent {...props} />
    </UserLayout>
  );
}
