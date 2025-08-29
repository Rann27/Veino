import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';

interface Genre {
  id: number;
  name: string;
}

interface NativeLanguage {
  id: number;
  name: string;
  code: string;
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
}

interface HomeProps {
  heroSeries: Series[];
  popularSeries: Series[];
  latestUpdates: Series[];
}

export default function Home({ heroSeries, popularSeries, latestUpdates }: HomeProps) {
  const [currentHero, setCurrentHero] = useState(0);

  const nextHero = () => {
    setCurrentHero((prev) => (prev + 1) % heroSeries.length);
  };

  const prevHero = () => {
    setCurrentHero((prev) => (prev - 1 + heroSeries.length) % heroSeries.length);
  };

  return (
    <UserLayout title="Veinovel - Read Best Web Novels">
      <Head title="Home" />

      {/* Hero Slider */}
      {heroSeries.length > 0 && (
        <section className="relative h-96 bg-gradient-to-r from-blue-600 to-purple-700 overflow-hidden">
          <div className="absolute inset-0">
            {heroSeries[currentHero].cover_url && (
              <img
                src={heroSeries[currentHero].cover_url}
                alt={heroSeries[currentHero].title}
                className="w-full h-full object-cover opacity-20"
              />
            )}
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="max-w-2xl text-white">
              <h1 className="text-4xl font-bold mb-4">
                {heroSeries[currentHero].title}
              </h1>
              {heroSeries[currentHero].alternative_title && (
                <p className="text-xl text-gray-200 mb-4">
                  {heroSeries[currentHero].alternative_title}
                </p>
              )}
              <p className="text-gray-300 mb-6 line-clamp-3">
                {heroSeries[currentHero].synopsis || 'No synopsis available.'}
              </p>
              <div className="flex items-center space-x-4 mb-6">
                <span className="bg-yellow-500 text-black px-2 py-1 rounded text-sm font-bold">
                  ★ {heroSeries[currentHero].rating}
                </span>
                <span className="text-gray-300">
                  {heroSeries[currentHero].native_language.name}
                </span>
                <span className="text-gray-300 capitalize">
                  {heroSeries[currentHero].status}
                </span>
              </div>
              <Link
                href={`/series/${heroSeries[currentHero].slug}`}
                className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Read Now
              </Link>
            </div>
          </div>

          {/* Navigation */}
          {heroSeries.length > 1 && (
            <>
              <button
                onClick={prevHero}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextHero}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Dots indicator */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {heroSeries.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentHero(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentHero ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* Popular Series */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Popular Series</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {popularSeries.map((series) => (
            <Link
              key={series.id}
              href={`/series/${series.slug}`}
              className="group"
            >
              <div className="aspect-[3/4] bg-gray-200 rounded-lg overflow-hidden mb-3 shadow-sm group-hover:shadow-md transition-shadow">
                {series.cover_url ? (
                  <img
                    src={series.cover_url}
                    alt={series.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Cover
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                {series.title}
              </h3>
              <p className="text-xs text-gray-500">
                {series.native_language.name} • {series.chapters_count} chapters
              </p>
              <div className="flex items-center mt-1">
                <span className="text-yellow-500 text-xs">★</span>
                <span className="text-xs text-gray-600 ml-1">{series.rating}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Updates */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Latest Updates</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {latestUpdates.map((series) => (
            <Link
              key={series.id}
              href={`/series/${series.slug}`}
              className="group"
            >
              <div className="aspect-[3/4] bg-gray-200 rounded-lg overflow-hidden mb-3 shadow-sm group-hover:shadow-md transition-shadow">
                {series.cover_url ? (
                  <img
                    src={series.cover_url}
                    alt={series.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Cover
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                {series.title}
              </h3>
              <p className="text-xs text-gray-500">
                {series.native_language.name} • Updated {new Date(series.updated_at).toLocaleDateString()}
              </p>
              <div className="flex items-center mt-1">
                <span className="text-yellow-500 text-xs">★</span>
                <span className="text-xs text-gray-600 ml-1">{series.rating}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </UserLayout>
  );
}
