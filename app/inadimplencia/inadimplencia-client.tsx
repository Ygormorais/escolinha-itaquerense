"use client"

import { useState, useTransition } from "react"
import { sanitizeCSVCell, plural, formatPhone, formatMoney } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { format, differenceInDays } from "date-fns"
import { AlertTriangle, Phone, CheckCircle, Download, MessageCircle, Search, Send, Loader2, CheckSquare, Square, PartyPopper } from "lucide-react"
import Link from "next/link"
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
import { notificarInadimplentesEmLote } from "@/app/actions/whatsapp"
import { PixButton } from "@/components/ui/pix-modal"
import { Label } from "@/components/ui/label"

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
          <Label>Mês de referência</Label>
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
          <Label htmlFor="pagar-data">Data do pagamento</Label>
          <Input id="pagar-data" type="date" value={data} onChange={(e) => setData(e.target.value)} className="mt-1" />
        </div>

        <div>
          <Label>Forma de pagamento</Label>
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
          <Label htmlFor="pagar-valor">Valor recebido (R$)</Label>
          <Input
            id="pagar-valor"
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
          {pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
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

function gerarLinkWA(a: Inadimplente, nomeClube: string, template?: string) {
  let texto: string
  if (template) {
    const nome = a.nome.split(" ")[0]
    const linhasMeses = a.pagamentos.map((p) => `• ${p.mesReferencia}`).join("\n")
    const total = (a.mensalidade * a.pagamentos.length).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    texto = template
      .replace("{responsavel}", nome)
      .replace("{aluno}", a.nome)
      .replace("{meses}", linhasMeses)
      .replace("{total}", total)
      .replace("{pix}", "")
  } else {
    texto = `Olá ${a.nome.split(" ")[0]}, tudo bem? 😊\n\nPassando para avisar que identificamos ${plural(a.pagamentos.length, "mensalidade", "mensalidades", "nenhuma")} em aberto na ${nomeClube}.\n\nPoderia nos contatar para regularizar? Obrigado! 🙏`
  }
  return `https://wa.me/55${a.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`
}

export function InadimplenciaClient({
  inadimplentes,
  chavePix,
  nomeClube,
  cidade,
  templateCobranca,
}: {
  inadimplentes: Inadimplente[]
  chavePix?: string
  nomeClube?: string
  cidade?: string
  templateCobranca?: string
}) {
  const now = new Date()
  const [dialogAluno, setDialogAluno] = useState<Inadimplente | null>(null)
  const [search, setSearch] = useState("")
  const [turmaFilter, setTurmaFilter] = useState("Todas")
  const [nivelFilter, setNivelFilter] = useState("Todos")
  const [enviando, startEnviando] = useTransition()
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set())
  const [enviandoLote, startEnviandoLote] = useTransition()

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

  function toggleSelecionado(id: number) {
    setSelecionados((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleTodos() {
    if (selecionados.size === filtered.length) {
      setSelecionados(new Set())
    } else {
      setSelecionados(new Set(filtered.map((a) => a.alunoId)))
    }
  }

  function handleEnviarLoteAPI() {
    const ids = Array.from(selecionados)
    if (ids.length === 0) return
    startEnviandoLote(async () => {
      const result = await notificarInadimplentesEmLote(ids)
      toast.success(`Enviado: ${result.enviados} · Erros: ${result.erros} · Sem tel: ${result.semTelefone}`)
      setSelecionados(new Set())
    })
  }

  function handleNotificarEmLote() {
    if (filtered.length === 0) return
    startEnviando(async () => {
      for (let i = 0; i < filtered.length; i++) {
        window.open(gerarLinkWA(filtered[i], nomeClube ?? "Escolinha", templateCobranca), "_blank")
        if (i < filtered.length - 1) await new Promise((r) => setTimeout(r, 800))
      }
    })
  }

  const totalAberto = inadimplentes.reduce((s, a) => s + a.mensalidade * a.pagamentos.length, 0)
  const criticos = inadimplentes.filter((a) => differenceInDays(now, a.pagamentos[0]?.dataVencimento ?? now) > 30).length
  const mediaMeses = inadimplentes.length > 0
    ? (inadimplentes.reduce((s, a) => s + a.pagamentos.length, 0) / inadimplentes.length).toFixed(1)
    : "0"

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Inadimplentes</p>
          <p className="mt-1 text-2xl font-extrabold text-danger-600">{inadimplentes.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total em Aberto</p>
          <p className="mt-1 text-xl font-extrabold text-danger-600">{formatMoney(totalAberto)}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Críticos &gt;30d</p>
          <p className={`mt-1 text-2xl font-extrabold ${criticos > 0 ? "text-danger-600" : "text-muted-foreground"}`}>{criticos}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Média Meses</p>
          <p className="mt-1 text-2xl font-extrabold">{mediaMeses}</p>
        </div>
      </div>

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
            <SelectTrigger className="h-12 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={nivelFilter} onValueChange={(v) => { if (v) setNivelFilter(v) }}>
            <SelectTrigger className="h-12 w-32">
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
          {selecionados.size > 0 && (
            <ConfirmDialog
              title={`Enviar cobrança para ${selecionados.size} aluno(s)?`}
              description="Mensagens serão enviadas via WhatsApp pelo sistema, sem abrir abas do navegador."
              confirmLabel="Enviar agora"
              onConfirm={handleEnviarLoteAPI}
            >
              <Button disabled={enviandoLote} className="bg-success-600 text-white hover:bg-success-700">
                {enviandoLote ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {enviandoLote ? "Enviando..." : `Cobrar ${selecionados.size} selecionados`}
              </Button>
            </ConfirmDialog>
          )}
          <ConfirmDialog title="Notificar inadimplentes?" description={`Abrir WhatsApp para ${plural(filtered.length, "inadimplente", "inadimplentes", "nenhum")}? Os links serão abertos um a um.`} confirmLabel="Abrir WhatsApp" variant="warning" onConfirm={handleNotificarEmLote}>
            <Button variant="outline" disabled={filtered.length === 0 || enviando} className="text-success-600 border-success-600/30 hover:bg-success-50">
              {enviando ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
              {enviando ? "Abrindo..." : `WhatsApp (${filtered.length})`}
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
              <TableHead className="w-10">
                <button onClick={toggleTodos} className="flex items-center justify-center">
                  {selecionados.size === filtered.length && filtered.length > 0
                    ? <CheckSquare className="size-4 text-brand-600" />
                    : <Square className="size-4 text-muted-foreground" />}
                </button>
              </TableHead>
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
                <TableCell colSpan={10}>
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    {search ? (
                      <Search className="size-8 text-muted-foreground/30" />
                    ) : (
                      <PartyPopper className="size-8 text-success-400/60" />
                    )}
                    <p className="text-sm text-muted-foreground">
                      {search ? "Nenhum resultado para a busca" : "Nenhum aluno inadimplente 🎉"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {filtered.map((a) => {
              const maisAntigo = a.pagamentos[0]?.dataVencimento ?? new Date()
              const diasAtraso = differenceInDays(now, maisAntigo)
              const isCritico = diasAtraso > 30
              const valorAberto = a.mensalidade * a.pagamentos.length

              return (
                <TableRow key={a.alunoId} className={selecionados.has(a.alunoId) ? "bg-brand-50" : ""}>
                  <TableCell>
                    <button onClick={() => toggleSelecionado(a.alunoId)} className="flex items-center justify-center">
                      {selecionados.has(a.alunoId)
                        ? <CheckSquare className="size-4 text-brand-600" />
                        : <Square className="size-4 text-muted-foreground" />}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/alunos/${a.alunoId}`} className="hover:underline text-brand-800">{a.nome}</Link>
                  </TableCell>
                  <TableCell>{a.turma}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <a
                        href={`tel:${a.telefone}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-800 hover:underline"
                      >
                        <Phone className="size-3" />
                        {formatPhone(a.telefone)}
                      </a>
                      <a
                        href={gerarLinkWA(a, nomeClube ?? "Escolinha", templateCobranca)}
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
                    {formatMoney(valorAberto)}
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
                        aria-label="Registrar pagamento"
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
