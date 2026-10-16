"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { plural } from "@/lib/utils"
import { MessageCircle, ListChecks, Download, FileUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MonthInput } from "@/components/ui/month-input"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { FilterBar } from "@/components/ui/filter-bar"
import { toast } from "sonner"
import { GerarMensalidades } from "./gerar-mensalidades"
import { PagamentosResumo } from "./pagamentos-resumo"
import { PagamentosTabela } from "./pagamentos-tabela"
import { RegistrarLoteDialog } from "./registrar-lote-dialog"
import {
  filtrarPagamentos,
  gerarCSVPagamentos,
  mensagemLembreteVencimento,
  resumirPagamentos,
  turmasDosPagamentos,
  vencendoNaSemana,
  type Pagamento,
} from "./pagamentos-utils"

export function PagamentosClient({
  pagamentos,
  mes,
  chavePix,
  nomeClube,
  cidade,
}: {
  pagamentos: Pagamento[]
  mes: string
  chavePix?: string
  nomeClube?: string
  cidade?: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("Todos")
  const [turmaFilter, setTurmaFilter] = useState("Todas")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)

  // A navegação por mês (router.push ?mes=) não remonta este componente, então
  // a seleção sobreviveria à troca de mês e o lote agiria sobre IDs fora da tela.
  // Limpar ao trocar de mês mantém a seleção sempre dentro do mês visível — ajuste
  // de estado durante o render (padrão React p/ "estado derivado de prop"), sem effect.
  const [prevMes, setPrevMes] = useState(mes)
  if (mes !== prevMes) {
    setPrevMes(mes)
    setSelected(new Set())
  }

  const resumo = resumirPagamentos(pagamentos)
  const TURMAS = turmasDosPagamentos(pagamentos)
  const filtered = filtrarPagamentos(pagamentos, { search, status: statusFilter, turma: turmaFilter })
  const vencendoSemana = vencendoNaSemana(pagamentos)

  // Mudar busca/filtros pode tirar linhas selecionadas da lista visível — sem isso
  // o lote agiria sobre pagamentos que não estão mais na tela. Mesmo padrão de
  // ajuste de estado durante o render usado acima para a troca de mês.
  const filterKey = `${search}|${statusFilter}|${turmaFilter}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    const filteredIds = new Set(filtered.map((p) => String(p.id)))
    setSelected((prev) => new Set([...prev].filter((id) => filteredIds.has(id))))
  }

  async function handleNotificarVencendo() {
    if (vencendoSemana.length === 0) {
      toast.info("Nenhuma mensalidade vencendo nos próximos 7 dias")
      return
    }
    for (let i = 0; i < vencendoSemana.length; i++) {
      const p = vencendoSemana[i]
      const fone = (p.aluno.telefone ?? "").replace(/\D/g, "")
      if (!fone) continue
      const msg = mensagemLembreteVencimento(p, chavePix)
      window.open(`https://wa.me/55${fone}?text=${encodeURIComponent(msg)}`, "_blank")
      if (i < vencendoSemana.length - 1) await new Promise((r) => setTimeout(r, 800))
    }
  }

  function exportarCSV() {
    const csv = gerarCSVPagamentos(filtered)
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pagamentos-${mes}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <PagamentosResumo {...resumo} />

      {selected.size > 0 && (
        <div role="status" className="flex flex-wrap items-center gap-2 rounded-[var(--radius-control)] border border-brand-200 bg-brand-50 px-4 py-3">
          <span className="text-sm font-medium text-brand-800">{plural(selected.size, "selecionado", "selecionados", "nenhum")}</span>
          <Button
            size="sm"
            onClick={() => setBulkOpen(true)}
            className="bg-brand-800 text-white hover:bg-brand-900 gap-1.5"
          >
            <ListChecks className="size-4" />
            Registrar todos
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Limpar</Button>
        </div>
      )}

      <RegistrarLoteDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        selecionados={new Set([...selected].map(Number))}
        onRegistrado={() => setSelected(new Set())}
      />

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Buscar aluno...",
          "aria-label": "Buscar aluno",
        }}
        filters={[
          <Select key="status" value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v) }}>
            <SelectTrigger className="w-full sm:w-40" aria-label="Filtrar por status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Pago">Pago</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Vencido">Vencido</SelectItem>
            </SelectContent>
          </Select>,
          <Select key="turma" value={turmaFilter} onValueChange={(v) => { if (v) setTurmaFilter(v) }}>
            <SelectTrigger className="w-full sm:w-40" aria-label="Filtrar por turma">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>,
        ]}
        activeFiltersCount={(statusFilter !== "Todos" ? 1 : 0) + (turmaFilter !== "Todas" ? 1 : 0)}
        actions={
          <>
            <Button variant="outline" className="w-full sm:w-auto" onClick={exportarCSV} disabled={filtered.length === 0}>
              <Download className="size-4" />
              Exportar CSV
            </Button>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => router.push("/pagamentos/importar")}>
              <FileUp className="size-4" />
              Importar OFX
            </Button>
          </>
        }
      />
      <section data-slot="payment-context-bar" aria-label="Período e ações de cobrança" className="flex flex-col gap-3 rounded-[var(--radius-card)] border bg-card p-4 shadow-sm lg:flex-row lg:items-end">
        <div className="w-full sm:w-auto">
          <Label htmlFor="pag-mes" className="text-muted-foreground">Mês de referência</Label>
          <MonthInput id="pag-mes" value={mes} onChange={(v) => router.push(`/pagamentos?mes=${v}`)} className="mt-1" />
        </div>
        <div className="grid w-full gap-2 sm:grid-cols-2 lg:flex lg:w-auto lg:items-center">
          <GerarMensalidades mes={mes} />

          <ConfirmDialog title="Notificar responsáveis?" description={`Abrir WhatsApp para ${vencendoSemana.length} responsável(is)? Os links serão abertos um a um.`} confirmLabel="Abrir WhatsApp" variant="warning" onConfirm={handleNotificarVencendo}>
            <Button variant="outline" className="w-full border-success-600/30 text-success-600 hover:bg-success-50 lg:w-auto">
              <MessageCircle className="size-4" />
              Notificar vencendo ({vencendoSemana.length})
            </Button>
          </ConfirmDialog>
        </div>
      </section>

      <PagamentosTabela
        pagamentos={filtered}
        selected={selected}
        onSelectionChange={setSelected}
        emptyTitle={
          search || statusFilter !== "Todos" || turmaFilter !== "Todas"
            ? "Nenhum pagamento para os filtros aplicados"
            : "Nenhum pagamento cadastrado neste mês"
        }
        chavePix={chavePix}
        nomeClube={nomeClube}
        cidade={cidade}
      />
    </div>
  )
}
