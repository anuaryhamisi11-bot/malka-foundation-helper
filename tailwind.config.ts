import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#b3ccff',
          300: '#80a8ff',
          400: '#4d7dff',
          500: '#2453ff',
          600: '#1a3fd6',
          700: '#152fa8',
          800: '#12267f',
          900: '#101f5f'
        }
      }
    }
  },
  plugins: []
}

export default config
