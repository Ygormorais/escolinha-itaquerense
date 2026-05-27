"use server"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function listarReunioes() {
  await requireAuth()
  return db.evento.findMany({
    where: { tipo: "Reunião" },
    orderBy: { data: "desc" },
  })
}

export async function atualizarStatusReuniao(id: number, status: string) {
  await requireAuth()
  await db.evento.update({ where: { id }, data: { status } })
  revalidatePath("/configuracoes/reunioes")
}

export async function criarReuniao(data: { titulo: string; data: Date; horaInicio?: string; horaFim?: string; descricao?: string; status?: string }) {
  await requireAuth()
  await db.evento.create({
    data: { ...data, tipo: "Reunião" },
  })
  revalidatePath("/configuracoes/reunioes")
}
