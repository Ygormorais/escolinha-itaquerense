import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it, vi } from "vitest"
import robots from "@/app/robots"
import sitemap from "@/app/sitemap"
import { mascararTelefone } from "@/lib/mascarar-telefone"

const raiz = process.cwd()
const ler = (p: string) => readFileSync(join(raiz, p), "utf8")

describe("robots e sitemap", () => {
  it("sitemap lista só rotas públicas, sem área autenticada nem redirecionamentos", () => {
    const urls = sitemap().map((i) => new URL(i.url).pathname)
    expect(urls).toContain("/")
    expect(urls).toContain("/matricula")
    expect(urls).toContain("/horarios")
    for (const u of urls) {
      expect(u.startsWith("/responsavel")).toBe(false)
      expect(u).not.toBe("/login")
      expect(u).not.toBe("/resultados")
    }
  })

  it("robots libera o site público e bloqueia áreas autenticadas", () => {
    const regras = robots().rules
    const regra = (Array.isArray(regras) ? regras[0] : regras) as { allow?: unknown; disallow?: string[] }
    expect(regra.allow).toBe("/")
    expect(regra.disallow).toContain("/responsavel")
    expect(regra.disallow).toContain("/api/")
  })

  it("páginas públicas abrem com index:true e o layout raiz segue fechado", () => {
    for (const p of ["app/page.tsx", "app/matricula/page.tsx", "app/horarios/page.tsx", "app/partidas/page.tsx", "app/noticias/publico/page.tsx"]) {
      // metadataPublica (lib/site/seo) define robots index:true; o teste dela cobre o valor.
      expect(ler(p), p).toMatch(/metadataPublica\(|robots: \{ index: true, follow: true \}/)
    }
    expect(ler("app/layout.tsx")).toMatch(/robots: \{\s*index: false/)
  })
})

describe("error.tsx raiz", () => {
  it("leva o visitante para a página inicial, não para o dashboard", () => {
    const s = ler("app/error.tsx")
    expect(s).toContain('href="/"')
    expect(s).not.toContain("/dashboard")
  })
})

describe("mascararTelefone", () => {
  it("mantém só os 4 últimos dígitos", () => {
    expect(mascararTelefone("5511987654321")).toBe("***4321")
    expect(mascararTelefone("(11) 98765-4321")).toBe("***4321")
    expect(mascararTelefone("")).toBe("sem-telefone")
    expect(mascararTelefone(null)).toBe("sem-telefone")
  })
})

describe("service worker", () => {
  type Handler = (event: unknown) => void
  function carregar() {
    const handlers: Record<string, Handler> = {}
    const puts: string[] = []
    const apagados: string[] = []
    const cache = { put: async (r: Request) => void puts.push(new URL(r.url).pathname), addAll: async () => {} }
    const self = {
      location: { origin: "https://x.test" },
      addEventListener: (t: string, h: Handler) => (handlers[t] = h),
      skipWaiting: () => {},
      clients: { claim: () => {} },
    }
    const caches = {
      open: async () => cache,
      keys: async () => ["escolinha-v3", "escolinha-v4"],
      delete: async (k: string) => void apagados.push(k),
      match: async () => undefined,
    }
    new Function("self", "caches", ler("public/sw.js"))(self, caches)
    return { handlers, puts, apagados }
  }

  async function buscar(h: Record<string, Handler>, path: string, init: { mode?: string; cc?: string } = {}) {
    const request = new Request("https://x.test" + path, init.mode ? undefined : undefined)
    Object.defineProperty(request, "mode", { value: init.mode ?? "cors" })
    const resposta = new Response("ok", { status: 200, headers: init.cc ? { "Cache-Control": init.cc } : {} })
    Object.defineProperty(resposta, "type", { value: "basic" })
    vi.stubGlobal("fetch", async () => resposta)
    let promessa: Promise<unknown> | undefined
    h.fetch({ request, respondWith: (p: Promise<unknown>) => (promessa = p) })
    await promessa
    await new Promise((r) => setTimeout(r, 0))
    vi.unstubAllGlobals()
  }

  it("guarda só assets estáticos", async () => {
    const { handlers, puts } = carregar()
    await buscar(handlers, "/_next/static/chunks/a.js")
    await buscar(handlers, "/logo.png")
    expect(puts).toEqual(["/_next/static/chunks/a.js", "/logo.png"])
  })

  it("não guarda páginas, /api, /uploads, navegação nem no-store", async () => {
    const { handlers, puts } = carregar()
    await buscar(handlers, "/alunos/123")
    await buscar(handlers, "/api/alunos")
    await buscar(handlers, "/uploads/matriculas/doc.pdf")
    await buscar(handlers, "/_next/static/x.js", { mode: "navigate" })
    await buscar(handlers, "/_next/static/y.js", { cc: "no-store" })
    expect(puts).toEqual([])
  })

  it("apaga todos os caches ao receber limpar-cache", async () => {
    const { handlers, apagados } = carregar()
    let p: Promise<unknown> | undefined
    handlers.message({ data: { type: "limpar-cache" }, waitUntil: (x: Promise<unknown>) => (p = x) })
    await p
    expect(apagados).toEqual(["escolinha-v3", "escolinha-v4"])
  })
})

describe("deploy.sh", () => {
  it("não pula o backup em silêncio e aceita aspas/export no .env", () => {
    const s = ler("deploy/deploy.sh")
    expect(s).toContain("ALLOW_DEPLOY_SEM_BACKUP")
    expect(s).toContain("export[[:space:]]")
    expect(s).not.toContain("grep -oP '^DATABASE_URL")
  })
})
