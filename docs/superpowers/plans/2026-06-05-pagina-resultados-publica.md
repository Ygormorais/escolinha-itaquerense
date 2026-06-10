# Página Pública de Resultados — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar rota pública `/resultados` mostrando resultados, próximos jogos, classificação FPFS e links de súmulas — sem login.

**Architecture:** Server component em `app/resultados/page.tsx` fora do `AdminShell`. CSS escopado `.resultados`. `proxy.ts` libera a rota. Link no footer da landing page. Sem novos modelos — usa `Campeonato`, `Partida` e `ClassificacaoFpfs` já existentes.

**Tech Stack:** Next.js 16, Prisma SQLite, `date-fns`, CSS escopado.

**Working directory:** `escolinha-itaquerense/`

---

## Mapa de arquivos

| Arquivo | Ação |
|---|---|
| `app/resultados/page.tsx` | Create — server component público |
| `app/__tests__/resultados.test.tsx` | Create — teste renderToStaticMarkup |
| `proxy.ts` | Modify — adiciona `/resultados` à lista pública |
| `components/landing/landing-client.tsx` | Modify — link no footer |

---

## Task 1: Liberar rota no proxy

**Files:**
- Modify: `proxy.ts`

- [ ] **Step 1: Adicionar `/resultados` à lista pública**

Em `proxy.ts`, dentro do bloco `if (pathname === "/" || ...)`, adicione:

```ts
    pathname.startsWith("/resultados") ||
```

Logo após `pathname.startsWith("/matricula") ||`.

- [ ] **Step 2: Commit**

```bash
git add proxy.ts
git commit -m "feat(resultados): libera /resultados no proxy como rota publica"
```

---

## Task 2: Página de resultados (TDD)

**Files:**
- Create: `app/resultados/page.tsx`
- Create: `app/__tests__/resultados.test.tsx`

- [ ] **Step 1: Escrever o teste que falha**

Crie `app/__tests__/resultados.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

vi.mock("@/lib/db", () => ({
  db: { campeonato: { findMany: vi.fn().mockResolvedValue([]) } },
}))

vi.mock("next/image", () => ({ default: (p: { alt: string }) => `<img alt="${p.alt}" />` }))

import ResultadosPage from "@/app/resultados/page"

describe("ResultadosPage", () => {
  it("renderiza sem erros com lista vazia", async () => {
    const jsx = await ResultadosPage()
    expect(() => renderToStaticMarkup(jsx)).not.toThrow()
  })

  it("exibe mensagem quando nao ha campeonatos", async () => {
    const jsx = await ResultadosPage()
    const html = renderToStaticMarkup(jsx)
    expect(html).toContain("Nenhum campeonato")
  })
})
```

- [ ] **Step 2: Rodar — esperar falha**

Run: `npx vitest run app/__tests__/resultados.test.tsx`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `app/resultados/page.tsx`**

