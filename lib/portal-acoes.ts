import { formatMoney, plural } from "@/lib/utils"
import type { AcaoInicio } from "@/lib/inicio"

export type EntradaAcoesPortal = {
  /** Mensalidades já vencidas e sem quitação (inclui baixa parcial). */
  atrasadas: number
  /** Mensalidades em aberto que ainda vão vencer. */
  aVencer: number
  /** Quanto falta pagar nas mensalidades já vencidas. */
  restanteAtrasado: number
  /** Quanto falta pagar nas que ainda vão vencer. */
  restanteAVencer: number
  /** Documentos obrigatórios aguardando o aceite da família. */
  documentosPendentes: number
  /** Pesquisa de satisfação aberta que a família ainda não respondeu (já filtrada por elegibilidade). */
  pesquisaPendente?: { titulo: string } | null
}

/**
 * O que a família precisa resolver, na ordem de urgência. Cada linha leva à tela que resolve.
 * Lista vazia = tudo em dia.
 */
export function acoesDoPortal(e: EntradaAcoesPortal): AcaoInicio[] {
  const acoes: AcaoInicio[] = []
  if (e.atrasadas > 0) {
    acoes.push({
      chave: "atraso",
      texto: `${plural(e.atrasadas, "mensalidade atrasada", "mensalidades atrasadas")} · faltam ${formatMoney(e.restanteAtrasado)}`,
      href: "/responsavel/mensalidades",
      quantidade: e.atrasadas,
      prioridade: "alta",
    })
  } else if (e.aVencer > 0) {
    acoes.push({
      chave: "vencendo",
      texto: `${plural(e.aVencer, "mensalidade em aberto", "mensalidades em aberto")} · ${formatMoney(e.restanteAVencer)}`,
      href: "/responsavel/mensalidades",
      quantidade: e.aVencer,
      prioridade: "normal",
    })
  }
  if (e.documentosPendentes > 0) {
    acoes.push({
      chave: "documentos",
      texto: `${plural(e.documentosPendentes, "documento para aceitar", "documentos para aceitar")}`,
      href: "/responsavel/documentos",
      quantidade: e.documentosPendentes,
      prioridade: "normal",
    })
  }
  if (e.pesquisaPendente) {
    acoes.push({
      chave: "pesquisa",
      texto: `Pesquisa de satisfação: ${e.pesquisaPendente.titulo}`,
      href: "/responsavel/pesquisa",
      quantidade: 1,
      prioridade: "normal",
    })
  }
  return acoes
}
