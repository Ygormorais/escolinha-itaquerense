import type { PendenciaGrupo } from "@/lib/pendencias-data"

/** Cálculos do Início (dashboard). Funções puras: as consultas ficam na página. */

type ValorAluno = { mensalidade: number; desconto: number }

export function valorDevido({ mensalidade, desconto }: ValorAluno): number {
  return Math.max(0, mensalidade - desconto)
}

/** Mensalidades vencidas e não pagas — mesma regra da tela de Inadimplência. */
export function resumoAtraso(vencidas: (ValorAluno & { alunoId: number })[]): {
  valor: number
  alunos: number
  mensalidades: number
} {
  return {
    valor: vencidas.reduce((total, v) => total + valorDevido(v), 0),
    alunos: new Set(vencidas.map((v) => v.alunoId)).size,
    mensalidades: vencidas.length,
  }
}

/** Total em aberto da tela de Inadimplência — mesma conta do "Em atraso" do Início. */
export function valorTotalEmAberto(alunos: (ValorAluno & { pagamentos: unknown[] })[]): number {
  return alunos.reduce((total, aluno) => total + valorDevido(aluno) * aluno.pagamentos.length, 0)
}

export type AcaoInicio = {
  /** Agrupa e ordena: "atraso", "vencendo", "prematriculas", "solicitacoes" ou o título do grupo. */
  chave: string
  texto: string
  href: string
  quantidade: number
  prioridade: "alta" | "normal"
}

const ORDEM_FIXA = ["atraso", "vencendo", "prematriculas", "solicitacoes"]

const CHAVE_DO_GRUPO: Record<string, string> = {
  "Mensalidades vencidas": "atraso",
  "Solicitações": "solicitacoes",
}

const LIMITE_ACOES = 5

/** Tela da área do item: sem filtro na URL e sem id no fim (ex.: /alunos/12 → /alunos). */
function telaDaArea(href: string): string {
  const caminho = href.split(/[?#]/, 1)[0]
  const partes = caminho.split("/").filter(Boolean)
  while (partes.length > 1 && /^\d+$/.test(partes[partes.length - 1])) partes.pop()
  return `/${partes.join("/")}`
}

/**
 * "Precisa de você": uma ação por grupo de pendências mais os alertas do Início.
 * Ordem: atraso, vencendo, pré-matrículas, solicitações; depois urgência e quantidade.
 */
export function acoesDoInicio(grupos: PendenciaGrupo[], alertas: AcaoInicio[] = []): { acoes: AcaoInicio[]; total: number } {
  const daPendencia: AcaoInicio[] = grupos
    .filter((g) => g.itens.length > 0)
    .map((g) => ({
      chave: CHAVE_DO_GRUPO[g.titulo] ?? g.titulo,
      texto: `${g.titulo} · ${g.itens.length}`,
      href: g.titulo === "Mensalidades vencidas" ? "/inadimplencia" : telaDaArea(g.itens[0].href),
      quantidade: g.itens.length,
      prioridade: g.itens.some((i) => i.prioridade === "alta") ? "alta" : "normal",
    }))
  const acoes = [...daPendencia, ...alertas.filter((a) => a.quantidade > 0)]
  const posicao = (a: AcaoInicio) => {
    const i = ORDEM_FIXA.indexOf(a.chave)
    return i === -1 ? ORDEM_FIXA.length : i
  }
  acoes.sort((a, b) =>
    posicao(a) - posicao(b) ||
    (a.prioridade === b.prioridade ? 0 : a.prioridade === "alta" ? -1 : 1) ||
    b.quantidade - a.quantidade,
  )
  return { acoes: acoes.slice(0, LIMITE_ACOES), total: acoes.length }
}

export function serieRecebidoPrevisto(
  meses: string[],
  pagamentos: { mesReferencia: string; valorRecebido: number | null; previsto: number }[],
): { mes: string; recebido: number; previsto: number }[] {
  return meses.map((mes) => {
    const doMes = pagamentos.filter((p) => p.mesReferencia === mes)
    return {
      mes,
      recebido: doMes.reduce((t, p) => t + (p.valorRecebido ?? 0), 0),
      previsto: doMes.reduce((t, p) => t + p.previsto, 0),
    }
  })
}
