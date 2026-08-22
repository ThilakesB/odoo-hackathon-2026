/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#3f3f46',
          700: '#27272a',
          800: '#18181b',
          900: '#09090b',
          950: '#000000',
        },
        indigo: {
          50: '#f4f4f5',
          500: '#52525b',
          600: '#3f3f46',
          700: '#27272a',
          900: '#18181b',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.85)',
          'light-hover': 'rgba(255, 255, 255, 0.95)',
          'light-border': 'rgba(0, 0, 0, 0.08)',
          dark: 'rgba(9, 9, 11, 0.85)',
          'dark-hover': 'rgba(24, 24, 27, 0.9)',
          'dark-border': 'rgba(255, 255, 255, 0.1)',
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.04)',
        'glass-lg': '0 12px 40px 0 rgba(0, 0, 0, 0.08)',
        'glass-glow': '0 0 25px -5px rgba(0, 0, 0, 0.12)',
        'apple-card': '0 4px 24px -1px rgba(0, 0, 0, 0.05), 0 2px 8px -1px rgba(0, 0, 0, 0.03)',
        'apple-card-dark': '0 4px 24px -1px rgba(0, 0, 0, 0.6), 0 2px 8px -1px rgba(0, 0, 0, 0.5)',
      },
      backdropBlur: {
        'xs': '2px',
        '2xl': '24px',
        '3xl': '32px',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        glow: {
          '0%': { opacity: '0.4' },
          '100%': { opacity: '0.8' },
        }
      }
    },
  },
  plugins: [],
}
