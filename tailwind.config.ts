import type { Config } from 'tailwindcss';

// Colours come from CSS variables (src/app/globals.css), so the "Lights" switch can flip
// the whole site between dark (default) and light without changing any class names.
const v = (name: string) => `rgb(var(--taw-${name}) / <alpha-value>)`;

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#0a7cff', light: '#4da3ff', night: '#050a14' },
        page: v('page'),
        card: v('card'),
        raised: v('raised'),
        line: v('line'),
        ink: v('ink'),
        muted: v('muted'),
        link: v('link'),
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
