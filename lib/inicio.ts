import type { PendenciaGrupo } from "@/lib/pendencias-data"

/** Cálculos do Início (dashboard). Funções puras: as consultas ficam na página. */

type ValorAluno = { mensalidade: number; desconto: number }

function valorDevido({ mensalidade, desconto }: ValorAluno): number {
  return Math.max(0, mensalidade - desconto)
}

/** Previsto do mês: soma do que cada aluno ativo paga (mensalidade − desconto). */
export function previstoDoMes(alunos: ValorAluno[]): number {
  return alunos.reduce((total, aluno) => total + valorDevido(aluno), 0)
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

export type AcaoInicio = { texto: string; href: string; quantidade: number; prioridade: "alta" | "normal" }

const LIMITE_ACOES = 5

/** Tela da área do item: sem filtro na URL e sem id no fim (ex.: /alunos/12 → /alunos). */
function telaDaArea(href: string): string {
  const caminho = href.split(/[?#]/, 1)[0]
  const partes = caminho.split("/").filter(Boolean)
  while (partes.length > 1 && /^\d+$/.test(partes[partes.length - 1])) partes.pop()
  return `/${partes.join("/")}`
}

/** "Precisa de você": uma ação por grupo de pendências, as mais urgentes primeiro. */
export function acoesDoInicio(grupos: PendenciaGrupo[]): { acoes: AcaoInicio[]; total: number } {
  const acoes: AcaoInicio[] = grupos
    .filter((g) => g.itens.length > 0)
    .map((g) => ({
      texto: `${g.itens.length} ${g.titulo.toLowerCase()}`,
      href: g.titulo === "Mensalidades vencidas" ? "/inadimplencia" : telaDaArea(g.itens[0].href),
      quantidade: g.itens.length,
      prioridade: g.itens.some((i) => i.prioridade === "alta") ? "alta" : "normal",
    }))
  acoes.sort((a, b) =>
    a.prioridade === b.prioridade ? b.quantidade - a.quantidade : a.prioridade === "alta" ? -1 : 1,
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

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

/** "Outubro de 2026". */
export function formatarMesAno(data: Date): string {
  return `${MESES[data.getMonth()]} de ${data.getFullYear()}`
}
