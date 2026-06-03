// lib/whatsapp/tools.ts
import { db } from "@/lib/db"
import type Anthropic from "@anthropic-ai/sdk"

export const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: "buscar_pagamentos",
    description: "Busca as mensalidades do aluno: status (pago/pendente), vencimento e valor.",
    input_schema: {
      type: "object",
      properties: {
        alunoId: { type: "number", description: "ID do aluno no banco" },
      },
      required: ["alunoId"],
    },
  },
  {
    name: "buscar_frequencia",
    description: "Busca presenças e faltas do aluno no período informado.",
    input_schema: {
      type: "object",
      properties: {
        alunoId: { type: "number", description: "ID do aluno no banco" },
        periodo: {
          type: "string",
          enum: ["mes_atual", "ultimo_mes"],
          description: "Período a consultar. Padrão: mes_atual.",
        },
      },
      required: ["alunoId"],
    },
  },
  {
    name: "buscar_eventos",
    description: "Busca os próximos 5 eventos, jogos ou treinos da turma.",
    input_schema: {
      type: "object",
      properties: {
        turma: { type: "string", description: "Nome da turma, ex: Sub-13" },
      },
      required: ["turma"],
    },
  },
  {
    name: "buscar_turma",
    description: "Busca informações e horários da turma do aluno.",
    input_schema: {
      type: "object",
      properties: {
        turma: { type: "string", description: "Nome da turma, ex: Sub-13" },
      },
      required: ["turma"],
    },
  },
  {
    name: "escalonar_humano",
    description:
      "Chama quando não consegue responder. Notifica o admin e para de responder automaticamente.",
    input_schema: {
      type: "object",
      properties: {
        motivo: { type: "string", description: "Motivo pelo qual não conseguiu ajudar" },
      },
      required: ["motivo"],
    },
  },
  {
    name: "buscar_uniformes",
    description: "Busca os uniformes e taxas associadas ao aluno.",
    input_schema: {
      type: "object",
      properties: {
        alunoId: { type: "number", description: "ID do aluno" },
      },
      required: ["alunoId"],
    },
  },
  {
    name: "encerrar_atendimento",
    description: "Finaliza o atendimento educadamente quando o responsável indicar que não precisa mais de ajuda.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "buscar_campeonatos",
    description: "Busca campeonatos que o aluno está inscrito, com status e datas.",
    input_schema: {
      type: "object",
      properties: {
        alunoId: { type: "number", description: "ID do aluno no banco" },
      },
      required: ["alunoId"],
    },
  },
  {
    name: "buscar_comunicados",
    description: "Busca os últimos comunicados enviados ao responsável sobre o aluno.",
    input_schema: {
      type: "object",
      properties: {
        alunoId: { type: "number", description: "ID do aluno no banco" },
      },
      required: ["alunoId"],
    },
  },
  {
    name: "buscar_horarios",
    description: "Retorna os horários de treino e contato da escolinha.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "buscar_carteirinha",
    description: "Retorna informações da carteirinha digital do aluno (matrícula, turma, validade).",
    input_schema: {
      type: "object",
      properties: {
        alunoId: { type: "number", description: "ID do aluno no banco" },
      },
      required: ["alunoId"],
    },
  },
]

type ToolInput = Record<string, unknown>

