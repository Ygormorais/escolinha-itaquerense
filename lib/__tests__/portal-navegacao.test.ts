import { describe, expect, it } from "vitest"
import { GRUPOS_PORTAL, abaAtiva, grupoDaRota } from "@/lib/portal-navegacao"

describe("navegação do portal", () => {
  it("tem 5 grupos e cada página aparece uma vez só", () => {
    expect(GRUPOS_PORTAL).toHaveLength(5)
    const hrefs = GRUPOS_PORTAL.flatMap((g) => g.paginas.map((p) => p.href))
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })

  it.each([
    ["/responsavel", "inicio"],
    ["/responsavel/aluno/3", "inicio"],
    ["/responsavel/mensalidades", "financeiro"],
    ["/responsavel/recibos/9", "financeiro"],
    ["/responsavel/declaracao", "financeiro"],
    ["/responsavel/boletim/pdf", "atleta"],
    ["/responsavel/lojinha", "atleta"],
    ["/responsavel/calendario", "jogos"],
    ["/responsavel/solicitacoes", "escolinha"],
  ])("%s pertence ao grupo %s", (rota, id) => {
    expect(grupoDaRota(rota)?.id).toBe(id)
  })

  it("aba ativa é a página da rota, inclusive em subrotas", () => {
    const atleta = GRUPOS_PORTAL.find((g) => g.id === "atleta")!
    expect(abaAtiva(atleta, "/responsavel/boletim/pdf")?.label).toBe("Boletim")
    expect(abaAtiva(atleta, "/responsavel/desempenho")?.label).toBe("Desempenho")
  })

  it("rota fora do portal não tem grupo", () => {
    expect(grupoDaRota("/responsavel-x")).toBeNull()
  })
})
