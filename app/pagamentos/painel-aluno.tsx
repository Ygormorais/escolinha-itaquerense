import Link from "next/link"
import { format } from "date-fns"
import { db } from "@/lib/db"
import { formatMoney } from "@/lib/utils"
import { restanteDoPagamento } from "@/lib/valor-devido"
import { BaixaForm, type MensalidadeDoPainel } from "./baixa-form"

/** Painel do aluno escolhido na central: mensalidades em aberto, baixa e recibos recentes. */
export async function PainelAluno({ alunoId, agora }: { alunoId: number; agora: Date }) {
  const aluno = Number.isInteger(alunoId)
    ? await db.aluno.findUnique({
        where: { id: alunoId },
        select: {
          id: true, nome: true, turma: true, telefone: true, responsavel: true, mensalidade: true, desconto: true,
          responsavelRef: { select: { nome: true } },
          pagamentos: {
            where: { dataPagamento: null },
            orderBy: { dataVencimento: "asc" },
            select: {
              id: true, mesReferencia: true, dataVencimento: true, valorDevido: true, valorRecebido: true,
              externalId: true, statusCobranca: true, canalPrevisto: true,
              pixCopiaECola: true, linhaDigitavel: true, externalUrl: true,
            },
          },
        },
      })
    : null

  if (!aluno) {
    return (
      <section aria-label="Aluno" className="min-w-0 rounded-[var(--radius-card)] border border-border bg-card p-6 text-sm">
        <p className="font-semibold">Aluno não encontrado</p>
        <p className="mt-1 text-muted-foreground">Escolha outro aluno na lista.</p>
      </section>
    )
  }

  const recibos = await db.recibo.findMany({
    where: { alunoId: aluno.id, canceladoAt: null },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, numero: true, codigoVerificacao: true, mesReferencia: true, valor: true, dataPagamento: true },
  })

  const mensalidades: MensalidadeDoPainel[] = aluno.pagamentos.map((p) => ({
    id: p.id,
    mesReferencia: p.mesReferencia,
    vencimento: p.dataVencimento.toISOString(),
    restante: restanteDoPagamento({ ...p, aluno }),
    situacao: (p.valorRecebido ?? 0) > 0 ? "parcial" : p.dataVencimento < agora ? "atrasada" : "a_vencer",
    externalId: p.externalId,
    statusCobranca: p.statusCobranca,
    canalPrevisto: p.canalPrevisto,
    pixCopiaECola: p.pixCopiaECola,
    linhaDigitavel: p.linhaDigitavel,
    externalUrl: p.externalUrl,
  }))

  return (
    <section aria-label="Aluno" className="min-w-0 space-y-4 rounded-[var(--radius-card)] border border-border bg-card p-4">
      <header>
        <h2 className="text-lg font-bold">
          <Link href={`/alunos/${aluno.id}`} className="hover:underline">{aluno.nome}</Link>
        </h2>
        <p className="text-sm text-muted-foreground">
          {aluno.turma} · {aluno.responsavelRef?.nome ?? aluno.responsavel}
          {aluno.desconto > 0 ? ` · desconto ${formatMoney(aluno.desconto)}` : ""}
        </p>
      </header>

      <BaixaForm aluno={{ id: aluno.id, nome: aluno.nome, telefone: aluno.telefone }} mensalidades={mensalidades} />

      {recibos.length > 0 && (
        <div>
          <h3 className="mb-1 text-sm font-semibold">Recibos recentes</h3>
          <ul className="divide-y divide-border text-sm">
            {recibos.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 py-1.5">
                <span>
                  {r.numero} · {r.mesReferencia} · {formatMoney(r.valor)}{" "}
                  <span className="text-xs text-muted-foreground">{format(r.dataPagamento, "dd/MM/yyyy")}</span>
                </span>
                {r.codigoVerificacao && (
                  <Link href={`/recibos?codigo=${r.codigoVerificacao}`} target="_blank" className="text-xs font-semibold underline">
                    Imprimir
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
