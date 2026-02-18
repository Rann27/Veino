import React from 'react';
import { Link } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';

interface NativeLanguage {
  id: number;
  name: string;
  code: string;
}

interface SimpleSeriesCardProps {
  series: {
    id: number;
    title: string;
    slug: string;
    cover_url?: string;
    rating: number;
    native_language?: NativeLanguage;
  };
  index?: number;
}

/**
 * Simple card for Featured Series & New Series sections
 * Displays: Cover, Title, Rating, Language
 */
export default function SimpleSeriesCard({ series, index = 0 }: SimpleSeriesCardProps) {
  const { currentTheme } = useTheme();

  const getCardBg = () => {
    switch (currentTheme.name) {
      case 'Light': return 'rgba(248, 250, 252, 0.9)';
      case 'Dark': return 'rgba(30, 41, 59, 0.6)';
      case 'Sepia': return 'rgba(244, 236, 216, 0.7)';
      case 'Cool Dark': return 'rgba(49, 50, 68, 0.6)';
      case 'Frost': return 'rgba(205, 220, 237, 0.7)';
      case 'Solarized': return 'rgba(253, 246, 227, 0.7)';
      default: return 'rgba(30, 41, 59, 0.6)';
    }
  };

  return (
    <Link
      href={`/series/${series.slug}`}
      className={`group block animate-in fade-in-up stagger-${Math.min(index + 1, 8)}`}
    >
      <div
        className="rounded-xl overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        style={{
          backgroundColor: getCardBg(),
          border: `1px solid ${currentTheme.foreground}08`,
        }}
      >
        {/* Cover Image */}
        <div className="aspect-[2/3] overflow-hidden relative">
          {series.cover_url ? (
            <img
              src={series.cover_url}
              alt={series.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                backgroundColor: `${currentTheme.foreground}08`,
                color: `${currentTheme.foreground}30`,
              }}
            >
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col flex-1">
          {/* Title */}
          <h3
            className="font-semibold text-[13px] sm:text-sm line-clamp-2 mb-2 leading-snug"
            style={{ color: currentTheme.foreground }}
          >
            {series.title}
          </h3>

          {/* Rating + Language */}
          <div className="flex items-center justify-between mt-auto gap-2">
            <div className="flex items-center gap-1">
              <span className="text-yellow-500 text-xs">★</span>
              <span
                className="text-xs font-medium"
                style={{ color: `${currentTheme.foreground}70` }}
              >
                {series.rating}
              </span>
            </div>
            {series.native_language && (
              <span
                className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-medium truncate max-w-[80px]"
                style={{
                  backgroundColor: `${currentTheme.foreground}06`,
                  color: `${currentTheme.foreground}50`,
                  border: `1px solid ${currentTheme.foreground}08`,
                }}
              >
                {series.native_language.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
