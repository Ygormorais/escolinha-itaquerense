import { defineConfig } from "prisma/config"
import { resolveDbPath } from "./lib/db-path"
import { loadEnv } from "./scripts/load-env"

// O Prisma 7 não carrega .env automaticamente ao usar prisma.config.ts.
// CLI, deploy e scripts precisam resolver o mesmo arquivo que a aplicação.
loadEnv()

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    // Caminho absoluto para garantir que migrate/studio usem o MESMO arquivo
    // que o app em runtime (lib/db.ts).
    url: `file:${resolveDbPath()}`,
  },
  migrations: {
    seed: "npx ts-node ./prisma/seed.ts",
  },
})
