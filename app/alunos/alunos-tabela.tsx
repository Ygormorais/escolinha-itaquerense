"use client"

import Link from "next/link"
import { PencilIcon, UserCheckIcon, UserXIcon, Users } from "lucide-react"
import { formatMoney } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { AlunoFormDialog } from "./aluno-form-dialog"
import type { ListaAlunosProps } from "./alunos-lista-mobile"

export function AlunosTabela({ alunos, frequenciaBaixa: baixaSet, onInativar, onReativar }: ListaAlunosProps) {
  return (
    <div data-slot="student-table" className="hidden overflow-x-auto rounded-xl border bg-card md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Turma</TableHead>
            <TableHead>Horário</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Mensalidade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-20">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alunos.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <Users className="size-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Nenhum aluno encontrado</p>
                </div>
              </TableCell>
            </TableRow>
          )}
          {alunos.map((aluno) => (
            <TableRow key={aluno.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/alunos/${aluno.id}`}
                    className="hover:underline hover:text-brand-800"
                  >
                    {aluno.nome}
                  </Link>
                  {baixaSet.has(aluno.id) && (
                    <span
                      title="Frequência abaixo de 75% este mês"
                      className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-danger-50 text-danger-600"
                    >
                      Freq. baixa
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>{aluno.turma}</TableCell>
              <TableCell>{aluno.horario}</TableCell>
              <TableCell>{aluno.responsavel}</TableCell>
              <TableCell>{formatMoney(aluno.mensalidade)}</TableCell>
              <TableCell>
                <StatusBadge status={aluno.status as "Ativo" | "Inativo"} />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <AlunoFormDialog
                    key={aluno.id}
                    aluno={aluno}
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label="Editar aluno">
                        <PencilIcon className="size-3.5" />
                      </Button>
                    }
                  />
                  {aluno.status === "Ativo" ? (
                    <ConfirmDialog title="Inativar aluno?" description="O aluno será desativado e não aparecerá nas listas padrão." confirmLabel="Inativar" onConfirm={() => onInativar(aluno.id)}>
                      <Button variant="ghost" size="icon-sm" aria-label="Inativar aluno">
                        <UserXIcon className="size-3.5" />
                      </Button>
                    </ConfirmDialog>
                  ) : (
                    <ConfirmDialog title="Reativar aluno?" description="O aluno voltará a ficar ativo no sistema." confirmLabel="Reativar" variant="warning" onConfirm={() => onReativar(aluno.id)}>
                      <Button variant="ghost" size="icon-sm" aria-label="Reativar aluno">
                        <UserCheckIcon className="size-3.5 text-success-600" />
                      </Button>
                    </ConfirmDialog>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
