import React from 'react';

/**
 * One source of truth for how each membership tier looks.
 *
 * Before this, `membership_tier === 'premium'` was spelled out in a dozen
 * places, each with its own inline gradient. Adding Premium Exclusive that way
 * would have meant a dozen more — and any tier added later, a dozen again.
 */

export type Tier = 'basic' | 'premium' | 'exclusive';

/** Purple carries the membership line; gold marks Exclusive. */
export const SHINY_PURPLE = '#a78bfa';
export const EXCLUSIVE_GOLD = '#f5c542';

export const TIER_LABEL: Record<Tier, string> = {
    basic: 'Basic',
    premium: 'Premium',
    exclusive: 'Premium Exclusive',
};

/** Short form, for places with no room — badges, mobile chips. */
export const TIER_SHORT: Record<Tier, string> = {
    basic: 'Basic',
    premium: 'Premium',
    exclusive: 'Exclusive',
};

/** Accent used for text and icon strokes. */
export const TIER_COLOR: Record<Tier, string> = {
    basic: 'currentColor',
    premium: SHINY_PURPLE,
    exclusive: EXCLUSIVE_GOLD,
};

/** Fill for rings, pills and borders. */
export const TIER_GRADIENT: Record<Tier, string> = {
    basic: 'transparent',
    premium: 'linear-gradient(135deg, #c084fc, #e879f9, #818cf8)',
    exclusive: `linear-gradient(115deg, ${SHINY_PURPLE}, ${EXCLUSIVE_GOLD}, #e879f9, ${EXCLUSIVE_GOLD}, ${SHINY_PURPLE})`,
};

export const TIER_GLOW: Record<Tier, string> = {
    basic: 'none',
    premium: '0 0 10px #a78bfa60',
    exclusive: `0 0 12px ${SHINY_PURPLE}70, 0 0 20px ${EXCLUSIVE_GOLD}45`,
};

/** Paid tiers only — `basic` is the absence of a membership. */
export function isPaidTier(tier?: string | null): tier is 'premium' | 'exclusive' {
    return tier === 'premium' || tier === 'exclusive';
}

export function asTier(tier?: string | null): Tier {
    return tier === 'premium' || tier === 'exclusive' ? tier : 'basic';
}

/** True only while the membership has not lapsed. */
export function hasActiveTier(tier?: string | null, expiresAt?: string | null): boolean {
    if (!isPaidTier(tier) || !expiresAt) return false;
    return new Date(expiresAt).getTime() > Date.now();
}

/**
 * Keyframes for the Exclusive neon sweep. Mounted once per page via
 * <TierStyles /> rather than inlined per element.
 */
export const TIER_STYLES = `
@keyframes veinovelTierSweep {
    0%   { background-position:   0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position:   0% 50%; }
}
@keyframes veinovelTierGlow {
    0%, 100% { opacity: 0.6; }
    50%      { opacity: 1; }
}
.tier-neon { background-size: 260% 260%; animation: veinovelTierSweep 7s ease-in-out infinite; }
.tier-glow { animation: veinovelTierGlow 3.4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
    .tier-neon, .tier-glow { animation: none; }
}
`;

export function TierStyles() {
    return <style>{TIER_STYLES}</style>;
}

/** Premium's mark. */
export function PremiumDiamondIcon({ size = 16 }: { size?: number }) {
    const id = React.useId();

    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
            <defs>
                <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c084fc" />
                    <stop offset="50%" stopColor="#e879f9" />
                    <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
            </defs>
            <path d="M12 2L3 9L12 22L21 9L12 2Z" fill={`url(#${id})`} stroke="#fff" strokeWidth="0.5" />
            <path d="M12 2L12 22M3 9L21 9M7 5.5L17 5.5M7 9L12 22M17 9L12 22" stroke="#fff" strokeWidth="0.3" opacity="0.6" />
        </svg>
    );
}

/** Exclusive's mark. */
export function ExclusiveCrownIcon({ size = 16 }: { size?: number }) {
    const id = React.useId();

    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f7d774" />
                    <stop offset="45%" stopColor={EXCLUSIVE_GOLD} />
                    <stop offset="100%" stopColor="#c9962a" />
                </linearGradient>
            </defs>
            <path d="M3 8.5l3.6 2.6L12 4l5.4 7.1L21 8.5l-1.7 9.4a1.2 1.2 0 0 1-1.2 1H5.9a1.2 1.2 0 0 1-1.2-1L3 8.5Z"
                fill={`url(#${id})`} stroke="#fff" strokeWidth="0.5" strokeLinejoin="round" />
            <circle cx="12" cy="15.4" r="1.15" fill="#fff" opacity="0.85" />
        </svg>
    );
}

export function TierIcon({ tier, size = 16 }: { tier?: string | null; size?: number }) {
    const resolved = asTier(tier);

    if (resolved === 'exclusive') return <ExclusiveCrownIcon size={size} />;
    if (resolved === 'premium') return <PremiumDiamondIcon size={size} />;

    return null;
}

/** Icon + label pill. Renders nothing for readers without a membership. */
export function TierBadge({
    tier, size = 12, short = false, className = '',
}: { tier?: string | null; size?: number; short?: boolean; className?: string }) {
    const resolved = asTier(tier);

    if (resolved === 'basic') return null;

    const isExclusive = resolved === 'exclusive';

    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${isExclusive ? 'tier-neon' : ''} ${className}`}
            style={{
                fontSize: size - 1,
                // Exclusive gets the moving gradient; Premium a flat tint, so
                // the two never read as the same thing at a glance.
                background: isExclusive ? TIER_GRADIENT.exclusive : `${SHINY_PURPLE}1F`,
                color: isExclusive ? '#1a1206' : SHINY_PURPLE,
                border: isExclusive ? 'none' : `1px solid ${SHINY_PURPLE}33`,
            }}
        >
            <TierIcon tier={resolved} size={size} />
            {short ? TIER_SHORT[resolved] : TIER_LABEL[resolved]}
        </span>
    );
}

/** Ring around an avatar. */
export function tierRingStyle(tier?: string | null): React.CSSProperties {
    const resolved = asTier(tier);

    if (resolved === 'basic') return {};

    return {
        background: TIER_GRADIENT[resolved],
        boxShadow: TIER_GLOW[resolved],
        padding: '2px',
    };
}
