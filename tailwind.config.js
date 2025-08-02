/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'physio-primary': '#4F46E5',
        'physio-secondary': '#06B6D4',
        'physio-success': '#10B981',
        'physio-warning': '#F59E0B',
        'physio-error': '#EF4444',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}