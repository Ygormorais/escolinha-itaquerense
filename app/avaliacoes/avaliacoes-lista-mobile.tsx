"use client"

import Link from "next/link"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { EditarAvaliacaoDialog } from "./avaliacao-dialogs"
import { freqBadgeColor, type Avaliacao } from "./avaliacoes-utils"

export type ListaAvaliacoesProps = {
  avaliacoes: Avaliacao[]
  onDelete: (avaliacao: Avaliacao) => Promise<void>
}

export function AvaliacoesListaMobile({ avaliacoes: listaFiltrada, onDelete: handleDelete }: ListaAvaliacoesProps) {
  return (
    <div className="grid gap-3 md:hidden">
      {listaFiltrada.map((a) => <article key={a.id} className="rounded-xl border bg-card p-4"><div className="flex justify-between gap-3"><div><Link href={`/alunos/${a.alunoId}`} className="font-semibold text-brand-800 hover:underline">{a.aluno.nome}</Link><p className="mt-1 text-sm text-muted-foreground">{a.aluno.turma} · {a.periodo}</p></div><Badge variant={freqBadgeColor(a.frequencia)}>{a.frequencia !== null ? `${a.frequencia.toFixed(0)}%` : "—"}</Badge></div><div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-center text-sm"><div><p className="text-xs text-muted-foreground">Técnica</p><p>{a.notaTecnica?.toFixed(1) ?? "—"}</p></div><div><p className="text-xs text-muted-foreground">Física</p><p>{a.notaFisica?.toFixed(1) ?? "—"}</p></div><div><p className="text-xs text-muted-foreground">Comport.</p><p>{a.notaComportamento?.toFixed(1) ?? "—"}</p></div></div><div className="mt-3 flex justify-end gap-1 border-t pt-3"><EditarAvaliacaoDialog avaliacao={a} /><ConfirmDialog title="Remover avaliação?" description={`Remover avaliação de ${a.aluno.nome} (${a.periodo})?`} confirmLabel="Remover" onConfirm={() => handleDelete(a)}><Button variant="ghost" size="icon-sm" aria-label="Remover avaliação"><Trash2 className="size-3.5" /></Button></ConfirmDialog></div></article>)}
    </div>
  )
}
