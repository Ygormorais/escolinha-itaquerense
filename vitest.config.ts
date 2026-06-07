import path from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    // singleFork evita que handles nativos do better-sqlite3 prendam o processo no CI
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
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
