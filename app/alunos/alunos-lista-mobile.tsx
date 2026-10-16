"use client"

import Link from "next/link"
import { PencilIcon, UserCheckIcon, UserXIcon, Users } from "lucide-react"
import { formatMoney } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { StatusBadge } from "@/components/ui/status-badge"
import { AlunoFormDialog } from "./aluno-form-dialog"
import type { Aluno } from "./alunos-utils"

export type ListaAlunosProps = {
  alunos: Aluno[]
  frequenciaBaixa: Set<number>
  onInativar: (id: number) => Promise<void>
  onReativar: (id: number) => Promise<void>
}

export function AlunosListaMobile({ alunos, frequenciaBaixa: baixaSet, onInativar, onReativar }: ListaAlunosProps) {
  return (
    <div data-slot="student-mobile-list" className="grid gap-3 md:hidden">
      {alunos.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] border bg-card py-10 text-center">
          <Users className="size-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhum aluno encontrado</p>
        </div>
      )}
      {alunos.map((aluno) => (
        <article key={aluno.id} className="min-w-0 rounded-[var(--radius-card)] border bg-card p-4 shadow-sm">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={`/alunos/${aluno.id}`} className="block truncate font-semibold text-brand-800 hover:underline">
                {aluno.nome}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">{aluno.turma} · {aluno.horario}</p>
            </div>
            <StatusBadge status={aluno.status as "Ativo" | "Inativo"} />
          </div>
          {baixaSet.has(aluno.id) && (
            <p className="mt-3 inline-flex rounded-full bg-danger-50 px-2 py-1 text-xs font-semibold text-danger-600">
              Frequência abaixo de 75%
            </p>
          )}
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Responsável</dt>
              <dd className="truncate font-medium">{aluno.responsavel}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Mensalidade</dt>
              <dd data-numeric className="font-semibold">{formatMoney(aluno.mensalidade)}</dd>
            </div>
          </dl>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-3">
            <AlunoFormDialog
              aluno={aluno}
              trigger={<Button variant="outline" className="w-full"><PencilIcon className="size-4" />Editar</Button>}
            />
            {aluno.status === "Ativo" ? (
              <ConfirmDialog title="Inativar aluno?" description="O aluno será desativado e não aparecerá nas listas padrão." confirmLabel="Inativar" onConfirm={() => onInativar(aluno.id)}>
                <Button variant="ghost" className="w-full"><UserXIcon className="size-4" />Inativar</Button>
              </ConfirmDialog>
            ) : (
              <ConfirmDialog title="Reativar aluno?" description="O aluno voltará a ficar ativo no sistema." confirmLabel="Reativar" variant="warning" onConfirm={() => onReativar(aluno.id)}>
                <Button variant="ghost" className="w-full"><UserCheckIcon className="size-4 text-success-600" />Reativar</Button>
              </ConfirmDialog>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}
