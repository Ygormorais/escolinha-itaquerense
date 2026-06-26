"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { registrarLog } from "@/app/actions/log"

export async function listarNoticias() {
  return db.noticia.findMany({ orderBy: { createdAt: "desc" } })
}

export async function criarNoticia(data: {
  titulo: string
  subtitulo?: string
  categoria: string
  imagemUrl?: string
  publicado: boolean
  destaque: boolean
}) {
  await requireAuth(["admin", "secretaria"])
  const noticia = await db.noticia.create({ data })
  await registrarLog("noticia_criada", `Notícia criada — ${data.titulo}`, { categoria: data.categoria, publicado: data.publicado })
  revalidatePath("/noticias")
  revalidatePath("/")
  return noticia
}

export async function editarNoticia(id: number, data: {
  titulo: string
  subtitulo?: string
  categoria: string
  imagemUrl?: string
  publicado: boolean
  destaque: boolean
}) {
  await requireAuth(["admin", "secretaria"])
  const noticia = await db.noticia.update({ where: { id }, data })
  await registrarLog("noticia_editada", `Notícia editada — ${data.titulo}`, { id, categoria: data.categoria })
  revalidatePath("/noticias")
  revalidatePath("/")
  return noticia
}

export async function deletarNoticia(id: number) {
  await requireAuth(["admin", "secretaria"])
  const noticia = await db.noticia.findUnique({ where: { id }, select: { titulo: true } })
  await db.noticia.delete({ where: { id } })
  await registrarLog("noticia_excluida", `Notícia excluída — ${noticia?.titulo ?? `ID ${id}`}`, { id })
  revalidatePath("/noticias")
  revalidatePath("/")
}

export async function togglePublicado(id: number, publicado: boolean) {
  await requireAuth(["admin", "secretaria"])
  const noticia = await db.noticia.update({ where: { id }, data: { publicado } })
  await registrarLog("noticia_publicada", `Notícia ${publicado ? "publicada" : "despublicada"} — ${noticia.titulo}`, { id })
  revalidatePath("/noticias")
  revalidatePath("/")
}
