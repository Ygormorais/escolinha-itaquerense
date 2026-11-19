import fs from "fs"
import path from "path"
import { describe, expect, it } from "vitest"

const ROOT = path.resolve(__dirname, "..")
const dockerfile = fs.readFileSync(path.join(ROOT, "Dockerfile"), "utf8")

function estagio(nome: string): string {
  const partes = dockerfile.split(/^FROM /m)
  const achado = partes.find((p) => new RegExp(`AS ${nome}\\s`).test(p.split("\n")[0] + "\n"))
  if (!achado) throw new Error(`estágio ${nome} não encontrado`)
  return achado
}

const runner = estagio("runner")
const builder = estagio("builder")

/** Arquivos copiados do builder para o runner (destino relativo a /app). */
const copiados = new Set(
  [...runner.matchAll(/^COPY --from=builder \/app\/(\S+) \.\/(\S+)/gm)].map((m) => m[2]),
)

function copiado(rel: string): boolean {
  const normal = rel.replace(/\\/g, "/")
  return [...copiados].some((c) => normal === c || normal.startsWith(c.replace(/\/?$/, "/")))
}

/** Imports relativos de um .ts, seguidos recursivamente. */
function importsRelativos(arquivo: string, vistos = new Set<string>()): Set<string> {
  const texto = fs.readFileSync(path.join(ROOT, arquivo), "utf8")
  for (const m of texto.matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g)) {
    let alvo = path.relative(ROOT, path.resolve(ROOT, path.dirname(arquivo), m[1]))
    if (!alvo.endsWith(".ts")) alvo += ".ts"
    alvo = alvo.replace(/\\/g, "/")
    if (vistos.has(alvo)) continue
    vistos.add(alvo)
    importsRelativos(alvo, vistos)
  }
  return vistos
}

describe("Dockerfile — imagem final", () => {
  it.each(["prisma.config.ts", "prisma/seed-prod.ts"])(
    "copia tudo o que %s importa",
    (entrada) => {
      expect(copiado(entrada)).toBe(true)
      for (const dep of importsRelativos(entrada)) {
        expect(copiado(dep), `${dep} falta no runner`).toBe(true)
      }
    },
  )

  it("copia o next.config.ts lido pelo next start e tudo o que ele importa", () => {
    expect(copiado("next.config.ts")).toBe(true)
    for (const dep of importsRelativos("next.config.ts")) {
      expect(copiado(dep), `${dep} falta no runner (next start cairia ao carregar a configuração)`).toBe(true)
    }
  })

  it.each(["NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_VAPID_PUBLIC_KEY"])(
    "recebe %s como build arg antes do next build",
    (nome) => {
      const idxArg = builder.indexOf(`ARG ${nome}`)
      const idxBuild = builder.indexOf("npm run build")
      expect(idxArg).toBeGreaterThan(-1)
      expect(idxArg).toBeLessThan(idxBuild)
    },
  )

  it("grava banco, uploads, backups e config dentro do volume /data", () => {
    expect(runner).toMatch(/^ENV DATABASE_URL=file:\/data\//m)
    expect(runner).toMatch(/^ENV UPLOADS_DIR=\/data\//m)
    expect(runner).toMatch(/^ENV BACKUP_DIR=\/data\//m)
    expect(runner).toMatch(/^ENV CLUB_CONFIG_PATH=\/data\//m)
    const railway = JSON.parse(fs.readFileSync(path.join(ROOT, "railway.json"), "utf8"))
    expect(railway.deploy.requiredMountPath).toBe("/data")
  })
})
