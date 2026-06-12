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
