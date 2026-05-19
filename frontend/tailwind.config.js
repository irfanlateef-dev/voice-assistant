/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#070b14',
        surface: 'rgba(15,23,42,0.72)',
        'accent-indigo': '#6366f1',
        'accent-purple': '#a855f7',
        'accent-cyan': '#22d3ee',
        'text-primary': '#eef2ff',
        'text-muted': '#94a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
