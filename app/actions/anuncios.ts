"use server"

import { revalidatePath } from "next/cache"
import { unlink } from "fs/promises"
import path from "path"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { registrarLog } from "@/app/actions/log"
import { resolveUploadsDir } from "@/lib/uploads-path"
import { AnuncioSchema, type AnuncioEntrada } from "@/lib/site/anuncios"

function revalidarPublicidade() {
  revalidatePath("/configuracoes/publicidade")
  revalidatePath("/")
  revalidatePath("/partidas")
}

/** Apaga do disco o upload que deixou de ser usado (URLs externas ficam como estão). */
async function apagarUpload(url: string | null | undefined) {
  if (!url?.startsWith("/uploads/publicidade/")) return
  await unlink(path.join(/* turbopackIgnore: true */ resolveUploadsDir("publicidade"), path.basename(url))).catch(() => {})
}

export async function salvarAnuncio(id: number | null, entrada: AnuncioEntrada) {
  await requireAuth(["admin", "secretaria"])
  const parsed = AnuncioSchema.safeParse(entrada)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  const data = parsed.data

  try {
    if (id === null) {
      await db.anuncio.create({ data })
      void registrarLog("anuncio_criado", `Anúncio criado — ${data.anunciante}`, { posicao: data.posicao })
    } else {
      const antes = await db.anuncio.findUnique({ where: { id }, select: { imagemUrl: true, imagemMobileUrl: true } })
      if (!antes) return { error: "Anúncio não encontrado" }
      await db.anuncio.update({ where: { id }, data })
      if (antes.imagemUrl !== data.imagemUrl) await apagarUpload(antes.imagemUrl)
      if (antes.imagemMobileUrl !== data.imagemMobileUrl) await apagarUpload(antes.imagemMobileUrl)
      void registrarLog("anuncio_editado", `Anúncio editado — ${data.anunciante}`, { id, posicao: data.posicao })
    }
    revalidarPublicidade()
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao salvar anúncio" }
  }
}

export async function alternarAnuncio(id: number, ativo: boolean) {
  await requireAuth(["admin", "secretaria"])
  try {
    const a = await db.anuncio.update({ where: { id }, data: { ativo }, select: { anunciante: true } })
    void registrarLog("anuncio_status", `Anúncio ${ativo ? "ativado" : "pausado"} — ${a.anunciante}`, { id })
    revalidarPublicidade()
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao alterar anúncio" }
  }
}

export async function removerAnuncio(id: number) {
  await requireAuth(["admin", "secretaria"])
  try {
    const a = await db.anuncio.delete({ where: { id }, select: { anunciante: true, imagemUrl: true, imagemMobileUrl: true } })
    await apagarUpload(a.imagemUrl)
    await apagarUpload(a.imagemMobileUrl)
    void registrarLog("anuncio_removido", `Anúncio removido — ${a.anunciante}`, { id })
    revalidarPublicidade()
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao remover anúncio" }
  }
}
