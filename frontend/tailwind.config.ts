import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0A0E1A',
        'dark-card': '#0F1629',
        'dark-border': '#1E2D4A',
        'brand-teal': '#00D4AA',
        'brand-amber': '#F59E0B',
        'brand-red': '#EF4444',
        'brand-blue': '#3B82F6',
        'text-primary': '#E8EAED',
        'text-secondary': '#9FA3A8',
      },
      backgroundColor: {
        'primary': '#0A0E1A',
        'secondary': '#0F1629',
      },
      borderColor: {
        'primary': '#1E2D4A',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slide-in 0.5s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'bounce-in': 'bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'glow-teal': '0 0 20px rgba(0, 212, 170, 0.3)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.3)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.3)',
      },
    },
  },
  plugins: [],
}
export default config
