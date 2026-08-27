"use client"

/* Hallmark · macrostructure: Catalogue · theme: Escolinha Orgânico / Humano · pre-emit critique: P5 H5 E5 S5 R5 V5 · contrast: pass (40–41) · nav: existing admin chrome · footer: existing admin chrome · honest: pass (46) · chrome: pass (47) · tokens: pass (48) · responsive: pass (34, 49–57) · icons: pass (30) */

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, RefreshCw, Search, Trophy, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { CampeonatoCard } from "@/components/campeonatos/campeonato-card"
import { CampeonatoSummary } from "@/components/campeonatos/campeonato-summary"
import { NovoCampeonatoDialog } from "@/components/campeonatos/novo-campeonato-dialog"
import type { Campeonato } from "@/components/campeonatos/types"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { toast } from "sonner"
import { sincronizarTodosFpfs } from "@/app/actions/campeonatos"

export function CampeonatoClient({
  campeonatos,
}: {
  campeonatos: Campeonato[]
}) {
  const router = useRouter()
  const [syncing, startSyncing] = useTransition()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [fpfsFilter, setFpfsFilter] = useState("todos")

  const comFpfs = campeonatos.filter((c) => c.fpfsEventoId != null).length
  const receitaPotencial = campeonatos.reduce((sum, c) => sum + c.taxaInscricao * c._count.inscricoes, 0)
  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase()
    return campeonatos.filter((c) => {
      if (q) {
        const hay = [c.nome, c.descricao ?? "", c.local ?? ""].join(" ").toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (statusFilter !== "todos" && c.status !== statusFilter) return false
      if (fpfsFilter === "com" && c.fpfsEventoId == null) return false
      if (fpfsFilter === "sem" && c.fpfsEventoId != null) return false
      return true
    })
  }, [campeonatos, fpfsFilter, search, statusFilter])

  function handleSyncTodos() {
    startSyncing(async () => {
      const r = await sincronizarTodosFpfs()
      if (!r.ok) { toast.error("error" in r ? r.error : "Erro ao sincronizar"); return }
      if ("novos" in r) toast.success(`FPFS: ${r.novos} novos, ${r.atualizados} atualizados em ${r.campeonatos} campeonato(s)`)
      router.refresh()
    })
  }

  const abertos = campeonatos.filter((c) => c.status === "aberto").length
  const andamento = campeonatos.filter((c) => c.status === "andamento").length
  const encerrados = campeonatos.filter((c) => c.status === "encerrado").length
  const totalInscricoes = campeonatos.reduce((s, c) => s + c._count.inscricoes, 0)

  return (
    <div className="space-y-6">
      <CampeonatoSummary
        total={campeonatos.length}
        abertos={abertos}
        andamento={andamento}
        encerrados={encerrados}
        totalInscricoes={totalInscricoes}
        receitaPotencial={receitaPotencial}
      />

      <section aria-label="Filtros e ações" className="rounded-[var(--radius-panel)] border border-border/80 bg-card p-4 shadow-sm">
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_11rem_11rem]">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="campeonato-busca">Buscar</Label>
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="campeonato-busca"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar campeonato, local ou descricao..."
                className="pl-9"
              />
            </div>
          </div>
          <div className="min-w-0 space-y-2">
            <Label id="campeonato-status-label">Status</Label>
            <Select value={statusFilter} onValueChange={(value) => value && setStatusFilter(value)}>
              <SelectTrigger aria-labelledby="campeonato-status-label" className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos status</SelectItem>
                <SelectItem value="aberto">Abertos</SelectItem>
                <SelectItem value="andamento">Em andamento</SelectItem>
                <SelectItem value="encerrado">Encerrados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-2">
            <Label id="campeonato-fpfs-label">Integração</Label>
            <Select value={fpfsFilter} onValueChange={(value) => value && setFpfsFilter(value)}>
              <SelectTrigger aria-labelledby="campeonato-fpfs-label" className="w-full">
                <SelectValue placeholder="FPFS" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos FPFS</SelectItem>
                <SelectItem value="com">Com FPFS</SelectItem>
                <SelectItem value="sem">Sem FPFS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex min-w-0 flex-col gap-3 border-t border-border/70 pt-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span aria-live="polite">{filtrados.length} de {campeonatos.length} campeonato(s) visiveis</span>
            <Badge variant="outline" className="shrink-0 text-xs">
              <Wifi className="size-3" aria-hidden="true" /> {comFpfs} conectados
            </Badge>
          </div>
          <div className="flex min-w-0 flex-col gap-2 xl:flex-row xl:items-center">
            <Button
              variant="outline"
              onClick={handleSyncTodos}
              disabled={syncing || comFpfs === 0}
              title={comFpfs === 0 ? "Nenhum campeonato com FPFS configurado" : undefined}
            >
              {syncing
                ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Sincronizando...</>
                : <><RefreshCw className="size-4" aria-hidden="true" /> Sync Tudo FPFS ({comFpfs})</>}
            </Button>
            <NovoCampeonatoDialog />
          </div>
        </div>
      </section>

      {campeonatos.length === 0 && (
        <EmptyState icon={Trophy} title="Nenhum campeonato cadastrado" description="Crie o primeiro campeonato para começar." />
      )}
      {campeonatos.length > 0 && filtrados.length === 0 && (
        <EmptyState icon={Trophy} title="Nenhum campeonato encontrado" description="Ajuste a busca ou os filtros para encontrar outra competicao." />
      )}
      {filtrados.length > 0 && (
        <section aria-label="Catálogo de campeonatos" data-slot="campeonato-catalogue" className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {filtrados.map((campeonato) => (
            <CampeonatoCard key={campeonato.id} campeonato={campeonato} />
          ))}
        </section>
      )}
    </div>
  )
}
