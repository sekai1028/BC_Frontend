/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        // Responsive breakpoints — change here to affect sm/md/lg/xl app-wide
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
        desktop: '1600px', // header: max-desktop = compact, desktop: = full size, single line
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        serif: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['Space Grotesk', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        terminal: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'app-xs': ['0.8125rem', { lineHeight: '1.35' }],   // 13px – labels, captions
        'app-sm': ['0.9375rem', { lineHeight: '1.4' }],   // 15px – secondary
        'app-base': ['1rem', { lineHeight: '1.5' }],       // 16px – body
        'app-lg': ['1.125rem', { lineHeight: '1.4' }],    // 18px – emphasis
        'app-xl': ['1.25rem', { lineHeight: '1.35' }],    // 20px – headings
        'app-2xl': ['1.5rem', { lineHeight: '1.3' }],     // 24px – section titles
        'app-3xl': ['1.875rem', { lineHeight: '1.25' }],  // 30px – hero
        'app-4xl': ['2.25rem', { lineHeight: '1.2' }],    // 36px – display
      },
      colors: {
        'bunker-green': '#00FF41',
        'bunker-purple': '#1A0033',
        'bunker-purple-light': '#BF00FF',
        'bunker-yellow': '#F0FF00',
        'bunker-amber': '#FFBF00',
        'bunker-orange': '#FF8C00',
        'bunker-red': '#FF0000',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'breathing': 'pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
