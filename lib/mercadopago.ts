import { MercadoPagoConfig, Payment } from "mercadopago"
import { requireEnv } from "@/lib/env"

const client = new MercadoPagoConfig({
  accessToken: requireEnv("MERCADOPAGO_ACCESS_TOKEN", "TEST-placeholder"),
})

export const mpPayment = new Payment(client)

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
