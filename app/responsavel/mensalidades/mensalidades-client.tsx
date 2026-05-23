"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, CreditCard, CheckCircle, AlertTriangle, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

type Pagamento = {
  mesReferencia: string
  dataVencimento: string
  dataPagamento: string | null
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

  const meses = [
    "2026-01", "2026-02", "2026-03", "2026-04", "2026-05",
    "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12",
  ]

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <Link href="/responsavel" className="inline-flex items-center justify-center size-9 rounded-md hover:bg-muted transition-colors">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-heading">Mensalidades</h1>
          <p className="text-sm text-muted-foreground">{responsavel.nome}</p>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input className="pl-8" placeholder="Buscar aluno..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.map((aluno) => {
        const getPagamento = (mes: string) => aluno.pagamentos.find((p) => p.mesReferencia === mes)
        return (
          <Card key={aluno.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                {aluno.nome}
                <Badge variant="secondary" className="text-[10px]">{aluno.turma}</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Mensalidade: R$ {(aluno.mensalidade - aluno.desconto).toFixed(2)}
                {aluno.desconto > 0 && <span className="text-success-600 ml-1">(desconto de R$ {aluno.desconto.toFixed(2)})</span>}
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
                    <div key={mes} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="capitalize">{nomeMes}/{ano}</span>
                      <div className="flex items-center gap-3">
                        {p ? (
                          <>
                            <span className="text-xs text-muted-foreground">
                              {p.formaPagamento ? `${p.formaPagamento} · ${format(new Date(p.dataPagamento!), "dd/MM")}` : ""}
                            </span>
                            <span className={cn("font-semibold", emDia ? "text-success-600" : "")}>
                              R$ {p.valorRecebido?.toFixed(2) ?? "—"}
                            </span>
                            {emDia
                              ? <CheckCircle className="size-4 text-success-600" />
                              : <AlertTriangle className="size-4 text-warning-600" />
                            }
                          </>
                        ) : (
                          <>
                            <span className="text-muted-foreground text-xs">Aguardando</span>
                            <span className="text-muted-foreground">R$ {(aluno.mensalidade - aluno.desconto).toFixed(2)}</span>
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
    </div>
  )
}
