"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { addMonths, setDate } from "date-fns"
import { registrarLog } from "@/app/actions/log"
import { requireAuth } from "@/lib/auth"
import { getConfig } from "@/lib/config"
import { dataValida } from "@/lib/utils"
import { getWhatsAppProvider } from "@/lib/whatsapp/provider"

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
  if (!data.nome?.trim()) return { error: "Nome do aluno é obrigatório" }
  const mensalidade = Number(data.mensalidade)
  if (!Number.isFinite(mensalidade) || mensalidade < 0) return { error: "Mensalidade inválida" }
  if (!dataValida(data.dataNascimento)) return { error: "Data de nascimento inválida" }
  if (!dataValida(data.dataMatricula)) return { error: "Data de matrícula inválida" }
  try {
    const aluno = await db.aluno.create({
      data: {
        nome: data.nome.trim(),
        dataNascimento: new Date(data.dataNascimento),
        turma: data.turma,
        horario: data.horario,
        responsavel: data.responsavel,
        telefone: data.telefone,
        email: data.email,
        dataMatricula: new Date(data.dataMatricula),
        mensalidade: data.mensalidade,
        desconto: data.desconto ?? 0,
        status: data.status,
        posicao: data.posicao ?? null,
        observacoes: data.observacoes ?? null,
      },
    })

    const baseDate = new Date(data.dataMatricula)
    const pagamentos = Array.from({ length: 12 }, (_, i) => {
      const month = addMonths(baseDate, i)
      return {
        alunoId: aluno.id,
        mesReferencia: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
        dataVencimento: setDate(month, 10),
      }
    })
    await db.pagamento.createMany({ data: pagamentos })

    await registrarLog("aluno_novo", `Novo aluno cadastrado — ${data.nome}`, { turma: data.turma })

    const tel = data.telefone?.replace(/\D/g, "")
    if (tel && tel.length >= 8) {
      try {
        const config = getConfig()
        const msg = [
          `Olá ${data.responsavel?.split(" ")[0] ?? "responsável"}!`,
          ``,
          `Bem-vindo(a) à *${config.nome}*! 🎉`,
          ``,
          `O(a) aluno(a) *${data.nome}* foi matriculado(a) na turma *${data.turma}* no horário *${data.horario}*.`,
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
    revalidatePath("/")
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
  if (!data.nome?.trim()) return { error: "Nome do aluno é obrigatório" }
  const mensalidade = Number(data.mensalidade)
  if (!Number.isFinite(mensalidade) || mensalidade < 0) return { error: "Mensalidade inválida" }
  if (!dataValida(data.dataNascimento)) return { error: "Data de nascimento inválida" }
  if (!dataValida(data.dataMatricula)) return { error: "Data de matrícula inválida" }
  try {
    await db.aluno.update({
      where: { id },
      data: {
        nome: data.nome.trim(),
        dataNascimento: new Date(data.dataNascimento),
        turma: data.turma,
        horario: data.horario,
        responsavel: data.responsavel,
        telefone: data.telefone,
        email: data.email,
        dataMatricula: new Date(data.dataMatricula),
        mensalidade: data.mensalidade,
        desconto: data.desconto ?? 0,
        status: data.status,
        posicao: data.posicao ?? null,
        observacoes: data.observacoes ?? null,
      },
    })

    await registrarLog("aluno_editado", `Aluno atualizado — ${data.nome}`, { turma: data.turma })
    revalidatePath("/alunos")
    revalidatePath("/secretaria")
    revalidatePath("/turmas")
    revalidatePath("/")
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
    revalidatePath("/")
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
    revalidatePath("/")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao reativar aluno" }
  }
}
