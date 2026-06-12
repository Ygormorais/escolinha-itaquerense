import { defineConfig } from "@playwright/test"

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
    command: "npm run dev",
    port: 3000,
    timeout: 120_000,
    reuseExistingServer: true,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
})