export async function executeTool(name: string, input: ToolInput): Promise<string> {
  try {
    switch (name) {
      case "buscar_pagamentos": {
        const alunoId = input.alunoId as number
        const pagamentos = await db.pagamento.findMany({
          where: { alunoId },
          orderBy: { dataVencimento: "desc" },
          take: 6,
        })
        if (!pagamentos.length) return "Nenhuma mensalidade encontrada para este aluno."
        return pagamentos
          .map((p) => {
            const status = p.dataPagamento ? "✅ Pago" : "⏳ Pendente"
            const venc = p.dataVencimento.toLocaleDateString("pt-BR")
            const valor = p.valorRecebido ?? 0
            return `• ${p.mesReferencia} — ${status} — Vencimento: ${venc} — R$ ${valor.toFixed(2)}`
          })
          .join("\n")
      }

      case "buscar_frequencia": {
        const alunoId = input.alunoId as number
        const periodo = (input.periodo as string) ?? "mes_atual"
        const now = new Date()
        const start = new Date(now)
        start.setDate(1)
        if (periodo !== "mes_atual") start.setMonth(start.getMonth() - 1)
        start.setHours(0, 0, 0, 0)

        const end = new Date(start)
        end.setMonth(end.getMonth() + 1)
        end.setDate(0)
        end.setHours(23, 59, 59, 999)

        const frequencias = await db.frequencia.findMany({
          where: { alunoId, data: { gte: start, lte: end } },
        })
        const total = frequencias.length
        const presencas = frequencias.filter((f) => f.presenca === "presente").length
        const faltas = total - presencas
        const pct = total > 0 ? Math.round((presencas / total) * 100) : 0
        const label = periodo === "mes_atual" ? "este mês" : "mês passado"
        return `Frequência ${label}: ${presencas} presenças, ${faltas} faltas (${pct}% de presença).`
      }

      case "buscar_eventos": {
        const turma = input.turma as string
        const eventos = await db.evento.findMany({
          where: {
            data: { gte: new Date() },
            turmas: { not: null },
            OR: [{ turmas: { contains: turma } }, { turmas: "Todas" }],
          },
          orderBy: { data: "asc" },
          take: 5,
        })
        if (!eventos.length) return "Nenhum evento programado para a turma nos próximos dias."
        return eventos
          .map((e) => {
            const data = e.data.toLocaleDateString("pt-BR")
            const hora = e.horaInicio ?? ""
            return `• ${e.tipo} — ${e.titulo} — ${data}${hora ? ` às ${hora}` : ""}${e.local ? ` — ${e.local}` : ""}`
          })
          .join("\n")
      }

      case "buscar_turma": {
        const turma = input.turma as string
        const alunos = await db.aluno.findMany({
          where: { turma, status: "Ativo" },
          select: { horario: true },
          take: 1,
        })
        if (!alunos.length) return `Nenhuma informação encontrada para a turma ${turma}.`
        return `Turma: ${turma}\nHorário: ${alunos[0].horario}`
      }

      // Escalation is handled in ai-router.ts before executeTool is called for this tool.
      // This branch should never be reached in practice.
      case "escalonar_humano":
        return ""

      case "buscar_uniformes": {
        const alunoId = input.alunoId as number
        const uniformes = await db.uniforme.findMany({
          where: { alunoId },
        })
        if (!uniformes.length) return "Nenhum uniforme cadastrado para este aluno."
        return uniformes
          .map((u) => {
            const status = u.entregue ? "✅ Entregue" : "⏳ Pendente"
            return `• ${u.item}${u.tamanho ? ` (Tam. ${u.tamanho})` : ""} — ${status}`
          })
          .join("\n")
      }

      case "encerrar_atendimento":
        return "Foi um prazer ajudar! Se precisar de algo é só chamar. Tenha um ótimo dia! 😊"

      case "buscar_campeonatos": {
        const alunoId = input.alunoId as number
        const inscricoes = await db.inscricaoCampeonato.findMany({
          where: { alunoId },
          include: { campeonato: true },
        })
        if (!inscricoes.length) return "O aluno não está inscrito em nenhum campeonato no momento."
        return inscricoes.map((i) => {
          const c = i.campeonato
          return `• ${c.nome} — ${c.status} — Início: ${c.dataInicio.toLocaleDateString("pt-BR")}${c.dataFim ? ` — Fim: ${c.dataFim.toLocaleDateString("pt-BR")}` : ""}`
        }).join("\n")
      }

      case "buscar_comunicados": {
        const alunoId = input.alunoId as number
        const comunicados = await db.whatsAppMensagem.findMany({
          where: { alunoId, origem: "comunicado", direcao: "outgoing" },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
        if (!comunicados.length) return "Nenhum comunicado recente encontrado para este aluno."
        return comunicados.map((c) =>
          `• ${c.mensagem.slice(0, 100)}${c.mensagem.length > 100 ? "..." : ""} — ${c.createdAt.toLocaleDateString("pt-BR")}`
        ).join("\n")
      }

      case "buscar_horarios": {
        const config = await import("@/lib/config").then(m => m.getConfig())
        return `Horários de treino:\n• Segunda a Sexta: 8h às 18h\n• Sábados: 8h às 12h\n\nEndereço: ${config.endereco}${config.cidade ? `, ${config.cidade}` : ""}${config.telefone ? `\n\nTelefone: ${config.telefone}` : ""}`
      }

      case "buscar_carteirinha": {
        const alunoId = input.alunoId as number
        const aluno = await db.aluno.findUnique({
          where: { id: alunoId },
          select: { id: true, nome: true, turma: true, dataNascimento: true },
        })
        if (!aluno) return "Aluno não encontrado."
        const matricula = String(aluno.id).padStart(6, "0")
        const nasc = aluno.dataNascimento.toLocaleDateString("pt-BR")
        return `Carteirinha digital de ${aluno.nome}:\n• Matrícula: ${matricula}\n• Turma: ${aluno.turma}\n• Nascimento: ${nasc}\n• Validade: ${new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" })}`
      }

      default:
        return "Tool desconhecida."
    }
  } catch (error) {
    console.error(`[Tools] executeTool error for ${name}:`, error)
    return "Desculpe, ocorreu um erro ao buscar as informações. Tente novamente."
  }
}
