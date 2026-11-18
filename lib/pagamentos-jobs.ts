import { db } from "@/lib/db"
import { getConfig } from "@/lib/config"
import { logger } from "@/lib/logger"
import { valorDevidoDoAluno } from "@/lib/valor-devido"

/** Mês de referência no formato AAAA-MM, com mês de 01 a 12. */
export function mesReferenciaValido(mes: unknown): mes is string {
  return typeof mes === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(mes)
}

/** Dia de vencimento configurado (1 a 28); fora disso, dia 10. */
export function diaVencimentoConfigurado(): number {
  const rawDia = getConfig().diaVencimento
  return Number.isInteger(rawDia) && rawDia >= 1 && rawDia <= 28 ? rawDia : 10
}

/** Aluno já matriculado até o fim do mês (sem data de matrícula, conta como matriculado). */
export function matriculadoAteFimDoMes(aluno: { dataMatricula?: Date | null }, ano: number, mesNum: number): boolean {
  if (!aluno.dataMatricula) return true
  return aluno.dataMatricula.getTime() < Date.UTC(ano, mesNum, 1)
}

export async function runGerarMensalidadesMes(
  mes: string
): Promise<{ criados: number; ignorados: number }> {
  if (!mesReferenciaValido(mes)) throw new Error("Mês inválido. Use o formato AAAA-MM.")
  const t0 = performance.now()
  const [ano, mesNum] = mes.split("-").map(Number)
  const diaVencimento = diaVencimentoConfigurado()

  const [alunos, existentes] = await Promise.all([
    db.aluno.findMany({ where: { status: "Ativo" } }),
    db.pagamento.findMany({ where: { mesReferencia: mes }, select: { alunoId: true } }),
  ])

  const existentesSet = new Set(existentes.map((e) => e.alunoId))
  // Quem se matriculou depois do mês não ganha mensalidade dele (nasceria vencida).
  const novos = alunos.filter((a) => !existentesSet.has(a.id) && matriculadoAteFimDoMes(a, ano, mesNum))

  if (novos.length > 0) {
    await db.pagamento.createMany({
      data: novos.map((a) => ({
        alunoId: a.id,
        mesReferencia: mes,
        dataVencimento: new Date(ano, mesNum - 1, diaVencimento),
        canalPrevisto: null,
        statusCobranca: null,
        valorDevido: valorDevidoDoAluno(a),
      })),
    })
  }

  const resultado = { criados: novos.length, ignorados: existentesSet.size }
  logger.info("cron/gerar-mensalidades: concluído", { mes, ...resultado, durMs: Math.round(performance.now() - t0) })
  return resultado
}
