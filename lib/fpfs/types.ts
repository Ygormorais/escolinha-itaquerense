export interface JogoFpfs {
  fpfsJogoId: string | null
  rodada: number
  data: string          // ISO yyyy-mm-dd
  hora: string | null   // "17:00"
  ginasio: string | null
  mandante: string
  visitante: string
  /** Escudo do mandante (URL https da FPFS) */
  mandanteEscudo: string | null
  /** Escudo do visitante (URL https da FPFS) */
  visitanteEscudo: string | null
  golsMandante: number | null
  golsVisitante: number | null
  sumulaUrl: string | null
}

export interface LinhaClassificacao {
  fase: string
  grupo: string | null
  posicao: number
  timeNome: string
  pontos: number
  jogos: number
  vitorias: number
  empates: number
  derrotas: number
  golsPro: number
  golsContra: number
  saldo: number
}
