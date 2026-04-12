import React from 'react';
import { Link } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';
import PremiumDiamond from '@/Components/PremiumDiamond';
import CoverImage from '@/Components/CoverImage';
import { getCardBg } from '@/constants/colors';

interface Genre {
  id: number;
  name: string;
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
  slug: string;
  cover_url?: string;
  rating: number;
  chapters_count?: number;
  chapters?: Chapter[];
}

interface SeriesCardProps {
  series: Series;
  index?: number;
}

export default function SeriesCard({ series, index = 0 }: SeriesCardProps) {
  const { currentTheme } = useTheme();

  // Helper function to format chapter display
  const formatChapterDisplay = (chapter: Chapter): string => {
    if (chapter.volume) {
      return `Vol ${chapter.volume} Ch ${chapter.chapter_number}`;
    }
    return `Chapter ${chapter.chapter_number}`;
  };

  return (
    <Link
      href={`/series/${series.slug}`}
      className={`group animate-in fade-in-up stagger-${Math.min(index + 1, 6)}`}
    >
      <div
        className="series-card rounded-lg p-4 sm:p-5 h-full flex flex-col min-h-[280px]"
        style={{
          backgroundColor: getCardBg(currentTheme.name),
          border: `1px solid ${currentTheme.foreground}10`,
          boxShadow: `0 1px 3px ${currentTheme.foreground}10`,
        }}
      >
        {/* Cover Image with zoom on card hover */}
        <div className="mb-3 overflow-hidden rounded-lg">
          <CoverImage
            src={series.cover_url}
            alt={series.title}
            containerClassName="cover-zoom"
            hoverScale={false}
          />
        </div>

        {/* Title */}
        <h3
          className="series-card-title font-semibold text-sm md:text-base line-clamp-2 mb-3 leading-tight transition-colors duration-200"
          style={{ color: currentTheme.foreground }}
        >
          {series.title}
        </h3>

        {/* Latest Chapters */}
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
                    key={`fallback-${idx}`}
                    className="interactive-scale flex items-center justify-between gap-2 p-1.5 rounded transition-all cursor-pointer hover:shadow-sm"
                    style={{ 
                      backgroundColor: `${currentTheme.foreground}05`,
                    }}
                    onClick={(e) => {
                      e.preventDefault();
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
                      <PremiumDiamond size={16} className="flex-shrink-0" />
                    )}
                  </div>
                ));
            }

            const chsDesc = [...chs].sort((a, b) => b.chapter_number - a.chapter_number);
            return chsDesc.map((c) => (
              <div
                key={c.id ?? c.chapter_number}
                className="interactive-scale flex items-center justify-between gap-2 p-1.5 rounded transition-all cursor-pointer hover:shadow-sm"
                style={{ 
                  backgroundColor: `${currentTheme.foreground}05`,
                }}
                onClick={(e) => {
                  e.preventDefault();
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
                  <PremiumDiamond size={16} className="flex-shrink-0" />
                )}
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
  );
}
