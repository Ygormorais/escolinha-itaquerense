import { describe, expect, it } from "vitest"
import { gerarCSVAlunos, montarQueryAlunos, type Aluno } from "@/app/alunos/alunos-utils"

const padrao = { turma: "Todas", status: "Todos" }

describe("montarQueryAlunos", () => {
  it("omite busca vazia e filtros no valor padrão", () => {
    expect(montarQueryAlunos("", padrao)).toBe("")
  })

  it("inclui busca, turma e status escolhidos", () => {
    expect(montarQueryAlunos("ana", { turma: "Sub-9", status: "Ativo" })).toBe("q=ana&turma=Sub-9&status=Ativo")
  })

  it("troca um filtro e remove quando volta ao padrão", () => {
    const filtros = { turma: "Sub-9", status: "Ativo" }
    expect(montarQueryAlunos("", filtros, { chave: "turma", valor: "Sub-11", padrao: "Todas" })).toBe("turma=Sub-11&status=Ativo")
    expect(montarQueryAlunos("", filtros, { chave: "turma", valor: "Todas", padrao: "Todas" })).toBe("status=Ativo")
  })

  it("só põe a página na URL a partir da segunda", () => {
    expect(montarQueryAlunos("ana", padrao, { chave: "page", valor: "3", padrao: "1" })).toBe("q=ana&page=3")
    expect(montarQueryAlunos("ana", padrao, { chave: "page", valor: "1", padrao: "1" })).toBe("q=ana")
  })

  it("codifica caracteres especiais da busca", () => {
    expect(montarQueryAlunos("joão & cia", padrao)).toBe("q=jo%C3%A3o+%26+cia")
  })
})

describe("gerarCSVAlunos", () => {
  const aluno: Aluno = {
    id: 1, nome: "Pedro Souza", dataNascimento: new Date(), turma: "Sub-11", horario: "Seg/Qua 14h",
    responsavel: "Carlos", telefone: "11999999999", email: "c@x.com", dataMatricula: new Date(),
    mensalidade: 150, desconto: 0, status: "Ativo", posicao: null, observacoes: null,
  }

  it("gera cabeçalho e uma linha por aluno", () => {
    const [cabecalho, linha] = gerarCSVAlunos([aluno]).split("\n")
    expect(cabecalho).toBe('"Nome";"Turma";"Horário";"Responsável";"Telefone";"Email";"Mensalidade";"Status"')
    expect(linha).toBe('"Pedro Souza";"Sub-11";"Seg/Qua 14h";"Carlos";"11999999999";"c@x.com";"150.00";"Ativo"')
  })

  it("neutraliza valores que o Excel interpretaria como fórmula", () => {
    expect(gerarCSVAlunos([{ ...aluno, responsavel: "+5511" }])).toContain(`"'+5511"`)
  })
})
