"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Upload, CheckCircle, XCircle, RefreshCw, AlertTriangle, Smartphone } from "lucide-react"
import { formatMoney } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MonthInput } from "@/components/ui/month-input"
import { Card, CardContent } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { toast } from "sonner"
import { importarCSV, reconciliarTransacao, reconciliarAuto, ignorarTransacao } from "@/app/actions/maquina"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { toDate, type RscDate } from "@/lib/rsc-date"

type Transacao = {
  id: number
  dataTransacao: RscDate
  valor: number
  parcelas: number
  bandeira: string
  tipo: string
  nomeNoCartao: string
  parcela: string | null
  autorizacao: string | null
  nsu: string | null
  custoTaxa: number | null
  valorLiquido: number | null
  arquivo: string
  status: string
  aluno: { id: number; nome: string; turma: string } | null
}

type Aluno = { id: number; nome: string; responsavel: string }

export function MaquinaClient({ transacoes, alunos }: { transacoes: Transacao[]; alunos: Aluno[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState("todas")
  const [filtroPeriodo, setFiltroPeriodo] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTransacao, setSelectedTransacao] = useState<Transacao | null>(null)
  const [alunoId, setAlunoId] = useState("")
  const [mesRef, setMesRef] = useState("")
  const [obs, setObs] = useState("")
  const [pending, start] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = transacoes.filter((t) => {
    if (filter !== "todas" && t.status !== filter) return false
    if (filtroPeriodo) {
      const d = toDate(t.dataTransacao)
      const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (mes !== filtroPeriodo) return false
    }
    return true
  })

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    start(async () => {
      const text = await file.text()
      const result = await importarCSV(text, file.name)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        toast.success(`${result.importadas} transações importadas (${result.ignoradas} duplicadas ignoradas) — Formato: ${result.formato}`)
        router.refresh()
      }
    })
    if (fileRef.current) fileRef.current.value = ""
  }

  function openReconcile(t: Transacao) {
    setSelectedTransacao(t)
    const dt = toDate(t.dataTransacao)
    const mes = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`
    setMesRef(mes)
    setAlunoId(t.aluno?.id ? String(t.aluno.id) : "")
    setObs(`Reconciliado - ${t.nomeNoCartao}`)
    setDialogOpen(true)
  }

  function handleReconcile() {
    if (!selectedTransacao || !alunoId) { toast.error("Selecione um aluno"); return }
    if (!mesRef) { toast.error("Selecione o mês de referência"); return }
    start(async () => {
      const result = await reconciliarTransacao(selectedTransacao.id, Number(alunoId), mesRef, `${mesRef}-10`, obs)
      if ("success" in result) {
        toast.success("Transação reconciliada com sucesso!")
        setDialogOpen(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleReconcileAuto() {
    start(async () => {
      const result = await reconciliarAuto()
      toast.success(`${result.reconciliados} reconciliados, ${result.naoEncontrados} não encontrados`)
      router.refresh()
    })
  }

  function handleIgnorar(id: number) {
    start(async () => {
      await ignorarTransacao(id)
      toast.success("Transação ignorada")
      router.refresh()
    })
  }

  const totalValor = filtered.reduce((s, t) => s + t.valor, 0)
  const reconciliadas = filtered.filter((t) => t.status === "reconciliado").length
  const pendentes = filtered.filter((t) => t.status === "pendente").length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Transações</p>
          <p className="mt-1 text-2xl font-extrabold text-brand-800">{filtered.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
          <p className="mt-1 text-xl font-extrabold text-success-700">{formatMoney(totalValor)}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Reconciliadas</p>
          <p className="mt-1 text-2xl font-extrabold text-success-700">{reconciliadas}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pendentes</p>
          <p className={`mt-1 text-2xl font-extrabold ${pendentes > 0 ? "text-warning-600" : "text-muted-foreground"}`}>{pendentes}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={pending} className="gap-2">
            <Upload className="size-4" />
            Importar CSV
          </Button>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
          <ConfirmDialog title="Reconciliar automaticamente?" description="Todas as transações pendentes serão reconciliadas automaticamente." confirmLabel="Reconciliar" variant="warning" onConfirm={handleReconcileAuto}>
            <Button variant="outline" disabled={pending} className="gap-2">
              <RefreshCw className="size-4" />
              Reconciliar Automático
            </Button>
          </ConfirmDialog>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            value={filtroPeriodo}
            onChange={(e) => setFiltroPeriodo(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {filtroPeriodo && (
            <Button variant="ghost" size="sm" onClick={() => setFiltroPeriodo("")}>Limpar</Button>
          )}
          <span className="text-border">|</span>
          {["todas", "pendente", "reconciliado", "ignorado"].map((f) => (
            <Button key={f} variant={filter === f ? "default" : "ghost"} size="sm" onClick={() => setFilter(f)}>
              {f === "todas" ? "Todas" : f === "pendente" ? "Pendentes" : f === "reconciliado" ? "Reconciliadas" : "Ignoradas"}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Bandeira</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Nome no Cartão</TableHead>
                <TableHead>Parcelas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aluno</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9}>
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <Smartphone className="size-8 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Nenhuma transação encontrada. Importe um CSV da sua maquininha.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{format(new Date(t.dataTransacao), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="font-medium">{formatMoney(t.valor)}</TableCell>
                  <TableCell>{t.bandeira || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={t.tipo === "debito" ? "default" : "secondary"} className="text-[10px]">
                      {t.tipo === "debito" ? "Débito" : "Crédito"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate" title={t.nomeNoCartao}>{t.nomeNoCartao || "—"}</TableCell>
                  <TableCell>{t.parcelas > 1 ? `${t.parcelas}x` : "À vista"}</TableCell>
                  <TableCell>
                    <Badge variant={
                      t.status === "reconciliado" ? "default" :
                      t.status === "ignorado" ? "outline" : "secondary"
                    } className="gap-1">
                      {t.status === "reconciliado" ? <CheckCircle className="size-3" /> :
                       t.status === "ignorado" ? <XCircle className="size-3" /> :
                       <AlertTriangle className="size-3" />}
                      {t.status === "reconciliado" ? "Ok" : t.status === "ignorado" ? "Ignorado" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {t.aluno ? (
                      <Link href={`/alunos/${t.aluno.id}`} className="hover:underline text-brand-800">{t.aluno.nome}</Link>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {t.status === "pendente" && (
                      <div className="flex gap-1">
                        <Button size="icon-xs" variant="outline" onClick={() => openReconcile(t)} aria-label="Reconciliar transação">
                          <CheckCircle className="size-3 text-success-600" />
                        </Button>
                        <Button size="icon-xs" variant="ghost" onClick={() => handleIgnorar(t.id)} aria-label="Ignorar transação">
                          <XCircle className="size-3 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reconciliar Transação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedTransacao && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                <p className="text-sm font-medium">{formatMoney(selectedTransacao.valor)} — {selectedTransacao.bandeira} {selectedTransacao.tipo}</p>
                <p className="text-xs text-muted-foreground">{selectedTransacao.nomeNoCartao} · {format(new Date(selectedTransacao.dataTransacao), "dd/MM/yyyy")}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Aluno</Label>
              <Select value={alunoId} onValueChange={(v) => { if (v) setAlunoId(v) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um aluno..." />
                </SelectTrigger>
                <SelectContent>
                  {alunos.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.nome} ({a.responsavel})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mes-ref">Mês de Referência</Label>
              <MonthInput
                id="mes-ref"
                value={mesRef}
                onChange={setMesRef}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="obs-reconcile">Observações</Label>
              <Input id="obs-reconcile" value={obs} onChange={(e) => setObs(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleReconcile} disabled={pending || !alunoId || !mesRef} className="gap-2">
              <CheckCircle className="size-4" />
              Reconciliar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
