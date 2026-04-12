import React from 'react';
import { Link } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';
import CoverImage from '@/Components/CoverImage';
import { getCardBg } from '@/constants/colors';

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

  return (
    <Link
      href={`/series/${series.slug}`}
      className={`group block animate-in fade-in-up stagger-${Math.min(index + 1, 8)}`}
    >
      <div
        className="series-card rounded-xl overflow-hidden h-full flex flex-col"
        style={{
          backgroundColor: getCardBg(currentTheme.name),
          border: `1px solid ${currentTheme.foreground}08`,
        }}
      >
        {/* Cover Image with zoom */}
        <div className="overflow-hidden">
          <CoverImage
            src={series.cover_url}
            alt={series.title}
            aspectClass="aspect-[2/3]"
            containerClassName="cover-zoom"
            hoverScale={false}
          />
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col flex-1">
          {/* Title */}
          <h3
            className="series-card-title font-semibold text-[13px] sm:text-sm line-clamp-2 mb-2 leading-snug transition-colors duration-200"
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
