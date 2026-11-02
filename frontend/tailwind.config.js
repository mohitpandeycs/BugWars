/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ["'Press Start 2P'", "monospace"],
      },
      colors: {
        pixel: {
          "sky-top": "#7FD3F0",
          "sky-bottom": "#2E97D4",
          grass: "#4CAF7D",
          cream: "#EFE7CC",
          "cream-dark": "#E2D6AE",
          red: "#D9534F",
          "red-dark": "#B23A36",
          brown: "#5C4324",
          "brown-dark": "#3B2A14",
          orange: "#F0A030",
          "orange-dark": "#C97D1C",
          pink: "#EC4C8C",
          green: "#4CAF50",
          "green-dark": "#3D8C41",
          ink: "#3B2F1E",
        },
      },
      keyframes: {
        drift: {
          '0%': { transform: 'translateX(0px)' },
          '50%': { transform: 'translateX(15px)' },
          '100%': { transform: 'translateX(0px)' },
        },
        driftSlow: {
          '0%': { transform: 'translateX(0px)' },
          '50%': { transform: 'translateX(25px)' },
          '100%': { transform: 'translateX(0px)' },
        },
        bob: {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
          '100%': { transform: 'translateY(0px)' },
        },
        driftBob: {
          '0%': { transform: 'translate(0px, 0px)' },
          '25%': { transform: 'translate(10px, -6px)' },
          '50%': { transform: 'translate(20px, 0px)' },
          '75%': { transform: 'translate(10px, 6px)' },
          '100%': { transform: 'translate(0px, 0px)' },
        },
      },
      animation: {
        drift: 'drift 6s ease-in-out infinite',
        driftSlow: 'driftSlow 10s ease-in-out infinite',
        bob: 'bob 4s ease-in-out infinite',
        driftBob: 'driftBob 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}