import fs from "fs"
import path from "path"

/** Carrega .env e .env.local no process.env (sem dependência extra). */
export function loadEnv(cwd = process.cwd()) {
  // Variáveis herdadas do processo têm prioridade sobre qualquer arquivo;
  // .env.local pode sobrescrever apenas valores carregados de .env.
  const inherited = new Set(Object.keys(process.env))
  for (const name of [".env", ".env.local"]) {
    const p = path.join(cwd, name)
    if (!fs.existsSync(p)) continue
    const text = fs.readFileSync(p, "utf8")
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim()
      if (!t || t.startsWith("#")) continue
      const eq = t.indexOf("=")
      if (eq <= 0) continue
      const key = t.slice(0, eq).trim()
      let val = t.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (!inherited.has(key)) process.env[key] = val
    }
  }
}
