// lib/responsavel-eventos.ts
import { db } from "@/lib/db"
import { nomeTime } from "@/lib/landing/times"

export type ItemAgendaDashboard = {
  tipo: "jogo" | "evento"
  titulo: string
  data: string // ISO string
  alunoNome?: string
  confirmacao?: string | null
}

export async function buscarProximosEventos(
  responsavelId: number,
  turmasAlunos: string[]
): Promise<ItemAgendaDashboard[]> {
  const hoje = new Date()
  const limite = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)

  const [convocacoes, eventos] = await Promise.all([
    db.escalacaoJogador.findMany({
      where: {
        convocadoEm: { not: null },
        partida: { data: { gte: hoje, lte: limite } },
        aluno: { responsavelId },
      },
      select: {
        id: true,
        confirmacao: true,
        aluno: { select: { nome: true } },
        partida: { select: { data: true, adversario: true } },
      },
      orderBy: { partida: { data: "asc" } },
      take: 5,
    }),
    db.evento.findMany({
      where: {
        data: { gte: hoje, lte: limite },
        status: { not: "cancelado" },
        tipo: { not: "Jogo" },
      },
      orderBy: { data: "asc" },
      take: 5,
    }),
  ])

  const itensJogo: ItemAgendaDashboard[] = convocacoes.map((c) => ({
    tipo: "jogo",
    titulo: `Jogo vs ${nomeTime(c.partida.adversario)}`,
    data: c.partida.data.toISOString(),
    alunoNome: c.aluno.nome,
    confirmacao: c.confirmacao,
  }))

  const itensEvento: ItemAgendaDashboard[] = eventos
    .filter((e) => {
      if (!e.turmas || e.turmas === "Todas") return true
      return turmasAlunos.some((t) => e.turmas!.split(",").map((s) => s.trim()).includes(t))
    })
    .map((e) => ({
      tipo: "evento",
      titulo: e.titulo,
      data: e.data.toISOString(),
    }))

  return [...itensJogo, ...itensEvento]
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .slice(0, 3)
}
