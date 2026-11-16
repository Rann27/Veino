<?php

return [
    /*
     * Master switch for third-party ad networks (Adsterra, HilltopAds, A-ADS, Adcash).
     * Off hides every network unit and stops their scripts from loading, for
     * when a network misbehaves and needs pulling at once: set ADS_ENABLED=false
     * and re-cache config. Veinovel's own ad system (Admin > Ads) is separate.
     *
     * Paid members and admins never see network ads either way.
     */
    'enabled' => env('ADS_ENABLED', true),

    /*
     * Per-network switches, for pulling one network without touching the
     * others: one serving the wrong kind of creative, say. A disabled
     * network's slots stay empty and its scripts never load.
     */
    'networks' => [
        'adsterra' => (bool) env('ADS_ADSTERRA', true),
        'hilltop' => (bool) env('ADS_HILLTOP', true),
        'aads' => (bool) env('ADS_AADS', true),
        'adcash' => (bool) env('ADS_ADCASH', true),
    ],

    /*
     * Adcash's library. app.blade.php prints it into <head> for visitors who
     * are shown ads, where Adcash looks for it; the zones themselves are in
     * resources/js/ads/units.ts (ADCASH).
     */
    'adcash_lib' => 'https://acscdn.com/script/aclib.js',

    /*
     * A-ADS unit ids, mirrored in resources/js/ads/units.ts (AADS_UNITS).
     * app.blade.php prints their snippets into the HTML as well: the units
     * themselves are drawn by React, and A-ADS's site check reads the HTML
     * without running scripts, so without this every unit shows "Not found"
     * and is never sent paid campaigns.
     */
    'aads_units' => [2461370, 2461372],
];
