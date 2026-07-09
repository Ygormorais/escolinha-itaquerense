import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class", "[data-theme='dark']"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          950: "#4A0B0B",
          900: "#7F0000",
          800: "#9F1D1D",
          700: "#9F1D1D",
          600: "#C62828",
          500: "#E53935",
          200: "#F6CACA",
          300: "#EF9A9A",
          100: "#FFEBEE",
          50: "#FFF5F5",
        },
        ink: {
          950: "#1C1412",
          900: "#1C1412",
          700: "#5C534E",
          500: "#8A827C",
          300: "#D4CBC0",
        },
        paper: {
          100: "#F3EFE9",
          50: "#FAF8F5",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Georgia", "serif"],
        body: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
export default config
