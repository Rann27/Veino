<?php

/*
 * Ad-gate shortlink providers for the free unlock.
 *
 * Which one is live is an admin setting (Series Management → Settings), with
 * `default` as the fallback while that has never been saved. Switching is safe
 * at any time: each provider keeps its own links, so switching back finds the
 * old links still there.
 *
 *   min_seconds    fastest an honest run through the gate can be. A claim
 *                  quicker than this is refused as a skipped gate. Too high
 *                  refuses honest readers; too low lets skippers through.
 *                  Tune it from the elapsed times in the Free Unlocks monitor.
 *   referer_hosts  hosts a reader may come back from. A missing referer is
 *                  always accepted (shorteners often strip it); a present one
 *                  from anywhere else is refused. An entry with a dot matches
 *                  that host or any subdomain of it; one without a dot matches
 *                  any host containing it (how the Move2Link check always
 *                  worked).
 */
return [
    'default' => env('SHORTLINK_PROVIDER', 'move2link'),

    /*
     * The main site. Move2Link links landing here keep living in the original
     * chapters.unlock_shortlink column; see ChapterUnlockService.
     */
    'legacy_url' => env('SHORTLINK_LEGACY_URL', 'https://veinovel.com'),

    'providers' => [
        'move2link' => [
            // Fastest honest run observed was 126s; see ChapterUnlockService.
            'min_seconds' => (int) env('MOVE2LINK_MIN_SECONDS', 90),
            'referer_hosts' => ['move2link'],
        ],
        'shrinkearn' => [
            // The gate is a 15-second countdown plus a captcha. Starts just
            // under the countdown; raise it once real runs show the floor.
            'min_seconds' => (int) env('SHRINKEARN_MIN_SECONDS', 12),
            'referer_hosts' => array_values(array_filter(array_map('trim', explode(',', (string) env(
                'SHRINKEARN_REFERER_HOSTS',
                'srnky.com,shrinkearn.com,shrinkbixby.com,shrinke.me'
            ))))),
        ],
    ],
];
