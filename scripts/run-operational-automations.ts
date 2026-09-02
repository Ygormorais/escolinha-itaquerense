import { loadEnv } from "./load-env"
loadEnv()

import { executarTodasAutomacoesAdministrativas } from "../lib/automacoes-runner"
import { db } from "../lib/db"

executarTodasAutomacoesAdministrativas()
  .then((resultado) => console.log(JSON.stringify(resultado)))
  .catch((erro) => { console.error(erro); process.exitCode = 1 })
  .finally(async () => { await db.$disconnect() })
