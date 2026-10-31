import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

interface Props {
    slug: string;
    /** This reader's own vote, 1–5, or null. */
    userRating: number | null;
    isAuthenticated: boolean;
    foreground: string;
    /** Called instead of voting when a guest clicks a star. */
    onRequireLogin: () => void;
}

const STAR = '#facc15';
const LABELS = ['', 'Bad', 'Meh', 'Good', 'Great', 'Masterpiece'];

/**
 * The reader's own 1–5 star vote.
 *
 * Optimistic: the stars move the instant they are clicked, and the server's
 * answer — which comes back as fresh page props — settles them. Clicking the
 * star that is already set withdraws the vote.
 */
export default function StarRating({ slug, userRating, isAuthenticated, foreground, onRequireLogin }: Props) {
    const [mine, setMine] = useState<number | null>(userRating);
    const [hover, setHover] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);

    // Follow the server once a request settles, so a rejected vote snaps back.
    useEffect(() => setMine(userRating), [userRating]);

    const shown = hover ?? mine ?? 0;

    const vote = (stars: number) => {
        // Guests are told, not redirected: reading needs no account, and a
        // stray click on a star shouldn't pull anyone off the page.
        if (!isAuthenticated) {
            onRequireLogin();
            return;
        }
        if (busy) return;

        const withdrawing = mine === stars;
        setMine(withdrawing ? null : stars);
        setBusy(true);

        const options = {
            preserveScroll: true,
            preserveState: true,
            // A partial reload: just the new average and this reader's vote.
            // It also keeps the round trip out of the page-view analytics,
            // which skips partial requests.
            only: ['series', 'userRating'],
            onError: () => setMine(userRating),
            onFinish: () => setBusy(false),
        };

        if (withdrawing) {
            router.delete(`/series/${slug}/rating`, options);
        } else {
            router.post(`/series/${slug}/rating`, { stars }, options);
        }
    };

    return (
        <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: `${foreground}70` }}>
                Your rating
            </span>

            <div className="flex items-center" onMouseLeave={() => setHover(null)} role="radiogroup" aria-label="Rate this series">
                {[1, 2, 3, 4, 5].map((n) => (
                    <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={mine === n}
                        aria-label={`${n} star${n > 1 ? 's' : ''}`}
                        title={mine === n ? 'Click again to remove your rating' : `${n} — ${LABELS[n]}`}
                        disabled={busy}
                        onMouseEnter={() => setHover(n)}
                        onFocus={() => setHover(n)}
                        onBlur={() => setHover(null)}
                        onClick={() => vote(n)}
                        className="px-0.5 text-xl leading-none transition-transform duration-150 hover:scale-110 disabled:cursor-wait focus:outline-none focus-visible:scale-110"
                        style={{ color: n <= shown ? STAR : `${foreground}25` }}
                    >
                        ★
                    </button>
                ))}
            </div>

            <span className="text-xs min-w-[5.5rem]" style={{ color: `${foreground}70` }}>
                {hover
                    ? LABELS[hover]
                    : mine
                        ? `You gave ${mine}/5`
                        : isAuthenticated ? 'Not rated yet' : 'Sign in to rate'}
            </span>
        </div>
    );
}
