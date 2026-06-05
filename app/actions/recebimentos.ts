"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { registrarLog } from "@/app/actions/log"
import { FORMAS_PAGAMENTO } from "@/lib/constants"

type ActionResult = { success: true } | { error: string }

const recebimentoSchema = z.object({
  data: z.string().min(1, "Data obrigatória"),
  descricao: z.string().trim().min(1, "Descrição obrigatória"),
  categoria: z.string().trim().min(1, "Categoria obrigatória"),
  valor: z.number().positive("Valor deve ser maior que zero"),
  formaPagamento: z.enum(FORMAS_PAGAMENTO),
  observacoes: z.string().optional(),
})

export type RecebimentoInput = z.input<typeof recebimentoSchema>

export async function criarRecebimento(input: RecebimentoInput): Promise<ActionResult> {
  await requireAuth(["admin", "secretaria"])

  const parsed = recebimentoSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }
  const data = parsed.data

  try {
    await db.recebimento.create({
      data: {
        data: new Date(data.data),
        descricao: data.descricao,
        categoria: data.categoria,
        valor: data.valor,
        formaPagamento: data.formaPagamento,
        observacoes: data.observacoes ?? null,
      },
    })
    await registrarLog("recebimento_novo", `Recebimento avulso — ${data.descricao}`, {
      categoria: data.categoria,
      valor: `R$ ${data.valor.toFixed(2)}`,
      forma: data.formaPagamento,
    })
    revalidatePath("/caixa")
    revalidatePath("/caixa/dinheiro")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao registrar recebimento" }
  }
}

export async function deletarRecebimento(id: number): Promise<ActionResult> {
  await requireAuth(["admin", "secretaria"])
  try {
    await db.recebimento.delete({ where: { id } })
    revalidatePath("/caixa")
    revalidatePath("/caixa/dinheiro")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao excluir recebimento" }
  }
}
