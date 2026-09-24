/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Newsreader"', '"Lora"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', '"Space Mono"', 'monospace'],
      },
      colors: {
        canvas: {
          DEFAULT: '#FAF9F5',
          subtle: '#F5F0E8',
          muted: '#EFE9DE',
        },
        surface: {
          DEFAULT: '#FFFFFF',
        },
        ink: {
          DEFAULT: '#141413',
          body: '#3D3D3A',
          muted: '#6C6A64',
          subtle: '#8E8B82',
        },
        hairline: {
          DEFAULT: '#E6DFD8',
          soft: '#EBE6DF',
        },
        coral: {
          DEFAULT: '#CC785C',
          hover: '#B5654A',
          active: '#A9583E',
          subtle: '#FDF4F0',
          border: '#F1CEC2',
        },
        status: {
          critical: { text: '#9E2A2B', bg: '#FDF2F2', border: '#F5C2C2', dot: '#C64545' },
          high:     { text: '#92400E', bg: '#FFFBEB', border: '#FDE68A', dot: '#D97706' },
          moderate: { text: '#78350F', bg: '#FEF3C7', border: '#FCD34D', dot: '#B45309' },
          safe:     { text: '#166534', bg: '#F0FDF4', border: '#BBF7D0', dot: '#22C55E' },
          info:     { text: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE', dot: '#3B82F6' },
        },
      },
      borderRadius: {
        xs: '4px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.03)',
        'elevated': '0 4px 12px rgba(0,0,0,0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