```tsx
import { db } from "@/lib/db"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Image from "next/image"

export const metadata = {
  title: "Resultados — E.C. Itaquerense",
  description: "Resultados, classificação e próximos jogos da Escolinha de Futsal E.C. Itaquerense.",
}

const css = `
  .resultados { font-family: 'Roboto', sans-serif; background: #f9fafb; min-height: 100vh; color: #1a1a1a; }
  .resultados .container { max-width: 900px; margin: 0 auto; padding: 24px 16px; }
  .resultados header { background: #7F0000; color: #fff; padding: 24px 0; margin-bottom: 32px; }
  .resultados header .container { display: flex; align-items: center; gap: 16px; }
  .resultados header h1 { font-size: 22px; font-weight: 700; margin: 0; }
  .resultados header p { font-size: 13px; opacity: .8; margin: 0; }
  .resultados .camp-block { background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 24px; margin-bottom: 24px; }
  .resultados .camp-title { font-size: 18px; font-weight: 700; color: #7F0000; margin-bottom: 4px; }
  .resultados .camp-status { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; background: #fef9c3; color: #854d0e; padding: 2px 8px; border-radius: 999px; }
  .resultados .tabs { display: flex; gap: 0; border-bottom: 2px solid #e5e7eb; margin-bottom: 16px; }
  .resultados .tab-content { display: none; }
  .resultados .tab-content.active { display: block; }
  .resultados table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .resultados th { text-align: left; padding: 8px 12px; background: #f3f4f6; font-size: 11px; text-transform: uppercase; color: #6b7280; }
  .resultados td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; }
  .resultados .nosso td { background: #fff5f5; font-weight: 600; color: #7F0000; }
  .resultados .placar { font-weight: 700; font-size: 16px; color: #1a1a1a; }
  .resultados .sumula-link { color: #7F0000; font-size: 12px; font-weight: 600; text-decoration: none; }
  .resultados .share-btn { display: inline-flex; align-items: center; gap: 6px; background: #25D366; color: #fff; border: none; border-radius: 6px; padding: 8px 14px; font-size: 13px; font-weight: 700; cursor: pointer; text-decoration: none; margin-top: 12px; }
  .resultados .sync-badge { font-size: 11px; background: rgba(255,255,255,.2); padding: 2px 8px; border-radius: 4px; margin-left: 8px; }
  .resultados footer { text-align: center; padding: 32px 16px; font-size: 13px; color: #6b7280; }
  .resultados footer a { color: #7F0000; text-decoration: none; margin: 0 8px; }
  .resultados .empty { text-align: center; padding: 48px; color: #6b7280; }
`

export default async function ResultadosPage() {
  const campeonatos = await db.campeonato.findMany({
    where: { fpfsEventoId: { not: null } },
    include: {
      partidas: {
        orderBy: { data: "desc" },
        take: 20,
      },
      classificacaoFpfs: {
        orderBy: [{ fase: "asc" }, { posicao: "asc" }],
      },
    },
    orderBy: { dataInicio: "desc" },
  })

  const agora = new Date()

  return (
    <div className="resultados">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <header>
        <div className="container">
          <Image src="/logo.png" alt="E.C. Itaquerense" width={48} height={48} style={{ borderRadius: 8 }} />
          <div>
            <h1>E.C. Itaquerense</h1>
            <p>Resultados & Classificação</p>
          </div>
        </div>
      </header>

      <div className="container">
        {campeonatos.length === 0 && (
          <div className="empty">
            <p>Nenhum campeonato em andamento no momento.</p>
          </div>
        )}

        {campeonatos.map((camp) => {
          const realizadas = camp.partidas.filter((p) => p.golsPro != null).slice(0, 5)
          const proximas = camp.partidas.filter((p) => p.golsPro == null && new Date(p.data) >= agora).slice(0, 5)

          const shareUrl = typeof window !== "undefined" ? window.location.href : ""
          const shareMsg = `Veja os resultados da Escolinha Itaquerense — ${camp.nome}: ${shareUrl}`
          const waHref = `https://wa.me/?text=${encodeURIComponent(shareMsg)}`

          return (
            <div key={camp.id} className="camp-block">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span className="camp-title">{camp.nome}</span>
                <span className="camp-status">{camp.status}</span>
                {camp.fpfsSyncEm && (
                  <span className="sync-badge" style={{ color: "#6b7280", fontSize: 11 }}>
                    FPFS {format(new Date(camp.fpfsSyncEm), "dd/MM HH:mm")}
                  </span>
                )}
              </div>

              {/* Resultados */}
              {realizadas.length > 0 && (
                <>
                  <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "#6b7280", marginBottom: 8 }}>Últimos Resultados</h3>
                  <table style={{ marginBottom: 20 }}>
                    <thead>
                      <tr>
                        <th>Jogo</th>
                        <th>Placar</th>
                        <th>Rodada</th>
                        <th>Data</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {realizadas.map((p) => (
                        <tr key={p.id}>
                          <td>Itaquerense × {p.adversario}</td>
                          <td className="placar">{p.golsPro} × {p.golsContra}</td>
                          <td>{p.rodada}ª</td>
                          <td>{format(new Date(p.data), "dd/MM/yyyy", { locale: ptBR })}</td>
                          <td>
                            {p.sumulaUrl && (
                              <a href={p.sumulaUrl} target="_blank" rel="noopener noreferrer" className="sumula-link">
                                Súmula →
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* Próximos jogos */}
              {proximas.length > 0 && (
                <>
                  <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "#6b7280", marginBottom: 8 }}>Próximos Jogos</h3>
                  <table style={{ marginBottom: 20 }}>
                    <thead>
                      <tr>
                        <th>Jogo</th>
                        <th>Data</th>
                        <th>Local</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proximas.map((p) => (
                        <tr key={p.id}>
                          <td>Itaquerense × {p.adversario}</td>
                          <td>{format(new Date(p.data), "EEE dd/MM 'às' HH'h'", { locale: ptBR })}</td>
                          <td>{p.local ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* Classificação */}
              {camp.classificacaoFpfs.length > 0 && (
                <>
                  <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "#6b7280", marginBottom: 8 }}>Classificação</h3>
                  <table style={{ marginBottom: 12 }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Time</th>
                        <th>P</th>
                        <th>J</th>
                        <th>V</th>
                        <th>E</th>
                        <th>D</th>
                        <th>GP</th>
                        <th>GC</th>
                        <th>SG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {camp.classificacaoFpfs.map((l) => (
                        <tr key={l.id} className={l.ehNosso ? "nosso" : ""}>
                          <td>{l.posicao}</td>
                          <td>{l.ehNosso ? "★ " : ""}{l.timeNome}</td>
                          <td style={{ fontWeight: 700 }}>{l.pontos}</td>
                          <td>{l.jogos}</td>
                          <td>{l.vitorias}</td>
                          <td>{l.empates}</td>
                          <td>{l.derrotas}</td>
                          <td>{l.golsPro}</td>
                          <td>{l.golsContra}</td>
                          <td>{l.saldo > 0 ? `+${l.saldo}` : l.saldo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              <a href={waHref} target="_blank" rel="noopener noreferrer" className="share-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Compartilhar no WhatsApp
              </a>
            </div>
          )
        })}

        <footer>
          <a href="/responsavel">Portal do Responsável</a>
          <a href="/matricula">Pré-Matrícula</a>
          <a href="/">← Voltar ao site</a>
        </footer>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Rodar — esperar passar**

Run: `npx vitest run app/__tests__/resultados.test.tsx`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add app/resultados/ app/__tests__/resultados.test.tsx
git commit -m "feat(resultados): pagina publica /resultados com jogos, classificacao e compartilhamento"
```

---

## Task 3: Link no footer da landing

**Files:**
- Modify: `components/landing/landing-client.tsx`

- [ ] **Step 1: Adicionar link no footer da landing**

Em `components/landing/landing-client.tsx`, localize o footer e adicione o link de resultados:

```tsx
<div className="fcol">
  <h4>Futebol</h4>
  <a href="/turmas">Turmas</a>
  <a href="/resultados">Resultados & Classificação</a>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/landing-client.tsx
git commit -m "feat(resultados): link no footer da landing para pagina publica de resultados"
```

---

## Task 4: Verificação final

- [ ] **Step 1: Rodar testes**

Run: `npx vitest run app/__tests__/resultados.test.tsx`
Expected: PASS (2 testes).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -cE "error TS"`
Expected: `0`

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully` com rota `/resultados` na árvore.

- [ ] **Step 4: Push**

```bash
git push origin develop
```
