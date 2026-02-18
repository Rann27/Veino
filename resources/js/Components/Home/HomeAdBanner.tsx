import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';

declare global {
  interface Window {
    __clickadillaLastReloadAt?: number;
  }
}

interface PageProps {
  auth?: {
    user?: {
      id: number;
      membership_tier: 'basic' | 'premium';
    };
  };
  [key: string]: any;
}

interface HomeAdBannerProps {
  position: 'top' | 'bottom';
}

/**
 * Clickadilla Banner Grid
 * Desktop: 6 cols × 1 row (300x250)
 * Mobile: 1 col × 2 rows (300x100)
 */
export default function HomeAdBanner({ position }: HomeAdBannerProps) {
  const page = usePage<PageProps>();
  const { auth } = page.props;
  const { currentTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  const CLICKADILLA_SCRIPT_SRC = 'https://js.wpadmngr.com/static/adManager.js';
  const CLICKADILLA_ADMP_IDS = ['425375', '425377', '425379'];

  // Premium users don't see ads
  if (auth?.user?.membership_tier === 'premium') {
    return null;
  }

  // Clickadilla banner IDs
  const adSlots = {
    top: [
      {
        desktop: ['1480979', '1480980', '1480982', '1480981', '1480992', '1480993'],
        mobile: ['1480987', '1480988'],
      },
    ],
    bottom: [
      {
        desktop: ['1480983', '1480985', '1480984', '1480986', '1480994', '1480995'],
        mobile: ['1480990', '1480989'],
      },
    ],
  };

  const desktopIds = adSlots[position][0].desktop;
  const mobileIds = adSlots[position][0].mobile;
  const slotSignature = `${position}|${desktopIds.join(',')}|${mobileIds.join(',')}|${isMobile ? 'm' : 'd'}|${page.url}`;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Re-init Clickadilla after React/Inertia renders dynamic banner slots
  useEffect(() => {
    const hasUninitializedSlots = () => {
      const slots = Array.from(document.querySelectorAll<HTMLElement>('[data-banner-id]'));
      if (slots.length === 0) return false;
      return slots.some((slot) => slot.childElementCount === 0 || !slot.innerHTML.trim());
    };

    const injectAdManagerScripts = () => {
      const now = Date.now();
      if (window.__clickadillaLastReloadAt && now - window.__clickadillaLastReloadAt < 500) {
        return;
      }

      const hasBannerSlots = document.querySelector('[data-banner-id]');
      if (!hasBannerSlots) return;

      const existingScripts = Array.from(
        document.querySelectorAll<HTMLScriptElement>('script[src*="js.wpadmngr.com/static/adManager.js"][data-admpid]')
      );
      existingScripts.forEach((script) => script.remove());

      CLICKADILLA_ADMP_IDS.forEach((admpid) => {
        const script = document.createElement('script');
        script.async = true;
        script.src = CLICKADILLA_SCRIPT_SRC;
        script.setAttribute('data-admpid', admpid);
        document.head.appendChild(script);
      });

      window.__clickadillaLastReloadAt = now;
    };

    const attemptRefresh = () => {
      if (hasUninitializedSlots()) {
        injectAdManagerScripts();
      }
    };

    // Multiple retries to catch late-mounted slots and SPA route transitions
    const timers = [120, 700, 1500, 2800].map((delay) => window.setTimeout(attemptRefresh, delay));

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [slotSignature]);

  return (
    <section
      className="py-3"
      style={{ backgroundColor: currentTheme.background }}
    >
      <div className="w-full px-0">
        {!isMobile ? (
          <div className="w-full">
            <div
              className="grid grid-cols-6 gap-2"
              style={{
                width: '100%',
              }}
            >
              {desktopIds.map((id, index) => (
                <div
                  key={`${position}-desktop-${id}-${index}`}
                  className="clickadilla-slot flex items-center justify-center overflow-hidden rounded-lg min-w-0"
                  style={{
                    width: '100%',
                    aspectRatio: '300 / 250',
                    backgroundColor: `${currentTheme.foreground}04`,
                  }}
                >
                  <div data-banner-id={id} style={{ width: '100%', height: '100%' }}></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 justify-items-center">
            {mobileIds.map((id, index) => (
              <div
                key={`${position}-mobile-${id}-${index}`}
                className="flex items-center justify-center overflow-hidden rounded-lg"
                style={{
                  width: '300px',
                  height: '100px',
                  backgroundColor: `${currentTheme.foreground}04`,
                }}
              >
                <div data-banner-id={id} style={{ width: '300px', height: '100px' }}></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .clickadilla-slot > * {
          width: 100% !important;
          height: 100% !important;
          max-width: 100% !important;
        }

        .clickadilla-slot iframe,
        .clickadilla-slot img {
          width: 100% !important;
          height: 100% !important;
          max-width: 100% !important;
          object-fit: cover;
        }
      `}</style>
    </section>
  );
}
