import { describe, it, expect } from "vitest"
import { AlunoSchema, PagamentoSchema, CustoSchema } from "../schemas"

describe("AlunoSchema", () => {
  const valid = {
    nome: "João da Silva",
    dataNascimento: "2010-01-15",
    turma: "Sub-13",
    horario: "09:00",
    responsavel: "Maria da Silva",
    telefone: "11999999999",
    email: "maria@email.com",
    dataMatricula: "2025-01-01",
    mensalidade: 150,
    status: "Ativo" as const,
  }

  it("aceita aluno válido", () => {
    expect(AlunoSchema.safeParse(valid).success).toBe(true)
  })

  it("rejeita nome curto demais", () => {
    const r = AlunoSchema.safeParse({ ...valid, nome: "Jo" })
    expect(r.success).toBe(false)
  })

  it("rejeita e-mail inválido", () => {
    const r = AlunoSchema.safeParse({ ...valid, email: "nao-e-email" })
    expect(r.success).toBe(false)
  })

  it("aceita mensalidade zero (bolsista)", () => {
    const r = AlunoSchema.safeParse({ ...valid, mensalidade: 0 })
    expect(r.success).toBe(true)
  })

  it("rejeita mensalidade negativa", () => {
    const r = AlunoSchema.safeParse({ ...valid, mensalidade: -50 })
    expect(r.success).toBe(false)
  })

  it("rejeita status inválido", () => {
    const r = AlunoSchema.safeParse({ ...valid, status: "Pendente" })
    expect(r.success).toBe(false)
  })

  it("coerce mensalidade de string para number", () => {
    const r = AlunoSchema.safeParse({ ...valid, mensalidade: "200" })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.mensalidade).toBe(200)
  })
})

describe("PagamentoSchema", () => {
  const valid = { dataPagamento: "2025-06-10", formaPagamento: "Pix", valorRecebido: 150 }

  it("aceita pagamento válido", () => {
    expect(PagamentoSchema.safeParse(valid).success).toBe(true)
  })

  it("rejeita valor zero", () => {
    expect(PagamentoSchema.safeParse({ ...valid, valorRecebido: 0 }).success).toBe(false)
  })
})

describe("CustoSchema", () => {
  const valid = {
    data: "2025-06-01",
    categoria: "Material",
    descricao: "Bolas de futsal",
    fornecedor: "Loja Esportes",
    valor: 250,
    formaPagamento: "Cartão",
    comprovante: true,
  }

  it("aceita custo válido", () => {
    expect(CustoSchema.safeParse(valid).success).toBe(true)
  })

  it("rejeita descrição curta", () => {
    const r = CustoSchema.safeParse({ ...valid, descricao: "ok" })
    expect(r.success).toBe(false)
  })

  it("comprovante default false quando omitido", () => {
    const { comprovante: _, ...semComprovante } = valid
    const r = CustoSchema.safeParse(semComprovante)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.comprovante).toBe(false)
  })
})
