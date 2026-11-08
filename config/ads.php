<?php

return [
    /*
     * Master switch for third-party ad networks (Adsterra, HilltopAds, A-ADS).
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
    ],
];
