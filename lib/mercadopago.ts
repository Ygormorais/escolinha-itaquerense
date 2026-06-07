import { MercadoPagoConfig, Payment } from "mercadopago"

export type MpPaymentStatus =
  | "pending"
  | "approved"
  | "authorized"
  | "in_process"
  | "in_mediation"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back"

export function mpStatusToLocal(
  status: MpPaymentStatus
): "pendente" | "pago" | "cancelado" {
  if (status === "approved") return "pago"
  if (status === "cancelled" || status === "rejected" || status === "refunded") return "cancelado"
  return "pendente"
}

// Lazy — só inicializa quando chamado, não no load do módulo (evita falha no build)
let _mpPayment: Payment | null = null

export function getMpPayment(): Payment {
  if (!_mpPayment) {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado")
    _mpPayment = new Payment(new MercadoPagoConfig({ accessToken: token }))
  }
  return _mpPayment
}

// Compatibilidade com código existente que usa mpPayment diretamente
export const mpPayment = new Proxy({} as Payment, {
  get(_target, prop: string | symbol) {
    const mp = getMpPayment()
    return mp[prop as keyof Payment]
  },
})
