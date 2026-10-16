import { format } from "date-fns"
import { sanitizeCSVCell } from "@/lib/utils"

export type Pagamento = {
  id: number
  mesReferencia: string
  dataVencimento: Date
  dataPagamento: Date | null
  formaPagamento: string | null
  valorRecebido: number | null
  aluno: { id: number; nome: string; turma: string; mensalidade: number; telefone: string }
  canalPrevisto: string | null
  statusCobranca: string | null
  externalId: string | null
  pixCopiaECola: string | null
  linhaDigitavel: string | null
  externalUrl: string | null
}

export type StatusPagamento = "Pago" | "Pendente" | "Vencido"

export const FORMAS_PAGAMENTO = ["PIX", "Dinheiro", "Transferência", "Cartão", "Boleto"]

export function getPagamentoStatus(p: Pagamento, agora: Date = new Date()): StatusPagamento {
  if (p.dataPagamento) return "Pago"
  if (new Date(p.dataVencimento) < agora) return "Vencido"
  return "Pendente"
}

export function resumirPagamentos(pagamentos: Pagamento[], agora: Date = new Date()) {
  const pagoList = pagamentos.filter((p) => p.dataPagamento)
  return {
    totalPago: pagoList.reduce((sum, p) => sum + (p.valorRecebido ?? 0), 0),
    totalPendente: pagamentos.filter((p) => !p.dataPagamento && new Date(p.dataVencimento) >= agora).length,
    totalVencido: pagamentos.filter((p) => !p.dataPagamento && new Date(p.dataVencimento) < agora).length,
    taxaAdimplencia: pagamentos.length > 0 ? Math.round((pagoList.length / pagamentos.length) * 100) : 0,
  }
}

export type FiltrosPagamento = { search: string; status: string; turma: string }

export function filtrarPagamentos(pagamentos: Pagamento[], filtros: FiltrosPagamento, agora: Date = new Date()) {
  return pagamentos.filter((p) => {
    const matchSearch = p.aluno.nome.toLowerCase().includes(filtros.search.toLowerCase())
    const matchStatus = filtros.status === "Todos" || getPagamentoStatus(p, agora) === filtros.status
    const matchTurma = filtros.turma === "Todas" || p.aluno.turma === filtros.turma
    return matchSearch && matchStatus && matchTurma
  })
}

export function turmasDosPagamentos(pagamentos: Pagamento[]) {
  return [...new Set(pagamentos.map((p) => p.aluno.turma))].sort()
}

export function vencendoNaSemana(pagamentos: Pagamento[], agora: Date = new Date()) {
  const em7dias = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000)
  return pagamentos.filter((p) => {
    if (p.dataPagamento) return false
    const venc = new Date(p.dataVencimento)
    return venc >= agora && venc <= em7dias
  })
}

function valorWhatsApp(valor: number) {
  return valor.toFixed(2).replace(".", ",")
}

export function mensagemLembreteVencimento(p: Pagamento, chavePix?: string) {
  const venc = format(new Date(p.dataVencimento), "dd/MM/yyyy")
  return [
    `Olá! 👋 Passando para lembrar que a mensalidade de *${p.aluno.nome}* (${p.aluno.turma}) vence em *${venc}*.`,
    ``,
    `Valor: *R$ ${valorWhatsApp(p.aluno.mensalidade)}*`,
    chavePix ? `\nChave PIX: *${chavePix}*` : "",
    ``,
    `Qualquer dúvida estamos à disposição. Obrigado! ⚽`,
  ].join("\n")
}

export function linkCobrancaWhatsApp(p: Pagamento) {
  const fone = p.aluno.telefone.replace(/\D/g, "")
  const msg = `Olá! 👋 A mensalidade de *${p.aluno.nome}* referente a *${p.mesReferencia}* está em aberto.\n\nValor: *R$ ${valorWhatsApp(p.aluno.mensalidade)}*\n\nObrigado! ⚽`
  return `https://wa.me/55${fone}?text=${encodeURIComponent(msg)}`
}

export function urlReciboPago(p: Pagamento) {
  const data = p.dataPagamento ? new Date(p.dataPagamento).toISOString().slice(0, 10) : ""
  return `/recibos?aluno=${encodeURIComponent(p.aluno.nome)}&referencia=${encodeURIComponent(p.mesReferencia)}&valor=${p.valorRecebido ?? p.aluno.mensalidade}&forma=${encodeURIComponent(p.formaPagamento ?? "")}&data=${data}`
}

export function gerarCSVPagamentos(pagamentos: Pagamento[], agora: Date = new Date()) {
  const linhas = [
    ["Nome", "Turma", "Mês Ref.", "Mensalidade (R$)", "Vencimento", "Data Pagamento", "Forma", "Status"],
    ...pagamentos.map((p) => [
      p.aluno.nome,
      p.aluno.turma,
      p.mesReferencia,
      p.aluno.mensalidade.toFixed(2),
      new Date(p.dataVencimento).toLocaleDateString("pt-BR"),
      p.dataPagamento ? new Date(p.dataPagamento).toLocaleDateString("pt-BR") : "",
      p.formaPagamento ?? "",
      getPagamentoStatus(p, agora),
    ]),
  ]
  return linhas.map((l) => l.map(sanitizeCSVCell).join(";")).join("\n")
}
