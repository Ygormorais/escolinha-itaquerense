"use client"

import { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon, Download, Search, RefreshCw } from "lucide-react"
import { plural } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MonthInput } from "@/components/ui/month-input"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { deleteCusto, gerarCustosRecorrentes } from "@/app/actions/custos"
import { CustoFormDialog } from "./custo-form-dialog"
import { CustosListaMobile } from "./custos-lista-mobile"
import { CustosResumo } from "./custos-resumo"
import { CustosTabela } from "./custos-tabela"
import {
  categoriaDestaque,
  filtrarCustos,
  gerarCSVCustos,
  ticketMedio,
  type Custo,
  type Recorrente,
} from "./custos-utils"

function baixarCSV(custos: Custo[], mes: string) {
  const csv = gerarCSVCustos(custos)
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `custos-${mes}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function CustosClient({
  custos,
  mes,
  total,
  recorrentes = [],
}: {
  custos: Custo[]
  mes: string
  total: number
  recorrentes?: Recorrente[]
}) {
  const router = useRouter()
  const [gerando, startGerando] = useTransition()
  const [geradoMsg, setGeradoMsg] = useState<string | null>(null)
  const [busca, setBusca] = useState("")

  const custosFiltrados = useMemo(() => filtrarCustos(custos, busca), [custos, busca])
  const topCategoria = useMemo(() => categoriaDestaque(custos), [custos])

  async function handleDelete(id: number) {
    const result = await deleteCusto(id)
    if ("error" in result) { toast.error(result.error); return }
    toast.success("Custo excluído")
    router.refresh()
  }

  function handleGerarRecorrentes() {
    const ativos = recorrentes.filter((r) => r.ativo)
    if (ativos.length === 0) {
      toast.warning("Nenhum modelo recorrente ativo cadastrado.")
      return
    }
    setGeradoMsg(null)
    startGerando(async () => {
      const r = await gerarCustosRecorrentes(mes)
      if ("error" in r) {
        toast.error(r.error)
      } else {
        setGeradoMsg(`${plural(r.criados, "custo gerado", "custos gerados", "nenhum")}`)
        toast.success(`${plural(r.criados, "custo recorrente gerado", "custos recorrentes gerados", "nenhum")} para ${mes}`)
      }
      router.refresh()
    })
  }

  const listaProps = {
    totalRegistros: custos.length,
    custos: custosFiltrados,
    busca,
    onDelete: handleDelete,
  }

  return (
    <div className="space-y-4">
      <CustosResumo
        total={total}
        registros={custos.length}
        topCategoria={topCategoria}
        ticketMedio={ticketMedio(total, custos.length)}
      />

      <div className="flex flex-wrap items-center gap-4">
        <div>
          <Label htmlFor="custos-mes" className="text-muted-foreground">Mês</Label>
          <MonthInput id="custos-mes" value={mes} onChange={(v) => router.push(`/custos?mes=${v}`)} className="mt-1" />
        </div>
        <div className="ml-auto flex flex-col items-end gap-2">
          {geradoMsg && <p className="text-xs text-success-600 font-medium">{geradoMsg}</p>}
          <div className="flex gap-2">
            <ConfirmDialog title="Gerar custos recorrentes?" description={`Gerar ${plural(recorrentes.filter((r) => r.ativo).length, "custo recorrente", "custos recorrentes", "nenhum")} para ${mes}?`} confirmLabel="Gerar" variant="warning" onConfirm={handleGerarRecorrentes}>
              <Button variant="outline" disabled={gerando}>
                <RefreshCw className="size-4" />
                {gerando ? "Gerando..." : "Gerar Recorrentes"}
              </Button>
            </ConfirmDialog>
            <Button
              variant="outline"
              onClick={() => baixarCSV(custos, mes)}
              disabled={custos.length === 0}
            >
              <Download className="size-4" />
              Exportar CSV
            </Button>
            <CustoFormDialog
              trigger={
                <Button className="bg-brand-800 text-white hover:bg-brand-900">
                  <PlusIcon className="size-4" />
                  Novo Custo
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {custos.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição, categoria ou fornecedor…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      <CustosListaMobile {...listaProps} />

      <CustosTabela {...listaProps} />
    </div>
  )
}
