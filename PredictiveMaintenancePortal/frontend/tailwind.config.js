/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          main: '#080A09',
          sidebar: '#0D100F',
          panel: '#111512',
          elevated: '#171B18',
        },
        border: {
          subtle: '#1C221E',
          DEFAULT: '#252B27',
          active: '#3A443E',
        },
        text: {
          main: '#E8ECE9',
          muted: '#89928C',
          dim: '#555E57',
        },
        accent: {
          DEFAULT: '#FF805F',
          hover: '#FF957A',
          dim: '#381C15',
        },
        status: {
          healthy: '#43D17D',
          warning: '#F5B942',
          critical: '#FF5B64',
          blue: '#38BDF8',
          purple: '#A78BFA',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
