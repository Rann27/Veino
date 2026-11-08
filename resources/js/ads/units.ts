/**
 * Third-party ad units, exactly as the networks issued them.
 *
 * Every in-page unit renders inside its own iframe (see AdFrame) so that
 * several networks can share a page: Adsterra's banner code writes a global
 * `atOptions`, and two of those on one document overwrite each other. A fresh
 * document per unit also means each one loads again on every Inertia page
 * change, which network scripts written for full page loads otherwise miss.
 *
 * Isolation:
 *  - 'strict': opaque, sandboxed origin. The script cannot reach Veinovel's
 *    page or redirect the reader's tab; ad clicks still open in a new tab.
 *    Used for HilltopAds multitags, which can carry pop formats.
 *  - 'frame':  separate document, same origin, network cookies intact. For
 *    formats that carry no pops (Adsterra banner and native).
 */

export type Isolation = 'strict' | 'frame';

/** Matches the keys of config/ads.php `networks`. */
export type Network = 'adsterra' | 'hilltop' | 'aads';

export interface FrameUnit {
    /** Shown in the iframe title and in the console when debugging. */
    name: string;
    network: Network;
    html: string;
    width: number;
    height: number;
    isolation: Isolation;
}

const adsterraBanner = (key: string, width: number, height: number): string => `
<script>
  atOptions = {
    'key' : '${key}',
    'format' : 'iframe',
    'height' : ${height},
    'width' : ${width},
    'params' : {}
  };
</script>
<script src="https://bauval.org/22/${key}"></script>`;

const hilltopTag = (src: string, settingsVar: string): string => `
<script>
(function(${settingsVar}){
var d = document,
    s = d.createElement('script'),
    l = d.currentScript || d.scripts[d.scripts.length - 1];
s.settings = ${settingsVar} || {};
s.src = "${src}";
s.async = true;
s.referrerPolicy = 'no-referrer-when-downgrade';
l.parentNode.insertBefore(s, l);
})({})
</script>`;

export const UNITS = {
    /** Adsterra 728×90 — series page between sections, chapter mid-text (desktop). */
    adsterraLeaderboard: {
        name: 'Adsterra 728x90',
        network: 'adsterra',
        html: adsterraBanner('926792a9a217ddcd295f7aa70e8a13fe', 728, 90),
        width: 728,
        height: 90,
        isolation: 'frame',
    },
    /** Adsterra 160×600 — series page, under "You Might Also Like" (desktop). */
    adsterraSkyscraper: {
        name: 'Adsterra 160x600',
        network: 'adsterra',
        html: adsterraBanner('e3228bac61ed55955fb416598ee5c1a9', 160, 600),
        width: 160,
        height: 600,
        isolation: 'frame',
    },
    /** HilltopAds 300×250 #1 — stands in for the 728×90 on mobile. */
    hilltopRectangle1: {
        name: 'HilltopAds 300x250 #1',
        network: 'hilltop',
        html: hilltopTag('//hurtfulseries.com/bqX.VpsrdTGQlh0RYRWZcc/Aezm_9auzZfU/lGkwPOT_cP2JM/Dzci4HNbjukWtaNRzVY/w/NyzFgy3pMRwo', 'blrj'),
        width: 300,
        height: 250,
        isolation: 'strict',
    },
    /** HilltopAds 300×250 #2 — end of chapter, before the navigation. */
    hilltopRectangle2: {
        name: 'HilltopAds 300x250 #2',
        network: 'hilltop',
        html: hilltopTag('//hurtfulseries.com/biXpV.s/d/GilP0yYSWcc_/ceim/9Gu-ZcU/l/k/PnTycB2/MsDvcs4QOeDfUDtINJznYnwBNVz/gU4cOLQm', 'yjyq'),
        width: 300,
        height: 250,
        isolation: 'strict',
    },
} satisfies Record<string, FrameUnit>;

/**
 * Adsterra Native Banner. Its widget sizes itself, so the frame grows to fit
 * (AdFrame's autoHeight). Font and colour are set to inherit in Adsterra, and
 * the frame passes the reader's theme in, so it matches the cards around it.
 */
export const NATIVE = {
    name: 'Adsterra Native',
    html: `<script async="async" data-cfasync="false" src="https://bauval.org/21/7f4f483de919cbdd11bb60fd3d07a1ec"></script>
<div id="container-7f4f483de919cbdd11bb60fd3d07a1ec"></div>`,
} as const;

/** A-ADS adaptive units, shown on every page. Plain cross-origin iframes. */
export const AADS_UNITS = {
    top: 2461370,
    bottom: 2461372,
} as const;

/**
 * Page-level overlays. These have to live in the page itself (they float over
 * it), so they load once per visit, a few seconds after the page is up.
 */
export const OVERLAYS = {
    /** Adsterra Social Bar (in-page push). */
    socialBarSrc: 'https://bauval.org/14/5db1323155471f92e5eb20e899abe2f5',
    /** HilltopAds Video Slider. */
    videoSlider: {
        src: '//hurtfulseries.com/beXSVrsZd.G/ls0kYOWDcJ/teZmn9/u/ZcUPlbkLPMTBcp2/MbDVcZ5/MTDdECt/NbzBYqwzN/zRkbwjN/QM',
        settingsVar: 'jb',
    },
} as const;
