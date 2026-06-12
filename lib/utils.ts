import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

/** "nenhuma transação" / "1 transação" / "3 transações" — zero customizável ("nenhum"). */
export function plural(n: number, singular: string, plural: string, zero = "nenhuma"): string {
  if (n === 0) return `${zero} ${singular}`
  return `${n} ${n === 1 ? singular : plural}`
}

/** Valida input de data "yyyy-mm-dd" (ou datetime-local) com ano 1900–2100 e data real no calendário. */
export function dataValida(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})(T\d{2}:\d{2})?$/.exec(s)
  if (!m) return false
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (ano < 1900 || ano > 2100) return false
  const d = new Date(ano, mes - 1, dia)
  return d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia
}

/** Normaliza telefone BR para "(11) 95868-6579"; fora do padrão devolve como veio. */
export function formatPhone(telefone: string): string {
  let d = telefone.replace(/\D/g, "")
  if (d.length === 13 && d.startsWith("55")) d = d.slice(2)
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return telefone
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("pt-BR")
}

/** Escapa um valor para uso em CSV: aspas duplas dobradas + prefixo anti-injeção de fórmula. */
export function sanitizeCSVCell(value: unknown): string {
  const str = String(value ?? "").replace(/"/g, '""')
  // Prefixar com apóstrofo se o valor começa com caractere que Excel/Calc interpreta como fórmula
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str
  return `"${safe}"`
}

export function calcStatus(vencimento: Date, pagamento: Date | null): string {
  if (pagamento) return "Pago"
  const today = new Date()
  const dias = Math.floor((today.getTime() - vencimento.getTime()) / 86400000)
  if (dias > 30) return "Atraso grave"
  if (dias > 0)  return "Em atraso"
  return "Pendente"
}
