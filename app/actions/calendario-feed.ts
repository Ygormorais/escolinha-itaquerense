"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { gerarTokenCalendario } from "@/lib/calendario-feed"

type Resultado = { token: string | null } | { error: string }

async function responsavelId(): Promise<number | null> {
  const session = await getResponsavelSession()
  return session.authenticated && session.responsavelId != null ? session.responsavelId : null
}

async function gravar(id: number, token: string | null): Promise<Resultado> {
  await db.responsavel.update({
    where: { id },
    data: { calendarioToken: token, calendarioTokenCriadoEm: token ? new Date() : null },
  })
  revalidatePath("/responsavel/calendario")
  return { token }
}

/** Cria o link do feed se ainda não existe; se já existe, devolve o mesmo (não invalida assinaturas). */
export async function ativarLinkCalendario(): Promise<Resultado> {
  const id = await responsavelId()
  if (id == null) return { error: "Sessão expirada. Entre novamente." }
  const atual = await db.responsavel.findUnique({ where: { id }, select: { calendarioToken: true } })
  if (atual?.calendarioToken) return { token: atual.calendarioToken }
  return gravar(id, gerarTokenCalendario())
}

/** Gera outro link e invalida o anterior (quem assinou com o link antigo deixa de receber atualizações). */
export async function renovarLinkCalendario(): Promise<Resultado> {
  const id = await responsavelId()
  if (id == null) return { error: "Sessão expirada. Entre novamente." }
  return gravar(id, gerarTokenCalendario())
}

/** Desativa o feed: o link atual passa a responder "não encontrado". */
export async function desativarLinkCalendario(): Promise<Resultado> {
  const id = await responsavelId()
  if (id == null) return { error: "Sessão expirada. Entre novamente." }
  return gravar(id, null)
}
