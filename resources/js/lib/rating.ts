/**
 * Series ratings are the readers' average vote (1–5 stars) doubled onto a
 * 10-point scale. A series nobody has rated yet carries `null` rather than 0,
 * so it never looks like it was rated badly. Decimal columns arrive from
 * Laravel as strings ("8.0"), hence the loose input type.
 */
export type Rating = number | string | null | undefined;

/** "8.4", or the fallback when the series has no votes yet. */
export function formatRating(rating: Rating, fallback = 'N/A'): string {
    if (rating === null || rating === undefined || rating === '') return fallback;

    const value = Number(rating);

    return Number.isFinite(value) && value > 0 ? value.toFixed(1) : fallback;
}

/** "1 rating", "12 ratings". */
export function formatRatingCount(count: number | null | undefined): string {
    const n = count ?? 0;

    return `${n.toLocaleString()} rating${n === 1 ? '' : 's'}`;
}
