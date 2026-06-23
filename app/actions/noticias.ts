"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

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
  revalidatePath("/noticias")
  revalidatePath("/")
  return noticia
}

export async function deletarNoticia(id: number) {
  await requireAuth(["admin", "secretaria"])
  await db.noticia.delete({ where: { id } })
  revalidatePath("/noticias")
  revalidatePath("/")
}

export async function togglePublicado(id: number, publicado: boolean) {
  await requireAuth(["admin", "secretaria"])
  await db.noticia.update({ where: { id }, data: { publicado } })
  revalidatePath("/noticias")
  revalidatePath("/")
}
