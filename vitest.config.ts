import path from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    reporters: ["default", "./vitest.force-exit-reporter.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "next/font/google": path.resolve(
        __dirname,
        "node_modules/next/dist/build/jest/__mocks__/nextFontMock.js"
      ),
    },
  },
})
