
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Flat aliases (more reliable for @apply)
        'aura-bg': '#0A0E17',
        'aura-surface': '#141A24',
        'aura-surface2': '#1C2431',
        'aura-red': '#E50914',
        'aura-red-hover': '#F6121D',
        'aura-muted': '#9BA4B5',
        'aura-accent': '#FF6B6B',

        aura: {
          bg: '#0A0E17',
          surface: '#141A24',
          surface2: '#1C2431',
          red: '#E50914',
          redHover: '#F6121D',
          muted: '#9BA4B5',
          accent: '#FF6B6B',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ]
      },
      boxShadow: {
        'cinematic': '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        'cinematic-lg': '0 35px 80px -20px rgba(0, 0, 0, 0.85)',
        'cinematic-xl': '0 45px 100px -25px rgba(0, 0, 0, 0.9)',
        'glow-red': '0 0 30px -5px rgba(229, 9, 20, 0.35)',
        'glow-white': '0 0 25px -5px rgba(255, 255, 255, 0.12)',
        'card-hover': '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px -8px rgba(229, 9, 20, 0.12)',
      },
      transitionTimingFunction: {
        'max': 'cubic-bezier(0.25,1,0.5,1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
      },
      backdropBlur: {
        '3xl': '64px',
      }
    },
  },
  plugins: [],
}
