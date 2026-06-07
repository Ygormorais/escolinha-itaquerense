"use client"

import { PiggyBank, TrendingUp, CreditCard, Smartphone, FileText, Percent, Banknote } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import Link from "next/link"
import type { RscDate } from "@/lib/rsc-date"
import { formatMoney } from "@/lib/utils"

type Pagamento = {
  id: number
  mesReferencia: string
  dataPagamento: RscDate | null
  formaPagamento: string | null
  valorRecebido: number | null
  aluno: { nome: string; turma: string }
}

type Custo = {
  id: number
  data: RscDate
  categoria: string
  descricao: string
  valor: number
}

type Aluno = { id: number; nome: string }

export function CaixaClient({
  pagamentosMes,
  custosMes,
  porForma,
}: {
  pagamentosMes: Pagamento[]
  custosMes: Custo[]
  porForma: Record<string, number>
  alunos: Aluno[]
}) {
  const sections = [
    { href: "/caixa/recebimentos", label: "Recebimentos", icon: TrendingUp, color: "text-success-600 bg-success-50", desc: `${pagamentosMes.length} pagamentos no mês` },
    { href: "/caixa/pix", label: "PIX", icon: Smartphone, color: "text-info-600 bg-info-50", desc: formatMoney(porForma["PIX"] ?? 0) },
    { href: "/caixa/boleto", label: "Boleto", icon: FileText, color: "text-warning-600 bg-warning-50", desc: formatMoney(porForma["Boleto"] ?? 0) },
    { href: "/caixa/dinheiro", label: "Dinheiro", icon: Banknote, color: "text-success-600 bg-success-50", desc: formatMoney(porForma["Dinheiro"] ?? 0) },
    { href: "/caixa/maquina", label: "Maquininha", icon: CreditCard, color: "text-brand-800 bg-brand-100", desc: `Cartão crédito/débito` },
    { href: "/caixa/descontos", label: "Descontos", icon: Percent, color: "text-danger-600 bg-danger-50", desc: `Descontos concedidos` },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {sections.map(({ href, label, icon: Icon, color, desc }) => (
          <Link key={href} href={href}>
            <Card className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-px">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</CardTitle>
                  <div className={`flex size-9 items-center justify-center rounded-lg ${color}`}>
                    <Icon className="size-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-heading">
              <TrendingUp className="size-4 text-success-600" />
              Últimos Recebimentos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagamentosMes.slice(0, 8).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.aluno.nome}</TableCell>
                    <TableCell>{formatMoney(p.valorRecebido ?? 0)}</TableCell>
                    <TableCell>{p.formaPagamento || "—"}</TableCell>
                    <TableCell>{p.dataPagamento ? format(new Date(p.dataPagamento), "dd/MM") : "—"}</TableCell>
                  </TableRow>
                ))}
                {pagamentosMes.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum recebimento no mês</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-heading">
              <PiggyBank className="size-4 text-danger-600" />
              Últimos Custos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {custosMes.slice(0, 8).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.descricao}</TableCell>
                    <TableCell>{c.categoria}</TableCell>
                    <TableCell className="text-danger-600">{formatMoney(c.valor)}</TableCell>
                    <TableCell>{format(new Date(c.data), "dd/MM")}</TableCell>
                  </TableRow>
                ))}
                {custosMes.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum custo no mês</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
