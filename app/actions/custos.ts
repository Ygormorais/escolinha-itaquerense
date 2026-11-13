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
        data: new Date(`${d.data}T12:00:00`),
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
        data: new Date(`${d.data}T12:00:00`),
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
  await requireAuth(["admin"])
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

/** Chave que identifica um custo recorrente dentro do mês. */
const chaveRecorrente = (c: { categoria: string; descricao: string; fornecedor: string }) =>
  [c.categoria, c.descricao, c.fornecedor].map((t) => t.trim().toLowerCase()).join("|")

/**
 * Gera os custos recorrentes do mês. É idempotente: modelo que já tem custo no mês
 * (mesma categoria, descrição e fornecedor) é pulado, então clicar de novo não duplica.
 */
export async function gerarCustosRecorrentes(mes: string): Promise<{ criados: number; jaExistentes: number } | { error: string }> {
  await requireAuth(["admin"])
  try {
    if (!/^\d{4}-\d{2}$/.test(mes)) return { error: "Mês inválido" }
    const [ano, mesNum] = mes.split("-").map(Number)
    const dataRef = new Date(ano, mesNum - 1, 1)
    const proximoMes = new Date(ano, mesNum, 1)

    const [modelos, doMes] = await Promise.all([
      db.custoRecorrente.findMany({ where: { ativo: true } }),
      db.custo.findMany({
        where: { data: { gte: dataRef, lt: proximoMes } },
        select: { categoria: true, descricao: true, fornecedor: true },
      }),
    ])

    const existentes = new Set(doMes.map(chaveRecorrente))
    const novos = modelos.filter((m) => {
      const k = chaveRecorrente(m)
      if (existentes.has(k)) return false
      existentes.add(k) // dois modelos iguais geram um custo só
      return true
    })

    if (novos.length > 0) {
      await db.custo.createMany({
        data: novos.map((m) => ({
          data: dataRef,
          categoria: m.categoria,
          descricao: m.descricao,
          fornecedor: m.fornecedor,
          valor: m.valor,
          formaPagamento: m.formaPagamento,
          comprovante: false,
        })),
      })
    }

    revalidatePath("/custos")
    revalidatePath("/relatorio")
    revalidatePath("/dashboard")

    return { criados: novos.length, jaExistentes: modelos.length - novos.length }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao gerar custos recorrentes" }
  }
}
