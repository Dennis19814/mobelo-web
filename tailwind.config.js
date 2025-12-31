/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          main: '#8055f3',
          hover: '#6d43e8',
        },
        text: {
          primary: '#1e1e1e',
          secondary: '#6e6e6e',
        },
        highlight: {
          blue: '#eef2ff',
          green: '#e9f9f1',
          purple: '#f3ebfd',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}