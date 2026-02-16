/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        letterDrop: {
          '0%': {
            opacity: '0',
            transform: 'translateY(-50px) rotateX(-90deg)',
          },
          '50%': {
            opacity: '1',
            transform: 'translateY(10px) rotateX(0deg)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) rotateX(0deg)',
          },
        },
      },
      animation: {
        letterDrop: 'letterDrop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};