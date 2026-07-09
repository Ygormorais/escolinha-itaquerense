import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { AlertTriangle, DollarSign } from "lucide-react"
import { InadimplenciaClient } from "./inadimplencia-client"
import { getConfig } from "@/lib/config"
import { formatMoney } from "@/lib/utils"

export const metadata = { title: "Inadimplência — Escolinha Itaquerense" }

export default async function InadimplenciaPage() {
  const now = new Date()

  // Mesmo critério do dashboard e do relatório: só alunos ativos
  const pagamentosVencidos = await db.pagamento.findMany({
    where: {
      dataPagamento: null,
      dataVencimento: { lt: now },
      aluno: { status: "Ativo" },
    },
    include: {
      aluno: {
        select: { nome: true, turma: true, telefone: true, mensalidade: true },
      },
    },
    orderBy: { dataVencimento: "asc" },
  })

  const porAluno = new Map<
    number,
    {
      alunoId: number
      nome: string
      turma: string
      telefone: string
      mensalidade: number
      pagamentos: { id: number; mesReferencia: string; dataVencimento: Date; externalId: string | null; statusCobranca: string | null; canalPrevisto: string | null }[]
    }
  >()

  for (const p of pagamentosVencidos) {
    if (!porAluno.has(p.alunoId)) {
      porAluno.set(p.alunoId, {
        alunoId: p.alunoId,
        nome: p.aluno.nome,
        turma: p.aluno.turma,
        telefone: p.aluno.telefone,
        mensalidade: p.aluno.mensalidade,
        pagamentos: [],
      })
    }
    porAluno.get(p.alunoId)!.pagamentos.push({
      id: p.id,
      mesReferencia: p.mesReferencia,
      dataVencimento: p.dataVencimento,
      externalId: p.externalId,
      statusCobranca: p.statusCobranca,
      canalPrevisto: p.canalPrevisto,
    })
  }

  const inadimplentes = Array.from(porAluno.values())
  const config = getConfig()

  const totalInadimplentes = inadimplentes.length
  const valorTotalAberto = inadimplentes.reduce(
    (sum, a) => sum + a.mensalidade * a.pagamentos.length,
    0
  )
  const mesesMedios =
    totalInadimplentes > 0
      ? Math.round(
          inadimplentes.reduce((sum, a) => sum + a.pagamentos.length, 0) /
            totalInadimplentes
        )
      : 0

  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <PageHeader
        title="Inadimplência"
        description="Mensalidades vencidas e não pagas"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          title="Total Inadimplentes"
          value={totalInadimplentes}
          description="Alunos com mensalidade vencida"
          icon={AlertTriangle}
        />
        <StatCard
          title="Valor Total em Aberto"
          value={formatMoney(valorTotalAberto)}
          description="Soma das mensalidades em atraso"
          icon={DollarSign}
        />
        <StatCard
          title="Meses Médios de Atraso"
          value={mesesMedios}
          description="Média por aluno inadimplente"
          icon={AlertTriangle}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Alunos Inadimplentes</h2>
        <InadimplenciaClient
          inadimplentes={inadimplentes}
          chavePix={config.chavePix}
          nomeClube={config.nome}
          cidade={config.cidade}
          templateCobranca={config.templateCobranca}
        />
      </div>
    </div>
  )
}
