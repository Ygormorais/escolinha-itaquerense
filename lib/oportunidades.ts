import type { AtletaDesenvolvimento } from "@/lib/desenvolvimento"

const DAY_MS = 86400000

export type AtletaOportunidades = AtletaDesenvolvimento & {
  inscricoes: {
    createdAt: Date
    campeonato: { partidas: { id: number; data: Date; resultado: string | null }[] }
  }[]
  escalacoes: { partida: { id: number; data: Date } }[]
}

export type OportunidadeResumo = {
  alunoId: number
  nome: string
  turma: string
  registros: number
  presenca: number | null
  jogos: number
  convocacoes: number
  avaliacao: "recente" | "pendente" | "periodo_inicial"
  situacao: "revisar" | "com_convocacao" | "sem_jogos" | "amostra_insuficiente" | "presenca_abaixo_limiar"
}

// Não inferir elegibilidade anterior ao cadastro da inscrição nem contar jogos
// apenas agendados. IDs evitam duplicação e convocações de outros campeonatos.
export function partidasNoRecorte(atleta: AtletaOportunidades, now: Date) {
  const inicio = Math.max(now.getTime() - 90 * DAY_MS, atleta.dataMatricula.getTime())
  const partidas = new Map<number, Date>()
  for (const inscricao of atleta.inscricoes) {
    for (const partida of inscricao.campeonato.partidas) {
      if (partida.data.getTime() >= Math.max(inicio, inscricao.createdAt.getTime()) &&
          partida.data <= now && ["Vitoria", "Derrota", "Empate"].includes(partida.resultado ?? "")) {
        partidas.set(partida.id, partida.data)
      }
    }
  }
  const convocadas = new Set(atleta.escalacoes.filter((item) => partidas.has(item.partida.id)).map((item) => item.partida.id))
  return { jogos: partidas.size, datasConvocacoes: [...convocadas].map((id) => partidas.get(id)!) }
}

export function resumirOportunidades(atleta: AtletaOportunidades, now: Date): OportunidadeResumo {
  const inicio = Math.max(now.getTime() - 90 * DAY_MS, atleta.dataMatricula.getTime())
  const registros = atleta.frequencias.filter((item) => item.data.getTime() >= inicio && item.data <= now)
  const percentual = registros.length ? registros.filter((item) => item.presenca.trim().toLocaleLowerCase("pt-BR") === "presente").length / registros.length * 100 : null
  const { jogos, datasConvocacoes } = partidasNoRecorte(atleta, now)
  const recente = atleta.avaliacoes.some((item) => item.createdAt <= now && item.createdAt.getTime() >= now.getTime() - 180 * DAY_MS)
  return {
    alunoId: atleta.id, nome: atleta.nome, turma: atleta.turma,
    registros: registros.length, presenca: percentual === null ? null : Math.floor(percentual * 10) / 10,
    jogos, convocacoes: datasConvocacoes.length,
    avaliacao: recente ? "recente" : atleta.dataMatricula.getTime() > now.getTime() - 90 * DAY_MS ? "periodo_inicial" : "pendente",
    situacao: jogos === 0 ? "sem_jogos" : datasConvocacoes.length > 0 ? "com_convocacao" : registros.length < 4 ? "amostra_insuficiente" : percentual !== null && percentual >= 80 ? "revisar" : "presenca_abaixo_limiar",
  }
}
