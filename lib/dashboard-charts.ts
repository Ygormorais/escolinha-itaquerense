export type ReceitaCustoData = {
  mes: string
  recebido: number
  custos: number
}

export type ReceitaCustoComSaldo = ReceitaCustoData & {
  saldo: number
}

export type InadimplenciaData = {
  mes: string
  pagas: number
  vencidas: number
  taxa: number
}

export type ReceitaTurmaData = {
  turma: string
  receita: number
  alunos: number
}

export function adicionarSaldo(data: ReceitaCustoData[]): ReceitaCustoComSaldo[] {
  return data.map((item) => ({
    ...item,
    saldo: item.recebido - item.custos,
  }))
}

export function ordenarReceitaPorTurma(data: ReceitaTurmaData[]): ReceitaTurmaData[] {
  return [...data].sort(
    (a, b) => b.receita - a.receita || a.turma.localeCompare(b.turma, "pt-BR"),
  )
}

export function alturaGraficoTurmas(quantidade: number): number {
  return Math.max(184, quantidade * 48 + 48)
}

export function temMovimentoFinanceiro(data: ReceitaCustoData[]): boolean {
  return data.some((item) => item.recebido !== 0 || item.custos !== 0)
}

export function temMensalidades(data: InadimplenciaData[]): boolean {
  return data.some((item) => item.pagas !== 0 || item.vencidas !== 0)
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function formatarMoedaCompacta(valor: number): string {
  const absoluto = Math.abs(valor)
  const prefixo = valor < 0 ? "−" : ""
  if (absoluto >= 1_000) {
    return `${prefixo}R$${(absoluto / 1_000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })} mil`
  }

  return `${prefixo}R$${absoluto.toLocaleString("pt-BR")}`
}
