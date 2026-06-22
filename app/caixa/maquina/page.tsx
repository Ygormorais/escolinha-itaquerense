import { PageHeader } from "@/components/layout/page-header"
import { MaquinaClient } from "./maquina-client"
import { getTransacoes, getResumoMaquina } from "@/app/actions/maquina"
import { formatMoney } from "@/lib/utils"
import { db } from "@/lib/db"

export const metadata = { title: "Maquininha — Escolinha Itaquerense" }

export default async function MaquinaPage() {
  const [transacoes, resumo, alunos] = await Promise.all([
    getTransacoes("todas"),
    getResumoMaquina(),
    db.aluno.findMany({
      where: { status: "Ativo" },
      select: { id: true, nome: true, responsavel: true },
      orderBy: { nome: "asc" },
    }),
  ])

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Maquininha"
        description="Importe o CSV da sua maquininha e reconcilie com os alunos"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Importado</p>
          <p className="mt-1 font-heading text-2xl font-extrabold tracking-tight">{formatMoney(resumo.total)}</p>
          <p className="text-xs text-muted-foreground">{resumo.totalTransacoes} transações</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pendentes</p>
          <p className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-warning-600">{formatMoney(resumo.totalPendente)}</p>
          <p className="text-xs text-muted-foreground">{resumo.pendentes} transações</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reconciliados</p>
          <p className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-success-600">{formatMoney(resumo.totalReconciliado)}</p>
          <p className="text-xs text-muted-foreground">{resumo.reconciliados} transações</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Taxa Média</p>
          <p className="mt-1 font-heading text-2xl font-extrabold tracking-tight">
            {resumo.taxaMedia != null ? `${resumo.taxaMedia.toFixed(2)}%` : "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {resumo.taxaMedia != null ? "Custo sobre vendas" : "Sem dados de taxa"}
          </p>
        </div>
      </div>

      <MaquinaClient transacoes={transacoes} alunos={alunos} />
    </div>
  )
}
