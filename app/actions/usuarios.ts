"use server"

import { createHmac } from "crypto"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

function hashSenha(senha: string): string {
  const secret = process.env.SESSION_SECRET ?? "dev-secret"
  return createHmac("sha256", secret).update(senha).digest("hex")
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
  await db.usuario.update({
    where: { id },
    data: { senha: hashSenha(novaSenha) },
  })
  revalidatePath("/configuracoes/usuarios")
  return { success: true }
}

export async function toggleUsuario(id: number, ativo: boolean) {
  await db.usuario.update({ where: { id }, data: { ativo } })
  revalidatePath("/configuracoes/usuarios")
}

export async function deletarUsuario(id: number) {
  await db.usuario.delete({ where: { id } })
  revalidatePath("/configuracoes/usuarios")
}

export async function checkDbCredentials(username: string, senha: string): Promise<{ ok: boolean; nome?: string; role?: string }> {
  const user = await db.usuario.findUnique({ where: { username } })
  if (!user || !user.ativo) return { ok: false }
  const hash = hashSenha(senha)
  if (hash !== user.senha) return { ok: false }
  return { ok: true, nome: user.nome, role: user.role }
}
