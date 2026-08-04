import type { WhatsAppProvider, SendTextParams, SendTemplateParams } from "./types"

const BASE_URL = process.env.EVOLUTION_API_URL ?? "http://localhost:8080"
const API_KEY = process.env.EVOLUTION_API_KEY ?? ""
const INSTANCE = process.env.EVOLUTION_INSTANCE ?? "escolinha"

function assertConfigured() {
  if (!BASE_URL || !API_KEY) {
    throw new Error("Evolution API não configurada")
  }
}

function headers() {
  return {
    "Content-Type": "application/json",
    "apikey": API_KEY,
  }
}

export class EvolutionProvider implements WhatsAppProvider {
  async sendText({ telefone, mensagem }: SendTextParams) {
    assertConfigured()
    const res = await fetch(`${BASE_URL}/message/sendText/${INSTANCE}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        number: telefone.replace(/\D/g, ""),
        text: mensagem,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Evolution API error: ${err}`)
    }

    const data = await res.json()
    return { success: true, messageId: data.key?.id }
  }

  async sendTemplate({ telefone, template, params }: SendTemplateParams) {
    assertConfigured()
    const res = await fetch(`${BASE_URL}/message/sendTemplate/${INSTANCE}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        number: telefone.replace(/\D/g, ""),
        template,
        params: params ?? [],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Evolution API template error: ${err}`)
    }

    const data = await res.json()
    return { success: true, messageId: data.key?.id }
  }

  async getStatus() {
    if (!BASE_URL || !API_KEY) {
      return { connected: false, instance: INSTANCE }
    }

    const res = await fetch(`${BASE_URL}/instance/connectionState/${INSTANCE}`, {
      headers: headers(),
    })

    if (!res.ok) return { connected: false, instance: INSTANCE }

    const data = await res.json()
    return { connected: data.instance?.state === "open", instance: INSTANCE }
  }
}
