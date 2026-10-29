import { describe, expect, it } from "vitest"
import type { PendenciaGrupo } from "@/lib/pendencias-data"
import { acoesDoInicio, formatarMesAno, previstoDoMes, resumoAtraso, serieRecebidoPrevisto } from "@/lib/inicio"

function grupo(titulo: string, quantidade: number, href: string, prioridade: "alta" | "normal" = "normal"): PendenciaGrupo {
  return {
    titulo,
    descricao: "",
    itens: Array.from({ length: quantidade }, (_, i) => ({
      chave: `${titulo}-${i}`,
      titulo: `${titulo} ${i}`,
      detalhe: "",
      href,
      prioridade,
      situacao: prioridade === "alta" ? "atrasada" : "proxima",
    })),
  }
}

function gruposDeTeste(n: number): PendenciaGrupo[] {
  return Array.from({ length: n }, (_, i) => grupo(`Grupo ${i}`, i + 1, `/rota-${i}/${i}`, i === n - 1 ? "alta" : "normal"))
}

describe("previstoDoMes", () => {
  it("ignora desconto maior que a mensalidade", () => {
    expect(previstoDoMes([{ mensalidade: 120, desconto: 20 }, { mensalidade: 100, desconto: 150 }])).toBe(100)
  })

  it("sem alunos, zero", () => {
    expect(previstoDoMes([])).toBe(0)
  })
})

describe("resumoAtraso", () => {
  it("conta alunos distintos e mensalidades", () => {
    expect(resumoAtraso([
      { alunoId: 1, mensalidade: 120, desconto: 0 },
      { alunoId: 1, mensalidade: 120, desconto: 0 },
      { alunoId: 2, mensalidade: 100, desconto: 10 },
    ])).toEqual({ valor: 330, alunos: 2, mensalidades: 3 })
  })

  it("sem vencidas, tudo zero", () => {
    expect(resumoAtraso([])).toEqual({ valor: 0, alunos: 0, mensalidades: 0 })
  })
})

describe("acoesDoInicio", () => {
  it("mais de 5 grupos: 5 ações, alta primeiro, e total para 'Ver todas'", () => {
    const r = acoesDoInicio(gruposDeTeste(7))
    expect(r.acoes).toHaveLength(5)
    expect(r.total).toBe(7)
    expect(r.acoes[0].prioridade).toBe("alta")
  })

  it("mensalidades vencidas levam à inadimplência", () => {
    expect(acoesDoInicio([grupo("Mensalidades vencidas", 3, "/pagamentos?aluno=1", "alta")]).acoes[0]).toMatchObject({
      texto: "3 mensalidades vencidas",
      href: "/inadimplencia",
      quantidade: 3,
    })
  })

  it("link vai para a tela da área, sem id nem filtro", () => {
    expect(acoesDoInicio([grupo("Solicitações", 2, "/configuracoes/solicitacoes?id=9")]).acoes[0].href).toBe("/configuracoes/solicitacoes")
    expect(acoesDoInicio([grupo("Fichas médicas não lidas", 1, "/alunos/12")]).acoes[0].href).toBe("/alunos")
  })

  it("grupo vazio não vira ação", () => {
    expect(acoesDoInicio([grupo("Documentos", 0, "/x")])).toEqual({ acoes: [], total: 0 })
  })
})

describe("serieRecebidoPrevisto", () => {
  it("soma recebido e previsto por mês, incluindo meses sem dados", () => {
    expect(serieRecebidoPrevisto(["2026-09", "2026-10"], [
      { mesReferencia: "2026-10", valorRecebido: 100, previsto: 120 },
      { mesReferencia: "2026-10", valorRecebido: null, previsto: 120 },
    ])).toEqual([
      { mes: "2026-09", recebido: 0, previsto: 0 },
      { mes: "2026-10", recebido: 100, previsto: 240 },
    ])
  })
})

describe("formatarMesAno", () => {
  it("mês com inicial maiúscula e 'de' minúsculo", () => {
    expect(formatarMesAno(new Date(2026, 9, 1))).toBe("Outubro de 2026")
  })
})
