/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        terminal: ['VT323', 'Courier New', 'monospace'],
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
