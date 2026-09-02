import { describe, expect, it } from "vitest"
import { prepararPautaSemanal, type BasePautaSemanal } from "@/lib/pauta-semanal"
import type { InsightDesenvolvimento } from "@/lib/desenvolvimento"

const indicador = (id: string, alunoId: number, extra: Partial<InsightDesenvolvimento> = {}): InsightDesenvolvimento => ({
  id, alunoId, alunoNome: `Atleta ${alunoId}`, turma: "Sub-13", tipo: "avaliacao_atrasada", prioridade: "media",
  titulo: `Indicador ${id}`, explicacao: "Contexto registrado", evidencias: ["Sem avaliação recente"],
  acaoSugerida: "Combinar a avaliação com a comissão.", positivo: false, ...extra,
})

function base(): BasePautaSemanal {
  return {
    cicloInicio: "2026-08-31",
    atletas: [1, 2, 3].map((alunoId) => ({ alunoId, nome: `Atleta ${alunoId}`, turma: "Sub-13" })),
    insights: [indicador("1:avaliacao_atrasada", 1), indicador("1:baixa_frequencia", 1, { tipo: "baixa_frequencia", prioridade: "alta" }), indicador("2:avaliacao_atrasada", 2)],
    acoes: {
      "1:baixa_frequencia:2026-08-31": { status: "pendente", planoSemanal: ["Plano revisado da comissão"], rascunhoAprovado: true },
      "2:avaliacao_atrasada:2026-08-31": { status: "concluida", planoSemanal: null, rascunhoAprovado: false },
    },
  }
}

describe("pauta semanal local", () => {
  it("distingue quantidade de atletas e de indicadores e organiza o ciclo atual", () => {
    const pauta = prepararPautaSemanal(base(), "Sub-13")
    expect(pauta.contagens).toEqual({ atletas: 3, atletasComIndicador: 2, paraPlanejar: 1, naFila: 1, concluidas: 1, ignoradas: 0, evolucoes: 0 })
    expect(pauta.texto).toContain("31/08/2026")
    expect(pauta.texto).toContain("Plano revisado da comissão")
    expect(pauta.texto).toContain("não um relatório de eventos ocorridos nesta semana")
    expect(pauta.texto).toContain("Não é um ranking de atletas")
  })

  it("não mistura outras turmas nem atletas fora do cadastro ativo", () => {
    const dados = base()
    dados.atletas.push({ alunoId: 4, nome: "Atleta de outra turma", turma: "Sub-15" })
    dados.insights.push(indicador("4:avaliacao_atrasada", 4, { alunoNome: "Atleta de outra turma", turma: "Sub-15" }), indicador("99:avaliacao_atrasada", 99, { alunoNome: "Atleta não ativo" }))
    const pauta = prepararPautaSemanal(dados, "Sub-13")
    expect(pauta.contagens.atletas).toBe(3)
    expect(pauta.texto).not.toContain("Atleta de outra turma")
    expect(pauta.texto).not.toContain("Atleta não ativo")
  })

  it("não incorpora planos e decisões de semanas anteriores", () => {
    const dados = base()
    dados.acoes["1:avaliacao_atrasada:2026-08-24"] = { status: "ignorada", planoSemanal: ["Plano antigo confidencial"], rascunhoAprovado: true }
    const pauta = prepararPautaSemanal(dados, "Sub-13")
    expect(pauta.contagens.paraPlanejar).toBe(1)
    expect(pauta.contagens.ignoradas).toBe(0)
    expect(pauta.texto).not.toContain("Plano antigo confidencial")
    expect(pauta.texto).toContain("Pendências de todos os ciclos")
  })

  it("não trata evoluções como tarefas nem conta indicadores duplicados", () => {
    const dados = base()
    dados.insights.push(dados.insights[0], indicador("3:evolucao_positiva", 3, { positivo: true, tipo: "evolucao_positiva" }))
    const pauta = prepararPautaSemanal(dados, "Sub-13")
    expect(pauta.contagens).toMatchObject({ evolucoes: 1, atletasComIndicador: 3, paraPlanejar: 1 })
  })

  it("trata ausência de indicadores sem inventar evolução ou ausência de necessidade", () => {
    const dados = base()
    dados.insights = []
    const pauta = prepararPautaSemanal(dados, "Sub-13")
    expect(pauta.contagens.atletas).toBe(3)
    expect(pauta.contagens.atletasComIndicador).toBe(0)
    expect(pauta.texto).toContain("Ausência de indicador não comprova ausência de necessidade")
  })

  it("ordena prioridades de indicadores sem modificar os dados de entrada", () => {
    const dados = base()
    dados.acoes = {}
    const original = JSON.stringify(dados)
    const pauta = prepararPautaSemanal(dados, "Sub-13")
    expect(pauta.texto.indexOf("Indicador 1:baixa_frequencia")).toBeLessThan(pauta.texto.indexOf("Indicador 1:avaliacao_atrasada"))
    expect(JSON.stringify(dados)).toBe(original)
  })

  it("só inclui planos aprovados pendentes e omite campos livres e contatos", () => {
    const dados = base()
    dados.acoes["1:baixa_frequencia:2026-08-31"] = {
      status: "pendente", planoSemanal: ["Plano não revisado"], rascunhoAprovado: false,
      ...{ observacao: "Nota interna privada", mensagemFamilia: "Mensagem privada", usuario: "Usuario privado" },
    }
    dados.acoes["2:avaliacao_atrasada:2026-08-31"].planoSemanal = ["Plano concluído antigo"]
    dados.acoes["2:avaliacao_atrasada:2026-08-31"].rascunhoAprovado = true
    const texto = prepararPautaSemanal(dados, "Sub-13").texto
    for (const privado of ["Plano não revisado", "Nota interna privada", "Mensagem privada", "Usuario privado", "Plano concluído antigo"]) expect(texto).not.toContain(privado)
    expect(texto).toContain("Próximo passo sugerido: Combinar a avaliação")
  })

  it("separa recomendações ignoradas de tarefas a executar", () => {
    const dados = base()
    dados.acoes["1:baixa_frequencia:2026-08-31"].status = "ignorada"
    const pauta = prepararPautaSemanal(dados, "Sub-13")
    expect(pauta.contagens).toMatchObject({ ignoradas: 1, naFila: 0 })
    expect(pauta.texto).not.toContain("Plano revisado da comissão")
  })

  it.each(["2026-02-30", "2026-09-01", "inválido", "2026-8-31"])("rejeita ciclo inválido ou que não comece na segunda: %s", (cicloInicio) => {
    expect(() => prepararPautaSemanal({ ...base(), cicloInicio }, "Sub-13")).toThrow("Ciclo semanal inválido")
  })

  it("rejeita turma inexistente", () => {
    expect(() => prepararPautaSemanal(base(), "Sub-99")).toThrow("não possui atletas ativos")
  })
})
