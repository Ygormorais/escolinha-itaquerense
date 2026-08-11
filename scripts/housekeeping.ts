import { runHousekeeping } from "@/lib/housekeeping"

async function main() {
  console.log("[housekeeping] Iniciando limpeza...")
  const resultado = await runHousekeeping()
  console.log("[housekeeping] Concluído:", resultado)
}

main()
  .catch((error) => {
    console.error("[housekeeping] Erro:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    const { db } = await import("@/lib/db")
    await db.$disconnect()
  })
