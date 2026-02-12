/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a4a4a',     // Dark teal background
        primary: '#5dd3d3',        // Bright cyan for accents
        secondary: '#0d5b5b',      // Medium teal
        cardBg: '#0d4444',         // Card background
        textPrimary: '#ffffff',    // White text
        textSecondary: '#7a9999',  // Muted teal text
      },
    },
  },
  plugins: [],
};