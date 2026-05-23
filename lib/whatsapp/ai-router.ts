import { db } from "@/lib/db"

type IntentClassification = {
  intent: "cobranca" | "frequencia" | "matricula" | "informacao" | "desconhecido"
  confidence: number
}

export async function classifyIntent(mensagem: string): Promise<IntentClassification> {
  const msg = mensagem.toLowerCase().trim()

  if (/mensalidade|pagamento|pix|boleto|devo|quanto|cobrança|atrasado/i.test(msg)) {
    return { intent: "cobranca", confidence: 0.8 }
  }

  if (/falta|faltei|aula|treino|posso ir|horário|frequência/i.test(msg)) {
    return { intent: "frequencia", confidence: 0.8 }
  }

  if (/matrícula|inscrever|entrar|novo aluno|quero|cadastro/i.test(msg)) {
    return { intent: "matricula", confidence: 0.8 }
  }

  if (/uniformes|camisa|short|chuteira|material|contato|telefone|endereço/i.test(msg)) {
    return { intent: "informacao", confidence: 0.7 }
  }

  return { intent: "desconhecido", confidence: 0 }
}

export async function routeMessage(alunoId: number, mensagem: string, telefone: string) {
  const classification = await classifyIntent(mensagem)

  await db.whatsAppMensagem.create({
    data: {
      alunoId,
      telefone,
      mensagem,
      direcao: "incoming",
      status: "received",
      instancia: process.env.EVOLUTION_INSTANCE ?? "escolinha",
      origem: "ai-router",
      intent: classification.intent,
      confidence: classification.confidence,
    },
  })

  return classification
}
