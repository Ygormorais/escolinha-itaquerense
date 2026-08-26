import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { PagamentosClient } from "./pagamentos-client"
import { getConfig } from "@/lib/config"

export const metadata = { title: "Pagamentos — Escolinha Itaquerense" }

export default async function PagamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const mes = params.mes ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const pagamentos = await db.pagamento.findMany({
    where: { mesReferencia: mes },
    include: {
      aluno: { select: { id: true, nome: true, turma: true, mensalidade: true, telefone: true } },
    },
    orderBy: { aluno: { nome: "asc" } },
  })

  const config = getConfig()

  return (
    <div data-page="pagamentos" className="mx-auto flex w-full max-w-[var(--content-max)] flex-col gap-6 bg-[var(--color-paper-50)]/40 p-[var(--space-page)] dark:bg-transparent">
      <PageHeader
        title="Pagamentos"
        description={`Controle de mensalidades — ${mes}`}
      />
      <PagamentosClient
        pagamentos={pagamentos}
        mes={mes}
        chavePix={config.chavePix}
        nomeClube={config.nome}
        cidade={config.cidade}
      />
    </div>
  )
}
