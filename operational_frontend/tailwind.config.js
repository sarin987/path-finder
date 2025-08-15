/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'facebook': {
          DEFAULT: '#1877F2',
          dark: '#1661C9',
        },
      },
    },
  },
  plugins: [],
};
