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
 *   referer_hosts  hosts a reader may come back from. null skips the check,
 *                  for gates that hop through blogs whose domains change. A missing referer is
 *                  always accepted (shorteners often strip it); a present one
 *                  from anywhere else is refused. An entry with a dot matches
 *                  that host or any subdomain of it; one without a dot matches
 *                  any host containing it (how the Move2Link check always
 *                  worked).
 */
return [
    'default' => env('SHORTLINK_PROVIDER', 'move2link'),

    /*
     * Rotation order, best-paying first. Networks pay for one view per IP per
     * day, so a reader's first unlock of the day goes through the first
     * network, the second through the second, and so on: up to five paid
     * views instead of one. The admin can reorder or drop networks in
     * Series Management → Settings; this is the order until they do.
     */
    'rotation' => array_values(array_filter(array_map('trim', explode(',', (string) env(
        'SHORTLINK_ROTATION',
        'shrinkearn,shrtfly,safelinku,move2link,nexolink'
    ))))),

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
        'shrtfly' => [
            // AdLinkFly gate on shrtslug.biz with a Turnstile captcha.
            'token' => env('SHRTFLY_TOKEN'),
            'endpoint' => env('SHRTFLY_ENDPOINT', 'https://shrtfly.com/api'),
            'query' => ['type' => 1], // mainstream ads only
            'min_seconds' => (int) env('SHRTFLY_MIN_SECONDS', 10),
            'referer_hosts' => ['shrtslug.biz', 'shrtfly.com', 'stfly.me'],
        ],
        'safelinku' => [
            // sfl.gl → a multi-page blog walk (app.khaddavi.net and others).
            'token' => env('SAFELINKU_TOKEN'),
            'endpoint' => env('SAFELINKU_ENDPOINT', 'https://safelinku.com/api/v1/links'),
            'link_path' => 'url',
            'min_seconds' => (int) env('SAFELINKU_MIN_SECONDS', 15),
            // The blog domains it hops through change; checking them would
            // refuse honest readers. The timing floor and single-use claim
            // still apply.
            'referer_hosts' => null,
        ],
        'nexolink' => [
            // Our own network: nxlnk.cc → step pages on gtechupdate.com.
            'token' => env('NEXOLINK_TOKEN'),
            'endpoint' => env('NEXOLINK_ENDPOINT', 'https://nexolink.cc/api/v1/links'),
            'link_path' => 'data.short_url',
            'send_title' => true,
            'min_seconds' => (int) env('NEXOLINK_MIN_SECONDS', 10),
            'referer_hosts' => ['nxlnk.cc', 'nexolink.cc', 'gtechupdate.com'],
        ],
    ],
];
