<?php

namespace App\Support;

/**
 * Groups sign-in addresses into the networks they came from.
 *
 * A raw address count punishes honest readers: ISPs reshuffle home addresses,
 * IPv6 privacy extensions give a phone a new address inside the same /64
 * every day, and a phone hops between Wi-Fi and mobile data. Grouping by
 * network, and asking whether networks were in use one after another or side
 * by side, is what separates that churn from an account several people share.
 */
class IpNetworks
{
    /**
     * How many networks an account has used, and the most it was using at once.
     *
     * The second number is the one that separates sharing from churn. An
     * address that changes because of the ISP, a phone moving between Wi-Fi
     * and mobile data, a VPN switched on, all of that happens one after
     * another: the old network stops being seen when the new one starts. An
     * account passed around between several people keeps several networks
     * alive side by side, each one logging in again and again over the same
     * weeks. So each network becomes the span from its first to its last
     * sign-in, and the peak is the most spans open at any single moment.
     *
     * A normal reader tops out at two or three (home, work, the phone on mobile
     * data). Higher than that is worth a look; it is not proof on its own.
     *
     * @return array{0: int, 1: int}
     */
    public static function stats($rows): array
    {
        if ($rows->isEmpty()) {
            return [0, 0];
        }

        $spans = $rows->groupBy(fn ($r) => self::network($r->ip))
            ->map(fn ($group) => [
                strtotime((string) $group->min('first_seen_at')),
                strtotime((string) $group->max('last_seen_at')),
            ]);

        // Sweep: +1 where a span opens, -1 just after it closes. Opens sort
        // before closes at the same instant, so a single sign-in that lands
        // inside a longer span counts as overlapping it.
        $events = [];
        foreach ($spans as [$start, $end]) {
            $events[] = [$start, 0, 1];
            $events[] = [$end, 1, -1];
        }
        usort($events, fn ($a, $b) => [$a[0], $a[1]] <=> [$b[0], $b[1]]);

        $open = 0;
        $peak = 0;
        foreach ($events as [, , $delta]) {
            $open += $delta;
            $peak = max($peak, $open);
        }

        return [$spans->count(), $peak];
    }

    /** The /24 or /64 an address sits in; mirrors UserController::NETWORK_SQL. */
    public static function network(string $ip): string
    {
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return implode('.', array_slice(explode('.', $ip), 0, 3)).'.0/24';
        }

        $packed = @inet_pton($ip);

        return $packed === false || strlen($packed) !== 16
            ? $ip
            : inet_ntop(substr($packed, 0, 8).str_repeat("\0", 8)).'/64';
    }
}
