import type { InsightDesenvolvimento } from "@/lib/desenvolvimento"

export const MAX_TEXTO_PAUTA = 100_000
export type PautaSemanalResumo = { id: number; turma: string; cicloInicio: string; usuario: string; createdAt: string }
export type PautaSemanalSalva = PautaSemanalResumo & { texto: string }

export type AcaoPauta = {
  status: "pendente" | "concluida" | "ignorada"
  planoSemanal: string[] | null
  rascunhoAprovado: boolean
}

export type BasePautaSemanal = {
  cicloInicio: string
  insights: InsightDesenvolvimento[]
  acoes: Record<string, AcaoPauta>
  atletas: { alunoId: number; nome: string; turma: string }[]
}

const prioridades = { alta: 0, media: 1, baixa: 2 }
const rotulosPrioridade = { alta: "Alta prioridade", media: "Média prioridade", baixa: "Acompanhamento" }
const linha = (texto: string) => texto.replace(/\s+/g, " ").trim()

/** Retrato local do ciclo exibido; não consulta API nem infere eventos da semana. */
export function prepararPautaSemanal(base: BasePautaSemanal, turma: string) {
  const data = new Date(`${base.cicloInicio}T12:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(base.cicloInicio) || !Number.isFinite(data.getTime()) || data.toISOString().slice(0, 10) !== base.cicloInicio || data.getUTCDay() !== 1) {
    throw new Error("Ciclo semanal inválido. Atualize a página.")
  }
  const alunos = new Map(base.atletas.filter((item) => item.turma === turma).map((item) => [item.alunoId, item]))
  if (alunos.size === 0) throw new Error("Esta turma não possui atletas ativos no painel.")
  const indicadores = [...new Map(base.insights.filter((item) => item.turma === turma && alunos.has(item.alunoId)).map((item) => [item.id, item])).values()]
  const ordem = (a: InsightDesenvolvimento, b: InsightDesenvolvimento) => prioridades[a.prioridade] - prioridades[b.prioridade] || a.alunoNome.localeCompare(b.alunoNome, "pt-BR") || a.id.localeCompare(b.id)
  const acionaveis = indicadores.filter((item) => !item.positivo).sort(ordem)
  const positivos = indicadores.filter((item) => item.positivo).sort((a, b) => a.alunoNome.localeCompare(b.alunoNome, "pt-BR") || a.id.localeCompare(b.id))
  // Use a chave do ciclo fornecido pelo servidor, sem recalcular a semana no
  // fuso do navegador e sem incorporar ações antigas de outro ciclo.
  const acao = (item: InsightDesenvolvimento) => base.acoes[`${item.id}:${base.cicloInicio}`]
  const grupos = [
    { titulo: "PARA PLANEJAR", itens: acionaveis.filter((item) => !acao(item)) },
    { titulo: "NA FILA SEMANAL", itens: acionaveis.filter((item) => acao(item)?.status === "pendente") },
    { titulo: "AÇÕES CONCLUÍDAS NO CICLO", itens: acionaveis.filter((item) => acao(item)?.status === "concluida") },
    { titulo: "RECOMENDAÇÕES IGNORADAS NO CICLO", itens: acionaveis.filter((item) => acao(item)?.status === "ignorada") },
  ]
  const contagens = {
    atletas: alunos.size,
    atletasComIndicador: new Set(indicadores.map((item) => item.alunoId)).size,
    paraPlanejar: grupos[0].itens.length,
    naFila: grupos[1].itens.length,
    concluidas: grupos[2].itens.length,
    ignoradas: grupos[3].itens.length,
    evolucoes: positivos.length,
  }
  const texto = [
    "PAUTA SEMANAL DA COMISSÃO",
    `Turma: ${linha(turma) || "Sem turma"}`,
    `Ciclo iniciado em ${base.cicloInicio.split("-").reverse().join("/")}`,
    "Uso interno da equipe. Preparado por regras locais, sem IA generativa ou chamada à API.",
    "Retrato dos indicadores atualmente disponíveis, não um relatório de eventos ocorridos nesta semana.",
    "",
    `Atletas ativos na turma: ${contagens.atletas}. Com indicadores neste retrato: ${contagens.atletasComIndicador}.`,
    `Indicadores acionáveis: ${acionaveis.length}. Para planejar: ${contagens.paraPlanejar}; na fila: ${contagens.naFila}; concluídos: ${contagens.concluidas}; ignorados: ${contagens.ignoradas}.`,
    `Indicadores de evolução: ${contagens.evolucoes}. Um atleta pode ter mais de um indicador.`,
    "Ordem por situação da ação, prioridade do indicador e nome. Não é um ranking de atletas.",
  ]
  for (const grupo of grupos) {
    texto.push("", grupo.titulo)
    if (grupo.itens.length === 0) texto.push("Nenhum indicador nesta situação.")
    for (const item of grupo.itens) {
      texto.push(`• ${linha(item.alunoNome)} — ${linha(item.titulo)} (${rotulosPrioridade[item.prioridade]})`)
      texto.push(...item.evidencias.map((evidencia) => `  Evidência: ${linha(evidencia)}`))
      const registro = acao(item)
      if (!registro || registro.status === "pendente") {
        if (registro?.rascunhoAprovado && registro.planoSemanal?.length) {
          texto.push("  Plano aprovado pela equipe:", ...registro.planoSemanal.map((passo) => `  - ${linha(passo)}`))
        } else texto.push(`  Próximo passo sugerido: ${linha(item.acaoSugerida)}`)
      }
    }
  }
  texto.push("", "EVOLUÇÕES PARA RECONHECER")
  if (positivos.length === 0) texto.push("Nenhum indicador de evolução neste retrato.")
  for (const item of positivos) texto.push(`• ${linha(item.alunoNome)} — ${linha(item.titulo)}`, ...item.evidencias.map((evidencia) => `  Evidência: ${linha(evidencia)}`))
  texto.push("", "REVISÃO NA REUNIÃO", "• Confirmar contexto e dados antes de tomar decisões.", "• Combinar responsáveis e próximos passos para os itens em aberto.", "• Registrar os resultados das ações no painel.", "", "Ausência de indicador não comprova ausência de necessidade de acompanhamento. Pendências antigas ou sem indicador ativo devem ser consultadas em Pendências de todos os ciclos.", "Observações livres da equipe, contatos e mensagens para a família não são incluídos. Revise os planos aprovados antes de compartilhar esta pauta internamente.")
  return { turma, cicloInicio: base.cicloInicio, contagens, texto: texto.join("\n") }
}
