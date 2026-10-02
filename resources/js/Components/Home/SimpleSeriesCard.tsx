import React from 'react';
import { Link } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';
import CoverImage from '@/Components/CoverImage';

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
    thumb_url?: string | null;
    rating: number;
    native_language?: NativeLanguage;
  };
  index?: number;
}

/**
 * Simple card for Featured Series & New Series sections in quiet editorial style
 */
export default function SimpleSeriesCard({ series }: SimpleSeriesCardProps) {
  const { currentTheme } = useTheme();

  return (
    <Link
      href={`/series/${series.slug}`}
      className="group block h-full"
    >
      <div
        className="series-card rounded-lg overflow-hidden h-full flex flex-col border transition-transform duration-180 ease-out hover:-translate-y-0.5"
        style={{
          backgroundColor: `${currentTheme.foreground}08`,
          borderColor: `${currentTheme.foreground}15`,
        }}
      >
        {/* Cover Image */}
        <div className="overflow-hidden">
          <CoverImage
            src={series.thumb_url ?? series.cover_url}
            alt={series.title}
            aspectClass="aspect-[2/3]"
            containerClassName="cover-zoom rounded-none"
            hoverScale={false}
          />
        </div>

        {/* Info */}
        <div className="p-2.5 sm:p-3 flex flex-col flex-1">
          {/* Title */}
          <h3
            className="font-medium text-xs sm:text-sm line-clamp-2 mb-2 leading-snug group-hover:opacity-80 transition-opacity"
            style={{ color: currentTheme.foreground }}
          >
            {series.title}
          </h3>

          {/* Rating + Language */}
          <div className="flex items-center justify-between mt-auto gap-2 pt-1">
            <div className="flex items-center gap-1">
              <span className="text-amber-500 text-xs">★</span>
              <span
                className="text-xs font-medium"
                style={{ color: `${currentTheme.foreground}70` }}
              >
                {series.rating}
              </span>
            </div>
            {series.native_language && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-md font-medium truncate max-w-[80px]"
                style={{
                  backgroundColor: `${currentTheme.foreground}06`,
                  color: `${currentTheme.foreground}60`,
                  border: `1px solid ${currentTheme.foreground}10`,
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
