import { restanteDoPagamento, valorDevidoDoAluno, valorDevidoDoPagamento } from "@/lib/valor-devido"

/** Recibo de uma baixa, como o portal da família mostra. */
export type ReciboPortal = { id: number; numero: string; valor: number; dataPagamento: Date }

/** Mensalidade como o portal lê do banco. */
export type PagamentoPortal = {
  mesReferencia: string
  dataVencimento: Date
  dataPagamento: Date | null
  valorRecebido: number | null
  valorDevido: number | null
  formaPagamento: string | null
  recibos: ReciboPortal[]
}

export type SituacaoMes = "pago" | "parcial" | "atrasado" | "a_vencer" | "nao_gerada"

export type MesPortal = {
  /** "YYYY-MM" */
  mes: string
  situacao: SituacaoMes
  devido: number
  recebido: number
  restante: number
  formaPagamento: string | null
  /** Só quando a mensalidade foi quitada; baixa parcial não tem data de quitação. */
  dataPagamento: Date | null
  dataVencimento: Date | null
  recibos: ReciboPortal[]
}

function situacaoDe(p: PagamentoPortal, agora: Date): SituacaoMes {
  if (p.dataPagamento) return "pago"
  if ((p.valorRecebido ?? 0) > 0) return "parcial"
  return p.dataVencimento < agora ? "atrasado" : "a_vencer"
}

/**
 * Meses de um aluno no portal: os 12 meses do ano e, antes deles, mensalidades de anos
 * anteriores que ainda estão em aberto (para a família não perder dezembro em janeiro).
 */
export function montarMesesDoAluno(
  aluno: { mensalidade: number; desconto: number },
  pagamentos: PagamentoPortal[],
  ano: number,
  agora: Date,
): MesPortal[] {
  const porMes = new Map(pagamentos.map((p) => [p.mesReferencia, p]))
  const doAno = Array.from({ length: 12 }, (_, i) => `${ano}-${String(i + 1).padStart(2, "0")}`)
  const anterioresEmAberto = pagamentos
    .filter((p) => p.mesReferencia < `${ano}-01` && !p.dataPagamento)
    .map((p) => p.mesReferencia)
    .sort()

  return [...anterioresEmAberto, ...doAno].map((mes) => {
    const p = porMes.get(mes)
    if (!p) {
      const devido = valorDevidoDoAluno(aluno)
      return {
        mes, situacao: "nao_gerada", devido, recebido: 0, restante: devido,
        formaPagamento: null, dataPagamento: null, dataVencimento: null, recibos: [],
      }
    }
    const comAluno = { ...p, aluno }
    const situacao = situacaoDe(p, agora)
    return {
      mes,
      situacao,
      devido: valorDevidoDoPagamento(comAluno),
      recebido: p.valorRecebido ?? 0,
      restante: situacao === "pago" ? 0 : restanteDoPagamento(comAluno),
      formaPagamento: p.formaPagamento,
      dataPagamento: p.dataPagamento,
      dataVencimento: p.dataVencimento,
      recibos: [...p.recibos].sort((a, b) => a.dataPagamento.getTime() - b.dataPagamento.getTime()),
    }
  })
}

/** Totais do topo: só conta mensalidades já geradas. */
export function resumoMensalidades(mesesPorAluno: MesPortal[][]) {
  let pagos = 0
  let emAberto = 0
  let totalEmAberto = 0
  for (const m of mesesPorAluno.flat()) {
    if (m.situacao === "pago") pagos++
    else if (m.situacao !== "nao_gerada") {
      emAberto++
      totalEmAberto += m.restante
    }
  }
  return { pagos, emAberto, totalEmAberto: Math.round(totalEmAberto * 100) / 100 }
}
