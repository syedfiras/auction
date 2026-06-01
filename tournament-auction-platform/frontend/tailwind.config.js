/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Add custom neon/glow utilities if desired
      boxShadow: {
        'glow': '0 0 15px rgba(0, 255, 255, 0.5)',
      },
      textShadow: {
        'glow': '0 0 10px cyan',
      },
    },
  },
  plugins: [],
}