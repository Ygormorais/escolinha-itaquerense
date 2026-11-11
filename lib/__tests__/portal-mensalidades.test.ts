import { describe, expect, it } from "vitest"
import { montarMesesDoAluno, resumoMensalidades, type PagamentoPortal } from "@/lib/portal-mensalidades"

const aluno = { mensalidade: 150, desconto: 30 }
const agora = new Date(2026, 4, 15, 12) // 15/05/2026

function pag(p: Partial<PagamentoPortal> & { mesReferencia: string }): PagamentoPortal {
  const [a, m] = p.mesReferencia.split("-").map(Number)
  return {
    dataVencimento: new Date(a, m - 1, 10, 12),
    dataPagamento: null,
    valorRecebido: null,
    valorDevido: null,
    formaPagamento: null,
    recibos: [],
    ...p,
  }
}

describe("montarMesesDoAluno", () => {
  it("mostra os 12 meses do ano, com mês sem cobrança como não gerada", () => {
    const meses = montarMesesDoAluno(aluno, [], 2026, agora)
    expect(meses).toHaveLength(12)
    expect(meses[0].mes).toBe("2026-01")
    expect(meses[11].mes).toBe("2026-12")
    expect(meses[6]).toMatchObject({ situacao: "nao_gerada", devido: 120, restante: 120, recebido: 0 })
  })

  it("usa o valor devido gravado na mensalidade, não o atual do aluno", () => {
    const [mes] = montarMesesDoAluno(aluno, [pag({ mesReferencia: "2026-01", valorDevido: 100 })], 2026, agora)
    expect(mes).toMatchObject({ devido: 100, restante: 100 })
  })

  it("separa pago, atrasado e a vencer", () => {
    const meses = montarMesesDoAluno(aluno, [
      pag({ mesReferencia: "2026-03", dataPagamento: new Date(2026, 2, 8), valorRecebido: 120, formaPagamento: "Pix" }),
      pag({ mesReferencia: "2026-04" }),
      pag({ mesReferencia: "2026-06" }),
    ], 2026, agora)
    expect(meses[2]).toMatchObject({ situacao: "pago", recebido: 120, restante: 0, formaPagamento: "Pix" })
    expect(meses[3].situacao).toBe("atrasado")
    expect(meses[5].situacao).toBe("a_vencer")
  })

  it("no próprio dia do vencimento ainda está a vencer; atrasa no dia seguinte", () => {
    const venc = pag({ mesReferencia: "2026-05", dataVencimento: new Date(Date.UTC(2026, 4, 10)) })
    const noDia = new Date("2026-05-10T23:30:00-03:00")
    const diaSeguinte = new Date("2026-05-11T00:10:00-03:00")
    expect(montarMesesDoAluno(aluno, [venc], 2026, noDia)[4].situacao).toBe("a_vencer")
    expect(montarMesesDoAluno(aluno, [venc], 2026, diaSeguinte)[4].situacao).toBe("atrasado")
  })

  it("parcial mostra o recebido, o que falta e não traz data de pagamento", () => {
    const [, , , mes] = montarMesesDoAluno(aluno, [
      pag({ mesReferencia: "2026-04", valorDevido: 120, valorRecebido: 50, formaPagamento: "Dinheiro" }),
    ], 2026, agora)
    expect(mes).toMatchObject({ situacao: "parcial", recebido: 50, restante: 70, dataPagamento: null })
  })

  it("inclui mensalidade em aberto de ano anterior antes dos meses do ano", () => {
    const meses = montarMesesDoAluno(aluno, [
      pag({ mesReferencia: "2025-11" }),
      pag({ mesReferencia: "2025-12", dataPagamento: new Date(2025, 11, 9), valorRecebido: 120 }),
    ], 2026, agora)
    expect(meses).toHaveLength(13)
    expect(meses[0]).toMatchObject({ mes: "2025-11", situacao: "atrasado" })
  })

  it("leva os recibos de cada mensalidade, mais antigo primeiro", () => {
    const r1 = { id: 1, numero: "R-1", valor: 50, dataPagamento: new Date(2026, 3, 5) }
    const r2 = { id: 2, numero: "R-2", valor: 70, dataPagamento: new Date(2026, 3, 20) }
    const [, , , mes] = montarMesesDoAluno(aluno, [
      pag({ mesReferencia: "2026-04", dataPagamento: new Date(2026, 3, 20), valorRecebido: 120, recibos: [r2, r1] }),
    ], 2026, agora)
    expect(mes.recibos.map((r) => r.numero)).toEqual(["R-1", "R-2"])
  })
})

describe("resumoMensalidades", () => {
  it("conta pagos, em aberto e soma o que falta só de mensalidades geradas", () => {
    const meses = montarMesesDoAluno(aluno, [
      pag({ mesReferencia: "2026-01", dataPagamento: new Date(2026, 0, 9), valorRecebido: 120 }),
      pag({ mesReferencia: "2026-02", valorDevido: 120, valorRecebido: 20 }),
      pag({ mesReferencia: "2026-03" }),
    ], 2026, agora)
    expect(resumoMensalidades([meses])).toEqual({ pagos: 1, emAberto: 2, totalEmAberto: 220 })
  })
})
