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
];
