import { db } from "@/lib/db"
import { fetchHtml, urlJogos, urlClassificacao } from "./client"
import { parseJogos, parseClassificacao } from "./parser"

export interface ResumoSync {
  campeonatoId: number
  jogosNovos: number
  jogosAtualizados: number
  linhasClassificacao: number
}

function resultadoDe(golsPro: number | null, golsContra: number | null): string | null {
  if (golsPro == null || golsContra == null) return null
  if (golsPro > golsContra) return "Vitoria"
  if (golsPro < golsContra) return "Derrota"
  return "Empate"
}

export async function syncCampeonato(campeonatoId: number): Promise<ResumoSync> {
  const camp = await db.campeonato.findUnique({ where: { id: campeonatoId } })
  if (!camp || camp.fpfsEventoId == null) {
    throw new Error(`Campeonato ${campeonatoId} sem fpfsEventoId configurado`)
  }
  const eventoId = camp.fpfsEventoId
  const nosso = camp.fpfsTimeNome ?? null

  const [htmlJogos, htmlClass] = await Promise.all([
    fetchHtml(urlJogos(eventoId)),
    fetchHtml(urlClassificacao(eventoId)),
  ])
  const jogos = parseJogos(htmlJogos)
  const linhas = parseClassificacao(htmlClass)

  let jogosNovos = 0
  let jogosAtualizados = 0

  for (const j of jogos) {
    const ehNossoJogo = nosso != null && (j.mandante === nosso || j.visitante === nosso)
    const somosMandante = j.mandante === nosso
    const golsPro = ehNossoJogo ? (somosMandante ? j.golsMandante : j.golsVisitante) : j.golsMandante
    const golsContra = ehNossoJogo ? (somosMandante ? j.golsVisitante : j.golsMandante) : j.golsVisitante
    const adversario = ehNossoJogo ? (somosMandante ? j.visitante : j.mandante) : `${j.mandante} x ${j.visitante}`
    const local = ehNossoJogo ? (somosMandante ? "Casa" : "Fora") : "Neutro"

    const dados = {
      campeonatoId,
      rodada: j.rodada,
      data: new Date(j.data),
      adversario,
      local,
      golsPro,
      golsContra,
      resultado: ehNossoJogo ? resultadoDe(golsPro, golsContra) : null,
      fpfsJogoId: j.fpfsJogoId,
      sumulaUrl: j.sumulaUrl,
    }

    const existente = j.fpfsJogoId
      ? await db.partida.findFirst({ where: { campeonatoId, fpfsJogoId: j.fpfsJogoId } })
      : null

    if (existente) {
      await db.partida.update({ where: { id: existente.id }, data: dados })
      jogosAtualizados++
    } else {
      await db.partida.create({ data: dados })
      jogosNovos++
    }
  }

  await db.classificacaoFpfs.deleteMany({ where: { campeonatoId } })
  await db.classificacaoFpfs.createMany({
    data: linhas.map((l) => ({
      campeonatoId,
      fase: l.fase,
      grupo: l.grupo,
      posicao: l.posicao,
      timeNome: l.timeNome,
      pontos: l.pontos,
      jogos: l.jogos,
      vitorias: l.vitorias,
      empates: l.empates,
      derrotas: l.derrotas,
      golsPro: l.golsPro,
      golsContra: l.golsContra,
      saldo: l.saldo,
      ehNosso: nosso != null && l.timeNome === nosso,
      atualizadoEm: new Date(),
    })),
  })

  await db.campeonato.update({ where: { id: campeonatoId }, data: { fpfsSyncEm: new Date() } })

  return { campeonatoId, jogosNovos, jogosAtualizados, linhasClassificacao: linhas.length }
}

export async function syncTodos(): Promise<ResumoSync[]> {
  const campeonatos = await db.campeonato.findMany({
    where: { fpfsEventoId: { not: null } },
    select: { id: true },
  })
  const resumos: ResumoSync[] = []
  for (const c of campeonatos) {
    resumos.push(await syncCampeonato(c.id))
  }
  return resumos
}
