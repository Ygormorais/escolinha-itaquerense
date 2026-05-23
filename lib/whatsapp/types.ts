export type WhatsAppMessageStatus =
  | "sent"
  | "delivered"
  | "read"
  | "failed"

export type WhatsAppMessageDirection =
  | "outgoing"
  | "incoming"

export type WhatsAppMessageType =
  | "text"
  | "template"
  | "image"
  | "document"

export interface WhatsAppMessage {
  id: string
  alunoId?: number
  telefone: string
  mensagem: string
  tipo: WhatsAppMessageType
  direcao: WhatsAppMessageDirection
  status: WhatsAppMessageStatus
  instancia: string
  origem: string
  createdAt: Date
}

export interface SendTextParams {
  telefone: string
  mensagem: string
}

export interface SendTemplateParams {
  telefone: string
  template: string
  params?: string[]
}

export interface WhatsAppWebhookPayload {
  event: "MESSAGE" | "MESSAGE_STATUS" | "CONNECTION"
  instance: string
  data: {
    key: { remoteJid: string; fromMe: boolean; id: string }
    message?: { conversation?: string; extendedTextMessage?: { text: string } }
    messageType?: string
    pushName?: string
    status?: string
  }
}

export interface WhatsAppProvider {
  sendText(params: SendTextParams): Promise<{ success: boolean; messageId?: string }>
  sendTemplate(params: SendTemplateParams): Promise<{ success: boolean; messageId?: string }>
  getStatus(): Promise<{ connected: boolean; instance: string }>
}
