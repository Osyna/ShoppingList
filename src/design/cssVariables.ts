import { palette, radii, shadows, typography, easings, accent, type AccentName } from './tokens'

/**
 * Snapshot of every token mapped to its CSS custom-property name.
 *
 * Kept in one place so `:root` rules and the runtime theme swap agree
 * on the canonical list. Anything not in here is not themeable at runtime.
 */
export const baseCssVariables: Readonly<Record<string, string>> = {
  '--paper': palette.paper,
  '--paper-2': palette.paper2,
  '--paper-3': palette.paper3,
  '--paper-card': palette.paperCard,
  '--paper-backdrop': palette.paperBackdrop,
  '--paper-backdrop-light': palette.paperBackdropLight,
  '--paper-backdrop-dark': palette.paperBackdropDark,
  '--ink': palette.ink,
  '--ink-2': palette.ink2,
  '--ink-3': palette.ink3,
  '--ink-4': palette.ink4,
  '--line': palette.line,
  '--line-2': palette.line2,
  '--radius': radii.md,
  '--radius-sm': radii.sm,
  '--radius-lg': radii.lg,
  '--shadow-card': shadows.card,
  '--shadow-pop': shadows.pop,
  '--font-sans': typography.sans,
  '--font-serif': typography.serif,
  '--spring': easings.spring,
  '--spring-bounce': easings.springBounce,
  '--ease-out-expo': easings.easeOutExpo,
}

export function accentVariables(name: AccentName): Record<string, string> {
  const a = accent[name]
  return {
    '--accent': a.base,
    '--accent-soft': a.soft,
    '--accent-ink': a.ink,
    '--accent-warm': a.warm,
  }
}

/**
 * Serialize a map of variables into a CSS block body
 * (no selector, just the declarations). Useful for inline `<style>` injection.
 */
export function renderVariableBlock(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}: ${v};`)
    .join('\n  ')
}

/**
 * Apply a set of variables to `document.documentElement`. No-op in SSR.
 */
export function applyVariables(vars: Record<string, string>): void {
  if (typeof document === 'undefined') return
  const r = document.documentElement
  for (const [k, v] of Object.entries(vars)) r.style.setProperty(k, v)
}
