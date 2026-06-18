import { db } from "@/lib/db"

/**
 * Detecta (e opcionalmente resolve) mensalidades duplicadas por (alunoId, mesReferencia).
 *
 * Rodar ANTES do `prisma migrate deploy` que cria o UNIQUE INDEX
 * `Pagamento_alunoId_mesReferencia_key` — o CREATE UNIQUE INDEX FALHA se houver duplicatas.
 *
 *   npx tsx scripts/check-pagamentos-duplicados.ts          # só relatório (dry run)
 *   npx tsx scripts/check-pagamentos-duplicados.ts --fix    # resolve: mantém 1, remove o resto
 *
 * Critério do registro mantido (mais "real" primeiro):
 *   1. pago (dataPagamento != null)
 *   2. com cobrança emitida (externalId/pixCopiaECola)
 *   3. mais antigo (createdAt asc, depois menor id)
 * As transações da maquininha que apontavam para registros removidos são
 * reatribuídas ao registro mantido (não se perde vínculo de pagamento).
 */

const FIX = process.argv.includes("--fix")

function melhorPrimeiro<T extends { dataPagamento: Date | null; externalId: string | null; pixCopiaECola: string | null; createdAt: Date; id: number }>(a: T, b: T): number {
  const pago = Number(b.dataPagamento != null) - Number(a.dataPagamento != null)
  if (pago) return pago
  const cobranca = Number(!!(b.externalId || b.pixCopiaECola)) - Number(!!(a.externalId || a.pixCopiaECola))
  if (cobranca) return cobranca
  const data = a.createdAt.getTime() - b.createdAt.getTime()
  if (data) return data
  return a.id - b.id
}

async function main() {
  const grupos = await db.pagamento.groupBy({
    by: ["alunoId", "mesReferencia"],
    _count: { _all: true },
    having: { id: { _count: { gt: 1 } } },
  })

  if (grupos.length === 0) {
    console.log("[check-dup] Nenhuma mensalidade duplicada. Seguro para o migrate deploy. ✔")
    return
  }

  console.log(`[check-dup] ${grupos.length} grupo(s) com duplicata:\n`)
  let removeríamos = 0

  for (const g of grupos) {
    const regs = await db.pagamento.findMany({
      where: { alunoId: g.alunoId, mesReferencia: g.mesReferencia },
    })
    regs.sort(melhorPrimeiro)
    const [manter, ...remover] = regs
    removeríamos += remover.length

    const aluno = await db.aluno.findUnique({ where: { id: g.alunoId }, select: { nome: true } })
    console.log(`  aluno=${g.alunoId} (${aluno?.nome ?? "?"}) mês="${g.mesReferencia}" → ${regs.length} registros`)
    console.log(`    MANTER  id=${manter.id} pago=${manter.dataPagamento ? "sim" : "não"} valor=${manter.valorRecebido ?? "-"}`)
    for (const r of remover) {
      console.log(`    REMOVER id=${r.id} pago=${r.dataPagamento ? "sim" : "não"} valor=${r.valorRecebido ?? "-"}`)
    }

    if (FIX) {
      await db.$transaction(async (tx) => {
        // reatribui transações da maquininha ao registro mantido antes de remover
        await tx.transacaoMaquina.updateMany({
          where: { pagamentoId: { in: remover.map((r) => r.id) } },
          data: { pagamentoId: manter.id },
        })
        await tx.pagamento.deleteMany({ where: { id: { in: remover.map((r) => r.id) } } })
      })
    }
  }

  if (FIX) {
    console.log(`\n[check-dup] Resolvido: ${removeríamos} registro(s) removido(s). Agora pode rodar o migrate. ✔`)
  } else {
    console.log(`\n[check-dup] DRY RUN. Removeria ${removeríamos} registro(s). Rode com --fix para aplicar.`)
    process.exitCode = 1
  }
}

main()
  .catch((err) => {
    console.error("[check-dup] Erro:", err)
    process.exit(1)
  })
  .then(() => process.exit(process.exitCode ?? 0))
