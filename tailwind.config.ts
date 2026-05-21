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
          900: "#7F0000",
          800: "#B71C1C",
          600: "#C62828",
          500: "#E53935",
          300: "#EF9A9A",
          100: "#FFEBEE",
          50:  "#FFF5F5",
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
