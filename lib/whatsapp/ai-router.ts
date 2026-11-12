// lib/whatsapp/ai-router.ts
import Anthropic from "@anthropic-ai/sdk"
import { db } from "@/lib/db"
import { getSession, createSession, identifySession, appendHistory, blockSession } from "./session"
import { TOOL_DEFINITIONS, executeTool } from "./tools"
import { logger } from "@/lib/logger"
import { getWhatsAppProvider as getProvider } from "./provider"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-5-5"
/** Raciocínio + resposta curta de WhatsApp; com pouco espaço o raciocínio consome tudo e a resposta sai vazia. */
const MAX_TOKENS = 4096
const AVISO_FALHA = "Desculpe, estou com dificuldades técnicas agora. Tente em instantes."
const MSG_ESCALACAO = "Não consegui te ajudar com isso. Um atendente da Escolinha Itaquerense vai entrar em contato em breve."

const SYSTEM_PROMPT = `Você é o assistente virtual da Escolinha Itaquerense de Futebol.
Responda sempre em português brasileiro, de forma clara e amigável.
Você tem acesso a dados reais do aluno vinculado ao responsável identificado.
Use as tools disponíveis para buscar informações antes de responder.
Se não conseguir ajudar, chame escalonar_humano com o motivo.
Nunca invente informações — se não souber, escale para humano.
Quando o responsável perguntar sobre pagamento, pix, boleto, mensalidade, quanto deve, cobrança ou vencimento, SEMPRE chame a tool obter_pix_mensalidade antes de responder.`

function normalizeText(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
}

async function identificarResponsavel(telefone: string, texto: string): Promise<string> {
  const session = await getSession(telefone)

  if (!session) {
    await createSession(telefone)
    return "Olá! Antes de continuar, preciso identificar você. Por favor, informe seu *nome completo* e *CPF* (somente números)."
  }

  if (!session.identificado) {
    const partes = texto.split(/\s+/)
    const cpf = partes.find((p) => /^\d{11}$/.test(p))
    if (!cpf) {
      return "Não consegui identificar seu CPF. Por favor, envie seu *nome completo* seguido do *CPF* (somente números, sem pontos ou traço). Exemplo: João Silva 12345678900"
    }

    const responsavel = await db.responsavel.findFirst({ where: { cpf } })
    if (!responsavel) {
      return "Cadastro não encontrado. Por favor, compareça pessoalmente à Escolinha ou ligue para nós."
    }

    const nomeEnviado = normalizeText(texto.replace(cpf, ""))
    const nomeCadastrado = normalizeText(responsavel.nome)
    const tokens = nomeEnviado.trim().split(/\s+/).filter(t => t.length > 1)
    const matched = tokens.filter(t => nomeCadastrado.includes(t))
    if (tokens.length < 2 || matched.length < 2) {
      return "Por favor, informe seu nome completo (primeiro e último nome) junto com o CPF. Exemplo: João Silva 12345678900"
    }

    await identifySession(telefone, responsavel.id)
    const primeiroNome = responsavel.nome.split(" ")[0]
    const nomesFilhos = await db.aluno.findMany({
      where: { responsavelId: responsavel.id, status: "Ativo" },
      select: { nome: true },
    })
    const filhosTexto = nomesFilhos.length
      ? ` do(s) seu(s) filho(s): ${nomesFilhos.map(a => a.nome).join(", ")}`
      : ""
    return `Olá, ${primeiroNome}! Identificação confirmada${filhosTexto}. Como posso te ajudar? Posso consultar mensalidades, frequência, horários e próximos eventos.`
  }

  return ""
}

const MSG_SEM_IA =
  "Olá! Recebemos sua mensagem. A secretaria da Escolinha Itaquerense vai responder por aqui em breve."

/**
 * Sem ANTHROPIC_API_KEY o chatbot não usa IA: responde uma vez que a secretaria vai atender
 * e bloqueia a conversa (aparece em Escalações para a secretaria responder e reativar).
 */
async function responderSemIA(telefone: string, sessaoExiste: boolean) {
  if (!sessaoExiste) await createSession(telefone)
  await blockSession(telefone)
  await getProvider().sendText({ telefone, mensagem: MSG_SEM_IA })
  await db.whatsAppMensagem.create({
    data: {
      telefone,
      mensagem: MSG_SEM_IA,
      direcao: "outgoing",
      status: "sent",
      instancia: process.env.EVOLUTION_INSTANCE ?? "escolinha",
      origem: "ai-router",
      intent: "escalacao",
    },
  })
  await db.log.create({
    data: {
      tipo: "escalacao_chatbot",
      descricao: `Mensagem de ${telefone} aguardando a secretaria (chatbot sem IA).`,
      meta: JSON.stringify({ motivo: "chatbot sem IA", telefone }),
    },
  })
}

