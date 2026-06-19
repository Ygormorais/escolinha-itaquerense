import { describe, it, expect } from "vitest"
import { matchTransactions } from "../ofx-matcher"
import type { OFXTransaction } from "../ofx-parser"

function makeTransaction(memo: string, amount = 150, fitid = "1"): OFXTransaction {
  return { fitid, date: new Date(2025, 5, 1), amount, memo }
}

function makePagamento(id: number, alunoId: number, dataPagamento: Date | null = null) {
  return { id, alunoId, mesReferencia: "2025-06", dataPagamento }
}

describe("matchTransactions", () => {
  it("transação com MEMO 'PIX - JOAO SILVA' casa com aluno 'João Silva' → confiança alta", () => {
    const alunos = [{ id: 1, nome: "João Silva" }]
    const pagamentos = [makePagamento(10, 1, null)]

    const [result] = matchTransactions(
      [makeTransaction("PIX - JOAO SILVA")],
      alunos,
      pagamentos
    )

    expect(result.alunoId).toBe(1)
    expect(result.alunoNome).toBe("João Silva")
    expect(result.pagamentoId).toBe(10)
    expect(result.confianca).toBe("alta")
  })

  it("transação com MEMO sem nome → confiança nenhuma", () => {
    const alunos = [{ id: 1, nome: "João Silva" }]
    const [result] = matchTransactions(
      [makeTransaction("TARIFA BANCARIA")],
      alunos,
      []
    )

    expect(result.alunoId).toBeNull()
    expect(result.pagamentoId).toBeNull()
    expect(result.confianca).toBe("nenhuma")
  })

  it("aluno com múltiplas mensalidades pendentes → confiança baixa", () => {
    const alunos = [{ id: 1, nome: "João Silva" }]
    const pagamentos = [
      makePagamento(10, 1, null),
      makePagamento(11, 1, null),
    ]

    const [result] = matchTransactions(
      [makeTransaction("PIX JOAO SILVA")],
      alunos,
      pagamentos
    )

    expect(result.alunoId).toBe(1)
    expect(result.confianca).toBe("baixa")
  })

  it("com múltiplas pendentes, seleciona a mais antiga independente da ordem de entrada", () => {
    const alunos = [{ id: 1, nome: "João Silva" }]
    // entrada fora de ordem cronológica: mais recente primeiro
    const pagamentos = [
      { id: 11, alunoId: 1, mesReferencia: "2025-07", dataPagamento: null },
      { id: 10, alunoId: 1, mesReferencia: "2025-05", dataPagamento: null },
    ]

    const [result] = matchTransactions(
      [makeTransaction("PIX JOAO SILVA")],
      alunos,
      pagamentos
    )

    expect(result.confianca).toBe("baixa")
    expect(result.pagamentoId).toBe(10)
    expect(result.mesReferencia).toBe("2025-05")
  })

  it("aluno sem mensalidades pendentes → confiança baixa (match mas sem pagamento)", () => {
    const alunos = [{ id: 1, nome: "João Silva" }]
    const pagamentos: ReturnType<typeof makePagamento>[] = []

    const [result] = matchTransactions(
      [makeTransaction("PIX JOAO SILVA")],
      alunos,
      pagamentos
    )

    expect(result.alunoId).toBe(1)
    expect(result.pagamentoId).toBeNull()
    expect(result.confianca).toBe("baixa")
  })

  it("normalização de acentos: 'JOAO' casa com 'João'", () => {
    const alunos = [{ id: 1, nome: "João Ferreira" }]
    const pagamentos = [makePagamento(10, 1, null)]

    const [result] = matchTransactions(
      [makeTransaction("CREDITO JOAO FERREIRA")],
      alunos,
      pagamentos
    )

    expect(result.alunoId).toBe(1)
    expect(result.confianca).toBe("alta")
  })

  it("seleciona a mensalidade mais antiga quando há exatamente 1 pendente", () => {
    const alunos = [{ id: 1, nome: "Maria Santos" }]
    const pagamentos = [makePagamento(20, 1, null)]

    const [result] = matchTransactions(
      [makeTransaction("PIX MARIA SANTOS")],
      alunos,
      pagamentos
    )

    expect(result.pagamentoId).toBe(20)
    expect(result.mesReferencia).toBe("2025-06")
  })

  it("não casa quando apenas primeira palavra do nome está presente (palavra curta)", () => {
    const alunos = [{ id: 1, nome: "Ana Lima" }]
    const pagamentos = [makePagamento(10, 1, null)]

    // "Ana" tem menos de 3 chars → não deve casar apenas por "Ana"
    const [result] = matchTransactions(
      [makeTransaction("PIX ANA OUTRO")],
      alunos,
      pagamentos
    )

    // "Ana" < 3 chars é ignorada; "Lima" está ausente → nenhuma
    expect(result.confianca).toBe("nenhuma")
  })
})
