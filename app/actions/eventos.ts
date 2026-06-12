"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { registrarLog } from "@/app/actions/log"
import { dataValida } from "@/lib/utils"

export async function getEventosMes(ano: number, mes: number) {
  const inicio = new Date(ano, mes - 1, 1)
  const fim = new Date(ano, mes, 0, 23, 59, 59)
  return db.evento.findMany({
    where: { data: { gte: inicio, lte: fim } },
    orderBy: { data: "asc" },
  })
}

export async function criarEvento(data: {
  titulo: string
  tipo: string
  data: string
  horaInicio?: string
  horaFim?: string
  local?: string
  turmas?: string
  descricao?: string
}) {
  await requireAuth()
  if (!dataValida(data.data)) throw new Error("Data inválida")
  await db.evento.create({
    data: {
      titulo: data.titulo,
      tipo: data.tipo,
      data: new Date(data.data + "T12:00:00"),
      horaInicio: data.horaInicio || null,
      horaFim: data.horaFim || null,
      local: data.local || null,
      turmas: data.turmas || "Todas",
      descricao: data.descricao || null,
    },
  })
  await registrarLog("evento_criado", `Evento criado — ${data.titulo}`, { tipo: data.tipo, data: data.data })
  revalidatePath("/agenda")
}

export async function editarEvento(id: number, data: {
  titulo: string
  tipo: string
  data: string
  horaInicio?: string
  horaFim?: string
  local?: string
  turmas?: string
  descricao?: string
}) {
  await requireAuth()
  if (!dataValida(data.data)) throw new Error("Data inválida")
  await db.evento.update({
    where: { id },
    data: {
      titulo: data.titulo,
      tipo: data.tipo,
      data: new Date(data.data + "T12:00:00"),
      horaInicio: data.horaInicio || null,
      horaFim: data.horaFim || null,
      local: data.local || null,
      turmas: data.turmas || "Todas",
      descricao: data.descricao || null,
    },
  })
  await registrarLog("evento_editado", `Evento atualizado — ${data.titulo}`, { tipo: data.tipo })
  revalidatePath("/agenda")
}

export async function deletarEvento(id: number) {
  await requireAuth()
  await db.evento.delete({ where: { id } })
  await registrarLog("evento_excluido", `Evento excluído — ID ${id}`)
  revalidatePath("/agenda")
}
