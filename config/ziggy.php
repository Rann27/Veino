<?php

/*
 * Which named routes reach the browser through @routes.
 *
 * Readers get the 'public' group; admins get everything (see app.blade.php).
 * Left out: the admin area, and server-to-server or internal endpoints no
 * page ever builds a URL for — webhooks, payment callbacks, the local storage
 * proxy, the unlock sandbox and claim. None of these are secret, the routes
 * still exist and are still protected; there is just no reason to hand every
 * visitor a map of them, and the admin half alone was most of the list.
 */
return [
    'groups' => [
        'public' => [
            '!admin.*',
            '!storage.*',
            '!*.webhook',
            '!payment.callback',
            '!payment.paypal-ipn',
            '!membership.simulate',
            '!chapters.unlock.sandbox',
            '!chapters.unlock.claim',
        ],
    ],
];
