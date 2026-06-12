import { defineConfig } from "prisma/config"
import { resolveDbPath } from "./lib/db-path"

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
