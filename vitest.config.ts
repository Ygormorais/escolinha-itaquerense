import path from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // Mock próprio: o nextFontMock.js do Next é um Proxy que responde a
      // `then`, virando um thenable que faz o import() do vitest pendurar.
      "next/font/google": path.resolve(__dirname, "__tests__/mocks/next-font-mock.ts"),
    },
  },
})
