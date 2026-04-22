/**
 * Design tokens — single source of truth for the visual language.
 *
 * Everything that has a visual value (color, radius, shadow, spacing,
 * typography, easing, palettes) is defined here. Consumers:
 *   - `src/design/cssVariables.ts`     → serializes to CSS custom properties
 *   - `tailwind.config.js`             → re-exports via `import('./src/design/tokens')`
 *   - `src/design/themes.ts`           → accent swaps
 *   - `src/composables/useCategoryAppearance.ts` → pulls its palette from here
 *
 * Changing a value here propagates to every surface. Never inline raw
 * `oklch(...)`, pixel values, or hex in components — add a token first.
 */

export const palette = {
  paper: '#f6f1e6',
  paper2: '#efe8d8',
  paper3: '#e7dfcb',
  paperCard: '#fffdf7',
  paperBackdrop: '#d9cfb8',
  paperBackdropLight: '#ddd3be',
  paperBackdropDark: '#c9bfa6',
  ink: '#1c1a15',
  ink2: '#3b382f',
  ink3: '#6b6759',
  ink4: '#9a9583',
  line: 'rgba(28, 26, 21, 0.09)',
  line2: 'rgba(28, 26, 21, 0.16)',
} as const

export const accent = {
  crimson: {
    base: 'oklch(0.55 0.15 25)',
    soft: 'oklch(0.55 0.15 25 / 0.12)',
    ink: 'oklch(0.35 0.12 25)',
    warm: 'oklch(0.72 0.13 60)',
  },
  sage: {
    base: 'oklch(0.62 0.09 155)',
    soft: 'oklch(0.62 0.09 155 / 0.14)',
    ink: 'oklch(0.38 0.08 155)',
    warm: 'oklch(0.72 0.13 60)',
  },
  amber: {
    base: 'oklch(0.68 0.13 60)',
    soft: 'oklch(0.68 0.13 60 / 0.14)',
    ink: 'oklch(0.42 0.10 60)',
    warm: 'oklch(0.72 0.13 60)',
  },
  ink: {
    base: 'oklch(0.25 0.02 80)',
    soft: 'oklch(0.25 0.02 80 / 0.10)',
    ink: 'oklch(0.20 0.02 80)',
    warm: 'oklch(0.72 0.13 60)',
  },
  cobalt: {
    base: 'oklch(0.55 0.13 260)',
    soft: 'oklch(0.55 0.13 260 / 0.12)',
    ink: 'oklch(0.38 0.11 260)',
    warm: 'oklch(0.72 0.13 60)',
  },
} as const

export type AccentName = keyof typeof accent
export type AccentTokens = (typeof accent)[AccentName]

/** Category-chip palette used by `useCategoryAppearance`. */
export const categoryPalette = [
  'oklch(0.72 0.12 140)',
  'oklch(0.82 0.08 85)',
  'oklch(0.78 0.10 55)',
  'oklch(0.68 0.09 35)',
  'oklch(0.65 0.10 220)',
  'oklch(0.70 0.11 305)',
  'oklch(0.73 0.10 180)',
  'oklch(0.68 0.12 10)',
  'oklch(0.75 0.14 75)',
  'oklch(0.55 0.08 260)',
] as const

export const categoryPaletteNeutral = 'oklch(0.75 0.01 80)'

export const radii = {
  sm: '10px',
  md: '14px',
  lg: '20px',
} as const

export const shadows = {
  card: '0 1px 0 rgba(28,26,21,0.04), 0 1px 3px rgba(28,26,21,0.05), 0 8px 24px -12px rgba(28,26,21,0.12)',
  pop: '0 2px 8px rgba(28,26,21,0.08), 0 24px 48px -16px rgba(28,26,21,0.25)',
} as const

export const typography = {
  sans: "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  serif: "'Instrument Serif', Georgia, 'Times New Roman', serif",
} as const

export const easings = {
  spring: 'cubic-bezier(0.32, 0.72, 0, 1)',
  springBounce: 'cubic-bezier(0.2, 0.9, 0.3, 1.2)',
  easeOutExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const

export const tokens = {
  palette,
  accent,
  categoryPalette,
  categoryPaletteNeutral,
  radii,
  shadows,
  typography,
  easings,
} as const

export type DesignTokens = typeof tokens
