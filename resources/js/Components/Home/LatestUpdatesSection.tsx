import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';
import LatestUpdateCard from './LatestUpdateCard';

interface Chapter {
  id: number;
  title: string;
  chapter_number: number;
  chapter_link: string;
  volume?: number;
  is_premium: boolean;
}

interface NativeLanguage {
  id: number;
  name: string;
  code: string;
}

interface Genre {
  id: number;
  name: string;
}

interface Series {
  id: number;
  title: string;
  slug: string;
  cover_url?: string;
  rating: number;
  chapters_count?: number;
  chapters?: Chapter[];
  native_language?: NativeLanguage;
  genres?: Genre[];
}

type TabType = 'all' | 'light-novel' | 'web-novel';

interface LatestUpdatesSectionProps {
  initialData: Series[];
}

export default function LatestUpdatesSection({ initialData }: LatestUpdatesSectionProps) {
  const { currentTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [data, setData] = useState<Record<TabType, Series[]>>({
    'all': initialData,
    'light-novel': [],
    'web-novel': [],
  });
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState<Record<TabType, boolean>>({
    'all': true,
    'light-novel': false,
    'web-novel': false,
  });
  const contentRef = useRef<HTMLDivElement>(null);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'light-novel', label: 'Light Novel' },
    { key: 'web-novel', label: 'Web Novel' },
  ];

  const fetchTab = useCallback(async (type: TabType) => {
    if (loaded[type]) {
      setActiveTab(type);
      return;
    }

    setLoading(true);
    setActiveTab(type);

    try {
      const res = await fetch(`/api/home/latest-updates?type=${type}`);
      if (res.ok) {
        const json = await res.json();
        setData((prev) => ({ ...prev, [type]: json }));
        setLoaded((prev) => ({ ...prev, [type]: true }));
      }
    } catch (err) {
      console.error('Failed to fetch latest updates:', err);
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  const currentData = data[activeTab];

  // Skeleton loader
  const SkeletonCard = () => (
    <div
      className="rounded-xl overflow-hidden flex h-[180px] animate-pulse"
      style={{
        backgroundColor: `${currentTheme.foreground}06`,
        border: `1px solid ${currentTheme.foreground}05`,
      }}
    >
      <div
        className="w-[110px] sm:w-[120px] flex-shrink-0"
        style={{ backgroundColor: `${currentTheme.foreground}08` }}
      />
      <div className="flex-1 p-4 space-y-3">
        <div
          className="h-4 rounded w-3/4"
          style={{ backgroundColor: `${currentTheme.foreground}08` }}
        />
        <div
          className="h-3 rounded w-1/2"
          style={{ backgroundColor: `${currentTheme.foreground}06` }}
        />
        <div className="space-y-2 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-3 rounded w-full"
              style={{ backgroundColor: `${currentTheme.foreground}05` }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-8 sm:py-12" style={{ backgroundColor: currentTheme.background }}>
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16">
        {/* Header with tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2
            className="text-xl sm:text-2xl font-bold"
            style={{ color: currentTheme.foreground }}
          >
            Latest Updates
          </h2>

          <div className="flex items-center gap-1">
            {/* Tab buttons */}
            <div
              className="inline-flex rounded-lg p-1"
              style={{
                backgroundColor: `${currentTheme.foreground}06`,
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => fetchTab(tab.key)}
                  className="relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200"
                  style={{
                    backgroundColor:
                      activeTab === tab.key ? `${currentTheme.foreground}12` : 'transparent',
                    color:
                      activeTab === tab.key
                        ? currentTheme.foreground
                        : `${currentTheme.foreground}50`,
                    ...(activeTab === tab.key && {
                      boxShadow: `0 1px 3px ${currentTheme.foreground}08`,
                    }),
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* View All link */}
            <Link
              href={`/explore?sort=latest${activeTab !== 'all' ? `&type=${activeTab}` : ''}`}
              className="text-sm font-medium hover:opacity-70 transition-opacity flex items-center gap-1 ml-3"
              style={{ color: `${currentTheme.foreground}70` }}
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Content grid */}
        <div ref={contentRef} className="relative min-h-[200px]">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {currentData.map((series, i) => (
                <LatestUpdateCard key={series.id} series={series} index={i} />
              ))}
              {currentData.length === 0 && (
                <div
                  className="col-span-full text-center py-12 text-sm"
                  style={{ color: `${currentTheme.foreground}40` }}
                >
                  No updates found for this category.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
