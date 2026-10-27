"use client"

import { useState, useTransition } from "react"
import { plural } from "@/lib/utils"
import { format } from "date-fns"
import { Download, Loader2, MessageCircle, Search, Send } from "lucide-react"
import { EmailNotifButton } from "@/components/ui/email-notif-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Dialog } from "@/components/ui/dialog"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { notificarInadimplentesEmLote } from "@/app/actions/whatsapp"
import { InadimplenciaListaMobile } from "./inadimplencia-lista-mobile"
import { InadimplenciaTabela } from "./inadimplencia-tabela"
import { PagarDialog } from "./pagar-dialog"
import {
  filtrarInadimplentes,
  gerarCSVInadimplentes,
  gerarLinkWA,
  turmasDosInadimplentes,
  type Inadimplente,
} from "./inadimplencia-utils"

function baixarCSV(inadimplentes: Inadimplente[]) {
  const csv = gerarCSVInadimplentes(inadimplentes)
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `inadimplentes-${format(new Date(), "yyyy-MM-dd")}.csv`
  a.click()
  URL.revokeObjectURL(url)
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

  const TURMAS = turmasDosInadimplentes(inadimplentes)
  const filtered = filtrarInadimplentes(inadimplentes, { search, turma: turmaFilter, nivel: nivelFilter }, now)

  function toggleSelecionado(id: number) {
    setSelecionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
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

  const listaProps = {
    inadimplentes: filtered,
    agora: now,
    buscando: !!search,
    selecionados,
    onToggle: toggleSelecionado,
    onRegistrar: setDialogAluno,
    chavePix,
    nomeClube,
    cidade,
    templateCobranca,
  }

  return (
    <>
      <div data-slot="delinquency-filter-bar" className="grid min-w-0 gap-3 rounded-[var(--radius-card)] border bg-card p-4 lg:grid-cols-[minmax(14rem,1fr)_10rem_10rem]">
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="inadimplencia-busca" className="text-xs">Buscar aluno</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="inadimplencia-busca"
              type="search"
              placeholder="Buscar aluno..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9"
            />
          </div>
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label id="inadimplencia-turma-label" className="text-xs">Turma</Label>
          <Select value={turmaFilter} onValueChange={(v) => { if (v) setTurmaFilter(v) }}>
            <SelectTrigger aria-labelledby="inadimplencia-turma-label" className="h-12 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label id="inadimplencia-nivel-label" className="text-xs">Nível de atraso</Label>
          <Select value={nivelFilter} onValueChange={(v) => { if (v) setNivelFilter(v) }}>
            <SelectTrigger aria-labelledby="inadimplencia-nivel-label" className="h-12 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Crítico">Crítico</SelectItem>
              <SelectItem value="Atenção">Atenção</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div data-slot="delinquency-actions" className="mt-3 flex min-w-0 flex-wrap gap-2">
        {selecionados.size > 0 && (
          <ConfirmDialog
            title={`Enviar cobrança para ${selecionados.size} aluno(s)?`}
            description="Mensagens serão enviadas via WhatsApp pelo sistema, sem abrir abas do navegador."
            confirmLabel="Enviar agora"
            onConfirm={handleEnviarLoteAPI}
          >
            <Button disabled={enviandoLote} className="max-w-full bg-success-600 text-white hover:bg-success-700">
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
          onClick={() => baixarCSV(inadimplentes)}
          disabled={inadimplentes.length === 0}
        >
          <Download className="size-4" />
          Exportar CSV
        </Button>
      </div>

      <InadimplenciaListaMobile {...listaProps} />

      <InadimplenciaTabela {...listaProps} onToggleTodos={toggleTodos} />

      <Dialog open={!!dialogAluno} onOpenChange={(open) => { if (!open) setDialogAluno(null) }}>
        {dialogAluno && (
          <PagarDialog inadimplente={dialogAluno} onClose={() => setDialogAluno(null)} />
        )}
      </Dialog>
    </>
  )
}
