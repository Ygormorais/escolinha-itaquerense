import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getConfig } from "@/lib/config"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { montarDeclaracaoAnual } from "@/lib/declaracao"
import { DeclaracaoAnualDoc } from "@/components/declaracao/declaracao-anual-doc"
import { PrintButton } from "@/components/ui/print-button"

export const metadata = { title: "Declaração anual — Escolinha Itaquerense" }

export default async function DeclaracaoResponsavelPage({
  searchParams,
}: {
  searchParams: Promise<{ alunoId?: string; ano?: string }>
}) {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const { alunoId: alunoIdRaw, ano: anoRaw } = await searchParams
  const alunoId = Number(alunoIdRaw)
  const ano = Number(anoRaw) || new Date().getFullYear()
  if (!Number.isInteger(alunoId) || alunoId <= 0) notFound()

  const aluno = await db.aluno.findUnique({
    where: { id: alunoId },
    select: {
      nome: true, responsavel: true, responsavelId: true,
      pagamentos: { select: { mesReferencia: true, dataPagamento: true, valorRecebido: true, formaPagamento: true } },
    },
  })
  if (!aluno || aluno.responsavelId == null || aluno.responsavelId !== session.responsavelId) notFound()

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
