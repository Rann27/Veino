import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme, SHINY_PURPLE } from '@/Contexts/ThemeContext';
import PremiumDiamond from '@/Components/PremiumDiamond';

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
  chapter_link: string;
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

interface Blog {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

interface HomeProps {
  heroSeries: Series[];
  popularSeries: Series[];
  latestUpdates: Series[];
  newSeries: Series[];
  blogs: Blog[];
  showPremiumCongrats?: boolean;
}

function HomeContent({ heroSeries, popularSeries, latestUpdates, newSeries, blogs, showPremiumCongrats }: HomeProps) {
  const [currentHero, setCurrentHero] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [hasMovedMouse, setHasMovedMouse] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { currentTheme } = useTheme();

  useEffect(() => {
    // Check for query parameter (from payment redirect)
    const params = new URLSearchParams(window.location.search);
    if (params.get('premium') === 'activated') {
      setShowPremiumModal(true);
      params.delete('premium');
      const newSearch = params.toString();
      const newUrl = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
    // Check for prop from admin grant
    else if (showPremiumCongrats) {
      setShowPremiumModal(true);
    }
  }, [showPremiumCongrats]);

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

      {showPremiumModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
          onClick={() => setShowPremiumModal(false)}
        >
          <div
            className="relative max-w-lg w-full rounded-3xl overflow-hidden border-2 shadow-3xl"
            style={{
              borderColor: `${SHINY_PURPLE}80`,
              background: `linear-gradient(155deg, ${SHINY_PURPLE}33 0%, rgba(17, 24, 39, 0.9) 100%)`,
              boxShadow: `0 20px 60px ${SHINY_PURPLE}50`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 pointer-events-none">
              <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <radialGradient id="premiumGlow" cx="50%" cy="0%" r="100%">
                    <stop offset="0%" stopColor={`${SHINY_PURPLE}`} stopOpacity="0.8" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#premiumGlow)" />
              </svg>
            </div>

            <div className="relative p-8 sm:p-10 text-center space-y-6">
              <div className="flex justify-center">
                <div
                  className="relative w-24 h-24 rounded-full flex items-center justify-center"
                  style={{
                    background: `${SHINY_PURPLE}26`,
                    boxShadow: `0 0 40px ${SHINY_PURPLE}6b`
                  }}
                >
                  <svg className="w-14 h-14" viewBox="0 0 64 64" fill="none">
                    <defs>
                      <linearGradient id="premiumDiamond" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f0abfc" />
                        <stop offset="50%" stopColor="#c084fc" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                    <path d="M32 4L8 24l24 36 24-36L32 4z" fill="url(#premiumDiamond)" />
                  </svg>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: '#fdf2ff' }}>
                  Congratulations!
                </h2>
                <p className="text-lg" style={{ color: '#efe7ff' }}>
                  Your Premium membership is now active. Enjoy uninterrupted reading & exclusive perks.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                {[
                  'Unlimited access to all premium chapters',
                  'Ad-free immersive reading experience',
                  'Exclusive badge and early releases'
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="rounded-2xl p-4 border"
                    style={{
                      borderColor: `${SHINY_PURPLE}55`,
                      backgroundColor: `${SHINY_PURPLE}10`,
                      color: '#f8f5ff'
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 mt-0.5" fill="#bbf7d0" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm leading-relaxed">{feature}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowPremiumModal(false)}
                className="w-full py-3 mt-2 rounded-xl font-semibold transition-transform transform hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(120deg, ${SHINY_PURPLE} 0%, #a855f7 100%)`,
                  color: '#ffffff',
                  boxShadow: `0 12px 30px ${SHINY_PURPLE}55`
                }}
              >
                Start Exploring Premium Stories
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Container */}
      {heroSeries.length > 0 && (
        <div 
          className="py-6 sm:py-8"
          style={{ backgroundColor: currentTheme.background }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <section 
              className="relative h-64 sm:h-72 md:h-80 overflow-hidden cursor-pointer select-none rounded-xl border-4 shadow-lg"
              style={{
                borderColor: `${currentTheme.foreground}70`,
                backgroundColor: currentTheme.background
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
              
              {/* Background overlay */}
              <div 
                className="absolute inset-0"
                style={{
                  background: themeGradients.overlay,
                  opacity: 0.2
                }}
              />
              
              {/* Side fade gradients */}
              <div 
                className="absolute inset-y-0 left-0 w-24 sm:w-32 md:w-48"
                style={{
                  background: `linear-gradient(to right, ${currentTheme.background} 0%, transparent 100%)`
                }}
              />
              <div 
                className="absolute inset-y-0 right-0 w-24 sm:w-32 md:w-48"
                style={{
                  background: `linear-gradient(to left, ${currentTheme.background} 0%, transparent 100%)`
                }}
              />
              
              <div className="relative h-full flex items-center px-6 sm:px-8">
                <div className="w-full flex items-center justify-between gap-6 sm:gap-8">
                  {/* Content Left */}
                  <div className="flex-1 z-10" style={{ color: currentTheme.foreground }}>
                    {/* Genre Tags */}
                    <div className="flex flex-wrap gap-2 mb-2 sm:mb-3">
                      {heroSeries[currentHero].genres.slice(0, 3).map((genre) => (
                        <span
                          key={genre.id}
                          className="genre-tag px-2 py-1 text-xs font-medium rounded-full cursor-default border"
                          style={{
                            backgroundColor: `${currentTheme.foreground}10`,
                            borderColor: `${currentTheme.foreground}20`,
                            color: currentTheme.foreground
                          }}
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>

                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 leading-tight">
                      {heroSeries[currentHero].title}
                    </h1>
                    
                    {heroSeries[currentHero].synopsis && (
                      <p 
                        className="text-xs sm:text-sm md:text-base mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-2xl"
                        style={{ 
                          color: `${currentTheme.foreground}90`
                        }}
                      >
                        {heroSeries[currentHero].synopsis}
                      </p>
                    )}
                    
                    <div 
                      className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm"
                      style={{ 
                        color: `${currentTheme.foreground}80`
                      }}
                    >
                      <span className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        {heroSeries[currentHero].rating}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{heroSeries[currentHero].status}</span>
                    </div>
                  </div>

                  {/* Cover Image Right */}
                  <div className="hidden md:block flex-shrink-0">
                    {heroSeries[currentHero].cover_url && (
                      <img
                        src={heroSeries[currentHero].cover_url}
                        alt={heroSeries[currentHero].title}
                        className="w-28 h-40 lg:w-32 lg:h-44 object-cover rounded-lg shadow-xl border-2"
                        style={{
                          borderColor: `${currentTheme.foreground}20`
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Dots Indicator */}
              {heroSeries.length > 1 && (
                <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                  {heroSeries.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentHero(index);
                      }}
                      className="w-2 h-2 rounded-full transition-all duration-200 border"
                      style={{
                        backgroundColor: index === currentHero 
                          ? currentTheme.foreground 
                          : 'transparent',
                        borderColor: currentTheme.foreground
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Blog Announcements */}
      {blogs && blogs.length > 0 && (
        <section 
          className="py-3 sm:py-4"
          style={{ backgroundColor: currentTheme.background }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-2">
              {blogs.map((blog) => (
                <Link
                  key={blog.id}
                  href={`/blog/${blog.id}`}
                  className="block group"
                >
                  <div 
                    className="card-hover rounded-lg py-3 px-4 flex items-center gap-3 transition-all duration-200"
                    style={{
                      backgroundColor: 'rgba(220, 38, 38, 0.1)',
                      borderLeft: '4px solid rgb(220, 38, 38)',
                    }}
                  >
                    {/* Announcement Icon (Megaphone) */}
                    <div className="flex-shrink-0">
                      <svg 
                        className="w-5 h-5 sm:w-6 sm:h-6" 
                        style={{ color: 'rgb(220, 38, 38)' }}
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" />
                      </svg>
                    </div>
                    
                    {/* Blog Title */}
                    <div className="flex-grow min-w-0">
                      <h3 
                        className="font-semibold text-sm sm:text-base truncate group-hover:text-red-600 transition-colors"
                        style={{ color: currentTheme.foreground }}
                      >
                        {blog.title}
                      </h3>
                    </div>

                    {/* Arrow Icon */}
                    <div className="flex-shrink-0">
                      <svg 
                        className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform" 
                        style={{ color: 'rgb(220, 38, 38)' }}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
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
            {popularSeries.map((series, index) => (
              <Link
                key={series.id}
                href={`/series/${series.slug}`}
                className={`group animate-in fade-in-up stagger-${Math.min(index + 1, 6)}`}
              >
                <div 
                  className="card-hover rounded-lg p-4 sm:p-5 h-full flex flex-col min-h-[280px]"
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
                    border: `1px solid ${currentTheme.foreground}10`,
                    boxShadow: `0 1px 3px ${currentTheme.foreground}10`
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
                          { chapter_number: latestNum, chapter_link: latestNum.toString(), is_premium: false },
                          latestNum > 1 ? { chapter_number: latestNum - 1, chapter_link: (latestNum - 1).toString(), is_premium: false } : null,
                        ]
                          .filter(Boolean)
                          .map((c: any, idx: number) => (
                            <div
                              key={`fallback-${idx}`}
                              className="interactive-scale flex items-center justify-between gap-2 p-1.5 rounded transition-all cursor-pointer"
                              style={{ backgroundColor: `${currentTheme.foreground}05` }}
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/series/${series.slug}/chapter/${c.chapter_link}`;
                              }}
                            >
                              <span
                                className="text-sm font-medium"
                                style={{ color: currentTheme.foreground }}
                              >
                                {formatChapterDisplay(c)}
                              </span>
                              {c.is_premium && <PremiumDiamond size={16} />}
                            </div>
                          ));
                      }

                      const chsDesc = [...chs].sort((a, b) => { const volDiff = (b.volume || 0) - (a.volume || 0); return volDiff !== 0 ? volDiff : b.chapter_number - a.chapter_number; });
                      return chsDesc.map((c) => (
                        <div
                          key={c.id ?? c.chapter_number}
                          className="flex items-center justify-between gap-2 p-1 rounded hover:bg-opacity-20 transition-all cursor-pointer"
                          style={{ backgroundColor: `${currentTheme.foreground}05` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/series/${series.slug}/chapter/${c.chapter_link}`;
                          }}
                        >
                          <span
                            className="text-sm font-medium"
                            style={{ color: currentTheme.foreground }}
                          >
                            {formatChapterDisplay(c)}
                          </span>
                          {c.is_premium && <PremiumDiamond size={16} />}
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center mt-auto">
                    <span className="star-icon text-yellow-500 text-sm inline-block">★</span>
                    <span 
                      className="text-sm ml-1 font-medium"
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
            {latestUpdates.map((series, index) => (
              <Link
                key={series.id}
                href={`/series/${series.slug}`}
                className={`group animate-in fade-in-up stagger-${Math.min(index + 1, 6)}`}
              >
                <div 
                  className="card-hover rounded-lg p-4 sm:p-5 h-full flex flex-col min-h-[280px]"
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
                    border: `1px solid ${currentTheme.foreground}10`,
                    boxShadow: `0 1px 3px ${currentTheme.foreground}10`
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
                                window.location.href = `/series/${series.slug}/chapter/${c.chapter_link}`;
                              }}
                            >
                              <span
                                className="text-sm font-medium"
                                style={{ color: currentTheme.foreground }}
                              >
                                {formatChapterDisplay(c)}
                              </span>
                              {c.is_premium && <PremiumDiamond size={16} />}
                            </div>
                          ));
                      }

                      const chsDesc = [...chs].sort((a, b) => { const volDiff = (b.volume || 0) - (a.volume || 0); return volDiff !== 0 ? volDiff : b.chapter_number - a.chapter_number; });
                      return chsDesc.map((c) => (
                        <div
                          key={c.id ?? c.chapter_number}
                          className="flex items-center justify-between gap-2 p-1 rounded hover:bg-opacity-20 transition-all cursor-pointer"
                          style={{ backgroundColor: `${currentTheme.foreground}05` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/series/${series.slug}/chapter/${c.chapter_link}`;
                          }}
                        >
                          <span
                            className="text-sm font-medium"
                            style={{ color: currentTheme.foreground }}
                          >
                            {formatChapterDisplay(c)}
                          </span>
                          {c.is_premium && <PremiumDiamond size={16} />}
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
            {newSeries.map((series, index) => (
              <Link
                key={series.id}
                href={`/series/${series.slug}`}
                className={`group animate-in fade-in-up stagger-${Math.min(index + 1, 6)}`}
              >
                <div 
                  className="card-hover rounded-lg p-4 sm:p-5 h-full flex flex-col min-h-[280px]"
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
                    border: `1px solid ${currentTheme.foreground}10`,
                    boxShadow: `0 1px 3px ${currentTheme.foreground}10`
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
                                window.location.href = `/series/${series.slug}/chapter/${c.chapter_link}`;
                              }}
                            >
                              <span
                                className="text-sm font-medium"
                                style={{ color: currentTheme.foreground }}
                              >
                                {formatChapterDisplay(c)}
                              </span>
                              {c.is_premium && <PremiumDiamond size={16} />}
                            </div>
                          ));
                      }

                      const chsDesc = [...chs].sort((a, b) => { const volDiff = (b.volume || 0) - (a.volume || 0); return volDiff !== 0 ? volDiff : b.chapter_number - a.chapter_number; });
                      return chsDesc.map((c) => (
                        <div
                          key={c.id ?? c.chapter_number}
                          className="flex items-center justify-between gap-2 p-1 rounded hover:bg-opacity-20 transition-all cursor-pointer"
                          style={{ backgroundColor: `${currentTheme.foreground}05` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/series/${series.slug}/chapter/${c.chapter_link}`;
                          }}
                        >
                          <span
                            className="text-sm font-medium"
                            style={{ color: currentTheme.foreground }}
                          >
                            {formatChapterDisplay(c)}
                          </span>
                          {c.is_premium && <PremiumDiamond size={16} />}
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
