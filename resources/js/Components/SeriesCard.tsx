import React from 'react';
import { Link } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';
import PremiumDiamond from '@/Components/PremiumDiamond';
import CoverImage from '@/Components/CoverImage';

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
  thumb_url?: string | null;
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
      className="group block h-full"
    >
      <div
        className="series-card rounded-lg p-3.5 sm:p-4 h-full flex flex-col min-h-[280px] transition-all duration-200"
        style={{
          backgroundColor: `${currentTheme.foreground}08`,
          border: `1px solid ${currentTheme.foreground}15`,
        }}
      >
        {/* Cover Image — the only saturated element */}
        <div className="mb-3 overflow-hidden rounded-lg">
          <CoverImage
            src={series.thumb_url ?? series.cover_url}
            alt={series.title}
            containerClassName="cover-zoom"
            hoverScale={false}
          />
        </div>

        {/* Title — quiet editorial typography */}
        <h3
          className="series-card-title font-medium text-sm md:text-base line-clamp-2 mb-2.5 leading-snug group-hover:opacity-80 transition-opacity duration-150"
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
                    className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                    style={{
                      backgroundColor: `${currentTheme.foreground}06`,
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.location.href = `/series/${series.slug}/chapter/${c.chapter_number}`;
                    }}
                  >
                    <span
                      className="font-medium truncate"
                      style={{ color: `${currentTheme.foreground}90` }}
                    >
                      {formatChapterDisplay(c)}
                    </span>
                    {c.is_premium && (
                      <PremiumDiamond size={14} className="flex-shrink-0" />
                    )}
                  </div>
                ));
            }

            const chsDesc = [...chs].sort((a, b) => b.chapter_number - a.chapter_number);
            return chsDesc.map((c) => (
              <div
                key={c.id ?? c.chapter_number}
                className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                style={{
                  backgroundColor: `${currentTheme.foreground}06`,
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `/series/${series.slug}/chapter/${c.chapter_number}`;
                }}
              >
                <span
                  className="font-medium truncate"
                  style={{ color: `${currentTheme.foreground}90` }}
                >
                  {formatChapterDisplay(c)}
                </span>
                {c.is_premium && (
                  <PremiumDiamond size={14} className="flex-shrink-0" />
                )}
              </div>
            ));
          })()}
        </div>

        {/* Rating */}
        <div className="flex items-center mt-auto pt-2" style={{ borderTop: `1px solid ${currentTheme.foreground}08` }}>
          <span className="text-amber-500 text-xs inline-block">★</span>
          <span
            className="text-xs ml-1 font-medium"
            style={{ color: `${currentTheme.foreground}70` }}
          >
            {series.rating}
          </span>
        </div>
      </div>
    </Link>
  );
}
