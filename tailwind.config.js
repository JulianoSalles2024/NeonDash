/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Orbitron', 'sans-serif'],
      },
      colors: {
        neon: {
          cyan: '#7CFCF3',
          blue: '#4EE1FF',
          purple: '#9B5CFF',
          pink: '#FF4ECF',
          green: '#34FFB0',
        },
        dark: {
          bg: '#0B0F1A',
          surface: '#111625',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #7CFCF3, 0 0 10px #7CFCF3' },
          '100%': { boxShadow: '0 0 20px #7CFCF3, 0 0 30px #7CFCF3' },
        }
      }
    },
  },
  plugins: [],
}