/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Calibri', 'Trebuchet MS', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        av: {
          blue:        '#104866',
          navy:        '#003349',
          teal:        '#096E6B',
          'accent-teal': '#1B9390',
          'light-teal': '#C8E8E7',
          purple:      '#7B569B',
          gold:        '#CFB72E',
          'gold-text': '#82731D',
          'bg-teal':   '#E3F3F3',
          'bg-blue':   '#DDE9EF',
          'bg-purple': '#F6F2F8',
          'bg-gray':   '#F5F5F0',
          'bg-contrast':'#EBECE8',
          'light-gray':'#C8C8C3',
          'med-gray':  '#9A9A96',
          'dk-gray':   '#404040',
        },
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 60s linear infinite',
      },
    },
  },
  plugins: [],
}
