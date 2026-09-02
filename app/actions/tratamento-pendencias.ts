"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"

const schema = z.object({
  chave: z.string().min(3).max(180),
  acao: z.enum(["resolver", "adiar", "atribuir", "reabrir"]),
  dias: z.number().int().min(1).max(90).optional(),
})

export async function tratarPendencia(input: z.infer<typeof schema>) {
  const auth = await requireAuth(["admin", "secretaria", "tecnico"])
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { error: "Ação de pendência inválida." }

  const { chave, acao } = parsed.data
  const data = acao === "resolver"
    ? { status: "resolvida", responsavel: auth.user, adiadaAte: null }
    : acao === "adiar"
      ? { status: "adiada", responsavel: auth.user, adiadaAte: new Date(Date.now() + (parsed.data.dias ?? 7) * 86400000) }
      : { status: "aberta", responsavel: acao === "atribuir" ? auth.user : null, adiadaAte: null }

  await db.tratamentoPendencia.upsert({
    where: { chave },
    create: { chave, ...data, alteradaPor: auth.user },
    update: { ...data, alteradaPor: auth.user },
  })
  revalidatePath("/pendencias")
  revalidatePath("/", "layout")
  return { success: true as const, status: data.status, responsavel: data.responsavel, adiadaAte: data.adiadaAte?.toISOString() ?? null }
}
