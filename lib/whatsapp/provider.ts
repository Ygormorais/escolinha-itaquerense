import type { WhatsAppProvider } from "./types"
import { EvolutionProvider } from "./evolution"

let instance: WhatsAppProvider | null = null

export function getWhatsAppProvider(): WhatsAppProvider {
  if (!instance) {
    instance = new EvolutionProvider()
  }
  return instance
}

export function setWhatsAppProvider(provider: WhatsAppProvider) {
  instance = provider
}
