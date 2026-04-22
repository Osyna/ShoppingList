/** @type {import('tailwindcss').Config} */
// Token values live in src/design/tokens.ts. This config exposes them to
// Tailwind through CSS variable references so runtime theme swaps still work.
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'var(--paper)',
          2: 'var(--paper-2)',
          3: 'var(--paper-3)',
          card: 'var(--paper-card)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
          4: 'var(--ink-4)',
          muted: 'var(--ink-3)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
          ink: 'var(--accent-ink)',
          warm: 'var(--accent-warm)',
        },
        surface: {
          DEFAULT: 'var(--paper-card)',
          muted: 'var(--paper-2)',
        },
        line: 'var(--line)',
        line2: 'var(--line-2)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        pop: 'var(--shadow-pop)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        serif: 'var(--font-serif)',
      },
      transitionTimingFunction: {
        spring: 'var(--spring)',
        'spring-bounce': 'var(--spring-bounce)',
        'ease-out-expo': 'var(--ease-out-expo)',
      },
    },
  },
  plugins: [],
}
