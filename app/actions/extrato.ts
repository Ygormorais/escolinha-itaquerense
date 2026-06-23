"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { parseExtratoCSV } from "@/lib/extrato-csv"
import { requireAuth } from "@/lib/auth"

export async function importarExtrato(texto: string, nomeArquivo: string) {
  await requireAuth(["admin", "secretaria"])
  const result = parseExtratoCSV(texto, nomeArquivo)
  if (result.erro) return { error: result.erro }
  if (result.lancamentos.length === 0) return { error: "Nenhum lançamento encontrado." }

  let importados = 0
  let ignorados = 0

  for (const l of result.lancamentos) {
    const existente = await db.lancamentoBancario.findFirst({
      where: { data: l.data, descricao: l.descricao, valor: l.valor },
    })
    if (existente) { ignorados++; continue }

    await db.lancamentoBancario.create({
      data: {
        data: l.data,
        descricao: l.descricao,
        valor: l.valor,
        tipo: l.tipo,
        saldo: l.saldo ?? null,
        banco: result.banco,
        arquivo: nomeArquivo,
        status: "novo",
      },
    })
    importados++
  }

  revalidatePath("/caixa/extrato")
  return { importados, ignorados, banco: result.banco }
}

export async function getLancamentos(filtros?: {
  tipo?: string
  status?: string
  mes?: string
}) {
  const where: Record<string, unknown> = {}

  if (filtros?.tipo && filtros.tipo !== "todos") {
    where.tipo = filtros.tipo
  }
  if (filtros?.status && filtros.status !== "todos") {
    where.status = filtros.status
  }
  if (filtros?.mes) {
    const [ano, mesNum] = filtros.mes.split("-").map(Number)
    where.data = {
      gte: new Date(ano, mesNum - 1, 1),
      lt: new Date(ano, mesNum, 1),
    }
  }

  return db.lancamentoBancario.findMany({ where, orderBy: { data: "desc" }, select: { id: true, data: true, descricao: true, valor: true, tipo: true, saldo: true, banco: true, arquivo: true, status: true, categoria: true } })
}

export async function getResumoExtrato(mes?: string) {
  const where: Record<string, unknown> = {}
  if (mes) {
    const [ano, mesNum] = mes.split("-").map(Number)
    where.data = { gte: new Date(ano, mesNum - 1, 1), lt: new Date(ano, mesNum, 1) }
  }

  const [aggEntradas, aggSaidas, total] = await Promise.all([
    db.lancamentoBancario.aggregate({ where: { ...where, tipo: "entrada" }, _sum: { valor: true }, _count: true }),
    db.lancamentoBancario.aggregate({ where: { ...where, tipo: "saida" }, _sum: { valor: true }, _count: true }),
    db.lancamentoBancario.count({ where }),
  ])

  return {
    totalEntradas: aggEntradas._sum.valor ?? 0,
    totalSaidas: Math.abs(aggSaidas._sum.valor ?? 0),
    saldo: (aggEntradas._sum.valor ?? 0) + (aggSaidas._sum.valor ?? 0),
    qtdEntradas: aggEntradas._count,
    qtdSaidas: aggSaidas._count,
    total,
  }
}

export async function ignorarLancamento(id: number) {
  await requireAuth(["admin", "secretaria"])
  await db.lancamentoBancario.update({ where: { id }, data: { status: "ignorado" } })
  revalidatePath("/caixa/extrato")
}

export async function deletarLancamento(id: number) {
  await requireAuth(["admin", "secretaria"])
  await db.lancamentoBancario.delete({ where: { id } })
  revalidatePath("/caixa/extrato")
}

export async function categorizarLancamento(id: number, categoria: string) {
  await requireAuth(["admin", "secretaria"])
  await db.lancamentoBancario.update({ where: { id }, data: { categoria: categoria || null } })
  revalidatePath("/caixa/extrato")
}
