<?php

return [
    /*
    | Developers API token from ShrinkEarn → Tools → Developers API.
    */
    'token' => env('SHRINKEARN_TOKEN'),

    'endpoint' => env('SHRINKEARN_ENDPOINT', 'https://shrinkearn.com/api'),

    'timeout' => (int) env('SHRINKEARN_TIMEOUT', 12),
];
