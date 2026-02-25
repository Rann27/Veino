import React from 'react';
import { Link } from '@inertiajs/react';
import { useTheme, SHINY_PURPLE } from '@/Contexts/ThemeContext';
import PremiumDiamond from '@/Components/PremiumDiamond';

interface Chapter {
  id: number;
  title: string;
  chapter_number: number;
  chapter_link: string;
  volume?: number;
  is_premium: boolean;
  created_at?: string;
}

interface NativeLanguage {
  id: number;
  name: string;
  code: string;
}

interface LatestUpdateCardProps {
  series: {
    id: number;
    title: string;
    slug: string;
    cover_url?: string;
    rating: number;
    chapters_count?: number;
    chapters?: Chapter[];
    native_language?: NativeLanguage;
  };
  index?: number;
}

/**
 * Horizontal card for Latest Updates section
 * Displays: Cover (left) + Title & 4 chapter list (right)
 * Shows 2 latest premium + 2 latest free chapters (with fallback)
 */
export default function LatestUpdateCard({ series, index = 0 }: LatestUpdateCardProps) {
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

  const formatChapterDisplay = (chapter: Chapter): string => {
    if (chapter.volume) {
      return `Vol ${chapter.volume} Ch ${chapter.chapter_number}`;
    }
    return `Ch ${chapter.chapter_number}`;
  };

  const timeAgo = (dateStr?: string): string => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  /**
   * Get chapters to display in 2 groups:
   * - premiumGroup: 2 latest premium chapters (or filled with free if none)
   * - freeGroup: 2 latest free chapters (or filled with premium if none)
   * - hasBothTypes: whether both premium and free exist (to show separator)
   */
  const getChapterGroups = (): { premiumGroup: Chapter[]; freeGroup: Chapter[]; hasBothTypes: boolean } => {
    const allChapters = series.chapters || [];
    if (allChapters.length === 0) return { premiumGroup: [], freeGroup: [], hasBothTypes: false };

    // Sort by volume desc then chapter_number desc
    const sorted = [...allChapters].sort((a, b) => {
      const volDiff = (b.volume || 0) - (a.volume || 0);
      return volDiff !== 0 ? volDiff : b.chapter_number - a.chapter_number;
    });

    const premiumChs = sorted.filter((ch) => ch.is_premium);
    const freeChs = sorted.filter((ch) => !ch.is_premium);

    const hasBothTypes = premiumChs.length > 0 && freeChs.length > 0;

    let premiumGroup: Chapter[];
    let freeGroup: Chapter[];

    if (premiumChs.length === 0) {
      // No premium → all 4 slots go to free, no split
      premiumGroup = [];
      freeGroup = freeChs.slice(0, 4);
    } else if (freeChs.length === 0) {
      // No free → all 4 slots go to premium, no split
      premiumGroup = premiumChs.slice(0, 4);
      freeGroup = [];
    } else {
      // Both exist: 2 premium + 2 free
      premiumGroup = premiumChs.slice(0, 2);
      freeGroup = freeChs.slice(0, 2);
    }

    return { premiumGroup, freeGroup, hasBothTypes };
  };

  const { premiumGroup, freeGroup, hasBothTypes } = getChapterGroups();

  // Dummy rows to pad chapter list to always 4 slots
  const premiumDummies = hasBothTypes ? Math.max(0, 2 - premiumGroup.length) : 0;
  const freeDummies = hasBothTypes
    ? Math.max(0, 2 - freeGroup.length)
    : Math.max(0, 4 - (premiumGroup.length + freeGroup.length));

  const DummyRow = () => (
    <div className="px-2.5 py-1.5 rounded-lg">
      <span className="invisible text-xs">placeholder</span>
    </div>
  );

  const ChapterRow = ({ chapter }: { chapter: Chapter }) => (
    <Link
      href={`/series/${series.slug}/chapter/${chapter.chapter_link}`}
      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg transition-all hover:opacity-70"
      style={{ backgroundColor: `${currentTheme.foreground}04` }}
    >
      <div className="flex items-center gap-1 min-w-0">
        <span
          className="text-xs sm:text-[13px] font-medium truncate"
          style={{ color: `${currentTheme.foreground}80` }}
        >
          {formatChapterDisplay(chapter)}
        </span>
        {chapter.is_premium && (
          <span className="flex-shrink-0">
            <PremiumDiamond size={12} />
          </span>
        )}
      </div>
      <span
        className="text-[10px] sm:text-xs flex-shrink-0 tabular-nums"
        style={{ color: `${currentTheme.foreground}40` }}
      >
        {timeAgo(chapter.created_at)}
      </span>
    </Link>
  );

  return (
    <div className={`group animate-in fade-in-up stagger-${Math.min(index + 1, 8)}`}>
      <div
        className="rounded-xl overflow-hidden flex h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
        style={{
          backgroundColor: getCardBg(),
          border: `1px solid ${currentTheme.foreground}08`,
        }}
      >
        {/* Cover - Left */}
        <Link href={`/series/${series.slug}`} className="flex-shrink-0 w-[110px] sm:w-[120px]">
          <div className="h-full overflow-hidden">
            {series.cover_url ? (
              <img
                src={series.cover_url}
                alt={series.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center min-h-[180px]"
                style={{
                  backgroundColor: `${currentTheme.foreground}08`,
                  color: `${currentTheme.foreground}30`,
                }}
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                </svg>
              </div>
            )}
          </div>
        </Link>

        {/* Info - Right */}
        <div className="flex-1 p-3 sm:p-4 flex flex-col min-w-0">
          <Link href={`/series/${series.slug}`}>
            <h3
              className="font-semibold text-sm sm:text-[15px] line-clamp-2 mb-3 leading-snug group-hover:opacity-80 transition-opacity min-h-[2.5rem]"
              style={{ color: currentTheme.foreground }}
            >
              {series.title}
            </h3>
          </Link>

          {/* Chapter List — 2 premium + separator + 2 free, padded with dummies */}
          <div className="flex-1 flex flex-col">
            {/* Top group (premium or fallback) */}
            <div className="space-y-1">
              {premiumGroup.map((chapter) => <ChapterRow key={chapter.id} chapter={chapter} />)}
              {Array.from({ length: premiumDummies }).map((_, i) => <DummyRow key={`pd-${i}`} />)}
            </div>

            {/* Dashed separator — only when both types exist */}
            {hasBothTypes && (
              <div
                className="my-1.5 mx-2.5 border-t border-dashed"
                style={{ borderColor: `${currentTheme.foreground}18` }}
              />
            )}

            {/* Bottom group (free or fallback) */}
            <div className="space-y-1">
              {freeGroup.map((chapter) => <ChapterRow key={chapter.id} chapter={chapter} />)}
              {Array.from({ length: freeDummies }).map((_, i) => <DummyRow key={`fd-${i}`} />)}
            </div>

            {premiumGroup.length === 0 && freeGroup.length === 0 && (
              <p
                className="text-xs px-2.5 py-1.5"
                style={{ color: `${currentTheme.foreground}30` }}
              >
                No chapters yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
