/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#fafaf9',
        surface: '#ffffff',
        elevated: '#f5f5f4',
        'accent-amber': '#d97706',
        'accent-orange': '#ea580c',
        'text-primary': '#1c1917',
        'text-muted': '#78716c',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
