// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        facebook: {
          50: '#f0f2f5',
          100: '#e4e5e9',
          200: '#ccd0d5',
          300: '#b3bac4',
          400: '#9099a1',
          500: '#1877f2',
          600: '#166fe3',
          700: '#1463c0',
          800: '#12549d',
          900: '#0f457a',
        },
      },
    },
  },
  plugins: [],
}