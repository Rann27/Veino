/**
 * Veinovel — Central Color & Theme Tokens
 *
 * Rules from DESIGN-PALETTE.md:
 * 1. Veinovel has no fixed brand colour.
 *    Chrome (surfaces, borders, muted text) derives from the active theme
 *    via alpha suffixes:
 *      ${fg}15  → border, divider
 *      ${fg}08  → card surface
 *      ${fg}0C  → button fill, hover surface
 *      ${fg}70  → muted / secondary text
 * 2. Fixed colors carry semantic MEANING only:
 *      - Premium: #a78bfa (SHINY_PURPLE)
 *      - Exclusive: #f5c542 (EXCLUSIVE_GOLD) + #a78bfa
 *      - Coins: #f59e0b (COIN_COLOR) — never violet
 *      - Status: green #22c55e, red #ef4444, amber #f59e0b, info #3b82f6
 */

// ─── Membership Tiers (Fixed Semantic Colors) ────────────────────────────────
export const SHINY_PURPLE      = '#a78bfa';   // violet-400 — Premium
export const SHINY_PURPLE_DARK = '#7c3aed';   // violet-700
export const SHINY_PURPLE_DIM  = 'rgba(167,139,250,0.15)';
export const EXCLUSIVE_GOLD    = '#f5c542';   // amber-gold — Exclusive accent

// ─── Coins / Balances (Fixed Semantic Colors) ─────────────────────────────────
export const COIN_COLOR  = '#f59e0b';   // amber-500
export const COIN_LIGHT  = '#fbbf24';   // amber-300
export const COIN_DARK   = '#d97706';   // amber-600
export const COIN_DIM    = 'rgba(245,158,11,0.15)';

// ─── Semantic Status Colors ───────────────────────────────────────────────────
export const SUCCESS_COLOR  = '#22c55e';   // green-500
export const ERROR_COLOR    = '#ef4444';   // red-500
export const WARNING_COLOR  = '#f59e0b';   // amber-500

// ─── Series Status Badges ─────────────────────────────────────────────────────
export const STATUS_COLORS: Record<string, { bg: string; text: string; dim: string }> = {
    ongoing:   { bg: '#22c55e', text: '#ffffff', dim: 'rgba(34,197,94,0.14)' },
    completed: { bg: '#8b5cf6', text: '#ffffff', dim: 'rgba(139,92,246,0.14)' },
    hiatus:    { bg: '#f59e0b', text: '#1a1206', dim: 'rgba(245,158,11,0.14)' },
    dropped:   { bg: '#ef4444', text: '#ffffff', dim: 'rgba(239,68,68,0.14)' },
};

export function getStatusColor(status: string) {
    return STATUS_COLORS[status?.toLowerCase()] ?? {
        bg: 'rgba(120,120,120,0.25)',
        text: '#ffffff',
        dim: 'rgba(120,120,120,0.1)',
    };
}

// ─── Quiet Editorial Chrome Tokens ───────────────────────────────────────────
const THEME_FG_MAP: Record<string, string> = {
    Light: '#000000',
    Dark: '#ffffff',
    Sepia: '#4b3621',
    'Cool Dark': '#cdd6f4',
    Frost: '#021a36',
    Solarized: '#657b83',
};

/**
 * Card surface derived from active theme foreground (${fg}08).
 * Works across all 6 themes without hardcoded gray/blue conflicts.
 */
export function getCardBg(themeName?: string, foreground?: string): string {
    if (foreground) {
        return `${foreground}08`;
    }
    const fg = (themeName && THEME_FG_MAP[themeName]) || '#000000';
    return `${fg}08`;
}

export function getCardBorder(foreground: string): string {
    return `${foreground}15`;
}

export function getMutedText(foreground: string): string {
    return `${foreground}70`;
}
