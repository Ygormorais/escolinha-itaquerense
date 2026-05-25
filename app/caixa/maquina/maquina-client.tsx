"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, CheckCircle, XCircle, RefreshCw, Search, FileText, Download, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { toast } from "sonner"
import { importarCSV, reconciliarTransacao, reconciliarAuto, ignorarTransacao } from "@/app/actions/maquina"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"

type Transacao = {
  id: number
  dataTransacao: Date
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTransacao, setSelectedTransacao] = useState<Transacao | null>(null)
  const [alunoId, setAlunoId] = useState("")
  const [mesRef, setMesRef] = useState("")
  const [obs, setObs] = useState("")
  const [confirmReconcile, setConfirmReconcile] = useState(false)
  const [pending, start] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = filter === "todas" ? transacoes : transacoes.filter((t) => t.status === filter)

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
    const mes = `${t.dataTransacao.getFullYear()}-${String(t.dataTransacao.getMonth() + 1).padStart(2, "0")}`
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

  function executeReconcile() {
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={pending} className="gap-2">
            <Upload className="size-4" />
            Importar CSV
          </Button>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
          <Button variant="outline" onClick={() => setConfirmReconcile(true)} disabled={pending} className="gap-2">
            <RefreshCw className="size-4" />
            Reconciliar Automático
          </Button>
        </div>
        <div className="flex gap-1">
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
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Nenhuma transação encontrada. Importe um CSV da sua maquininha.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{format(new Date(t.dataTransacao), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="font-medium">R$ {t.valor.toFixed(2)}</TableCell>
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
                  <TableCell>{t.aluno?.nome || "—"}</TableCell>
                  <TableCell>
                    {t.status === "pendente" && (
                      <div className="flex gap-1">
                        <Button size="icon-xs" variant="outline" onClick={() => openReconcile(t)} title="Reconciliar">
                          <CheckCircle className="size-3 text-success-600" />
                        </Button>
                        <Button size="icon-xs" variant="ghost" onClick={() => handleIgnorar(t.id)} title="Ignorar">
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

      <AlertDialog open={confirmReconcile} onOpenChange={setConfirmReconcile}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reconciliar automaticamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá processar as transações pendentes automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeReconcile}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reconciliar Transação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedTransacao && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                <p className="text-sm font-medium">R$ {selectedTransacao.valor.toFixed(2)} — {selectedTransacao.bandeira} {selectedTransacao.tipo}</p>
                <p className="text-xs text-muted-foreground">{selectedTransacao.nomeNoCartao} · {format(new Date(selectedTransacao.dataTransacao), "dd/MM/yyyy")}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Aluno</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={alunoId}
                onChange={(e) => setAlunoId(e.target.value)}
              >
                <option value="">Selecione um aluno...</option>
                {alunos.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome} ({a.responsavel})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Mês de Referência</Label>
              <input
                type="month"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={mesRef}
                onChange={(e) => setMesRef(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input value={obs} onChange={(e) => setObs(e.target.value)} />
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
