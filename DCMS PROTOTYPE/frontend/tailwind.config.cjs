/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kabarak: {
          purple: {
            DEFAULT: '#534AB7',
            light: '#6E66D6',
            dark: '#3C3494',
          },
          teal: {
            DEFAULT: '#0F6E56',
            light: '#179E7C',
            dark: '#0A4D3C',
          },
          slate: {
            bg: '#F8FAFC',
            card: '#FFFFFF',
            border: '#E2E8F0',
            text: '#1E293B'
          }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}