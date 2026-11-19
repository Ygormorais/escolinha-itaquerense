"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { registrarLog } from "@/app/actions/log"
import { NoticiaSchema } from "@/lib/schemas"
import { gerarSlugUnico } from "@/lib/noticias/slug"

/** Campos de texto vazios viram null (o banco guarda "sem texto"/"sem vídeo", não string vazia). */
function limparOpcionais<T extends { corpo?: string; videoUrl?: string }>(d: T) {
  return { ...d, corpo: d.corpo?.trim() || null, videoUrl: d.videoUrl?.trim() || null }
}

const slugEmUso = async (slug: string) => (await db.noticia.findUnique({ where: { slug }, select: { id: true } })) !== null

export async function listarNoticias() {
  await requireAuth(["admin", "secretaria"])
  return db.noticia.findMany({ orderBy: { createdAt: "desc" } })
}

export async function criarNoticia(data: {
  titulo: string
  subtitulo?: string
  categoria: string
  imagemUrl?: string
  corpo?: string
  videoUrl?: string
  publicado: boolean
  destaque: boolean
}) {
  await requireAuth(["admin", "secretaria"])
  const parsed = NoticiaSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  const slug = await gerarSlugUnico(parsed.data.titulo, slugEmUso)
  const noticia = await db.noticia.create({ data: { ...limparOpcionais(parsed.data), slug } })
  await registrarLog("noticia_criada", `Notícia criada — ${data.titulo}`, { categoria: data.categoria, publicado: data.publicado })
  revalidatePath("/noticias")
  revalidatePath("/noticias/publico", "layout")
  revalidatePath("/")
  return noticia
}

export async function editarNoticia(id: number, data: {
  titulo: string
  subtitulo?: string
  categoria: string
  imagemUrl?: string
  corpo?: string
  videoUrl?: string
  publicado: boolean
  destaque: boolean
}) {
  await requireAuth(["admin", "secretaria"])
  const parsed = NoticiaSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  // O slug nunca muda com o título (o link já compartilhado continua valendo); só notícia
  // antiga sem slug recebe um agora.
  const atual = await db.noticia.findUnique({ where: { id }, select: { slug: true } })
  const slug = atual?.slug ?? (await gerarSlugUnico(parsed.data.titulo, slugEmUso))
  const noticia = await db.noticia.update({ where: { id }, data: { ...limparOpcionais(parsed.data), slug } })
  await registrarLog("noticia_editada", `Notícia editada — ${data.titulo}`, { id, categoria: data.categoria })
  revalidatePath("/noticias")
  revalidatePath("/noticias/publico", "layout")
  revalidatePath("/")
  return noticia
}

export async function deletarNoticia(id: number) {
  await requireAuth(["admin", "secretaria"])
  const noticia = await db.noticia.findUnique({ where: { id }, select: { titulo: true } })
  await db.noticia.delete({ where: { id } })
  await registrarLog("noticia_excluida", `Notícia excluída — ${noticia?.titulo ?? `ID ${id}`}`, { id })
  revalidatePath("/noticias")
  revalidatePath("/noticias/publico", "layout")
  revalidatePath("/")
}

export async function togglePublicado(id: number, publicado: boolean) {
  await requireAuth(["admin", "secretaria"])
  const noticia = await db.noticia.update({ where: { id }, data: { publicado } })
  await registrarLog("noticia_publicada", `Notícia ${publicado ? "publicada" : "despublicada"} — ${noticia.titulo}`, { id })
  revalidatePath("/noticias")
  revalidatePath("/noticias/publico", "layout")
  revalidatePath("/")
}
