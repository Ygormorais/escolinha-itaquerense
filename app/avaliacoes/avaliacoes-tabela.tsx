"use client"

import Link from "next/link"
import { ClipboardX, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { EditarAvaliacaoDialog } from "./avaliacao-dialogs"
import type { ListaAvaliacoesProps } from "./avaliacoes-lista-mobile"
import { freqBadgeColor, notaBadgeColor } from "./avaliacoes-utils"

export function AvaliacoesTabela({ avaliacoes: listaFiltrada, onDelete: handleDelete }: ListaAvaliacoesProps) {
  return (
    <div className="hidden rounded-xl border bg-card md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Aluno</TableHead>
            <TableHead>Turma</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Nota Técnica</TableHead>
            <TableHead>Nota Física</TableHead>
            <TableHead>Comportamento</TableHead>
            <TableHead>Frequência</TableHead>
            <TableHead className="w-20">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listaFiltrada.length === 0 && (
            <TableRow>
              <TableCell colSpan={8}>
                <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                  <ClipboardX className="size-10 opacity-30" />
                  <p className="text-sm">Nenhuma avaliação registrada ainda.</p>
                  <p className="text-xs">Use o botão <strong className="text-foreground">+ Nova Avaliação</strong> acima para começar.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
          {listaFiltrada.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">
                <Link href={`/alunos/${a.alunoId}`} className="hover:underline text-brand-800">{a.aluno.nome}</Link>
              </TableCell>
              <TableCell>{a.aluno.turma}</TableCell>
              <TableCell>{a.periodo}</TableCell>
              <TableCell>
                <Badge variant={notaBadgeColor(a.notaTecnica)}>
                  {a.notaTecnica !== null ? a.notaTecnica.toFixed(1) : "—"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={notaBadgeColor(a.notaFisica)}>
                  {a.notaFisica !== null ? a.notaFisica.toFixed(1) : "—"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={notaBadgeColor(a.notaComportamento)}>
                  {a.notaComportamento !== null ? a.notaComportamento.toFixed(1) : "—"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={freqBadgeColor(a.frequencia)}>
                  {a.frequencia !== null ? `${a.frequencia.toFixed(0)}%` : "—"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <EditarAvaliacaoDialog key={a.id} avaliacao={a} />
                  <ConfirmDialog title="Remover avaliação?" description={`Remover avaliação de ${a.aluno.nome} (${a.periodo})?`} confirmLabel="Remover" onConfirm={() => handleDelete(a)}>
                    <Button variant="ghost" size="icon-sm" aria-label="Remover avaliação">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </ConfirmDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
