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

export const UNITS = {
    /*
     * Adsterra serves one banner of a given size per page, so every page below
     * uses each size at most once: 728×90 and 320×50 share a slot (desktop vs
     * mobile), and 300×250 has a slot of its own.
     */

    /** Adsterra 728×90 — series page between sections, chapter mid-text (desktop). */
    adsterraLeaderboard: {
        name: 'Adsterra 728x90',
        network: 'adsterra',
        html: adsterraBanner('926792a9a217ddcd295f7aa70e8a13fe', 728, 90),
        width: 728,
        height: 90,
        isolation: 'frame',
    },
    /** Adsterra 320×50 — the 728×90's slot on mobile. */
    adsterraMobileBanner: {
        name: 'Adsterra 320x50',
        network: 'adsterra',
        html: adsterraBanner('6467e1682de7360d65b614019bf9cb08', 320, 50),
        width: 320,
        height: 50,
        isolation: 'frame',
    },
    /** Adsterra 300×250 — end of chapter, and as a card in "You Might Also Like". */
    adsterraRectangle: {
        name: 'Adsterra 300x250',
        network: 'adsterra',
        html: adsterraBanner('82b13c80593175e8c8da7221b187e733', 300, 250),
        width: 300,
        height: 250,
        isolation: 'frame',
    },
    /** Adsterra 160×600 — not placed at the moment (left the series page). */
    adsterraSkyscraper: {
        name: 'Adsterra 160x600',
        network: 'adsterra',
        html: adsterraBanner('e3228bac61ed55955fb416598ee5c1a9', 160, 600),
        width: 160,
        height: 600,
        isolation: 'frame',
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
