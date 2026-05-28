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
          800: "#B71C1C",
          700: "#9F1D1D",
          600: "#C62828",
          500: "#E53935",
          200: "#F6CACA",
          300: "#EF9A9A",
          100: "#FFEBEE",
          50: "#FFF7F7",
        },
        ink: {
          950: "#171312",
          900: "#221C1B",
          700: "#4F4543",
          500: "#7A6F6C",
          300: "#CFC4C1",
        },
        paper: {
          100: "#F6F0EE",
          50: "#FBF8F6",
        },
      },
      fontFamily: {
        heading: ["Nunito", "sans-serif"],
        body:    ["Inter",  "sans-serif"],
      },
    },
  },
  plugins: [],
}
export default config
