export type AlunoResumo = { id: number; nome: string; turma: string }

export type Avaliacao = {
  id: number
  alunoId: number
  aluno: AlunoResumo
  periodo: string
  notaTecnica: number | null
  notaFisica: number | null
  notaComportamento: number | null
  frequencia: number | null
  observacoes: string | null
  createdAt: Date
}

export type CampoNota = "notaTecnica" | "notaFisica" | "notaComportamento"

export type PontoEvolucao = {
  periodo: string
  Técnica: number | null
  Física: number | null
  Comportamento: number | null
}

type BadgeVariant = "default" | "destructive" | "secondary" | "outline"

export function notaBadgeColor(valor: number | null): BadgeVariant {
  if (valor === null) return "outline"
  if (valor >= 7) return "default"
  if (valor >= 5) return "secondary"
  return "destructive"
}

export function freqBadgeColor(valor: number | null): BadgeVariant {
  if (valor === null) return "outline"
  if (valor >= 75) return "default"
  if (valor >= 50) return "secondary"
  return "destructive"
}

/** Média com uma casa decimal, ignorando notas em branco; "—" se não houver nenhuma. */
export function mediaNota(avaliacoes: Avaliacao[], campo: CampoNota) {
  const vals = avaliacoes.map((a) => a[campo]).filter((v): v is number => v !== null)
  return vals.length > 0 ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : "—"
}

/** Pontos do gráfico de evolução, em ordem de período. */
export function dadosEvolucao(avaliacoes: Avaliacao[]): PontoEvolucao[] {
  return [...avaliacoes]
    .sort((a, b) => a.periodo.localeCompare(b.periodo))
    .map((a) => ({
      periodo: a.periodo,
      Técnica: a.notaTecnica,
      Física: a.notaFisica,
      Comportamento: a.notaComportamento,
    }))
}

export function gerarCSVAvaliacoes(avaliacoes: Avaliacao[]) {
  const linhas = [
    ["Aluno", "Turma", "Período", "Técnica", "Física", "Comportamento", "Frequência", "Observações"],
    ...avaliacoes.map((a) => [
      a.aluno.nome, a.aluno.turma, a.periodo,
      a.notaTecnica !== null ? String(a.notaTecnica) : "",
      a.notaFisica !== null ? String(a.notaFisica) : "",
      a.notaComportamento !== null ? String(a.notaComportamento) : "",
      a.frequencia !== null ? `${a.frequencia}%` : "",
      a.observacoes ?? "",
    ]),
  ]
  return linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n")
}
