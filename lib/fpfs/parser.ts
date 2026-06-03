import * as cheerio from "cheerio"
import type { JogoFpfs, LinhaClassificacao } from "./types"

function dataIso(dataBr: string): string {
  const [dia, mes, ano] = dataBr.trim().split("/")
  const yyyy = ano ?? String(new Date().getFullYear())
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

export function parseJogos(html: string): JogoFpfs[] {
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
    const [golsMandante, golsVisitante] = parseGols($(tds[3]).find(".result").text().trim())
    const sumulaHref = $(tds[3]).find('a[href*="sumula"]').attr("href")
    if (!mandante || !visitante) return
    jogos.push({
      fpfsJogoId: jogoIdDaSumula(sumulaHref),
      rodada: 1,
      data: dataIso(dataTxt),
      hora: horaTxt || null,
      ginasio,
      mandante,
      visitante,
      golsMandante,
      golsVisitante,
      sumulaUrl: sumulaHref ?? null,
    })
  })
  return jogos
}

export function parseClassificacao(html: string): LinhaClassificacao[] {
  const $ = cheerio.load(html)
  const linhas: LinhaClassificacao[] = []
  $("table.classification_table").each((_, table) => {
    $(table).find("tbody tr").each((i, el) => {
      const tds = $(el).children("td")
      if (tds.length < 11) return
      const grupoTxt = $(tds[0]).text().trim()
      const timeNome = ($(tds[2]).find(".nome_clube").text().trim() || $(tds[2]).text().trim())
      if (!timeNome) return
      const golsPro = num($(tds[8]).text())
      const golsContra = num($(tds[9]).text())
      linhas.push({
        fase: grupoTxt || "Classificação",
        grupo: grupoTxt || null,
        posicao: num($(tds[1]).text()) || i + 1,
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
