import path from "path"
import { defineConfig, type Plugin } from "vitest/config"

/** CSS global da landing não precisa de conteúdo nos testes unitários. */
function cssStub(): Plugin {
  return {
    name: "css-stub",
    load(id) {
      if (id.endsWith(".css")) return "export default {}"
    },
  }
}

export default defineConfig({
  plugins: [cssStub()],
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
