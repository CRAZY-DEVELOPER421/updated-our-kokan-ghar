/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        konkan: {
          green: {
            primary: '#2D6A4F',
            secondary: '#40916C',
            dark: '#1B4332',
            light: '#52B788',
            pale: '#95D5B2',
          },
          saffron: '#E87722',
          gold: '#F4A261',
          cream: '#FAF7F0',
          sand: '#EDE0CC',
          earth: '#3D2B1F',
          ocean: '#1A6B8A',
          text: {
            primary: '#1C1C1E',
            secondary: '#5B6775',
          },
          error: '#DC2626',
          success: '#15803B',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 300ms ease-out forwards',
        'fade-in': 'fadeIn 300ms ease-out forwards',
        'slide-up': 'slideUp 300ms ease-out forwards',
        'slide-in-right': 'slideInRight 300ms ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        'bounce-in': 'bounceIn 400ms ease-out',
        'count-up': 'countUp 2s ease-out',
        shimmer: 'shimmer 2s infinite linear',
        'spin-slow': 'spin 3s linear infinite',
        'bell-ring': 'bellRing 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(232, 119, 34, 0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(232, 119, 34, 0.8)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bellRing: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '10%': { transform: 'rotate(15deg)' },
          '20%': { transform: 'rotate(-15deg)' },
          '30%': { transform: 'rotate(12deg)' },
          '40%': { transform: 'rotate(-12deg)' },
          '50%': { transform: 'rotate(6deg)' },
          '60%': { transform: 'rotate(-6deg)' },
          '70%': { transform: 'rotate(0deg)' },
        },
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'nav': '0 2px 12px rgba(0, 0, 0, 0.06)',
        'modal': '0 20px 60px rgba(0, 0, 0, 0.3)',
        'badge': '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
