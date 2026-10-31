import React from 'react';
import { Link } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';
import PremiumDiamond from '@/Components/PremiumDiamond';
import CoverImage from '@/Components/CoverImage';

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
    type?: 'light-novel' | 'web-novel';
    cover_url?: string;
    thumb_url?: string | null;
    rating: number | string | null;
    chapters_count?: number;
    chapters?: Chapter[];
    native_language?: NativeLanguage;
  };
  index?: number;
}

/**
 * Horizontal card for Latest Updates section in quiet editorial style
 */
export default function LatestUpdateCard({ series }: LatestUpdateCardProps) {
  const { currentTheme } = useTheme();

  const formatChapterDisplay = (chapter: Chapter): string => {
    if (series.type === 'light-novel') {
      const title = chapter.title.trim();
      const titlePrefix = title.includes(':') ? title.slice(0, title.indexOf(':')).trim() : title;
      return `Vol ${chapter.volume ?? chapter.chapter_number} ${titlePrefix || title}`;
    }
    return `Chapter ${chapter.chapter_number}`;
  };

  const timeAgo = (dateStr?: string): string => {
    if (!dateStr) return '';
    const diff = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000));
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getChapterGroups = (): { premiumGroup: Chapter[]; freeGroup: Chapter[]; hasBothTypes: boolean } => {
    const allChapters = series.chapters || [];
    if (allChapters.length === 0) return { premiumGroup: [], freeGroup: [], hasBothTypes: false };

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
      premiumGroup = [];
      freeGroup = freeChs.slice(0, 4);
    } else if (freeChs.length === 0) {
      premiumGroup = premiumChs.slice(0, 4);
      freeGroup = [];
    } else {
      premiumGroup = premiumChs.slice(0, 2);
      freeGroup = freeChs.slice(0, 4 - premiumGroup.length);
    }

    return { premiumGroup, freeGroup, hasBothTypes };
  };

  const { premiumGroup, freeGroup, hasBothTypes } = getChapterGroups();
  const freeDummies = Math.max(0, 4 - premiumGroup.length - freeGroup.length);

  const DummyRow = () => (
    <div className="px-2 py-1 rounded-lg">
      <span className="invisible text-xs">placeholder</span>
    </div>
  );

  const ChapterRow = ({ chapter }: { chapter: Chapter }) => (
    <Link
      href={`/series/${series.slug}/chapter/${chapter.chapter_link}`}
      className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg transition-colors hover:opacity-75"
      style={{ backgroundColor: `${currentTheme.foreground}05` }}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className="text-xs font-medium truncate"
          style={{ color: `${currentTheme.foreground}85` }}
        >
          {formatChapterDisplay(chapter)}
        </span>
        {chapter.is_premium && (
          <span className="flex-shrink-0">
            <PremiumDiamond size={13} />
          </span>
        )}
      </div>
      <span
        className="text-[10px] flex-shrink-0 tabular-nums"
        style={{ color: `${currentTheme.foreground}45` }}
      >
        {timeAgo(chapter.created_at)}
      </span>
    </Link>
  );

  return (
    <div className="group h-full">
      <div
        className="rounded-lg overflow-hidden flex h-full border transition-transform duration-180 ease-out hover:-translate-y-0.5"
        style={{
          backgroundColor: `${currentTheme.foreground}08`,
          borderColor: `${currentTheme.foreground}15`,
        }}
      >
        {/* Cover - Left */}
        <Link href={`/series/${series.slug}`} className="flex-shrink-0 w-[105px] sm:w-[115px] self-stretch">
          <CoverImage
            src={series.thumb_url ?? series.cover_url}
            alt={series.title}
            aspectClass=""
            containerClassName="h-full min-h-[175px] rounded-none"
            hoverScale={false}
          />
        </Link>

        {/* Info - Right */}
        <div className="flex-1 p-3 flex flex-col min-w-0">
          <Link href={`/series/${series.slug}`}>
            <h3
              className="font-medium text-sm line-clamp-2 mb-2.5 leading-snug group-hover:opacity-80 transition-opacity min-h-[2.25rem]"
              style={{ color: currentTheme.foreground }}
            >
              {series.title}
            </h3>
          </Link>

          {/* Chapter List */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="space-y-1">
              {premiumGroup.map((chapter) => <ChapterRow key={chapter.id} chapter={chapter} />)}
            </div>

            {hasBothTypes && (
              <div
                className="my-1.5 mx-1 border-t"
                style={{ borderColor: `${currentTheme.foreground}12` }}
              />
            )}

            <div className="space-y-1">
              {freeGroup.map((chapter) => <ChapterRow key={chapter.id} chapter={chapter} />)}
              {Array.from({ length: freeDummies }).map((_, i) => <DummyRow key={`fd-${i}`} />)}
            </div>

            {premiumGroup.length === 0 && freeGroup.length === 0 && (
              <p
                className="text-xs px-2 py-1"
                style={{ color: `${currentTheme.foreground}40` }}
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
