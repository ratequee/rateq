const preset = require('@rateq/config/tailwind/preset');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{tsx,ts}', './src/**/*.{tsx,ts}'],
  presets: [require('nativewind/preset'), preset],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
