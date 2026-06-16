import type { OFXTransaction } from "./ofx-parser"

type MatchConfianca = "alta" | "baixa" | "nenhuma"

export type MatchResult = {
  fitid: string
  date: Date
  amount: number
  memo: string
  alunoId: number | null
  alunoNome: string | null
  pagamentoId: number | null
  mesReferencia: string | null
  confianca: MatchConfianca
}

function normalizarNome(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
}

function palavrasSignificativas(nome: string): string[] {
  return normalizarNome(nome)
    .split(/\s+/)
    .filter((p) => p.length >= 3)
}

export function matchTransactions(
  transactions: OFXTransaction[],
  alunos: { id: number; nome: string }[],
  pagamentos: { id: number; alunoId: number; mesReferencia: string; dataPagamento: Date | null }[]
): MatchResult[] {
  const pendentes = pagamentos.filter((p) => p.dataPagamento === null)

  return transactions.map((tx) => {
    const memoNorm = normalizarNome(tx.memo)

    const alunoMatch = alunos.find((aluno) => {
      const palavras = palavrasSignificativas(aluno.nome)
      if (palavras.length === 0) return false
      const primeira = palavras[0]
      const ultima = palavras[palavras.length - 1]
      return memoNorm.includes(primeira) && memoNorm.includes(ultima)
    })

    if (!alunoMatch) {
      return {
        fitid: tx.fitid,
        date: tx.date,
        amount: tx.amount,
        memo: tx.memo,
        alunoId: null,
        alunoNome: null,
        pagamentoId: null,
        mesReferencia: null,
        confianca: "nenhuma",
      }
    }

    const pendentesAluno = pendentes.filter((p) => p.alunoId === alunoMatch.id)

    if (pendentesAluno.length === 1) {
      const pag = pendentesAluno[0]
      return {
        fitid: tx.fitid,
        date: tx.date,
        amount: tx.amount,
        memo: tx.memo,
        alunoId: alunoMatch.id,
        alunoNome: alunoMatch.nome,
        pagamentoId: pag.id,
        mesReferencia: pag.mesReferencia,
        confianca: "alta",
      }
    }

    // 0 ou múltiplas pendentes → confiança baixa; pega a mais antiga se houver
    const mais_antiga = pendentesAluno[0] ?? null
    return {
      fitid: tx.fitid,
      date: tx.date,
      amount: tx.amount,
      memo: tx.memo,
      alunoId: alunoMatch.id,
      alunoNome: alunoMatch.nome,
      pagamentoId: mais_antiga?.id ?? null,
      mesReferencia: mais_antiga?.mesReferencia ?? null,
      confianca: "baixa",
    }
  })
}
