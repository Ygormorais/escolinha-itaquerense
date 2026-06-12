"use client"

import { useState, useTransition } from "react"
import { sanitizeCSVCell, plural } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { format, differenceInDays } from "date-fns"
import { AlertTriangle, Phone, CheckCircle, Download, MessageCircle, Search, Send } from "lucide-react"
import { EmailNotifButton } from "@/components/ui/email-notif-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { toast } from "sonner"
import { marcarComoPago } from "@/app/actions/pagamentos"
import { PixButton } from "@/components/ui/pix-modal"

type Pagamento = {
  id: number
  mesReferencia: string
  dataVencimento: Date
  externalId: string | null
  statusCobranca: string | null
  canalPrevisto: string | null
}

type Inadimplente = {
  alunoId: number
  nome: string
  turma: string
  telefone: string
  mensalidade: number
  pagamentos: Pagamento[]
}

const FORMAS = ["Pix", "Dinheiro", "Cartão de Débito", "Cartão de Crédito", "Transferência"]

function PagarDialog({ inadimplente, onClose }: { inadimplente: Inadimplente; onClose: () => void }) {
  const [pagamentoId, setPagamentoId] = useState<number>(inadimplente.pagamentos[inadimplente.pagamentos.length - 1]?.id ?? 0)
  const [data, setData] = useState(format(new Date(), "yyyy-MM-dd"))
  const [forma, setForma] = useState(FORMAS[0])
  const [valor, setValor] = useState(inadimplente.mensalidade.toFixed(2))
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleSalvar() {
    startTransition(async () => {
      const result = await marcarComoPago(pagamentoId, {
        dataPagamento: data,
        formaPagamento: forma,
        valorRecebido: parseFloat(valor),
      })
      if ("error" in result) { toast.error(result.error); return }
      toast.success("Pagamento registrado")
      onClose()
      router.refresh()
    })
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Registrar Pagamento — {inadimplente.nome}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-2">
        <div>
          <label className="text-sm font-medium">Mês de referência</label>
          <Select value={String(pagamentoId)} onValueChange={(v) => setPagamentoId(Number(v))}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {inadimplente.pagamentos.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.mesReferencia} — venc. {format(p.dataVencimento, "dd/MM/yyyy")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Data do pagamento</label>
          <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className="mt-1" />
        </div>

        <div>
          <label className="text-sm font-medium">Forma de pagamento</label>
          <Select value={forma} onValueChange={(v) => { if (v) setForma(v) }}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORMAS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Valor recebido (R$)</label>
          <Input
            type="number"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <DialogFooter showCloseButton>
        <Button
          onClick={handleSalvar}
          disabled={pending}
          className="bg-brand-800 text-white hover:bg-brand-900"
        >
          <CheckCircle className="size-4" />
          {pending ? "Salvando..." : "Registrar Pagamento"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

function exportarCSV(inadimplentes: Inadimplente[]) {
  const linhas = [
    ["Nome", "Turma", "Telefone", "Meses em Aberto", "Valor em Aberto (R$)", "Vencimento Mais Antigo"],
    ...inadimplentes.map((a) => [
      a.nome,
      a.turma,
      a.telefone,
      String(a.pagamentos.length),
      (a.mensalidade * a.pagamentos.length).toFixed(2),
      a.pagamentos[0] ? format(a.pagamentos[0].dataVencimento, "dd/MM/yyyy") : "",
    ]),
  ]

  const csv = linhas.map((l) => l.map(sanitizeCSVCell).join(";")).join("\n")
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `inadimplentes-${format(new Date(), "yyyy-MM-dd")}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function gerarLinkWA(a: Inadimplente, nomeClube: string) {
  const texto = `Olá ${a.nome.split(" ")[0]}, tudo bem? 😊\n\nPassando para avisar que identificamos ${plural(a.pagamentos.length, "mensalidade", "mensalidades", "nenhuma")} em aberto na ${nomeClube}.\n\nPoderia nos contatar para regularizar? Obrigado! 🙏`
  return `https://wa.me/55${a.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`
}

export function InadimplenciaClient({
  inadimplentes,
  chavePix,
  nomeClube,
  cidade,
}: {
  inadimplentes: Inadimplente[]
  chavePix?: string
  nomeClube?: string
  cidade?: string
}) {
  const now = new Date()
  const [dialogAluno, setDialogAluno] = useState<Inadimplente | null>(null)
  const [search, setSearch] = useState("")
  const [turmaFilter, setTurmaFilter] = useState("Todas")
  const [nivelFilter, setNivelFilter] = useState("Todos")
  const [enviando, setEnviando] = useState(false)

  const TURMAS = [...new Set(inadimplentes.map((a) => a.turma))].sort()

  const filtered = inadimplentes.filter((a) => {
    const matchSearch = !search || a.nome.toLowerCase().includes(search.toLowerCase())
    const matchTurma = turmaFilter === "Todas" || a.turma === turmaFilter
    if (!matchSearch || !matchTurma) return false
    if (nivelFilter === "Todos") return true
    const diasAtraso = differenceInDays(now, a.pagamentos[0]?.dataVencimento ?? now)
    const isCritico = diasAtraso > 30
    return nivelFilter === "Crítico" ? isCritico : !isCritico
  })

  async function handleNotificarEmLote() {
    if (filtered.length === 0) return
    setEnviando(true)
    for (let i = 0; i < filtered.length; i++) {
      window.open(gerarLinkWA(filtered[i], nomeClube ?? "Escolinha"), "_blank")
      if (i < filtered.length - 1) await new Promise((r) => setTimeout(r, 800))
    }
    setEnviando(false)
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar aluno..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 max-w-xs"
            />
          </div>
          <Select value={turmaFilter} onValueChange={(v) => { if (v) setTurmaFilter(v) }}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={nivelFilter} onValueChange={(v) => { if (v) setNivelFilter(v) }}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Crítico">Crítico</SelectItem>
              <SelectItem value="Atenção">Atenção</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <ConfirmDialog title="Notificar inadimplentes?" description={`Abrir WhatsApp para ${plural(filtered.length, "inadimplente", "inadimplentes", "nenhum")}? Os links serão abertos um a um.`} confirmLabel="Abrir WhatsApp" variant="warning" onConfirm={handleNotificarEmLote}>
            <Button variant="outline" disabled={filtered.length === 0 || enviando} className="text-success-600 border-success-600/30 hover:bg-success-50">
              <Send className="size-4" />
              {enviando ? "Enviando..." : `Notificar ${filtered.length} via WhatsApp`}
            </Button>
          </ConfirmDialog>
          <EmailNotifButton />
          <Button
            variant="outline"
            onClick={() => exportarCSV(inadimplentes)}
            disabled={inadimplentes.length === 0}
          >
            <Download className="size-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="text-center">Meses em Aberto</TableHead>
              <TableHead className="text-right">Valor em Aberto</TableHead>
              <TableHead>Vencimento Mais Antigo</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead>Cobrança</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  {search ? "Nenhum resultado para a busca" : "Nenhum aluno inadimplente"}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((a) => {
              const maisAntigo = a.pagamentos[0]?.dataVencimento ?? new Date()
              const diasAtraso = differenceInDays(now, maisAntigo)
              const isCritico = diasAtraso > 30
              const valorAberto = a.mensalidade * a.pagamentos.length

              return (
                <TableRow key={a.alunoId}>
                  <TableCell className="font-medium">{a.nome}</TableCell>
                  <TableCell>{a.turma}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <a
                        href={`tel:${a.telefone}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-800 hover:underline"
                      >
                        <Phone className="size-3" />
                        {a.telefone}
                      </a>
                      <a
                        href={gerarLinkWA(a, nomeClube ?? "Escolinha")}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-success-600 hover:underline"
                      >
                        <MessageCircle className="size-3" />
                        WhatsApp
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{a.pagamentos.length}</TableCell>
                  <TableCell className="text-right">
                    R$ {valorAberto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-danger-600">
                    {format(maisAntigo, "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    {isCritico ? (
                      <Badge variant="destructive" className="inline-flex items-center gap-1">
                        <AlertTriangle className="size-3" /> Crítico
                      </Badge>
                    ) : (
                      <Badge className="inline-flex items-center gap-1 bg-warning-50 text-warning-600">
                        <AlertTriangle className="size-3" /> Atenção
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {a.pagamentos.some((p) => p.externalId) ? (
                      <span className="text-xs text-muted-foreground">
                        {a.pagamentos.find((p) => p.externalId)?.canalPrevisto} · {a.pagamentos.find((p) => p.externalId)?.statusCobranca}
                      </span>
                    ) : (
                      <span className="text-xs text-warning-600">Sem cobrança</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        title="Registrar pagamento"
                        onClick={() => setDialogAluno(a)}
                      >
                        <CheckCircle className="size-4 text-success-600" />
                      </Button>
                      {chavePix && nomeClube && cidade && (
                        <PixButton
                          chave={chavePix}
                          nomeClube={nomeClube}
                          cidade={cidade}
                          valor={a.mensalidade * a.pagamentos.length}
                          descricao={`${a.pagamentos.length}x mensalidade ${a.nome.split(" ")[0]}`}
                          telefoneResponsavel={a.telefone}
                          nomeResponsavel={a.nome}
                          size="sm"
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!dialogAluno} onOpenChange={(open) => { if (!open) setDialogAluno(null) }}>
        {dialogAluno && (
          <PagarDialog inadimplente={dialogAluno} onClose={() => setDialogAluno(null)} />
        )}
      </Dialog>
    </>
  )
}
