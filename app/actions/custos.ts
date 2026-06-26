"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { registrarLog } from "@/app/actions/log"
import { CustoSchema } from "@/lib/schemas"

type ActionResult = { success: true } | { error: string }

export async function createCusto(data: {
  data: string
  categoria: string
  descricao: string
  fornecedor: string
  valor: number
  formaPagamento: string
  comprovante: boolean
  observacoes?: string
}): Promise<ActionResult> {
  await requireAuth(["admin"])
  const parsed = CustoSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  try {
    const d = parsed.data
    await db.custo.create({
      data: {
        data: new Date(d.data),
        categoria: d.categoria,
        descricao: d.descricao,
        fornecedor: d.fornecedor,
        valor: d.valor,
        formaPagamento: d.formaPagamento,
        comprovante: d.comprovante,
        observacoes: d.observacoes ?? null,
      },
    })
    await registrarLog("custo_novo", `Custo registrado — ${d.descricao}`, { categoria: d.categoria, valor: d.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) })
    revalidatePath("/custos")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao criar custo" }
  }
}

export async function updateCusto(id: number, data: {
  data: string
  categoria: string
  descricao: string
  fornecedor: string
  valor: number
  formaPagamento: string
  comprovante: boolean
  observacoes?: string
}): Promise<ActionResult> {
  await requireAuth(["admin"])
  const parsed = CustoSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  try {
    const d = parsed.data
    await db.custo.update({
      where: { id },
      data: {
        data: new Date(d.data),
        categoria: d.categoria,
        descricao: d.descricao,
        fornecedor: d.fornecedor,
        valor: d.valor,
        formaPagamento: d.formaPagamento,
        comprovante: d.comprovante,
        observacoes: d.observacoes ?? null,
      },
    })
    revalidatePath("/custos")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao atualizar custo" }
  }
}

export async function deleteCusto(id: number): Promise<ActionResult> {
  await requireAuth(["admin"])
  try {
    await db.custo.delete({ where: { id } })
    revalidatePath("/custos")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao excluir custo" }
  }
}

export async function getCustosRecorrentes() {
  return db.custoRecorrente.findMany({ orderBy: { descricao: "asc" } })
}

export async function createCustoRecorrente(data: {
  categoria: string
  descricao: string
  fornecedor: string
  valor: number
  formaPagamento: string
}): Promise<ActionResult> {
  await requireAuth(["admin"])
  if (!Number.isFinite(data.valor) || data.valor <= 0) return { error: "Valor inválido" }
  try {
    await db.custoRecorrente.create({ data })
    revalidatePath("/custos")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao criar custo recorrente" }
  }
}

export async function updateCustoRecorrente(id: number, data: {
  categoria: string
  descricao: string
  fornecedor: string
  valor: number
  formaPagamento: string
  ativo: boolean
}): Promise<ActionResult> {
  await requireAuth(["admin"])
  if (!Number.isFinite(data.valor) || data.valor <= 0) return { error: "Valor inválido" }
  try {
    await db.custoRecorrente.update({ where: { id }, data })
    revalidatePath("/custos")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao atualizar custo recorrente" }
  }
}

export async function deleteCustoRecorrente(id: number): Promise<ActionResult> {
  await requireAuth(["admin"])
  try {
    await db.custoRecorrente.delete({ where: { id } })
    revalidatePath("/custos")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao excluir custo recorrente" }
  }
}

export async function gerarCustosRecorrentes(mes: string): Promise<{ criados: number } | { error: string }> {
  try {
    const [ano, mesNum] = mes.split("-").map(Number)
    const dataRef = new Date(ano, mesNum - 1, 1)

    const modelos = await db.custoRecorrente.findMany({ where: { ativo: true } })

    await db.custo.createMany({
      data: modelos.map((m) => ({
        data: dataRef,
        categoria: m.categoria,
        descricao: m.descricao,
        fornecedor: m.fornecedor,
        valor: m.valor,
        formaPagamento: m.formaPagamento,
        comprovante: false,
      })),
    })

    revalidatePath("/custos")
    revalidatePath("/relatorio")
    revalidatePath("/dashboard")

    return { criados: modelos.length }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao gerar custos recorrentes" }
  }
}
