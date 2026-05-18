/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'cwm-dark':   '#0f172a',
        'cwm-darker': '#020617',
        'cwm-panel':  '#1e293b',
        'cwm-border': '#334155',
        'cwm-accent': '#3b82f6',
        'cwm-purple': '#8b5cf6',
        'cwm-green':  '#10b981',
        'cwm-red':    '#ef4444',
        'cwm-yellow': '#f59e0b',
        'cwm-cyan':   '#06b6d4',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
