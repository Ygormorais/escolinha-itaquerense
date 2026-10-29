/** Link wa.me com mensagem pronta; null quando o número configurado não é válido. */
export function whatsappUrl(numero: string | null | undefined, texto: string): string | null {
  const digitos = numero?.replace(/\D/g, "") ?? ""
  if (digitos.length < 10) return null
  return `https://wa.me/${digitos}?text=${encodeURIComponent(texto)}`
}

export const TEXTO_CONTATO = "Olá! Gostaria de mais informações sobre a Escolinha Itaquerense."
export const TEXTO_NOVIDADES = "Olá! Quero receber as novidades do E.C. Itaquerense pelo WhatsApp."
export const TEXTO_ANUNCIAR = "Olá! Tenho interesse em patrocinar o E.C. Itaquerense e anunciar no site do clube."