export async function routeMessage(telefone: string, texto: string) {
  const session = await getSession(telefone)

  // Sessão bloqueada (aguarda atendimento humano)
  if (session?.bloqueado) return

  if (!process.env.ANTHROPIC_API_KEY) {
    await responderSemIA(telefone, session != null)
    return
  }

  // Identificação — retorna mensagem se ainda não identificado
  const identificacaoMsg = await identificarResponsavel(telefone, texto)
  if (identificacaoMsg) {
    const provider = getProvider()
    await provider.sendText({ telefone, mensagem: identificacaoMsg })
    await db.whatsAppMensagem.create({
      data: {
        telefone,
        mensagem: identificacaoMsg,
        direcao: "outgoing",
        status: "sent",
        instancia: process.env.EVOLUTION_INSTANCE ?? "escolinha",
        origem: "ai-router",
      },
    })
    // Redact the user message before storing — it may contain CPF (sensitive PII)
    await appendHistory(telefone, "user", "[identificação]")
    await appendHistory(telefone, "assistant", identificacaoMsg)
    return
  }

  // Buscar dados do responsável e aluno vinculado
  const currentSession = await getSession(telefone)
  const responsavel = currentSession?.responsavelId
    ? await db.responsavel.findUnique({
        where: { id: currentSession.responsavelId },
        include: { alunos: { where: { status: "Ativo" }, take: 1 } },
      })
    : null

  const aluno = responsavel?.alunos?.[0]

  // Montar histórico e contexto
  const history: { role: "user" | "assistant"; content: string }[] = JSON.parse(
    currentSession?.historico ?? "[]"
  )
  await appendHistory(telefone, "user", texto)

  const contexto = aluno
    ? `\n\nContexto do responsável identificado:\n- Responsável: ${responsavel?.nome}\n- Aluno: ${aluno.nome} (ID: ${aluno.id})\n- Turma: ${aluno.turma}`
    : ""

  const messages: Anthropic.MessageParam[] = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: texto },
  ]

  const system: Anthropic.TextBlockParam[] = [
    { type: "text", text: SYSTEM_PROMPT + contexto, cache_control: { type: "ephemeral" } },
  ]
  // Esforço baixo: conversa curta de WhatsApp; o Sonnet 5.5 pensa por padrão.
  const pedir = () =>
    anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      output_config: { effort: "low" },
      system,
      tools: TOOL_DEFINITIONS,
      messages,
    })
  /** Chama o modelo e tenta de novo uma vez; null depois de avisar o responsável. */
  const pedirComNovaTentativa = async (etapa: string) => {
    try {
      return await pedir()
    } catch (err) {
      logger.error(`ai-router: Claude API error${etapa}`, { error: String(err) })
      try {
        return await pedir()
      } catch (retryErr) {
        logger.error(`ai-router: retry also failed${etapa}`, { telefone, error: String(retryErr) })
        await getProvider().sendText({ telefone, mensagem: AVISO_FALHA }).catch(() => {})
        return null
      }
    }
  }

  const escalar = async (motivo: string) => {
    await blockSession(telefone)
    await getProvider().sendText({ telefone, mensagem: MSG_ESCALACAO })
    await db.whatsAppMensagem.create({
      data: {
        telefone,
        alunoId: aluno?.id,
        mensagem: MSG_ESCALACAO,
        direcao: "outgoing",
        status: "sent",
        instancia: process.env.EVOLUTION_INSTANCE ?? "escolinha",
        origem: "ai-router",
        intent: "escalacao",
      },
    })
    await db.log.create({
      data: {
        tipo: "escalacao_chatbot",
        descricao: `Responsável ${responsavel?.nome ?? telefone} (${telefone}) precisou de atendimento humano.`,
        meta: JSON.stringify({ motivo, telefone, responsavelId: currentSession?.responsavelId }),
      },
    })
    await appendHistory(telefone, "assistant", MSG_ESCALACAO)
  }

  // Agentic loop com tool use
  let response = await pedirComNovaTentativa("")
  if (!response) return

  let iterations = 0
  while (response.stop_reason === "tool_use" && iterations < 8) {
    iterations++
    const toolUses = response.content.filter((b) => b.type === "tool_use")

    // Check for escalation before executing other tools
    const pedidoEscalacao = toolUses.find((b) => b.type === "tool_use" && b.name === "escalonar_humano")
    if (pedidoEscalacao && pedidoEscalacao.type === "tool_use") {
      await escalar((pedidoEscalacao.input as { motivo: string }).motivo)
      return
    }

    const toolResults: Anthropic.MessageParam = {
      role: "user",
      content: await Promise.all(
        toolUses.map(async (block) => {
          if (block.type !== "tool_use") return { type: "tool_result" as const, tool_use_id: "", content: "" }
          const result = await executeTool(block.name, block.input as Record<string, unknown>, { responsavelId: currentSession?.responsavelId ?? undefined })
          return {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: result,
          }
        })
      ),
    }

    messages.push({ role: "assistant", content: response.content })
    messages.push(toolResults)

    const proxima = await pedirComNovaTentativa(" (tool loop)")
    // Sem resposta: o aviso já foi; a anterior ainda é o tool_use e seguir enviaria texto parcial.
    if (!proxima) return
    response = proxima
  }

  // Recusa dos filtros de segurança: não há resposta para dar, então vai para um atendente.
  if (response.stop_reason === "refusal") {
    await escalar("recusa do modelo")
    return
  }

  // Extract final text response
  const respostaTexto = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n")
    .trim()

  if (!respostaTexto) {
    // Cortada no limite antes de escrever a resposta: avisa em vez de ficar em silêncio.
    if (response.stop_reason === "max_tokens") {
      logger.error("ai-router: resposta cortada sem texto", { telefone })
      await getProvider().sendText({ telefone, mensagem: AVISO_FALHA }).catch(() => {})
    }
    return
  }

  // Send response to responsavel
  const provider = getProvider()
  await provider.sendText({ telefone, mensagem: respostaTexto })

  await db.whatsAppMensagem.create({
    data: {
      telefone,
      alunoId: aluno?.id,
      mensagem: respostaTexto,
      direcao: "outgoing",
      status: "sent",
      instancia: process.env.EVOLUTION_INSTANCE ?? "escolinha",
      origem: "ai-router",
    },
  })

  await appendHistory(telefone, "assistant", respostaTexto)
}
