/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./constants/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          100: '#FBF5E6',
          200: '#F4E6BF',
          300: '#DDB856',
          400: '#C69C2E',
          500: '#B48811',
          600: '#8A6605',
          700: '#604600',
          800: '#3D2C00',
          900: '#1F1600',
        },
        luxury: {
          black: '#050505',
          dark: '#0A0A0A',
          panel: '#111111',
          glass: 'rgba(10, 10, 10, 0.95)',
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'serif'],
        sans: ['Lato', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #F4E6BF 0%, #DDB856 50%, #B48811 100%)',
        'gold-gradient-text': 'linear-gradient(to bottom, #F4E6BF, #DDB856)',
        'luxury-radial': 'radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)',
      },
      boxShadow: {
        'glow': '0 0 15px rgba(221, 184, 86, 0.3)',
        'glow-strong': '0 0 25px rgba(221, 184, 86, 0.6)',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      }
    },
  },
  plugins: [],
}