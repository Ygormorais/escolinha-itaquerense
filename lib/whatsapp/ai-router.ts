// lib/whatsapp/ai-router.ts
import Anthropic from "@anthropic-ai/sdk"
import { db } from "@/lib/db"
import { getSession, createSession, identifySession, appendHistory, blockSession } from "./session"
import { TOOL_DEFINITIONS, executeTool } from "./tools"
import { getWhatsAppProvider as getProvider } from "./provider"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Você é o assistente virtual da Escolinha Itaquerense de Futebol.
Responda sempre em português brasileiro, de forma clara e amigável.
Você tem acesso a dados reais do aluno vinculado ao responsável identificado.
Use as tools disponíveis para buscar informações antes de responder.
Se não conseguir ajudar, chame escalonar_humano com o motivo.
Nunca invente informações — se não souber, escale para humano.`

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
    if (!nomeCadastrado.includes(nomeEnviado.split(" ")[0])) {
      return "Nome não confere com o CPF informado. Tente novamente."
    }

    await identifySession(telefone, responsavel.id)
    return `Olá, ${responsavel.nome.split(" ")[0]}! Identificação confirmada. Como posso te ajudar? Posso consultar mensalidades, frequência, horários e próximos eventos do seu filho(a).`
  }

  return ""
}

export async function routeMessage(telefone: string, texto: string) {
  const session = await getSession(telefone)

  // Sessão bloqueada (aguarda atendimento humano)
  if (session?.bloqueado) return

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
    await appendHistory(telefone, "user", texto)
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

  // Agentic loop com tool use
  let response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT + contexto,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: TOOL_DEFINITIONS,
    messages,
  })

  while (response.stop_reason === "tool_use") {
    const toolUses = response.content.filter((b) => b.type === "tool_use")

    // Check for escalation before executing other tools
    const escalar = toolUses.find((b) => b.type === "tool_use" && b.name === "escalonar_humano")
    if (escalar && escalar.type === "tool_use") {
      const motivo = (escalar.input as { motivo: string }).motivo
      await blockSession(telefone)
      const msgEscalacao =
        "Não consegui te ajudar com isso. Um atendente da Escolinha Itaquerense vai entrar em contato em breve."
      const provider = getProvider()
      await provider.sendText({ telefone, mensagem: msgEscalacao })
      await db.whatsAppMensagem.create({
        data: {
          telefone,
          alunoId: aluno?.id,
          mensagem: msgEscalacao,
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
      await appendHistory(telefone, "assistant", msgEscalacao)
      return
    }

    const toolResults: Anthropic.MessageParam = {
      role: "user",
      content: await Promise.all(
        toolUses.map(async (block) => {
          if (block.type !== "tool_use") return { type: "tool_result" as const, tool_use_id: "", content: "" }
          const result = await executeTool(block.name, block.input as Record<string, unknown>)
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

    response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT + contexto,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: TOOL_DEFINITIONS,
      messages,
    })
  }

  // Extract final text response
  const respostaTexto = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n")
    .trim()

  if (!respostaTexto) return

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
