"use server"

import { z } from "zod"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { compararFrequenciaAposAcao, janelasAcompanhamento } from "@/lib/acompanhamento-frequencia"

export async function consultarAcompanhamentoFrequencia(acaoId: number) {
  await requireAuth(["admin", "tecnico"])
  if (!z.number().int().positive().safeParse(acaoId).success) return { error: "Ação inválida." }
  const acao = await db.acaoDesenvolvimento.findUnique({
    where: { id: acaoId }, select: { alunoId: true, status: true, concluidaEm: true },
  })
  if (!acao || acao.status !== "concluida") return { error: "Esta ação não está concluída. Atualize a página." }
  if (!acao.concluidaEm) return { error: "Esta ação antiga não tem data de conclusão registrada. Não é possível definir o período de comparação." }
  const now = new Date()
  const janela = janelasAcompanhamento(acao.concluidaEm, now)
  if (!janela) return { error: "A data de conclusão não permite uma comparação válida." }
  const frequencias = await db.frequencia.findMany({
    where: {
      alunoId: acao.alunoId,
      OR: [
        { data: { gte: janela.inicioAntes, lt: janela.fimAntes } },
        { data: { gte: janela.inicioDepois, lt: janela.limiteConsulta } },
      ],
    },
    select: { data: true, presenca: true },
  })
  return { acompanhamento: compararFrequenciaAposAcao(acao.concluidaEm, frequencias, now)! }
}
