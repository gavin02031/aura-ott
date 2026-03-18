
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

        aura: {
          bg: '#0A0E17',
          surface: '#141A24',
          surface2: '#1C2431',
          red: '#E50914',
          redHover: '#F6121D',
          muted: '#9BA4B5',
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
        'cinematic-lg': '0 35px 80px -20px rgba(0, 0, 0, 0.85)'
      },
      transitionTimingFunction: {
        'max': 'cubic-bezier(0.25,1,0.5,1)'
      }
    },
  },
  plugins: [],
}
