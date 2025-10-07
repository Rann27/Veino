import React from 'react';
import { Link } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';

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
        {/* Cover Image */}
        <div className="aspect-[2/3] bg-gray-200 rounded-md mb-3 overflow-hidden">
          {series.cover_url ? (
            <img
              src={series.cover_url}
              alt={series.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
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
        
        {/* Title */}
        <h3 
          className="font-semibold text-sm md:text-base line-clamp-2 mb-3 leading-tight"
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
