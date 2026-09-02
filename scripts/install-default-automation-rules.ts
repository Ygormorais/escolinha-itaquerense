import { loadEnv } from "./load-env"
loadEnv()

import { instalarRegrasAutomacaoPadrao } from "../lib/automacoes-defaults"
import { db } from "../lib/db"

instalarRegrasAutomacaoPadrao("sistema")
  .then((resultado) => console.log(JSON.stringify(resultado)))
  .catch((erro) => { console.error(erro); process.exitCode = 1 })
  .finally(async () => { await db.$disconnect() })
