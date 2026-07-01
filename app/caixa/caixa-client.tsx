import { PiggyBank, TrendingUp, CreditCard, Smartphone, FileText, Percent, Banknote, Building2, Inbox } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import Link from "next/link"
import type { RscDate } from "@/lib/rsc-date"
import { formatMoney, plural } from "@/lib/utils"

type Pagamento = {
  id: number
  mesReferencia: string
  dataPagamento: RscDate | null
  formaPagamento: string | null
  valorRecebido: number | null
  aluno: { id: number; nome: string; turma: string }
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
  totalRecebido,
  totalMaquininhaPendente,
  totalDescontos,
}: {
  pagamentosMes: Pagamento[]
  custosMes: Custo[]
  porForma: Record<string, number>
  alunos: Aluno[]
  totalRecebido: number
  totalMaquininhaPendente: number
  totalDescontos: number
}) {
  const noMes = "no mês"
  const sections = [
    { href: "/caixa/recebimentos", label: "Recebimentos", icon: TrendingUp, color: "text-success-600 bg-success-50", valor: formatMoney(totalRecebido), sub: plural(pagamentosMes.length, "pagamento", "pagamentos", "nenhum") + ` ${noMes}` },
    { href: "/caixa/pix", label: "PIX", icon: Smartphone, color: "text-info-600 bg-info-50", valor: formatMoney(porForma["PIX"] ?? 0), sub: noMes },
    { href: "/caixa/boleto", label: "Boleto", icon: FileText, color: "text-warning-600 bg-warning-50", valor: formatMoney(porForma["Boleto"] ?? 0), sub: noMes },
    { href: "/caixa/dinheiro", label: "Dinheiro", icon: Banknote, color: "text-success-600 bg-success-50", valor: formatMoney(porForma["Dinheiro"] ?? 0), sub: noMes },
    { href: "/caixa/maquina", label: "Maquininha", icon: CreditCard, color: "text-brand-800 bg-brand-100", valor: formatMoney(totalMaquininhaPendente), sub: "pendente de reconciliação" },
    { href: "/caixa/descontos", label: "Descontos", icon: Percent, color: "text-danger-600 bg-danger-50", valor: formatMoney(totalDescontos), sub: "concedidos por mês" },
    { href: "/caixa/extrato", label: "Extrato", icon: Building2, color: "text-muted-foreground bg-muted", valor: "Banco", sub: "entradas e saídas" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {sections.map(({ href, label, icon: Icon, color, valor, sub }) => (
          <Link key={href} href={href}>
            <Card className="h-full cursor-pointer transition-all hover:shadow-md hover:-translate-y-px">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</CardTitle>
                  <div className={`flex size-9 items-center justify-center rounded-lg ${color}`}>
                    <Icon className="size-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-lg font-bold tracking-tight text-foreground">{valor}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-heading">
              <TrendingUp className="size-4 text-success-600" />
              Últimos Recebimentos
            </CardTitle>
            {pagamentosMes.length > 8 && (
              <Link href="/caixa/recebimentos" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Ver todos ({pagamentosMes.length})
              </Link>
            )}
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
                    <TableCell className="font-medium">
                      <Link href={`/alunos/${p.aluno.id}`} className="hover:underline text-brand-800">{p.aluno.nome}</Link>
                    </TableCell>
                    <TableCell>{formatMoney(p.valorRecebido ?? 0)}</TableCell>
                    <TableCell>{p.formaPagamento || "—"}</TableCell>
                    <TableCell>{p.dataPagamento ? format(new Date(p.dataPagamento), "dd/MM") : "—"}</TableCell>
                  </TableRow>
                ))}
                {pagamentosMes.length === 0 && (
                  <TableRow><TableCell colSpan={4}><div className="flex flex-col items-center gap-2 py-8 text-center"><Inbox className="size-7 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">Nenhum recebimento no mês</p></div></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-heading">
              <PiggyBank className="size-4 text-danger-600" />
              Últimos Custos
            </CardTitle>
            {custosMes.length > 8 && (
              <Link href="/custos" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Ver todos ({custosMes.length})
              </Link>
            )}
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
                  <TableRow><TableCell colSpan={4}><div className="flex flex-col items-center gap-2 py-8 text-center"><Inbox className="size-7 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">Nenhum custo no mês</p></div></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
