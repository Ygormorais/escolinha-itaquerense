import * as cheerio from "cheerio"
import type { JogoFpfs, LinhaClassificacao } from "./types"

/**
 * Extrai o ano da temporada e metadados do HTML da FPFS.
 * Ex.: "Campeonato Paulista, Temporada 2026 Categoria Sub-7, Divisao A3"
 */
export function extractTemporadaMeta(html: string): {
  temporada: number | null
  categoria: string | null
  divisao: string | null
} {
  const block = html.replace(/\s+/g, " ")
  const t = block.match(/Temporada\s+(\d{4})/i)?.[1]
  const catRaw = block.match(/Categoria\s+(Sub[-\s]?\d+)/i)?.[1]
  // Normaliza "Sub 7" / "Sub7" / "Sub-7" → "Sub-7" (sem Sub--)
  const cat = catRaw
    ? `Sub-${catRaw.replace(/^Sub[-\s]?/i, "")}`
    : null
  const div = block.match(/Divis[aã]o\s+([A-Z0-9]+)/i)?.[1] ?? null
  return {
    temporada: t ? Number(t) : null,
    categoria: cat,
    divisao: div,
  }
}

function dataIso(dataBr: string, anoTemporada?: number): string {
  // O site exibe datas como "11/04" (sem ano). Prioridade:
  // 1) ano explícito no texto  2) temporada do HTML/evento  3) ano corrente
  const [dia, mes, ano] = dataBr.trim().split("/")
  const yyyy = ano ?? String(anoTemporada ?? new Date().getFullYear())
  return `${yyyy}-${(mes ?? "").padStart(2, "0")}-${(dia ?? "").padStart(2, "0")}`
}

function parseGols(texto: string): [number | null, number | null] {
  const m = texto.match(/(\d+)\s*[xX×]\s*(\d+)/)
  return m ? [Number(m[1]), Number(m[2])] : [null, null]
}

function jogoIdDaSumula(href: string | undefined): string | null {
  if (!href) return null
  const m = href.match(/id_jogo=(\d+)/i)
  return m ? m[1] : null
}

function num(txt: string): number {
  const n = Number(txt.trim().replace(/[^\d-]/g, ""))
  return Number.isFinite(n) ? n : 0
}

/** Aceita só hosts da FPFS e força https. */
export function normalizeEscudoUrl(src: string | undefined | null): string | null {
  if (!src?.trim()) return null
  try {
    const u = new URL(src.trim(), "https://admfutsal.com.br")
    const host = u.hostname.replace(/^www\./, "").toLowerCase()
    if (host !== "admfutsal.com.br" && host !== "eventos.admfutsal.com.br") return null
    u.protocol = "https:"
    return u.toString()
  } catch {
    return null
  }
}

export function parseJogos(html: string, anoTemporada?: number): JogoFpfs[] {
  // Preferir o ano impresso no HTML da FPFS (evita forçar 2026 em eventos 2024)
  const fromHtml = extractTemporadaMeta(html).temporada
  const ano = fromHtml ?? anoTemporada ?? undefined
  const $ = cheerio.load(html)
  const jogos: JogoFpfs[] = []
  $("table.classification_table tbody tr").each((_, el) => {
    const tds = $(el).children("td")
    if (tds.length < 4) return
    const dataTxt = $(tds[0]).text().trim()
    if (!/^\d{2}\/\d{2}/.test(dataTxt)) return
    const horaTxt = $(tds[1]).text().trim().replace(/h$/i, "")
    const ginasio = $(tds[2]).text().trim() || null
    const nomes = $(tds[3]).find(".nome_clube")
    const mandante = $(nomes[0]).text().trim()
    const visitante = $(nomes[1]).text().trim()
    const escudos = $(tds[3]).find("img.escudo")
    const mandanteEscudo = normalizeEscudoUrl($(escudos[0]).attr("src"))
    const visitanteEscudo = normalizeEscudoUrl($(escudos[1]).attr("src"))
    const [golsMandante, golsVisitante] = parseGols($(tds[3]).find(".result").text().trim())
    const sumulaHref = $(tds[3]).find('a[href*="sumula"]').attr("href")
    if (!mandante || !visitante) return
    jogos.push({
      fpfsJogoId: jogoIdDaSumula(sumulaHref),
      rodada: 1,
      data: dataIso(dataTxt, ano),
      hora: horaTxt || null,
      ginasio,
      mandante,
      visitante,
      mandanteEscudo,
      visitanteEscudo,
      golsMandante,
      golsVisitante,
      sumulaUrl: sumulaHref ?? null,
    })
  })
  return jogos
}

