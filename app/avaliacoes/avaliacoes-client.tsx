"use client"

import { useState, useMemo } from "react"
import { plural } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { useRouter } from "next/navigation"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { toast } from "sonner"
import { removerAvaliacao } from "@/app/actions/avaliacoes"
import { NovaAvaliacaoDialog } from "./avaliacao-dialogs"
import { AvaliacoesGrafico } from "./avaliacoes-grafico"
import { AvaliacoesListaMobile } from "./avaliacoes-lista-mobile"
import { AvaliacoesTabela } from "./avaliacoes-tabela"
import {
  dadosEvolucao,
  gerarCSVAvaliacoes,
  mediaNota as calcularMedia,
  type AlunoResumo,
  type CampoNota,
  type Avaliacao,
} from "./avaliacoes-utils"

type AvaliacoesClientProps = {
  avaliacoes: Avaliacao[]
  alunos: AlunoResumo[]
}

export function AvaliacoesClient({ avaliacoes, alunos }: AvaliacoesClientProps) {
  const router = useRouter()
  const [filtroAlunoId, setFiltroAlunoId] = useState<string>("all")

  const listaFiltrada = useMemo(
    () => filtroAlunoId === "all" ? avaliacoes : avaliacoes.filter((a) => String(a.alunoId) === filtroAlunoId),
    [avaliacoes, filtroAlunoId]
  )

  const mediaNota = (campo: CampoNota) => calcularMedia(listaFiltrada, campo)

  const dadosGrafico = useMemo(
    () => filtroAlunoId === "all" ? [] : dadosEvolucao(listaFiltrada),
    [listaFiltrada, filtroAlunoId]
  )

  function exportarCSV() {
    const csv = "\uFEFF" + gerarCSVAvaliacoes(listaFiltrada)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `avaliacoes-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleDelete(avaliacao: Avaliacao) {
    try {
      await removerAvaliacao(avaliacao.id)
      toast.success("Avaliação removida")
      router.refresh()
    } catch {
      toast.error("Erro ao remover avaliação")
    }
  }

  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <PageHeader
        title="Avaliações"
        description={plural(listaFiltrada.length, "avaliação registrada", "avaliações registradas", "nenhuma")}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportarCSV} disabled={listaFiltrada.length === 0}>
              <Download className="size-4" /> Exportar CSV
            </Button>
            <NovaAvaliacaoDialog alunos={alunos} />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Avaliações</p>
          <p className="mt-1 text-2xl font-extrabold text-brand-800">{listaFiltrada.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Média Técnica</p>
          <p className="mt-1 text-2xl font-extrabold">{mediaNota("notaTecnica")}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Média Física</p>
          <p className="mt-1 text-2xl font-extrabold">{mediaNota("notaFisica")}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Média Comportamento</p>
          <p className="mt-1 text-2xl font-extrabold">{mediaNota("notaComportamento")}</p>
        </div>
      </div>

      {/* Filtro por aluno */}
      <div className="flex items-center gap-3">
        <Select value={filtroAlunoId} onValueChange={(v) => v && setFiltroAlunoId(v)}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filtrar por aluno" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os alunos</SelectItem>
            {alunos.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.nome} — {a.turma}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filtroAlunoId !== "all" && (
          <button
            onClick={() => setFiltroAlunoId("all")}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Gráfico de evolução (só aparece quando um aluno está selecionado e tem 2+ períodos) */}
      {filtroAlunoId !== "all" && dadosGrafico.length >= 2 && (
        <AvaliacoesGrafico dadosGrafico={dadosGrafico} />
      )}

      <AvaliacoesListaMobile avaliacoes={listaFiltrada} onDelete={handleDelete} />
      <AvaliacoesTabela avaliacoes={listaFiltrada} onDelete={handleDelete} />
    </div>
  )
}
