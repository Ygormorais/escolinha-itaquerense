import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { getConfig } from "@/lib/config"
import { montarDeclaracaoAnual } from "@/lib/declaracao"
import { DeclaracaoAnualDoc } from "@/components/declaracao/declaracao-anual-doc"
import { PrintButton } from "@/components/ui/print-button"

export const metadata = { title: "Declaração anual — Escolinha Itaquerense" }

export default async function DeclaracaoPage({
  searchParams,
}: {
  searchParams: Promise<{ alunoId?: string; ano?: string }>
}) {
  const { alunoId: alunoIdRaw, ano: anoRaw } = await searchParams
  const alunoId = Number(alunoIdRaw)
  const ano = Number(anoRaw) || new Date().getFullYear()
  if (!Number.isInteger(alunoId) || alunoId <= 0) notFound()

  const aluno = await db.aluno.findUnique({
    where: { id: alunoId },
    select: {
      nome: true, responsavel: true,
      pagamentos: { select: { mesReferencia: true, dataPagamento: true, valorRecebido: true, formaPagamento: true } },
    },
  })
  if (!aluno) notFound()

  const config = getConfig()
  const declaracao = montarDeclaracaoAnual(aluno.pagamentos, ano)

  return (
    <div className="p-6">
      <div className="mb-4 print:hidden"><PrintButton /></div>
      <DeclaracaoAnualDoc
        declaracao={declaracao}
        aluno={{ nome: aluno.nome, responsavel: aluno.responsavel }}
        clube={{ nome: config.nome, cidade: config.cidade }}
      />
    </div>
  )
}
