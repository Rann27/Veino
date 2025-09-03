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
  latest_chapters?: Chapter[]; // For latest updates
}

interface HomeProps {
  heroSeries: Series[];
  popularSeries: Series[];
  latestUpdates: Series[];
}

function HomeContent({ heroSeries, popularSeries, latestUpdates }: HomeProps) {
  const [currentHero, setCurrentHero] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [hasMovedMouse, setHasMovedMouse] = useState(false);
  const { currentTheme } = useTheme();

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
          background: 'linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 50%, #fdf2f8 100%)',
          overlay: 'linear-gradient(135deg, rgba(99, 102, 241, 0.7) 0%, rgba(139, 92, 246, 0.7) 50%, rgba(219, 39, 119, 0.7) 100%)'
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
          background: 'linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 50%, #fdf2f8 100%)',
          overlay: 'linear-gradient(135deg, rgba(99, 102, 241, 0.7) 0%, rgba(139, 92, 246, 0.7) 50%, rgba(219, 39, 119, 0.7) 100%)'
        };
    }
  };

  const themeGradients = getThemeGradients();

  return (
    <>
      <Head title="Home" />

      {/* Hero Slider */}
      {heroSeries.length > 0 && (
        <section 
          className="relative h-72 sm:h-80 md:h-96 overflow-hidden cursor-pointer select-none"
          style={{
            background: themeGradients.background
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleHeroClick}
        >
          {/* Background overlay */}
          <div 
            className="absolute inset-0"
            style={{
              background: themeGradients.overlay
            }}
          />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="w-full flex items-center justify-between gap-8">
              {/* Content Left */}
              <div className="flex-1 text-white z-10">
                {/* Genre Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {heroSeries[currentHero].genres.slice(0, 3).map((genre) => (
                    <span
                      key={genre.id}
                      className="px-2 py-1 text-xs font-medium rounded-full"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white'
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
                  <p className="text-sm sm:text-base opacity-90 mb-4 line-clamp-3 leading-relaxed max-w-2xl">
                    {heroSeries[currentHero].synopsis}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-sm opacity-80">
                  <span>★ {heroSeries[currentHero].rating}</span>
                  <span>•</span>
                  <span>{heroSeries[currentHero].chapters_count || 0} chapters</span>
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

          {/* Navigation Arrows */}
          {heroSeries.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevHero();
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all z-20 backdrop-blur-sm"
                style={{
                  backgroundColor: `${currentTheme.foreground}30`,
                  color: currentTheme.background,
                  borderColor: `${currentTheme.background}20`
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextHero();
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all z-20 backdrop-blur-sm"
                style={{
                  backgroundColor: `${currentTheme.foreground}30`,
                  color: currentTheme.background,
                  borderColor: `${currentTheme.background}20`
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5">
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

                  {/* Latest Chapters */}
                  <div className="mb-3 flex-1 space-y-1">
                    {/* Chapter 1 (Latest) */}
                    <Link 
                      href={`/series/${series.slug}/chapter/${series.chapters_count || 1}`}
                      className="flex items-center justify-between gap-2 p-1 rounded hover:bg-opacity-20 transition-all"
                      style={{ backgroundColor: `${currentTheme.foreground}05` }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span 
                        className="text-sm font-medium"
                        style={{ color: currentTheme.foreground }}
                      >
                        Ch {series.chapters_count || 1}
                      </span>
                      {/* Premium indicator if chapter > 5 */}
                      {(series.chapters_count || 1) > 5 && (
                        <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </Link>
                    {/* Chapter 2 (Previous) */}
                    {(series.chapters_count || 1) > 1 && (
                      <Link 
                        href={`/series/${series.slug}/chapter/${(series.chapters_count || 1) - 1}`}
                        className="flex items-center justify-between gap-2 p-1 rounded hover:bg-opacity-20 transition-all"
                        style={{ backgroundColor: `${currentTheme.foreground}05` }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span 
                          className="text-sm opacity-80"
                          style={{ color: currentTheme.foreground }}
                        >
                          Ch {(series.chapters_count || 1) - 1}
                        </span>
                        {/* Premium indicator if chapter > 5 */}
                        {((series.chapters_count || 1) - 1) > 5 && (
                          <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </Link>
                    )}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5">
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

                  {/* Latest Chapters */}
                  <div className="mb-3 flex-1 space-y-1">
                    {/* Chapter 1 (Latest) */}
                    <Link 
                      href={`/series/${series.slug}/chapter/${series.chapters_count || 1}`}
                      className="flex items-center justify-between gap-2 p-1 rounded hover:bg-opacity-20 transition-all"
                      style={{ backgroundColor: `${currentTheme.foreground}05` }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span 
                        className="text-sm font-medium"
                        style={{ color: currentTheme.foreground }}
                      >
                        Ch {series.chapters_count || 1}
                      </span>
                      {/* Premium indicator if chapter > 5 */}
                      {(series.chapters_count || 1) > 5 && (
                        <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </Link>
                    {/* Chapter 2 (Previous) */}
                    {(series.chapters_count || 1) > 1 && (
                      <Link 
                        href={`/series/${series.slug}/chapter/${(series.chapters_count || 1) - 1}`}
                        className="flex items-center justify-between gap-2 p-1 rounded hover:bg-opacity-20 transition-all"
                        style={{ backgroundColor: `${currentTheme.foreground}05` }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span 
                          className="text-sm opacity-80"
                          style={{ color: currentTheme.foreground }}
                        >
                          Ch {(series.chapters_count || 1) - 1}
                        </span>
                        {/* Premium indicator if chapter > 5 */}
                        {((series.chapters_count || 1) - 1) > 5 && (
                          <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </Link>
                    )}
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
