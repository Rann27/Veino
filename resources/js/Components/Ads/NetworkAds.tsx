import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';
import AdFrame from '@/Components/Ads/AdFrame';
import { AADS_UNITS, NATIVE, OVERLAYS, type FrameUnit } from '@/ads/units';

/**
 * Third-party network ads. Every component here renders nothing unless the
 * server says this visitor gets ads (`showAds`): never for paid members or
 * admins, and never while the ADS_ENABLED switch is off.
 */
export function useShowAds(): boolean {
    return usePage<{ showAds?: boolean }>().props.showAds === true;
}

function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);

    useEffect(() => {
        const mq = window.matchMedia(query);
        const sync = () => setMatches(mq.matches);
        sync();
        mq.addEventListener('change', sync);

        return () => mq.removeEventListener('change', sync);
    }, [query]);

    return matches;
}

/** The small "Advertisement" caption, so an ad is never mistaken for content. */
function Labelled({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    const { currentTheme } = useTheme();

    return (
        <div className={`flex flex-col items-center ${className}`} data-network-ad>
            <span className="text-[10px] uppercase tracking-widest mb-1 select-none" style={{ color: `${currentTheme.foreground}45` }}>
                Advertisement
            </span>
            {children}
        </div>
    );
}

/** One fixed-size unit. */
export function UnitAd({ unit, className = '' }: { unit: FrameUnit; className?: string }) {
    if (!useShowAds()) return null;

    return (
        <Labelled className={className}>
            <AdFrame html={unit.html} title={unit.name} isolation={unit.isolation} width={unit.width} height={unit.height} />
        </Labelled>
    );
}

/**
 * A slot that changes unit with the screen: the 728×90 does not fit a phone,
 * so mobile gets a 300×250 in the same spot. Only the one that applies is
 * mounted, so the other never loads.
 */
export function ResponsiveAd({ desktop, mobile, className = '' }: { desktop: FrameUnit; mobile: FrameUnit | null; className?: string }) {
    const show = useShowAds();
    const wide = useMediaQuery('(min-width: 768px)');

    if (!show) return null;

    const unit = wide ? desktop : mobile;
    if (!unit) return null;

    return (
        <Labelled className={className}>
            <AdFrame key={unit.name} html={unit.html} title={unit.name} isolation={unit.isolation} width={unit.width} height={unit.height} />
        </Labelled>
    );
}

/** Only on wide screens (the 160×600 has nowhere to go on a phone). */
export function DesktopOnlyAd({ unit, minWidth = 1024, className = '' }: { unit: FrameUnit; minWidth?: number; className?: string }) {
    const show = useShowAds();
    const wide = useMediaQuery(`(min-width: ${minWidth}px)`);

    if (!show || !wide) return null;

    return (
        <Labelled className={className}>
            <AdFrame html={unit.html} title={unit.name} isolation={unit.isolation} width={unit.width} height={unit.height} />
        </Labelled>
    );
}

/**
 * A-ADS adaptive unit. Already a cross-origin iframe, so it needs no wrapper
 * of ours; this is their snippet as issued, minus the duplicate `id="frame"`
 * (two units on one page would otherwise share an id).
 */
export function AAdsAd({ position, className = '' }: { position: keyof typeof AADS_UNITS; className?: string }) {
    if (!useShowAds()) return null;

    const id = AADS_UNITS[position];

    return (
        <div className={`w-full py-2 ${className}`} data-network-ad>
            <div style={{ width: '100%', margin: 'auto', position: 'relative' }}>
                <iframe
                    data-aa={String(id)}
                    title={`A-ADS ${position}`}
                    src={`//acceptable.a-ads.com/${id}/?size=Adaptive`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    style={{ border: 0, padding: 0, width: '70%', height: 'auto', overflow: 'hidden', display: 'block', margin: 'auto' }}
                />
            </div>
        </div>
    );
}

/**
 * Adsterra Native Banner, placed among cards. The frame carries the reader's
 * theme colour and the site font in, which the widget picks up because its
 * font and colour are set to "inherit" in the Adsterra dashboard.
 */
export function NativeAd({ className = '' }: { className?: string }) {
    const show = useShowAds();
    const { currentTheme } = useTheme();

    if (!show) return null;

    return (
        <Labelled className={`w-full ${className}`}>
            <AdFrame
                key={currentTheme.foreground}
                html={NATIVE.html}
                title={NATIVE.name}
                isolation="frame"
                width="100%"
                height={260}
                autoHeight
                color={currentTheme.foreground}
                fontFamily="'Instrument Sans', ui-sans-serif, system-ui, sans-serif"
            />
        </Labelled>
    );
}

declare global {
    interface Window {
        __veinoOverlaysLoaded?: boolean;
    }
}

/**
 * Social Bar and Video Slider. They float over the page, so they cannot sit in
 * a frame of ours; they load once per visit, after the page is up (on the
 * first scroll or tap, or after a few seconds at the latest), so they never
 * compete with the content for the first paint.
 *
 * If a visitor stops qualifying for ads mid-visit (signs in as a member, or
 * buys a membership) the page reloads once, since a script already running in
 * the page cannot be taken back out.
 */
export function AdOverlays() {
    const show = useShowAds();

    useEffect(() => {
        if (!show) {
            if (window.__veinoOverlaysLoaded) window.location.reload();
            return;
        }
        if (window.__veinoOverlaysLoaded) return;

        let done = false;
        const load = () => {
            if (done || window.__veinoOverlaysLoaded) return;
            done = true;
            window.__veinoOverlaysLoaded = true;

            const social = document.createElement('script');
            social.setAttribute('data-cfasync', 'false');
            social.src = OVERLAYS.socialBarSrc;
            document.body.appendChild(social);

            // The HilltopAds loader as issued, run as an inline script so its
            // own currentScript lookup finds it.
            const { src, settingsVar } = OVERLAYS.videoSlider;
            const slider = document.createElement('script');
            slider.text = `(function(${settingsVar}){var d=document,s=d.createElement('script'),l=d.currentScript||d.scripts[d.scripts.length-1];s.settings=${settingsVar}||{};s.src=${JSON.stringify(src)};s.async=true;s.referrerPolicy='no-referrer-when-downgrade';l.parentNode.insertBefore(s,l);})({})`;
            document.body.appendChild(slider);

            cleanup();
        };

        const events = ['scroll', 'pointerdown', 'keydown', 'touchstart'] as const;
        events.forEach((e) => window.addEventListener(e, load, { once: true, passive: true }));
        const timer = window.setTimeout(load, 4000);
        const cleanup = () => {
            window.clearTimeout(timer);
            events.forEach((e) => window.removeEventListener(e, load));
        };

        return cleanup;
    }, [show]);

    return null;
}
