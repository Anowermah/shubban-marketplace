/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        shubban: {
          green: {
            DEFAULT: '#123D32',
            50: '#F2F8F6',
            100: '#E1EFEA',
            200: '#BFDFD4',
            300: '#92C6B5',
            400: '#5BA58F',
            500: '#348670',
            600: '#236B58',
            700: '#1A5344',
            800: '#123D32', // Primary
            900: '#0C2A22',
            950: '#061713',
          },
          ivory: {
            DEFAULT: '#F8F5ED',
            light: '#FCFAF5',
            dark: '#ECE7D8',
          },
          gold: {
            DEFAULT: '#C49A45',
            light: '#DEBC75',
            dark: '#9E782E',
            hover: '#B38938',
          },
          charcoal: {
            DEFAULT: '#222522',
            light: '#3C403C',
            muted: '#5F655F',
          },
          surface: '#F0F1EC',
          darkBg: '#0D1714',
          darkCard: '#13231E',
          darkBorder: '#1E352E',
        },
      },
      fontFamily: {
        bengali: ['"Bornomala"', '"Hind Siliguri"', '"Noto Sans Bengali"', 'system-ui', 'sans-serif'],
        serif: ['"Bornomala"', '"Galada"', 'Merriweather', 'serif'],
        sans: ['"Bornomala"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
