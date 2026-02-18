import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme, SHINY_PURPLE } from '@/Contexts/ThemeContext';
import PremiumDiamond from '@/Components/PremiumDiamond';
import BannerSlider from '@/Components/Home/BannerSlider';
import HeroSection from '@/Components/Home/HeroSection';
import SimpleSeriesCard from '@/Components/Home/SimpleSeriesCard';
import LatestUpdatesSection from '@/Components/Home/LatestUpdatesSection';

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
  chapters?: Chapter[];
}

interface Banner {
  image_url: string;
  link_url?: string;
  alt?: string;
}

interface Blog {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

interface HomeProps {
  heroSeries: Series[];
  featuredSeries: Series[];
  latestUpdates: Series[];
  newSeries: Series[];
  blogs: Blog[];
  banners: Banner[];
  showPremiumCongrats?: boolean;
}

function HomeContent({
  heroSeries,
  featuredSeries,
  latestUpdates,
  newSeries,
  blogs,
  banners,
  showPremiumCongrats,
}: HomeProps) {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { currentTheme } = useTheme();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('premium') === 'activated') {
      setShowPremiumModal(true);
      params.delete('premium');
      const newSearch = params.toString();
      const newUrl = newSearch
        ? `${window.location.pathname}?${newSearch}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } else if (showPremiumCongrats) {
      setShowPremiumModal(true);
    }
  }, [showPremiumCongrats]);

  return (
    <>
      <Head>
        <title>Home</title>
        <meta name="description" content="Find your favorite novels here!" />
        <meta name="keywords" content="english novels, web novels, online reading, premium stories, fiction, romance, fantasy, light novels, webnovel platform" />
        <meta property="og:title" content="VeiNovel" />
        <meta property="og:description" content="Discover amazing English novels from talented authors worldwide. Premium reading experience with our innovative coin system." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="VeiNovel" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="VeiNovel - Premium English Novels" />
        <meta name="twitter:description" content="Discover amazing English novels from talented authors worldwide." />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="author" content="VeiNovel" />
        <link rel="canonical" href="https://veinovel.com" />
      </Head>

      {/* ─── Premium Congratulations Modal ─── */}
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
              boxShadow: `0 20px 60px ${SHINY_PURPLE}50`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 pointer-events-none">
              <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <radialGradient id="premiumGlow" cx="50%" cy="0%" r="100%">
                    <stop offset="0%" stopColor={SHINY_PURPLE} stopOpacity="0.8" />
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
                  style={{ background: `${SHINY_PURPLE}26`, boxShadow: `0 0 40px ${SHINY_PURPLE}6b` }}
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
                  'Exclusive badge and early releases',
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-4 border"
                    style={{
                      borderColor: `${SHINY_PURPLE}55`,
                      backgroundColor: `${SHINY_PURPLE}10`,
                      color: '#f8f5ff',
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
                  boxShadow: `0 12px 30px ${SHINY_PURPLE}55`,
                }}
              >
                Start Exploring Premium Stories
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 1. Banner Slider Section ─── */}
      {banners && banners.length > 0 && <BannerSlider banners={banners} />}

      {/* ─── 2. Hero Section ─── */}
      <HeroSection heroSeries={heroSeries} />

      {/* ─── Blog Announcements ─── */}
      {blogs && blogs.length > 0 && (
        <section className="py-3 sm:py-4" style={{ backgroundColor: currentTheme.background }}>
          <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16">
            <div className="space-y-2">
              {blogs.map((blog) => (
                <Link key={blog.id} href={`/blog/${blog.id}`} className="block group">
                  <div
                    className="rounded-lg py-3 px-4 flex items-center gap-3 transition-all duration-200 hover:shadow-md"
                    style={{
                      backgroundColor: 'rgba(220, 38, 38, 0.08)',
                      borderLeft: '4px solid rgb(220, 38, 38)',
                    }}
                  >
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: 'rgb(220, 38, 38)' }} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" />
                      </svg>
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3
                        className="font-semibold text-sm sm:text-base truncate group-hover:text-red-600 transition-colors"
                        style={{ color: currentTheme.foreground }}
                      >
                        {blog.title}
                      </h3>
                    </div>
                    <div className="flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform" style={{ color: 'rgb(220, 38, 38)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* ─── 3. Featured Series Section ─── */}
      <section className="py-8 sm:py-12" style={{ backgroundColor: currentTheme.background }}>
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-1 h-6 rounded-full"
                style={{ backgroundColor: currentTheme.foreground }}
              />
              <h2
                className="text-xl sm:text-2xl font-bold"
                style={{ color: currentTheme.foreground }}
              >
                Featured Series
              </h2>
            </div>
          </div>

          {/* Mobile: Horizontal scroll slider */}
          <div className="sm:hidden -mx-4 px-4">
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {featuredSeries.map((series, i) => (
                <div key={series.id} className="flex-shrink-0 w-[130px] snap-start">
                  <SimpleSeriesCard series={series} index={i} />
                </div>
              ))}
            </div>
          </div>

          {/* Desktop/Tablet: Grid */}
          <div className="hidden sm:grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
            {featuredSeries.map((series, i) => (
              <SimpleSeriesCard key={series.id} series={series} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. Latest Updates Section (Tabbed) ─── */}
      <LatestUpdatesSection initialData={latestUpdates} />

      {/* ─── 5. New Series Section ─── */}
      <section className="py-8 sm:py-12" style={{ backgroundColor: currentTheme.background }}>
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-1 h-6 rounded-full"
                style={{
                  background: `linear-gradient(to bottom, ${currentTheme.foreground}80, ${currentTheme.foreground}20)`,
                }}
              />
              <h2
                className="text-xl sm:text-2xl font-bold"
                style={{ color: currentTheme.foreground }}
              >
                New Series
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
            {newSeries.map((series, i) => (
              <SimpleSeriesCard key={series.id} series={series} index={i} />
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
