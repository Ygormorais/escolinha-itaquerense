"use server"

import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { getSessionSecret } from "@/lib/env"

function hashSenha(senha: string): string {
  return bcrypt.hashSync(senha, 10)
}

export async function getUsuarios() {
  return db.usuario.findMany({ orderBy: { createdAt: "asc" } })
}

export async function criarUsuario(data: {
  username: string
  nome: string
  senha: string
  role: string
}) {
  await requireAuth()
  const existing = await db.usuario.findUnique({ where: { username: data.username } })
  if (existing) return { error: "Username já existe" }

  await db.usuario.create({
    data: {
      username: data.username,
      nome: data.nome,
      senha: hashSenha(data.senha),
      role: data.role,
    },
  })
  revalidatePath("/configuracoes/usuarios")
  return { success: true }
}

export async function alterarSenha(id: number, novaSenha: string) {
  await requireAuth()
  await db.usuario.update({
    where: { id },
    data: { senha: hashSenha(novaSenha) },
  })
  revalidatePath("/configuracoes/usuarios")
  return { success: true }
}

export async function toggleUsuario(id: number, ativo: boolean) {
  await requireAuth()
  await db.usuario.update({ where: { id }, data: { ativo } })
  revalidatePath("/configuracoes/usuarios")
}

export async function deletarUsuario(id: number) {
  await requireAuth()
  await db.usuario.delete({ where: { id } })
  revalidatePath("/configuracoes/usuarios")
}

async function legacyHashCompare(senha: string, hash: string): Promise<boolean> {
  const { createHmac, timingSafeEqual } = await import("crypto")
  const secret = getSessionSecret()
  const computed = createHmac("sha256", secret).update(senha).digest("hex")
  try {
    const a = Buffer.from(computed)
    const b = Buffer.from(hash)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function checkDbCredentials(username: string, senha: string): Promise<{ ok: boolean; nome?: string; role?: string }> {
  const user = await db.usuario.findUnique({ where: { username } })
  if (!user || !user.ativo) return { ok: false }

  const match = await bcrypt.compare(senha, user.senha)
  if (match) return { ok: true, nome: user.nome, role: user.role }

  const legacyMatch = await legacyHashCompare(senha, user.senha)
  if (legacyMatch) {
    const novaHash = hashSenha(senha)
    await db.usuario.update({ where: { id: user.id }, data: { senha: novaHash } })
    return { ok: true, nome: user.nome, role: user.role }
  }

  return { ok: false }
}
