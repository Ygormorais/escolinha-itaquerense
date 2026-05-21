import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("pt-BR")
}

export function calcStatus(vencimento: Date, pagamento: Date | null): string {
  if (pagamento) return "Pago"
  const today = new Date()
  const dias = Math.floor((today.getTime() - vencimento.getTime()) / 86400000)
  if (dias > 30) return "Atraso grave"
  if (dias > 0)  return "Em atraso"
  return "Pendente"
}
