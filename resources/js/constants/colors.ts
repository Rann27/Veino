/**
 * Veinovel — Central Color System
 *
 * Allowed key colors:
 *   - bg / fg        → currentTheme.background / currentTheme.foreground  (dynamic)
 *   - SHINY_PURPLE   → brand + premium + membership
 *   - COIN_*         → coin / payment related
 *   - SUCCESS_COLOR  → green confirmations / ongoing
 *   - ERROR_COLOR    → red errors / dropped
 *   - WARNING_COLOR  → amber warnings / hiatus
 *
 * Everything else is an intruder. No blue (#3b82f6, #2563eb, etc.) in UI.
 */

// ─── Brand / Premium ──────────────────────────────────────────────────────────
export const SHINY_PURPLE      = '#a78bfa';   // violet-400 — main brand color
export const SHINY_PURPLE_DARK = '#7c3aed';   // violet-700 — hover / deeper accent
export const SHINY_PURPLE_DIM  = 'rgba(167,139,250,0.15)'; // subtle purple bg

// ─── Coins / Payment ──────────────────────────────────────────────────────────
export const COIN_COLOR  = '#f59e0b';   // amber-500
export const COIN_LIGHT  = '#fbbf24';   // amber-300
export const COIN_DIM    = 'rgba(251,191,36,0.15)';

// ─── Semantic ─────────────────────────────────────────────────────────────────
export const SUCCESS_COLOR  = '#22c55e';   // green-500
export const ERROR_COLOR    = '#ef4444';   // red-500
export const WARNING_COLOR  = '#f59e0b';   // amber-500  (same as coin; intentional)

// ─── Series Status Badges ─────────────────────────────────────────────────────
// "completed" is VIOLET (purple family) — never blue
export const STATUS_COLORS: Record<string, { bg: string; text: string; dim: string }> = {
    ongoing:   { bg: '#22c55e',  text: '#ffffff', dim: 'rgba(34,197,94,0.15)'   },
    completed: { bg: '#7c3aed',  text: '#ffffff', dim: 'rgba(124,58,237,0.15)'  },
    hiatus:    { bg: '#f59e0b',  text: '#000000', dim: 'rgba(245,158,11,0.15)'  },
    dropped:   { bg: '#ef4444',  text: '#ffffff', dim: 'rgba(239,68,68,0.15)'   },
};

export function getStatusColor(status: string) {
    return STATUS_COLORS[status?.toLowerCase()] ?? {
        bg: 'rgba(120,120,120,0.25)',
        text: '#ffffff',
        dim: 'rgba(120,120,120,0.1)',
    };
}

// ─── Card Background Utility ──────────────────────────────────────────────────
export function getCardBg(themeName: string): string {
    switch (themeName) {
        case 'Light':     return 'rgba(248, 250, 252, 0.9)';
        case 'Dark':      return 'rgba(30, 41, 59, 0.6)';
        case 'Sepia':     return 'rgba(244, 236, 216, 0.7)';
        case 'Cool Dark': return 'rgba(49, 50, 68, 0.6)';
        case 'Frost':     return 'rgba(205, 220, 237, 0.7)';
        case 'Solarized': return 'rgba(253, 246, 227, 0.7)';
        default:          return 'rgba(30, 41, 59, 0.6)';
    }
}
