import { describe, expect, it } from "vitest"
import { agruparPorAluno, filtrarDevedores, type LinhaCentral } from "@/lib/central-pagamentos"

const agora = new Date("2026-06-15T12:00:00")

function linha(over: Partial<LinhaCentral> & { alunoId: number; nome: string }): LinhaCentral {
  const { alunoId, nome, ...resto } = over
  return {
    id: Math.floor(Math.random() * 1e6),
    mesReferencia: "2026-06",
    dataVencimento: new Date("2026-06-10"),
    valorDevido: 120,
    valorRecebido: null,
    externalId: null,
    statusCobranca: null,
    aluno: { id: alunoId, nome, turma: "Sub-11", responsavel: "Resp", telefone: "11999990000", mensalidade: 120, desconto: 0, responsavelRef: null },
    ...resto,
  } as LinhaCentral
}

describe("agruparPorAluno", () => {
  it("classifica a situação de cada mensalidade", () => {
    const [a] = agruparPorAluno([
      linha({ alunoId: 1, nome: "Ana", dataVencimento: new Date("2026-06-10") }),
      linha({ alunoId: 1, nome: "Ana", dataVencimento: new Date("2026-07-10"), mesReferencia: "2026-07" }),
      linha({ alunoId: 1, nome: "Ana", dataVencimento: new Date("2026-05-10"), mesReferencia: "2026-05", valorRecebido: 50 }),
    ], agora)
    expect(a.mensalidades.map((m) => [m.mesReferencia, m.situacao, m.restante])).toEqual([
      ["2026-05", "parcial", 70],
      ["2026-06", "atrasada", 120],
      ["2026-07", "a_vencer", 120],
    ])
    expect(a.totalRestante).toBe(310)
    expect(a.atrasadas).toBe(2)
  })

  it("quem tem atrasada vem primeiro (mais atrasadas antes), depois por nome", () => {
    const lista = agruparPorAluno([
      linha({ alunoId: 1, nome: "Bruno", dataVencimento: new Date("2026-07-10") }),
      linha({ alunoId: 2, nome: "Caio", dataVencimento: new Date("2026-06-10") }),
      linha({ alunoId: 3, nome: "Duda", dataVencimento: new Date("2026-05-10") }),
      linha({ alunoId: 3, nome: "Duda", dataVencimento: new Date("2026-06-10") }),
      linha({ alunoId: 4, nome: "Ana", dataVencimento: new Date("2026-07-10") }),
    ], agora)
    expect(lista.map((a) => a.nome)).toEqual(["Duda", "Caio", "Ana", "Bruno"])
  })

  it("usa o nome do responsável cadastrado quando existe", () => {
    const [a] = agruparPorAluno([linha({ alunoId: 1, nome: "Ana", aluno: { id: 1, nome: "Ana", turma: "Sub-9", responsavel: "digitado", telefone: "", mensalidade: 120, desconto: 0, responsavelRef: { nome: "Marta Souza" } } })], agora)
    expect(a.responsavel).toBe("Marta Souza")
  })
})

describe("filtrarDevedores", () => {
  const lista = agruparPorAluno([
    linha({ alunoId: 1, nome: "João Silva", aluno: { id: 1, nome: "João Silva", turma: "Sub-11", responsavel: "Maria Silva", telefone: "", mensalidade: 120, desconto: 20, responsavelRef: null } }),
    linha({ alunoId: 2, nome: "Ana Souza", dataVencimento: new Date("2026-07-10"), aluno: { id: 2, nome: "Ana Souza", turma: "Sub-9", responsavel: "Carla", telefone: "", mensalidade: 120, desconto: 0, responsavelRef: null } }),
  ], agora)

  it("busca por aluno ou responsável, sem acento e sem caixa", () => {
    expect(filtrarDevedores(lista, { busca: "joao", situacao: "aberto", turma: "" }).map((a) => a.id)).toEqual([1])
    expect(filtrarDevedores(lista, { busca: "MARIA", situacao: "aberto", turma: "" }).map((a) => a.id)).toEqual([1])
  })

  it("filtra atrasados, com desconto e turma", () => {
    expect(filtrarDevedores(lista, { busca: "", situacao: "atrasados", turma: "" }).map((a) => a.id)).toEqual([1])
    expect(filtrarDevedores(lista, { busca: "", situacao: "com_desconto", turma: "" }).map((a) => a.id)).toEqual([1])
    expect(filtrarDevedores(lista, { busca: "", situacao: "aberto", turma: "Sub-9" }).map((a) => a.id)).toEqual([2])
  })

  it("busca sem resultado devolve lista vazia", () => {
    expect(filtrarDevedores(lista, { busca: "zzz", situacao: "aberto", turma: "" })).toEqual([])
  })
})
