"use client"

import { PAGINA_PORTAL } from "@/components/layout/pagina"
import { useState } from "react"
import Link from "next/link"
import { ReceiptText, Search, Users } from "lucide-react"
import { PortalHero } from "@/components/responsavel/portal-hero"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn, formatMoney } from "@/lib/utils"
import { toDate, type RscDate } from "@/lib/rsc-date"
import { resumoMensalidades, type MesPortal, type SituacaoMes } from "@/lib/portal-mensalidades"

/** Datas chegam do Server Component como Date ou string serializada. */
type Mes = Omit<MesPortal, "dataPagamento" | "dataVencimento" | "recibos"> & {
  dataPagamento: RscDate | null
  dataVencimento: RscDate | null
  recibos: { id: number; numero: string; valor: number; dataPagamento: RscDate }[]
}

type Aluno = {
  id: number
  nome: string
  turma: string
  mensalidade: number
  desconto: number
  meses: Mes[]
}

const SITUACAO: Record<SituacaoMes, { label: string; className: string }> = {
  pago: { label: "Pago", className: "border-success-600/25 bg-success-50 text-success-600 dark:bg-success-600/15 dark:text-success-50" },
  parcial: { label: "Pago em parte", className: "border-warning-600/25 bg-warning-50 text-warning-700 dark:bg-warning-600/15 dark:text-warning-50" },
  atrasado: { label: "Atrasado", className: "border-danger-600/25 bg-danger-50 text-danger-600 dark:bg-danger-600/15 dark:text-danger-50" },
  a_vencer: { label: "A vencer", className: "border-border bg-background text-[var(--color-ink-700)]" },
  nao_gerada: { label: "Não gerada", className: "border-transparent bg-muted text-muted-foreground" },
}

/** Baixas gravam a data à meia-noite UTC; ler em UTC evita mostrar o dia anterior no navegador. */
function dataCurta(d: RscDate) {
  return toDate(d).toLocaleDateString("pt-BR", { timeZone: "UTC" })
}

function nomeDoMes(mes: string) {
  const [ano, m] = mes.split("-").map(Number)
  return `${format(new Date(ano, m - 1, 1), "MMMM", { locale: ptBR })}/${ano}`
}

function Detalhe({ m }: { m: Mes }) {
  switch (m.situacao) {
    case "pago":
      return <>{[m.formaPagamento, m.dataPagamento && `pago em ${dataCurta(m.dataPagamento)}`].filter(Boolean).join(" · ")}</>
    case "parcial":
      return <>Recebido {formatMoney(m.recebido)} · falta {formatMoney(m.restante)}</>
    case "atrasado":
      return <>Venceu em {m.dataVencimento ? dataCurta(m.dataVencimento) : "—"}</>
    case "a_vencer":
      return <>Vence em {m.dataVencimento ? dataCurta(m.dataVencimento) : "—"}</>
    case "nao_gerada":
      return <>Valor previsto</>
  }
}

function valorDaLinha(m: Mes) {
  if (m.situacao === "pago") return m.recebido
  if (m.situacao === "parcial" || m.situacao === "atrasado") return m.restante
  return m.devido
}

export function MensalidadesClient({ responsavelNome, ano, alunos }: { responsavelNome: string; ano: number; alunos: Aluno[] }) {
  const [search, setSearch] = useState("")

  const filtered = alunos.filter((a) => a.nome.toLowerCase().includes(search.toLowerCase()))
  const resumo = resumoMensalidades(alunos.map((a) => a.meses as MesPortal[]))

  return (
    <div className={PAGINA_PORTAL}>
      <PortalHero
        backHref="/responsavel"
        title="Mensalidades"
        description={`Pagamentos, valores em aberto e recibos dos alunos vinculados a ${responsavelNome}.`}
        stats={[
          { label: "Pagas", value: resumo.pagos },
          { label: "Em aberto", value: resumo.emAberto },
          { label: "Falta pagar", value: formatMoney(resumo.totalEmAberto) },
        ]}
      />

      {alunos.length > 1 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-500)]" />
          <Input className="pl-11" placeholder="Buscar aluno..." aria-label="Buscar aluno" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      )}

      {alunos.length === 0 && (
        <EmptyState
          icon={Users}
          title="Nenhum aluno ativo"
          description="Quando houver atletas vinculados à sua conta, as mensalidades e os recibos aparecem aqui."
          href="/responsavel"
          hrefLabel="Voltar ao portal"
        />
      )}

      {filtered.map((aluno) => (
        <Card key={aluno.id} id={`aluno-${aluno.id}`} className="scroll-mt-6 overflow-hidden border-border/80 shadow-sm">
          <CardHeader className="border-b border-border bg-[var(--color-paper-50)]/60 pb-4 dark:bg-muted/30">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 font-heading text-xl font-extrabold">
                <span className="border-l-4 border-brand-600 pl-2.5">{aluno.nome}</span>
                <Badge variant="secondary" className="px-2.5 text-[11px]">{aluno.turma}</Badge>
              </CardTitle>
              <Link href={`/responsavel/declaracao?alunoId=${aluno.id}&ano=${ano}`} className="text-xs font-semibold text-brand-700 underline-offset-2 hover:underline">
                Declaração anual
              </Link>
            </div>
            <p className="text-sm text-[var(--color-ink-700)]">
              Mensalidade: {formatMoney(Math.max(0, aluno.mensalidade - aluno.desconto))}
              {aluno.desconto > 0 && <span className="ml-1 text-success-600">(desconto de {formatMoney(aluno.desconto)})</span>}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {aluno.meses.map((m) => {
                const s = SITUACAO[m.situacao]
                return (
                  <li key={m.mes} data-mes={m.mes} className="px-5 py-4 text-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="min-w-28 font-medium capitalize text-[var(--color-ink-900)]">{nomeDoMes(m.mes)}</span>
                        <span className={cn("inline-flex rounded-[var(--radius-control)] border px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em]", s.className)}>
                          {s.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 sm:justify-end">
                        <span className="text-xs text-[var(--color-ink-500)]"><Detalhe m={m} /></span>
                        <span className={cn("font-semibold tabular-nums", m.situacao === "nao_gerada" ? "text-[var(--color-ink-500)]" : "text-[var(--color-ink-900)]")}>
                          {formatMoney(valorDaLinha(m))}
                        </span>
                      </div>
                    </div>
                    {m.recibos.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {m.recibos.map((r) => (
                          <Link
                            key={r.id}
                            href={`/responsavel/recibos/${r.id}`}
                            className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border border-border px-2 py-1 text-xs font-semibold text-[var(--color-ink-900)] transition-colors hover:border-brand-600 hover:text-brand-700"
                          >
                            <ReceiptText className="size-3.5" />
                            Recibo {r.numero} · {formatMoney(r.valor)}
                          </Link>
                        ))}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      ))}

      {alunos.length > 0 && filtered.length === 0 && (
        <EmptyState
          icon={Search}
          title="Nenhum aluno encontrado"
          description="Ajuste o termo da busca para localizar outro atleta."
        />
      )}
    </div>
  )
}
