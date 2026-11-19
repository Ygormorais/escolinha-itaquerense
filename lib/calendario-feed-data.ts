import { addDays, format } from "date-fns"
import { db } from "@/lib/db"
import { mapaFeriados } from "@/lib/feriados"
import { eventosDoFeed } from "@/lib/calendario-feed"
import { montarCalendario, type EventoIcs } from "@/lib/icalendar"

const DIAS_PASSADO = 30
const DIAS_FUTURO = 150

const chaveDia = (d: Date) => format(d, "yyyy-MM-dd")

/**
 * Feed .ics do responsável dono do token. Devolve null se o token não existe ou a conta está inativa.
 * Conteúdo mínimo: treinos da turma dos filhos, eventos da turma, convocações e cancelamentos
 * (feriado/bloqueio da quadra). Nada de telefone, e-mail, valores ou dados de saúde.
 */
export async function gerarFeedPorToken(token: string, agora: Date = new Date()): Promise<string | null> {
  const responsavel = await db.responsavel.findFirst({
    where: { calendarioToken: token, ativo: true },
    select: {
      id: true,
      alunos: { where: { status: "Ativo" }, select: { turma: true, horario: true } },
    },
  })
  if (!responsavel) return null

  const inicioData = addDays(agora, -DIAS_PASSADO)
  const fimData = addDays(agora, DIAS_FUTURO)
  const inicio = chaveDia(inicioData)
  const fim = chaveDia(fimData)

  const [eventos, convocacoes, bloqueiosDb] = await Promise.all([
    db.evento.findMany({
      where: { data: { gte: inicioData, lte: fimData } },
      select: { id: true, tipo: true, data: true, horaInicio: true, horaFim: true, titulo: true, local: true, turmas: true, descricao: true, status: true },
      orderBy: { data: "asc" },
    }),
    db.escalacaoJogador.findMany({
      where: {
        convocadoEm: { not: null },
        aluno: { responsavelId: responsavel.id, status: "Ativo" },
        partida: { data: { gte: inicioData, lte: fimData } },
      },
      select: { id: true, aluno: { select: { nome: true } }, partida: { select: { data: true, adversario: true, local: true } } },
    }),
    db.bloqueioQuadra.findMany({
      where: {
        dataInicio: { lte: new Date(`${fim}T00:00:00.000Z`) },
        dataFim: { gte: new Date(`${inicio}T00:00:00.000Z`) },
      },
    }),
  ])

  const anos = [...new Set([inicioData.getFullYear(), fimData.getFullYear()])]
  const eventosIcs: EventoIcs[] = eventosDoFeed({
    slotsTreino: responsavel.alunos.filter((a) => a.horario).map((a) => ({ turma: a.turma, horario: a.horario })),
    eventos,
    convocacoes: convocacoes.map((c) => ({ id: c.id, alunoNome: c.aluno.nome, partida: c.partida })),
    feriados: mapaFeriados(anos),
    bloqueios: bloqueiosDb.map((b) => ({
      inicio: b.dataInicio.toISOString().slice(0, 10),
      fim: b.dataFim.toISOString().slice(0, 10),
      motivo: b.motivo,
    })),
    inicio,
    fim,
  })

  return montarCalendario(eventosIcs, {
    nome: "Escolinha Itaquerense",
    descricao: "Treinos, jogos e eventos da turma. Atualiza sozinho.",
    agora,
  })
}
