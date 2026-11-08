import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Isolation } from '@/ads/units';

interface Props {
    /** The network's ad code, verbatim. */
    html: string;
    title: string;
    isolation: Isolation;
    width?: number | string;
    height?: number;
    /** Grow to fit what the network renders (native widgets size themselves). */
    autoHeight?: boolean;
    /** Text colour and font handed to the frame, for widgets set to "inherit". */
    color?: string;
    fontFamily?: string;
    className?: string;
}

/**
 * One ad unit in its own document.
 *
 * Loaded only when it scrolls near the viewport: units further down a long
 * chapter cost nothing for a reader who never gets there, and the page's
 * first paint never waits on an ad network.
 */
export default function AdFrame({
    html, title, isolation, width = '100%', height = 250, autoHeight = false, color, fontFamily, className = '',
}: Props) {
    const holderRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<HTMLIFrameElement>(null);
    const [near, setNear] = useState(false);
    const [fitted, setFitted] = useState<number | null>(null);

    useEffect(() => {
        const el = holderRef.current;
        if (!el || near) return;

        if (!('IntersectionObserver' in window)) {
            setNear(true);
            return;
        }

        const io = new IntersectionObserver(
            (entries) => entries.some((e) => e.isIntersecting) && setNear(true),
            { rootMargin: '400px 0px' },
        );
        io.observe(el);

        return () => io.disconnect();
    }, [near]);

    // Height reports from inside the frame. Matched on the sending window, so
    // several units on one page never pick up each other's sizes.
    useEffect(() => {
        if (!autoHeight) return;

        const onMessage = (e: MessageEvent) => {
            if (e.source !== frameRef.current?.contentWindow) return;
            const h = Number((e.data as { veinoAdHeight?: number })?.veinoAdHeight);
            if (h > 0 && h < 4000) setFitted(Math.ceil(h));
        };
        window.addEventListener('message', onMessage);

        return () => window.removeEventListener('message', onMessage);
    }, [autoHeight]);

    const srcDoc = useMemo(() => `<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer-when-downgrade">
<base target="_blank">
<style>
  html, body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
  body { display: flex; justify-content: center; ${color ? `color: ${color};` : ''} ${fontFamily ? `font-family: ${fontFamily};` : ''} }
  body > * { max-width: 100%; }
  a { color: inherit; }
</style></head>
<body>${html}${autoHeight ? `
<script>(function () {
  var last = 0;
  function report() {
    var h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    if (h !== last) { last = h; parent.postMessage({ veinoAdHeight: h }, '*'); }
  }
  window.addEventListener('load', report);
  setInterval(report, 700);
})();</script>` : ''}
</body></html>`, [html, autoHeight, color, fontFamily]);

    const frameHeight = autoHeight ? (fitted ?? height) : height;

    return (
        <div
            ref={holderRef}
            className={`mx-auto overflow-hidden ${className}`}
            style={{ width, maxWidth: '100%', minHeight: autoHeight ? undefined : height }}
        >
            {near && (
                <iframe
                    ref={frameRef}
                    title={title}
                    srcDoc={srcDoc}
                    width={typeof width === 'number' ? width : undefined}
                    height={frameHeight}
                    scrolling="no"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    // No allow-top-navigation in either mode: nothing in here can
                    // send the reader's own tab somewhere else. Popups are allowed
                    // so a click on an ad still opens the advertiser.
                    sandbox={isolation === 'strict'
                        ? 'allow-scripts allow-popups allow-popups-to-escape-sandbox'
                        : 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox'}
                    style={{ border: 0, display: 'block', width: typeof width === 'number' ? width : '100%', maxWidth: '100%', height: frameHeight, background: 'transparent' }}
                />
            )}
        </div>
    );
}
