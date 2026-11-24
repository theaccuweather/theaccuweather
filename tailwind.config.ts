import type { Config } from 'tailwindcss';

// Design tokens taken from the approved aqi.in-style layouts.
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#0a7cff', light: '#4da3ff', night: '#050a14' },
        page: '#f4f6fb',
        line: '#e3e7ef',
        ink: '#1f2633',
        muted: '#5b6475',
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
