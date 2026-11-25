import { buildWhatsAppHref } from "@/lib/browser-safety"

/**
 * Modelos de mensagem para o WhatsApp click-to-chat da secretaria: abrem a conversa com o texto
 * pronto, sem depender do robô (Evolution) estar conectado. Variáveis entre chaves, ex.: {aluno}.
 */

export type ModeloId = "cobranca" | "convocacao" | "chuva" | "vaga" | "atencao" | "satisfacao" | "experimental"

export type ModeloMensagem = { id: ModeloId; titulo: string; descricao: string; padrao: string }

export const MODELOS_MENSAGEM: ModeloMensagem[] = [
  {
    id: "cobranca",
    titulo: "Cobrança amigável",
    descricao: "Lembrete cordial de mensalidade em aberto.",
    padrao:
      "Olá, {responsavel}! Tudo bem? Aqui é da {clube}. Notamos que a mensalidade de {aluno} (vencimento {vencimento}, {valor}) ainda está em aberto. Se já pagou, desconsidere. Se precisar de uma segunda via ou combinar outra data, é só responder esta mensagem.",
  },
  {
    id: "convocacao",
    titulo: "Convocação para jogo",
    descricao: "Avisa a família da convocação e pede a confirmação.",
    padrao:
      "Olá, {responsavel}! {aluno} foi convocado(a) para o jogo contra {adversario}, dia {data} às {hora}, local: {local}. Confirme a presença pelo portal: {link}",
  },
  {
    id: "chuva",
    titulo: "Aviso de chuva",
    descricao: "Cancelamento ou mudança de treino por mau tempo.",
    padrao:
      "Atenção, famílias da turma {turma}! Por causa da chuva, o treino de {data} está cancelado. Avisaremos pelo portal e por aqui quando voltarmos. Obrigado pela compreensão!",
  },
  {
    id: "vaga",
    titulo: "Oferta de vaga",
    descricao: "Chama a próxima família da lista de espera.",
    padrao:
      "Olá, {responsavel}! Abriu uma vaga na turma {turma} da {clube} para {aluno}. Para garantir, responda até {prazo}. Depois desse prazo, a vaga segue para a próxima família da lista.",
  },
  {
    id: "atencao",
    titulo: "Contato acolhedor",
    descricao: "Conversa com a família que está se afastando.",
    padrao:
      "Olá, {responsavel}! Aqui é da {clube}. {motivo} Está tudo bem com {aluno}? Queremos ajudar no que for preciso; é só responder esta mensagem.",
  },
  {
    id: "satisfacao",
    titulo: "Retorno da pesquisa de satisfação",
    descricao: "Conversa acolhedora com quem deu nota baixa na pesquisa.",
    padrao:
      "Olá, {responsavel}! Aqui é da {clube}. Obrigado por responder à nossa pesquisa de satisfação. Queremos muito entender como melhorar a experiência da sua família com a gente. Pode nos contar mais? Responda esta mensagem ou, se preferir, ligamos num horário bom para você.",
  },
  {
    id: "experimental",
    titulo: "Aula experimental",
    descricao: "Confirma ou lembra a aula experimental de quem se inscreveu pelo site.",
    padrao:
      "Olá, {responsavel}! Aqui é da {clube}. A aula experimental de {aluno} está marcada para {data}, às {hora}, turma {turma}, em {local}. Chegue uns 10 minutos antes, com roupa de treino e garrafinha de água. Se não puder vir, é só responder esta mensagem.",
  },
]

const POR_ID = new Map(MODELOS_MENSAGEM.map((m) => [m.id, m]))

export type ModelosPersonalizados = Partial<Record<ModeloId, string>>

/** Texto do modelo: o personalizado nas configurações (se não vazio) ou o padrão. */
export function textoDoModelo(id: ModeloId, personalizados?: ModelosPersonalizados | null): string {
  const custom = personalizados?.[id]?.trim()
  return custom ? custom : POR_ID.get(id)!.padrao
}

/** Nomes das variáveis usadas no texto, sem repetição e na ordem em que aparecem. */
export function variaveisDoModelo(texto: string): string[] {
  const nomes = [...texto.matchAll(/\{([a-zA-Z_]+)\}/g)].map((m) => m[1])
  return [...new Set(nomes)]
}

/** Troca {variavel} pelo valor. Variável sem valor continua visível no texto para ninguém enviar em branco. */
export function preencherModelo(texto: string, valores: Record<string, string | null | undefined>): string {
  return texto.replace(/\{([a-zA-Z_]+)\}/g, (inteiro, nome: string) => {
    const valor = valores[nome]
    return valor != null && valor.trim() !== "" ? valor.trim() : inteiro
  })
}

/**
 * Telefone do cadastro (com ou sem DDD/55, máscara, espaços) → dígitos com DDI 55, ou null se
 * não parecer um celular/fixo brasileiro. Não cai no número padrão do clube como buildWhatsAppHref.
 */
export function normalizarTelefoneBR(telefone: string | null | undefined): string | null {
  const digitos = (telefone ?? "").replace(/\D/g, "")
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) return digitos
  return null
}

/** Link wa.me para a conversa com o telefone e a mensagem prontos; null se o telefone for inválido. */
export function whatsappHrefPara(telefone: string | null | undefined, mensagem: string): string | null {
  const numero = normalizarTelefoneBR(telefone)
  return numero ? buildWhatsAppHref(numero, mensagem) : null
}
