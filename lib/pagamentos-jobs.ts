import { db } from "@/lib/db"
import { getConfig } from "@/lib/config"
import { logger } from "@/lib/logger"

export async function runGerarMensalidadesMes(
  mes: string
): Promise<{ criados: number; ignorados: number }> {
  const t0 = performance.now()
  const [ano, mesNum] = mes.split("-").map(Number)
  const rawDia = getConfig().diaVencimento
  const diaVencimento = Number.isInteger(rawDia) && rawDia >= 1 && rawDia <= 28 ? rawDia : 10

  const [alunos, existentes] = await Promise.all([
    db.aluno.findMany({ where: { status: "Ativo" } }),
    db.pagamento.findMany({ where: { mesReferencia: mes }, select: { alunoId: true } }),
  ])

  const existentesSet = new Set(existentes.map((e) => e.alunoId))
  const novos = alunos.filter((a) => !existentesSet.has(a.id))

  if (novos.length > 0) {
    await db.pagamento.createMany({
      data: novos.map((a) => ({
        alunoId: a.id,
        mesReferencia: mes,
        dataVencimento: new Date(ano, mesNum - 1, diaVencimento),
        canalPrevisto: null,
        statusCobranca: null,
      })),
    })
  }

  const resultado = { criados: novos.length, ignorados: existentesSet.size }
  logger.info("cron/gerar-mensalidades: concluído", { mes, ...resultado, durMs: Math.round(performance.now() - t0) })
  return resultado
}
