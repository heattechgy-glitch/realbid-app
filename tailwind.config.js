/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#050c1a',
          900: '#0a1628',
          800: '#0f2040',
          700: '#162d58',
          600: '#1e3a6e',
        }
      }
    }
  },
  plugins: []
};
