import { defineConfig } from "@playwright/test"

const isCI = process.env.CI === "true"

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup",
  globalTeardown: "./e2e/global-teardown",
  timeout: 30_000,
  retries: 1,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    permissions: ["clipboard-read", "clipboard-write"],
  },
  webServer: {
    // O runner compartilhado do GitHub não consegue compilar dezenas de rotas
    // sob demanda dentro do timeout de cada teste. No CI usamos o build de
    // produção preparado pelo workflow; no desenvolvimento mantemos o servidor
    // com hot reload.
    command: isCI ? "npm run start" : "npm run dev",
    port: 3000,
    timeout: 180_000,
    reuseExistingServer: !isCI,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
})
