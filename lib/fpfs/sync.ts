import { db } from "@/lib/db"
import { fetchHtml, urlJogos, urlClassificacao } from "./client"
import {
  dataPartidaLocal,
  extractTemporadaMeta,
  parseJogos,
  parseClassificacao,
} from "./parser"

export interface ResumoSync {
  campeonatoId: number
  jogosNovos: number
  jogosAtualizados: number
  linhasClassificacao: number
  /** Preenchido quando o sync daquele campeonato falhou (syncTodos continua). */
  erro?: string
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
  // Ano da temporada vem do HTML da FPFS (não de dataInicio do seed)
  const meta = extractTemporadaMeta(htmlJogos)
  const anoTemporada =
    meta.temporada ??
    (camp.dataInicio ? new Date(camp.dataInicio).getFullYear() : undefined)
  const jogos = parseJogos(htmlJogos, anoTemporada)
  const linhas = parseClassificacao(htmlClass)

  // Atualiza nome do campeonato se ainda genérico e o HTML tem categoria
  if (meta.categoria && (!camp.nome.includes(meta.categoria) || camp.nome.includes("evento"))) {
    const div = meta.divisao ? ` ${meta.divisao}` : ""
    const ano = meta.temporada ?? ""
    const nome = `FPFS ${ano} · ${meta.categoria}${div} · ev.${eventoId}`.slice(0, 80)
    await db.campeonato.update({ where: { id: campeonatoId }, data: { nome } })
  }

  let jogosNovos = 0
  let jogosAtualizados = 0

  for (const j of jogos) {
    const ehNossoJogo = nosso != null && (j.mandante === nosso || j.visitante === nosso)
    const somosMandante = j.mandante === nosso
    const golsPro = ehNossoJogo ? (somosMandante ? j.golsMandante : j.golsVisitante) : j.golsMandante
    const golsContra = ehNossoJogo ? (somosMandante ? j.golsVisitante : j.golsMandante) : j.golsVisitante
    const adversario = ehNossoJogo ? (somosMandante ? j.visitante : j.mandante) : `${j.mandante} x ${j.visitante}`
    const adversarioEscudoUrl = ehNossoJogo
      ? (somosMandante ? j.visitanteEscudo : j.mandanteEscudo)
      : null
    const local = ehNossoJogo ? (somosMandante ? "Casa" : "Fora") : "Neutro"

    // Muitos jogos ainda nao tem link de sumula (fpfsJogoId null). Como NULLs sao
    // distintos no indice unico do SQLite, inserir por null duplicaria a cada sync.
    // Usamos uma chave estavel derivada de data+times para esses casos.
    const chaveSintetica = `m:${j.data}|${j.mandante}|${j.visitante}`
    const chave = j.fpfsJogoId ?? chaveSintetica
    // Quando a sumula aparece, a chave migra de sintetica -> id real; buscar por
    // ambas evita criar uma 2a partida para o mesmo jogo.
    const chavesBusca = j.fpfsJogoId ? [j.fpfsJogoId, chaveSintetica] : [chaveSintetica]

    const dados = {
      campeonatoId,
      rodada: j.rodada,
      data: dataPartidaLocal(j.data, j.hora),
      adversario,
      adversarioEscudoUrl,
      local,
      golsPro,
      golsContra,
      resultado: ehNossoJogo ? resultadoDe(golsPro, golsContra) : null,
      fpfsJogoId: chave,
      sumulaUrl: j.sumulaUrl,
    }

    const existente = await db.partida.findFirst({ where: { campeonatoId, fpfsJogoId: { in: chavesBusca } } })

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

/**
 * Sincroniza todos os campeonatos **ativos** com evento FPFS.
 * Encerrados (temporadas antigas) são ignorados para não gastar tempo no cron.
 */
export async function syncTodos(): Promise<ResumoSync[]> {
  const campeonatos = await db.campeonato.findMany({
    where: {
      fpfsEventoId: { not: null },
      status: { not: "encerrado" },
    },
    select: { id: true },
    orderBy: { id: "asc" },
  })
  const resumos: ResumoSync[] = []
  for (const c of campeonatos) {
    try {
      resumos.push(await syncCampeonato(c.id))
    } catch (e) {
      // Continua os demais se um evento da FPFS falhar
      resumos.push({
        campeonatoId: c.id,
        jogosNovos: 0,
        jogosAtualizados: 0,
        linhasClassificacao: 0,
        erro: e instanceof Error ? e.message : String(e),
      })
    }
  }
  return resumos
}
