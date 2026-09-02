export const perguntasDesenvolvimento = {
  faltas: "Quais atletas estão há duas semanas sem vir?",
  avaliacoes: "Quais atletas estão sem avaliação nos últimos 90 dias?",
  pendencias: "Quais ações estão pendentes?",
  planosSemRetorno: "Quais planos aguardam retorno da comissão?",
  resumosSemLeitura: "Quais resumos publicados aguardam leitura?",
  acoesForaCiclo: "Quais ações estão pendentes de ciclos anteriores?",
} as const

// Correspondência explícita: não ignorar qualificadores como datas, nomes ou negações.
export function reconhecerPergunta(texto: string): keyof typeof perguntasDesenvolvimento | null {
  const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[?!.]+$/, "").replace(/\s+/g, " ")
  const entrada = normalizar(texto)
  return (Object.keys(perguntasDesenvolvimento) as (keyof typeof perguntasDesenvolvimento)[]).find((key) => normalizar(perguntasDesenvolvimento[key]) === entrada) ?? null
}

export function janelaPergunta(dias: number, now: Date) {
  const hoje = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now)
  const fim = new Date(new Date(`${hoje}T00:00:00Z`).getTime() + 86400000)
  return { inicio: new Date(fim.getTime() - dias * 86400000), fim }
}