/**
 * Fases que são tabela de classificação real.
 * A FPFS reutiliza `classification_table` em chaves/mata-mata e rotula a
 * primeira coluna como "JOGO 12", "JOGO 68" etc. — isso não é standings.
 */
export function isFaseTabelaClassificacao(fase: string): boolean {
  const f = fase.trim()
  if (!f) return false
  // Mata-mata / chave rotulada por jogo
  if (/^jogo\s*\d+/i.test(f)) return false
  // Linha de jogos (dd/mm) que às vezes vaza na mesma classe de tabela
  if (/^\d{1,2}\/\d{1,2}/.test(f)) return false
  return true
}

export function parseClassificacao(html: string): LinhaClassificacao[] {
  const $ = cheerio.load(html)
  const linhas: LinhaClassificacao[] = []

  // Abas da FPFS: "1ª FASE CLASSIFICAÇÃO", "Geral", etc.
  const fasePorPane = new Map<string, string>()
  $('a[href^="#pills-fase"]').each((_, a) => {
    const href = $(a).attr("href")?.replace(/^#/, "")?.trim()
    const label = $(a).text().replace(/\s+/g, " ").trim()
    if (href && label) fasePorPane.set(href, label)
  })

  $("table.classification_table").each((_, table) => {
    const $table = $(table)
    const paneId = $table.closest(".tab-pane").attr("id") ?? ""
    // Painéis "-chave" herdam o label da fase pai
    const paneLabel =
      fasePorPane.get(paneId) ??
      fasePorPane.get(paneId.replace(/-chave$/i, "")) ??
      null
    const fasePane =
      paneLabel && /^geral$/i.test(paneLabel) ? "Classificação" : paneLabel

    $table.find("tbody tr").each((i, el) => {
      const tds = $(el).children("td")
      if (tds.length < 11) return
      const grupoTxt = $(tds[0]).text().trim()
      // 1ª coluna = chave/grupo; se for JOGO N ou data, a linha não é standings
      if (grupoTxt && !isFaseTabelaClassificacao(grupoTxt)) return

      const fase =
        fasePane ||
        (grupoTxt && isFaseTabelaClassificacao(grupoTxt) ? grupoTxt : null) ||
        "Classificação"
      if (!isFaseTabelaClassificacao(fase)) return

      const timeNome =
        $(tds[2]).find(".nome_clube").text().trim() || $(tds[2]).text().trim()
      if (!timeNome) return
      // Posição deve ser número de tabela (não placar solto / lixo)
      const posicao = num($(tds[1]).text()) || i + 1
      if (posicao < 1 || posicao > 64) return
      const golsPro = num($(tds[8]).text())
      const golsContra = num($(tds[9]).text())
      // Grupo: 1ª coluna quando é chave/grupo (não a fase "Classificação" genérica)
      const grupo =
        grupoTxt && !/^classifica/i.test(grupoTxt) ? grupoTxt : null
      linhas.push({
        fase,
        grupo,
        posicao,
        timeNome,
        pontos: num($(tds[3]).text()),
        jogos: num($(tds[4]).text()),
        vitorias: num($(tds[5]).text()),
        empates: num($(tds[6]).text()),
        derrotas: num($(tds[7]).text()),
        golsPro,
        golsContra,
        saldo: golsPro - golsContra,
      })
    })
  })
  return linhas
}
