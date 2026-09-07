<?php

return [
    /*
    | REST API token from Move2Link → Tools → REST API. Without it the
    | challenge button stays hidden rather than failing in front of readers.
    */
    'token' => env('MOVE2LINK_TOKEN'),

    'endpoint' => env('MOVE2LINK_ENDPOINT', 'https://api.move2link.com/api/v1/links'),

    'timeout' => (int) env('MOVE2LINK_TIMEOUT', 12),

    /*
    | Always sent explicitly, never left to the account's Default Paywall
    | Price. Move2Link's paywall settles in QRIS only, so any non-zero price
    | would lock out every reader outside Indonesia — and this button is
    | advertised as free. Earnings come from the ad gate, not from a paywall.
    */
    'price' => 0,
];
