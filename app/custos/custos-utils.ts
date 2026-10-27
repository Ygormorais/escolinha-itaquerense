import { format } from "date-fns"
import { sanitizeCSVCell } from "@/lib/utils"

export const CATEGORIAS = [
  "Aluguel de campo",
  "Salário técnico",
  "Material esportivo",
  "Uniforme",
  "Outros",
]

export const FORMAS_PAGAMENTO = ["PIX", "Dinheiro", "Transferência", "Cartão", "Boleto"]

export type Custo = {
  id: number
  data: Date
  categoria: string
  descricao: string
  fornecedor: string
  valor: number
  formaPagamento: string
  comprovante: boolean
  observacoes: string | null
}

export type Recorrente = { id: number; descricao: string; valor: number; ativo: boolean }

export type CustoFormValues = {
  data: string
  categoria: string
  descricao: string
  fornecedor: string
  valor: string
  formaPagamento: string
  comprovante: boolean
  observacoes: string
}

/** Busca por descrição, categoria ou fornecedor, sem diferenciar caixa nem espaços nas pontas. */
export function filtrarCustos(custos: Custo[], busca: string) {
  const q = busca.trim().toLowerCase()
  if (!q) return custos
  return custos.filter((c) =>
    c.descricao.toLowerCase().includes(q) ||
    c.categoria.toLowerCase().includes(q) ||
    c.fornecedor.toLowerCase().includes(q)
  )
}

/** Categoria com maior soma de valores; "—" quando não há custos. */
export function categoriaDestaque(custos: Custo[]) {
  const map = new Map<string, number>()
  for (const c of custos) map.set(c.categoria, (map.get(c.categoria) ?? 0) + c.valor)
  let top = ""
  let topVal = 0
  for (const [k, v] of map) { if (v > topVal) { top = k; topVal = v } }
  return top || "—"
}

export function ticketMedio(total: number, quantidade: number) {
  return quantidade > 0 ? total / quantidade : 0
}

export function gerarCSVCustos(custos: Custo[]) {
  const linhas = [
    ["Data", "Categoria", "Descrição", "Fornecedor", "Forma", "Comprovante", "Valor (R$)"],
    ...custos.map((c) => [
      format(new Date(c.data), "dd/MM/yyyy"),
      c.categoria,
      c.descricao,
      c.fornecedor,
      c.formaPagamento,
      c.comprovante ? "Sim" : "Não",
      c.valor.toFixed(2),
    ]),
  ]
  return linhas.map((l) => l.map(sanitizeCSVCell).join(";")).join("\n")
}
