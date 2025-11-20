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
        discord: {
          blurple: '#5865F2',
          green: '#57F287',
          yellow: '#FEE75C',
          fuchsia: '#EB459E',
          red: '#ED4245',
          dark: '#23272A',
          darker: '#2C2F33',
          darkest: '#1E2124',
        },
        // High contrast colors
        'hc': {
          'bg-primary': '#000000',
          'bg-secondary': '#0a0a0a',
          'text-primary': '#FFFFFF',
          'text-secondary': '#E0E0E0',
          'border': '#FFFFFF',
          'accent': 'var(--accent-color, #5865F2)',
        }
      },
      backgroundColor: {
        'hc-primary': 'var(--bg-primary, #000000)',
        'hc-secondary': 'var(--bg-secondary, #0a0a0a)',
        'accent': 'var(--accent-color, #5865F2)',
        'accent-hover': 'var(--accent-color-hover, #4752C4)',
        'accent-light': 'var(--accent-color-light, rgba(88, 101, 242, 0.1))',
      },
      textColor: {
        'hc-primary': 'var(--text-primary, #FFFFFF)',
        'hc-secondary': 'var(--text-secondary, #E0E0E0)',
        'accent': 'var(--accent-color, #5865F2)',
      },
      borderColor: {
        'hc': 'var(--border-color, #FFFFFF)',
        'accent': 'var(--accent-color, #5865F2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
}

