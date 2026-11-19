import fs from "node:fs"
import path from "node:path"
import { describe, it, expect } from "vitest"
import { isPrivateAppPath, isPublicRoute } from "@/lib/public-routes"
import { isPublicPath } from "@/proxy"

describe("isPublicRoute", () => {
  it("rotas exatas públicas", () => {
    expect(isPublicRoute("/")).toBe(true)
    expect(isPublicRoute("/login")).toBe(true)
    expect(isPublicRoute("/privacidade")).toBe(true)
    expect(isPublicRoute("/termos")).toBe(true)
    expect(isPublicRoute("/horarios")).toBe(true)
    expect(isPublicRoute("/resultados")).toBe(true)
    expect(isPublicRoute("/partidas")).toBe(true)
    expect(isPublicRoute("/frequencia/scanner")).toBe(true)
  })

  it("prefixos públicos e subpaths", () => {
    expect(isPublicRoute("/responsavel")).toBe(true)
    expect(isPublicRoute("/responsavel/dashboard")).toBe(true)
    expect(isPublicRoute("/responsavel/mensalidades")).toBe(true)
    expect(isPublicRoute("/matricula")).toBe(true)
    expect(isPublicRoute("/matricula/nova")).toBe(true)
    expect(isPublicRoute("/noticias/publico")).toBe(true)
    expect(isPublicRoute("/noticias/publico/123")).toBe(true)
    expect(isPublicRoute("/buscar")).toBe(true)
    expect(isPublicRoute("/validar-recibo/abc123")).toBe(true)
  })

  it("rotas protegidas não são públicas", () => {
    expect(isPublicRoute("/dashboard")).toBe(false)
    expect(isPublicRoute("/alunos")).toBe(false)
    expect(isPublicRoute("/alunos/1")).toBe(false)
    expect(isPublicRoute("/pagamentos")).toBe(false)
    expect(isPublicRoute("/admin")).toBe(false)
    expect(isPublicRoute("/noticias")).toBe(false)
  })

  it("não confunde prefixo com rota similar", () => {
    expect(isPublicRoute("/responsavel-admin")).toBe(false)
    expect(isPublicRoute("/matricula-online")).toBe(false)
  })
})

describe("isPrivateAppPath", () => {
  it.each(["/dashboard", "/alunos", "/alunos/1", "/api/alunos", "/api", "/uploads/documentos/x.pdf", "/noticias/admin", "/configuracoes/matriculas"])(
    "%s é área privada",
    (rota) => expect(isPrivateAppPath(rota)).toBe(true),
  )

  it.each(["/nao-existe", "/admin", "/alunosx", "/apix", "/foo/alunos", "/Alunos"])(
    "%s não é área privada (vira 404)",
    (rota) => expect(isPrivateAppPath(rota)).toBe(false),
  )

  it("toda pasta de app/ é pública ou privada: nenhuma rota nova fica sem classificação", () => {
    const appDir = path.join(process.cwd(), "app")
    const pastas = fs
      .readdirSync(appDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
      .map((d) => d.name)
      // pastas que não viram rota (ações de servidor)
      .filter((nome) => nome !== "actions")
      // portal do responsável: o proxy tem ramo próprio (cookie responsavel_session)
      .filter((nome) => nome !== "responsavel")
    expect(pastas.length).toBeGreaterThan(10)

    const semClasse = pastas.filter((nome) => {
      const rota = `/${nome}`
      return !isPrivateAppPath(rota) && !isPublicPath(rota) && !isPublicPath(`${rota}/x`)
    })
    expect(semClasse).toEqual([])
  })
})
