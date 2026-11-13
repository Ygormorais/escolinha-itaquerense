"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { registrarLog } from "@/app/actions/log"
import { dataValida } from "@/lib/utils"

/** Datas "yyyy-MM-dd" viram meia-noite UTC, como o resto do sistema. */
const paraUtc = (s: string) => new Date(`${s}T00:00:00.000Z`)

export async function criarBloqueioQuadra(input: { dataInicio: string; dataFim?: string; motivo: string }) {
  await requireAuth(["admin", "secretaria"])
  const fim = input.dataFim || input.dataInicio
  if (!dataValida(input.dataInicio) || !dataValida(fim)) throw new Error("Data inválida")
  if (fim < input.dataInicio) throw new Error("A data final não pode ser anterior à inicial")
  const motivo = input.motivo.trim()
  if (!motivo) throw new Error("Informe o motivo do bloqueio")
  if (motivo.length > 200) throw new Error("Motivo muito longo")

  await db.bloqueioQuadra.create({
    data: { dataInicio: paraUtc(input.dataInicio), dataFim: paraUtc(fim), motivo },
  })
  await registrarLog("bloqueio_quadra_criado", `Quadra bloqueada — ${motivo}`, { inicio: input.dataInicio, fim })
  revalidatePath("/agenda")
}

export async function removerBloqueioQuadra(id: number) {
  await requireAuth(["admin", "secretaria"])
  const b = await db.bloqueioQuadra.findUnique({ where: { id } })
  if (!b) return
  await db.bloqueioQuadra.delete({ where: { id } })
  await registrarLog("bloqueio_quadra_removido", `Bloqueio da quadra removido — ${b.motivo}`, { id })
  revalidatePath("/agenda")
}
