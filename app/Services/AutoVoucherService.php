<?php

namespace App\Services;

use App\Models\Voucher;
use Illuminate\Database\QueryException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * Generates and retires the automatic first-come vouchers.
 *
 *   daily    one per day,   valid 1 day,  15–40% off
 *   weekly   one per week,  valid 3 days, 50–75% off (Monday to Wednesday)
 *   monthly  one per month, valid 3 days, 80–90% off (1st to 3rd)
 *
 * Each is a single-use ("global", limit 1) percentage voucher for both
 * membership and epub purchases: the first reader to check out with it wins
 * it. Periods follow the app timezone (UTC), so the daily one turns over at
 * 07:00 WIB.
 *
 * Generation runs from the scheduler, and also lazily when the vouchers are
 * read, so a missed cron run never leaves a period without its voucher. The
 * unique (auto_kind, period_key) index makes the two safe to race.
 */
class AutoVoucherService
{
    public const KINDS = [
        'daily' => ['prefix' => 'DAILY', 'min' => 15, 'max' => 40, 'valid_days' => 1],
        'weekly' => ['prefix' => 'WEEKLY', 'min' => 50, 'max' => 75, 'valid_days' => 3],
        'monthly' => ['prefix' => 'MONTHLY', 'min' => 80, 'max' => 90, 'valid_days' => 3],
    ];

    private const CACHE_KEY = 'auto-vouchers:current:v1';

    /** Short: a claim flushes it anyway; this only bounds a missed flush. */
    private const CACHE_SECONDS = 60;

    /**
     * The vouchers of the current periods that are still running, claimed or
     * not, keyed by kind. What the homepage strip and the monthly modal show.
     *
     * @return array<string, array{kind: string, code: string, discount: int, expires_at: string, claimed: bool, period: string}>
     */
    public function current(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_SECONDS, function () {
            $this->ensureCurrent();

            return Voucher::whereNotNull('auto_kind')
                ->where('is_active', true)
                ->where('expires_at', '>', now())
                ->get()
                ->filter(fn (Voucher $v) => $v->period_key === $this->periodKey($v->auto_kind, now()))
                ->mapWithKeys(fn (Voucher $v) => [$v->auto_kind => [
                    'kind' => $v->auto_kind,
                    'code' => $v->code,
                    'discount' => (int) $v->discount_value,
                    'expires_at' => $v->expires_at->toIso8601String(),
                    'claimed' => $v->isClaimed(),
                    'period' => $v->period_key,
                ]])
                ->all();
        });
    }

    /**
     * Seconds left on each, counted on the server at render time so the
     * countdown on the page does not depend on the reader's clock.
     *
     * @return array<string, array<string, mixed>>
     */
    public function forDisplay(array $kinds): array
    {
        return collect($this->current())
            ->only($kinds)
            ->map(fn ($v) => $v + ['seconds_left' => max(0, (int) now()->diffInSeconds(Carbon::parse($v['expires_at'])))])
            ->all();
    }

    public function forget(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /** Creates the voucher of each kind whose period is running and has none yet. */
    public function ensureCurrent(?Carbon $at = null): int
    {
        $at ??= now();
        $created = 0;

        foreach (self::KINDS as $kind => $rule) {
            $start = $this->periodStart($kind, $at);
            $expires = $start->copy()->addDays($rule['valid_days']);

            // Weekly and monthly only run for their first three days.
            if ($at->gte($expires)) {
                continue;
            }

            $period = $this->periodKey($kind, $at);

            if (Voucher::where('auto_kind', $kind)->where('period_key', $period)->exists()) {
                continue;
            }

            try {
                Voucher::create([
                    'code' => $this->freshCode($rule['prefix']),
                    'type' => 'hybrid',
                    'discount_type' => 'percent',
                    'discount_value' => random_int($rule['min'], $rule['max']),
                    'usage_limit_type' => 'global',
                    'usage_limit' => 1,
                    'usage_count' => 0,
                    'expires_at' => $expires,
                    'is_active' => true,
                    'auto_kind' => $kind,
                    'period_key' => $period,
                ]);
                $created++;
            } catch (QueryException $e) {
                // Another request created it a moment ago; the unique index
                // turned this one away, which is exactly the point.
                if (! str_contains(strtolower($e->getMessage()), 'duplicate') && ! str_contains($e->getMessage(), 'UNIQUE')) {
                    throw $e;
                }
            }
        }

        if ($created > 0) {
            $this->forget();
        }

        return $created;
    }

    /**
     * Switches off automatic vouchers past their expiry. Expiry alone already
     * makes them unusable; this keeps the admin list honest about it.
     */
    public function revokeExpired(): int
    {
        $revoked = Voucher::whereNotNull('auto_kind')
            ->where('is_active', true)
            ->where('expires_at', '<=', now())
            ->update(['is_active' => false]);

        if ($revoked > 0) {
            $this->forget();
        }

        return $revoked;
    }

    private function periodStart(string $kind, Carbon $at): Carbon
    {
        return match ($kind) {
            'daily' => $at->copy()->startOfDay(),
            'weekly' => $at->copy()->startOfWeek(Carbon::MONDAY),
            'monthly' => $at->copy()->startOfMonth(),
        };
    }

    private function periodKey(string $kind, Carbon $at): string
    {
        return match ($kind) {
            'daily' => $at->format('Y-m-d'),
            'weekly' => $at->format('o-\WW'),
            'monthly' => $at->format('Y-m'),
        };
    }

    /** DAILY-K7Q3XM. Readable, and unambiguous when typed by hand. */
    private function freshCode(string $prefix): string
    {
        do {
            $code = $prefix.'-'.Str::upper((string) Str::of(Str::random(12))->replaceMatches('/[^A-HJ-NP-Z2-9]/i', '')->substr(0, 6));
        } while (strlen($code) < strlen($prefix) + 7 || Voucher::where('code', $code)->exists());

        return $code;
    }
}
