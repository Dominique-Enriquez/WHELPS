/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        orange: '#D97706',
        brown: '#4A382C',
        warm: '#80695C',
        cream: '#F8F2E5',
        mist: '#F2F2F2',
        ink: '#171717'
      },
      fontFamily: { display: ['Georgia', 'serif'], body: ['Inter', 'Arial', 'sans-serif'] },
      boxShadow: { soft: '0 18px 45px rgba(74,56,44,.12)' }
    }
  },
  plugins: []
}
