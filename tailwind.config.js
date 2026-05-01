/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Nunito'", 'sans-serif'],
        body: ["'Inter'", 'sans-serif'],
      },
      colors: {
        brand: {
          1: '#316735',
          2: '#85BB4B',
          3: '#61CDFB',
          4: '#C7E8F9',
          5: '#D7E4C4',
          6: '#EC6D5C',
          7: '#5F4B31',
        },
      },
      backgroundImage: {
        'app-gradient': 'linear-gradient(145deg, #1a3d20 0%, #316735 55%, #1c4528 100%)',
      },
    },
  },
  plugins: [],
}
