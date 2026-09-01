const preset = require('@rateq/config/tailwind/preset');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{tsx,ts}', './src/**/*.{tsx,ts}'],
  presets: [require('nativewind/preset'), preset],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito_400Regular', 'system-ui', 'sans-serif'],
        arabic: ['NotoSansArabic_400Regular', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
