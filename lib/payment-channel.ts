export type PaymentChannel =
  | "PIX"
  | "Boleto"
  | "Maquininha"
  | "Transferência"
  | "Dinheiro"
  | "Outro"
  | "Sem registro"

export function getPaymentChannel(formaPagamento: string | null | undefined): PaymentChannel {
  const raw = (formaPagamento ?? "").trim()
  if (!raw) return "Sem registro"

  const normalized = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

  if (normalized.includes("pix")) return "PIX"
  if (normalized.includes("boleto")) return "Boleto"
  if (normalized.includes("cartao")) return "Maquininha"
  if (normalized.includes("maquininha")) return "Maquininha"
  if (normalized.includes("transfer")) return "Transferência"
  if (normalized.includes("dinheiro")) return "Dinheiro"

  return "Outro"
}
