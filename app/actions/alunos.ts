"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { addMonths, setDate } from "date-fns"
import { registrarLog } from "@/app/actions/log"
import { requireAuth } from "@/lib/auth"
import { getConfig } from "@/lib/config"
import { getWhatsAppProvider } from "@/lib/whatsapp/provider"
import { AlunoSchema } from "@/lib/schemas"

type ActionResult = { success: true } | { error: string }

export async function createAluno(data: {
  nome: string
  dataNascimento: string
  turma: string
  horario: string
  responsavel: string
  telefone: string
  email: string
  dataMatricula: string
  mensalidade: number
  desconto?: number
  status: string
  posicao?: string | null
  observacoes?: string
}): Promise<ActionResult> {
  await requireAuth(["admin", "secretaria"])
  const parsed = AlunoSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  const d = parsed.data
  try {
    const aluno = await db.aluno.create({
      data: {
        nome: d.nome.trim(),
        dataNascimento: new Date(d.dataNascimento),
        turma: d.turma,
        horario: d.horario,
        responsavel: d.responsavel,
        telefone: d.telefone,
        email: d.email,
        dataMatricula: new Date(d.dataMatricula),
        mensalidade: d.mensalidade,
        desconto: data.desconto ?? 0,
        status: d.status,
        posicao: d.posicao ?? null,
        observacoes: d.observacoes ?? null,
      },
    })

    const baseDate = new Date(d.dataMatricula)
    const pagamentos = Array.from({ length: 12 }, (_, i) => {
      const month = addMonths(baseDate, i)
      return {
        alunoId: aluno.id,
        mesReferencia: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
        dataVencimento: setDate(month, 10),
      }
    })
    await db.pagamento.createMany({ data: pagamentos })

    await registrarLog("aluno_novo", `Novo aluno cadastrado — ${d.nome}`, { turma: d.turma })

    const tel = d.telefone?.replace(/\D/g, "")
    if (tel && tel.length >= 8) {
      try {
        const config = getConfig()
        const msg = [
          `Olá ${d.responsavel?.split(" ")[0] ?? "responsável"}!`,
          ``,
          `Bem-vindo(a) à *${config.nome}*! 🎉`,
          ``,
          `O(a) aluno(a) *${d.nome}* foi matriculado(a) na turma *${d.turma}* no horário *${d.horario}*.`,
          ``,
          `Qualquer dúvida, estamos à disposição!`,
        ].join("\n")
        await getWhatsAppProvider().sendText({ telefone: tel, mensagem: msg })
      } catch {
        // boas-vindas é opcional, não falha o cadastro
      }
    }

    revalidatePath("/alunos")
    revalidatePath("/secretaria")
    revalidatePath("/turmas")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao cadastrar aluno" }
  }
}

export async function updateAluno(
  id: number,
  data: {
    nome: string
    dataNascimento: string
    turma: string
    horario: string
    responsavel: string
    telefone: string
    email: string
    dataMatricula: string
    mensalidade: number
    desconto?: number
    status: string
    posicao?: string | null
    observacoes?: string
  }
): Promise<ActionResult> {
  await requireAuth(["admin", "secretaria"])
  const parsed = AlunoSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  const d = parsed.data
  try {
    await db.aluno.update({
      where: { id },
      data: {
        nome: d.nome.trim(),
        dataNascimento: new Date(d.dataNascimento),
        turma: d.turma,
        horario: d.horario,
        responsavel: d.responsavel,
        telefone: d.telefone,
        email: d.email,
        dataMatricula: new Date(d.dataMatricula),
        mensalidade: d.mensalidade,
        desconto: d.desconto ?? 0,
        status: d.status,
        posicao: d.posicao ?? null,
        observacoes: d.observacoes ?? null,
      },
    })

    await registrarLog("aluno_editado", `Aluno atualizado — ${d.nome}`, { turma: d.turma })
    revalidatePath("/alunos")
    revalidatePath("/secretaria")
    revalidatePath("/turmas")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao atualizar aluno" }
  }
}

export async function inativarAluno(id: number): Promise<ActionResult> {
  await requireAuth(["admin", "secretaria"])
  try {
    const aluno = await db.aluno.update({ where: { id }, data: { status: "Inativo" }, select: { nome: true, turma: true } })
    await registrarLog("aluno_inativo", `Aluno inativado — ${aluno.nome}`, { turma: aluno.turma })
    revalidatePath("/alunos")
    revalidatePath("/secretaria")
    revalidatePath("/turmas")
    revalidatePath("/inadimplencia")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao inativar aluno" }
  }
}

export async function salvarFichaMedica(
  id: number,
  data: {
    tipoSanguineo?: string
    alergias?: string
    condicaoSaude?: string
    contatoEmergenciaNome?: string
    contatoEmergenciaTel?: string
    contatoEmergenciaParentesco?: string
  }
): Promise<ActionResult> {
  await requireAuth(["admin", "secretaria"])
  try {
    await db.aluno.update({
      where: { id },
      data: {
        tipoSanguineo: data.tipoSanguineo?.trim() || null,
        alergias: data.alergias?.trim() || null,
        condicaoSaude: data.condicaoSaude?.trim() || null,
        contatoEmergenciaNome: data.contatoEmergenciaNome?.trim() || null,
        contatoEmergenciaTel: data.contatoEmergenciaTel?.trim() || null,
        contatoEmergenciaParentesco: data.contatoEmergenciaParentesco?.trim() || null,
      },
    })
    revalidatePath(`/alunos/${id}`)
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao salvar ficha médica" }
  }
}

export async function reativarAluno(id: number): Promise<ActionResult> {
  await requireAuth(["admin", "secretaria"])
  try {
    const aluno = await db.aluno.update({ where: { id }, data: { status: "Ativo" }, select: { nome: true, turma: true } })
    await registrarLog("aluno_reativo", `Aluno reativado — ${aluno.nome}`, { turma: aluno.turma })
    revalidatePath("/alunos")
    revalidatePath("/secretaria")
    revalidatePath("/turmas")
    revalidatePath("/inadimplencia")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao reativar aluno" }
  }
}
