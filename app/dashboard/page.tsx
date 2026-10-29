import { endOfMonth, startOfMonth, subMonths, format } from "date-fns"
import { PAGINA_ADMIN } from "@/components/layout/pagina"
import { PageHeader, PageHeaderDateNav } from "@/components/layout/page-header"
import { MonthPicker } from "@/app/caixa/month-picker"
import { NumeroInicio } from "@/components/inicio/numero-inicio"
import { PrecisaDeVoce } from "@/components/inicio/precisa-de-voce"
import { GraficoRecebidoPrevisto } from "@/components/inicio/grafico-recebido-previsto"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { normalizeDashboardMonth } from "@/lib/dashboard-query"
import { summarizeFrequency } from "@/lib/dashboard-metrics"
import { carregarPendencias } from "@/lib/pendencias-data"
import { acoesDoInicio, previstoDoMes, resumoAtraso, serieRecebidoPrevisto } from "@/lib/inicio"
import { canAccessStaffPath, isStaffRole } from "@/lib/permissions"
import { formatMoney, plural } from "@/lib/utils"

export const metadata = { title: "Início — Escolinha Itaquerense" }

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string | string[] }>
}) {
  const [{ role, user }, params] = await Promise.all([
    requireAuth(["admin", "secretaria", "tecnico"]),
    searchParams,
  ])
  if (!isStaffRole(role)) throw new Error("Perfil administrativo inválido.")
  const verDinheiro = canAccessStaffPath("/pagamentos", role)

  const now = new Date()
  const mesSelecionado = normalizeDashboardMonth(params.mes, now)
  const [ano, mes] = mesSelecionado.split("-").map(Number)
  const dataRef = new Date(ano, mes - 1, 1)
  const ultimos6Meses = Array.from({ length: 6 }, (_, i) => format(subMonths(dataRef, 5 - i), "yyyy-MM"))

  const [alunosAtivos, vencidas, pagamentos6Meses, frequencias, preMatriculas, pendencias] = await Promise.all([
    db.aluno.findMany({ where: { status: "Ativo" }, select: { mensalidade: true, desconto: true } }),
    verDinheiro
      ? db.pagamento.findMany({
          // Mesma regra da tela de Inadimplência.
          where: { dataPagamento: null, dataVencimento: { lt: now }, aluno: { status: "Ativo" } },
          select: { alunoId: true, aluno: { select: { mensalidade: true, desconto: true } } },
        })
      : Promise.resolve([]),
    verDinheiro
      ? db.pagamento.findMany({
          where: { mesReferencia: { in: ultimos6Meses } },
          select: { mesReferencia: true, valorRecebido: true, dataPagamento: true, aluno: { select: { mensalidade: true, desconto: true } } },
        })
      : Promise.resolve([]),
    db.frequencia.groupBy({
      by: ["presenca"],
      where: { data: { gte: startOfMonth(dataRef), lte: endOfMonth(dataRef) } },
      _count: { _all: true },
    }),
    db.preMatricula.count({ where: { status: "pendente" } }),
    carregarPendencias(role, user),
  ])

  const previsto = previstoDoMes(alunosAtivos)
  const atraso = resumoAtraso(vencidas.map((v) => ({ alunoId: v.alunoId, ...v.aluno })))
  const serie = serieRecebidoPrevisto(
    ultimos6Meses,
    pagamentos6Meses.map((p) => ({
      mesReferencia: p.mesReferencia,
      valorRecebido: p.dataPagamento ? p.valorRecebido : null,
      previsto: Math.max(0, p.aluno.mensalidade - p.aluno.desconto),
    })),
  )
  const recebidoNoMes = serie[serie.length - 1]?.recebido ?? 0
  const presenca = summarizeFrequency(frequencias)
  const { acoes, total } = acoesDoInicio(pendencias)

  return (
    <div data-page="dashboard" className={PAGINA_ADMIN}>
      <PageHeader
        title="Início"
        contextBar={<PageHeaderDateNav nav={<MonthPicker mes={mesSelecionado} basePath="/dashboard" />} />}
      />

      <section data-slot="inicio-numeros" aria-label="Números do mês" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {verDinheiro && (
          <NumeroInicio
            rotulo="Recebido no mês"
            valor={formatMoney(recebidoNoMes)}
            detalhe={`de ${formatMoney(previsto)} previstos`}
            href="/pagamentos"
          />
        )}
        {verDinheiro && (
          <NumeroInicio
            rotulo="Em atraso"
            valor={formatMoney(atraso.valor)}
            detalhe={atraso.alunos > 0
              ? `${plural(atraso.alunos, "aluno", "alunos")} · ${plural(atraso.mensalidades, "mensalidade", "mensalidades")}`
              : "Nenhuma mensalidade vencida"}
            atencao={atraso.valor > 0}
            href="/inadimplencia"
          />
        )}
        <NumeroInicio
          rotulo="Alunos ativos"
          valor={String(alunosAtivos.length)}
          detalhe={preMatriculas > 0 ? `${plural(preMatriculas, "pré-matrícula nova", "pré-matrículas novas")}` : undefined}
          href="/alunos"
        />
        <NumeroInicio
          rotulo="Presença média"
          valor={presenca.total > 0 ? `${presenca.percentage}%` : "—"}
          detalhe={presenca.total > 0 ? "No mês" : "Sem chamada registrada no mês"}
          href="/frequencia"
        />
      </section>

      <div className={verDinheiro ? "grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]" : undefined}>
        <PrecisaDeVoce acoes={acoes} total={total} />
        {verDinheiro && <GraficoRecebidoPrevisto serie={serie} />}
      </div>
    </div>
  )
}
