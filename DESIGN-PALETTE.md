# Veinovel — Colour Palette

Everything in this file is read from the running code, not invented. These are
the values a redesign has to keep; layout, components and spacing are open.

The single most important thing to understand before changing anything:

> **Veinovel has no brand colour, and that is deliberate.**

The interface is driven by a theme the reader picks. Every surface, border and
muted label is derived from two values — `background` and `foreground` — of
whichever theme is active. A fixed brand colour would fight all six themes at
once. The only fixed colours in the product are the ones that carry *meaning*:
membership tiers, coins, and status.

---

## 1. Themes

Six presets, user-selectable, defined in
`resources/js/Contexts/ThemeContext.tsx`. Only `background` and `foreground` are
stored; everything else is derived from them.

| Theme | Background | Foreground |
|---|---|---|
| Light | `#ffffff` | `#000000` |
| Dark | `#000000` | `#ffffff` |
| Sepia | `#f4ecd8` | `#4b3621` |
| Cool Dark | `#1e1e2e` | `#cdd6f4` |
| Frost | `#cddced` | `#021a36` |
| Solarized | `#fdf6e3` | `#657b83` |

Mirrored into CSS as `--theme-bg`, `--theme-fg`, `--theme-bg-inverted`,
`--theme-fg-inverted` (`resources/css/app.css`).

### The alpha-suffix convention

Rather than defining greys, the codebase appends an 8-bit hex alpha to the
foreground. This is used everywhere and should survive any redesign, because it
is what makes one component work across six themes without a per-theme override.

| Token | Meaning |
|---|---|
| `${fg}08` | Card fill on a plain background |
| `${fg}0C` | Button fill, hover surface |
| `${fg}15` | Border, divider |
| `${fg}70` | Muted / secondary text |

Cards frequently use `rgba(0,0,0,0.02)` on light themes and
`rgba(255,255,255,0.03)` on dark, chosen by whether the theme name contains
"light".

---

## 2. Membership tiers

Defined in `resources/js/lib/tier.tsx`. This is the closest thing Veinovel has
to a brand identity, and it is the part most worth protecting — readers
recognise their tier by these colours before they read the label.

### Premium — violet

| Role | Value |
|---|---|
| Accent (`SHINY_PURPLE`) | `#a78bfa` |
| Gradient | `linear-gradient(135deg, #c084fc, #e879f9, #818cf8)` |
| Glow | `0 0 10px #a78bfa60` |
| Badge fill | `#a78bfa1F` with `#a78bfa` text |

Gradient stops in use: `#c084fc` → `#e879f9` → `#818cf8`.
The diamond icon uses `#c084fc` → `#e879f9` → `#a78bfa`.

### Premium Exclusive — violet + gold

| Role | Value |
|---|---|
| Accent (`EXCLUSIVE_GOLD`) | `#f5c542` |
| Gradient | `linear-gradient(115deg, #a78bfa, #f5c542, #e879f9, #f5c542, #a78bfa)` |
| Glow | `0 0 12px #a78bfa70, 0 0 20px #f5c54245` |
| Badge text on gold | `#1a1206` |

Crown icon stops: `#f7d774` → `#f5c542` → `#c9962a`.

Exclusive deliberately *contains* the Premium violet rather than replacing it —
it reads as Premium with something added, which is exactly what it is.

### Basic

No colour. `TIER_COLOR.basic` is `currentColor`, gradient `transparent`, glow
`none`. Basic is the absence of a membership, and it should look like it.

---

## 3. Coins

Amber, used for balances, prices and coin icons.

| Role | Value |
|---|---|
| Primary | `#f59e0b` |
| Deep / text on light | `#d97706` |
| Bright / highlight | `#fbbf24` |
| Darkest (borders, pressed) | `#b45309` |

Occasionally warmed towards orange (`#f97316`, `#ea580c`) on emphasis.
Keep coins amber and tiers violet — they are the two currencies of the product
and must never be confusable.

---

## 4. Status colours

Semantic, theme-independent. Kept close to the Tailwind scale so they stay
legible on all six backgrounds.

| Meaning | Value |
|---|---|
| Success / granted / in use | `#22c55e` (deep `#16a34a`, alt `#10b981`) |
| Danger / error / delete | `#ef4444` (deep `#dc2626`, soft `#f87171`) |
| Warning / caution | `#f59e0b` |
| Info / neutral action | `#3b82f6` (deep `#2563eb`, soft `#60a5fa`) |
| Inactive / disabled | `#6b7280`, `#64748b` |

### Admin monitor outcomes

From `resources/js/pages/Admin/UnlockMonitor/Index.tsx`, where each refusal
reason needs to be distinguishable at a glance:

| Outcome | Value |
|---|---|
| Granted | `#22c55e` |
| Too fast | `#ef4444` |
| Foreign referer | `#f59e0b` |
| Never started | `#8b5cf6` |
| Daily limit | `#3b82f6` |
| Too many refusals | `#ec4899` |
| Expired link | `#f97316` |
| Challenge off | `#6b7280` |
| Started | `#64748b` |

---

## 5. Typography

| Token | Stack |
|---|---|
| `--font-sans` | Instrument Sans → system UI |
| `--font-display` | Poppins → Instrument Sans → system UI |

---

## 6. Rules for a redesign

Free to change: layout, spacing, component shapes, radii, shadows, motion,
iconography, type scale, grid.

Must survive:

1. **No fixed brand colour.** Chrome derives from the active theme. Anything
   hard-coded to one hue breaks five of the six themes.
2. **Premium is violet `#a78bfa`. Exclusive is violet + gold `#f5c542`.**
   Exclusive must keep containing the Premium violet.
3. **Coins are amber `#f59e0b`** and never violet.
4. **All six themes must stay usable**, including Sepia and Solarized, which are
   the ones a careless redesign breaks first — they are neither light nor dark.
5. **Status colours keep their meanings.** Green is granted, red is refused,
   amber is caution.
6. **Contrast holds on every theme.** Foreground-derived alphas are what make
   this work; replacing them with fixed greys will fail on Frost and Sepia.
