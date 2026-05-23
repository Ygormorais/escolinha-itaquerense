"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

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
  revalidatePath("/agenda")
}

export async function deletarEvento(id: number) {
  await db.evento.delete({ where: { id } })
  revalidatePath("/agenda")
}
