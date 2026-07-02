"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle, AlertTriangle, Search, Wallet, Clock3, ReceiptText } from "lucide-react"
import { PortalHero } from "@/components/responsavel/portal-hero"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatMoney } from "@/lib/utils"
import type { RscDate } from "@/lib/rsc-date"

type Pagamento = {
  mesReferencia: string
  dataVencimento: RscDate
  dataPagamento: RscDate | null
  valorRecebido: number | null
  formaPagamento: string | null
}

type Aluno = {
  id: number
  nome: string
  turma: string
  mensalidade: number
  desconto: number
  pagamentos: Pagamento[]
}

export function MensalidadesClient({ responsavel }: { responsavel: { nome: string; alunos: Aluno[] } }) {
  const [search, setSearch] = useState("")

  const filtered = responsavel.alunos.filter((a) =>
    a.nome.toLowerCase().includes(search.toLowerCase())
  )

  const totalAlunos = responsavel.alunos.length
  const totalPagos = responsavel.alunos.reduce(
    (acc, aluno) => acc + aluno.pagamentos.filter((pagamento) => pagamento.dataPagamento).length,
    0
  )
  const totalPendentes = responsavel.alunos.reduce(
    (acc, aluno) => acc + aluno.pagamentos.filter((pagamento) => !pagamento.dataPagamento).length,
    0
  )

  const anoAtual = new Date().getFullYear()
  const meses = Array.from({ length: 12 }, (_, i) =>
    `${anoAtual}-${String(i + 1).padStart(2, "0")}`
  )

  return (
    <div className="flex flex-col gap-8">
      <PortalHero
        backHref="/responsavel"
        title="Mensalidades"
        description={`Consulte pagamentos, valores em aberto e o histórico recente dos alunos vinculados a ${responsavel.nome}.`}
        stats={[
          { label: "Alunos", value: totalAlunos },
          { label: "Pagos", value: totalPagos },
          { label: "Pendentes", value: totalPendentes },
        ]}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-start gap-3 py-1">
            <div className="mt-1 rounded-lg bg-brand-50 p-2 text-brand-800">
              <Wallet className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink-950)]">Visão financeira</p>
              <p className="mt-1 text-sm text-[var(--color-ink-700)]">
                Veja valores recebidos e o que ainda esta aguardando pagamento.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3 py-1">
            <div className="mt-1 rounded-lg bg-success-50 p-2 text-success-600">
              <ReceiptText className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink-950)]">Histórico recente</p>
              <p className="mt-1 text-sm text-[var(--color-ink-700)]">
                Os registros exibem status, forma de pagamento e datas mais recentes.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3 py-1">
            <div className="mt-1 rounded-lg bg-warning-50 p-2 text-warning-600">
              <Clock3 className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink-950)]">Acompanhamento</p>
              <p className="mt-1 text-sm text-[var(--color-ink-700)]">
                Use a busca para localizar rapidamente o aluno que voce quer consultar.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="relative max-w-sm">
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-500)]" />
        <Input className="pl-11" placeholder="Buscar aluno..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.map((aluno) => {
        const getPagamento = (mes: string) => aluno.pagamentos.find((p) => p.mesReferencia === mes)
        return (
          <Card key={aluno.id}>
            <CardHeader className="border-b border-black/5 pb-4">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  {aluno.nome}
                  <Badge variant="secondary" className="px-2.5 text-[11px]">{aluno.turma}</Badge>
                </CardTitle>
                <Link href={`/responsavel/declaracao?alunoId=${aluno.id}&ano=${new Date().getFullYear()}`} className="text-xs text-brand-600 underline-offset-2 hover:underline">
                  Declaração anual
                </Link>
              </div>
              <p className="text-sm text-[var(--color-ink-700)]">
                Mensalidade: {formatMoney(aluno.mensalidade - aluno.desconto)}
                {aluno.desconto > 0 && <span className="ml-1 text-success-600">(desconto de {formatMoney(aluno.desconto)})</span>}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {meses.map((mes) => {
                  const p = getPagamento(mes)
                  const [ano, mesNum] = mes.split("-")
                  const nomeMes = format(new Date(Number(ano), Number(mesNum) - 1), "MMMM", { locale: ptBR })
                  const emDia = p?.dataPagamento
                  return (
                    <div key={mes} className="flex flex-col gap-2 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-medium capitalize text-[var(--color-ink-900)]">{nomeMes}/{ano}</span>
                      <div className="flex flex-wrap items-center gap-3">
                        {p ? (
                          <>
                            <span className="text-xs text-[var(--color-ink-500)]">
                              {p.formaPagamento ? `${p.formaPagamento} · ${format(new Date(p.dataPagamento!), "dd/MM")}` : ""}
                            </span>
                            <span className={`font-semibold ${emDia ? "text-success-600" : "text-[var(--color-ink-700)]"}`}>
                              {p.valorRecebido != null ? formatMoney(p.valorRecebido) : "—"}
                            </span>
                            {emDia
                              ? <CheckCircle className="size-4 text-success-600" />
                              : <AlertTriangle className="size-4 text-warning-600" />
                            }
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-[var(--color-ink-500)]">Aguardando</span>
                            <span className="text-[var(--color-ink-700)]">{formatMoney(aluno.mensalidade - aluno.desconto)}</span>
                            <AlertTriangle className="size-4 text-warning-600" />
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-[var(--color-ink-700)]">
            Nenhum aluno encontrado para essa busca.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
