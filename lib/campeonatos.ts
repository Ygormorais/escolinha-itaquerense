export type ClassificacaoItem = {
  nome: string
  jogos: number
  vitorias: number
  empates: number
  derrotas: number
  golsPro: number
  golsContra: number
  saldo: number
  pontos: number
}

export function calcularClassificacao(partidas: { golsPro: number | null; golsContra: number | null }[]): ClassificacaoItem[] {
  const stats: ClassificacaoItem = {
    nome: "E.C. Itaquerense",
    jogos: 0, vitorias: 0, empates: 0, derrotas: 0,
    golsPro: 0, golsContra: 0, saldo: 0, pontos: 0,
  }

  for (const p of partidas) {
    if (p.golsPro == null || p.golsContra == null) continue
    stats.jogos++
    stats.golsPro += p.golsPro
    stats.golsContra += p.golsContra
    if (p.golsPro > p.golsContra) { stats.vitorias++; stats.pontos += 3 }
    else if (p.golsPro < p.golsContra) { stats.derrotas++ }
    else { stats.empates++; stats.pontos++ }
  }
  stats.saldo = stats.golsPro - stats.golsContra

  return [stats]
}
