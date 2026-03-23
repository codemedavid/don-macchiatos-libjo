/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#faf8f5',
          100: '#f5f0ea',
          200: '#ebe0d2',
          300: '#dccbb4',
          400: '#c9af91',
          500: '#b89572',
          600: '#a07a56',
          700: '#856344',
          800: '#6b4f38',
          900: '#573f2e'
        },
        beige: {
          50: '#f9f8f6',
          100: '#f3f1ed',
          200: '#e8e4dd',
          300: '#d9d3c8',
          400: '#c6bead',
          500: '#b3a894',
          600: '#9c8f7a',
          700: '#817464',
          800: '#695e52',
          900: '#564d43'
        },
        espresso: {
          50: '#f7f5f3',
          100: '#ede8e3',
          200: '#ddd4ca',
          300: '#c4b5a5',
          400: '#a8917a',
          500: '#8f7560',
          600: '#7a5f4a',
          700: '#654c3b',
          800: '#503c2f',
          900: '#3d2e24'
        }
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'playfair': ['Playfair Display', 'serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        bounceGentle: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-4px)' },
          '60%': { transform: 'translateY(-2px)' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    },
  },
  plugins: [],
};