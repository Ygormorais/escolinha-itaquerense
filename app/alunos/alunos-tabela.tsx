"use client"

import Link from "next/link"
import { PencilIcon, UserCheckIcon, UserXIcon } from "lucide-react"
import { formatMoney } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { AlunoFormDialog } from "./aluno-form-dialog"
import type { Aluno } from "./alunos-utils"

export function AlunosTabela({
  alunos,
  frequenciaBaixa: baixaSet,
  canManage,
  onInativar,
  onReativar,
}: {
  alunos: Aluno[]
  frequenciaBaixa: Set<number>
  canManage: boolean
  onInativar: (id: number) => void
  onReativar: (id: number) => void
}) {
  const columns: DataTableColumn<Aluno>[] = [
    {
      id: "nome",
      header: "Nome",
      cell: (aluno) => (
        <div className="flex items-center gap-2">
          <Link href={`/alunos/${aluno.id}`} className="font-medium hover:text-brand-800 hover:underline">
            {aluno.nome}
          </Link>
          {baixaSet.has(aluno.id) && (
            <span
              title="Frequência abaixo de 75% este mês"
              className="inline-flex shrink-0 rounded-full bg-danger-50 px-2 py-0.5 text-xs font-semibold text-danger-600"
            >
              Freq. baixa
            </span>
          )}
        </div>
      ),
    },
    { id: "turma", header: "Turma", cell: (aluno) => aluno.turma },
    { id: "horario", header: "Horário", cell: (aluno) => aluno.horario, hideOnMobile: true },
    { id: "responsavel", header: "Responsável", cell: (aluno) => aluno.responsavel },
    {
      id: "mensalidade",
      header: "Mensalidade",
      cell: (aluno) => <span data-numeric>{formatMoney(aluno.mensalidade)}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: (aluno) => <StatusBadge status={aluno.status as "Ativo" | "Inativo"} />,
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={alunos}
      getRowId={(aluno) => String(aluno.id)}
      emptyState={{ title: "Nenhum aluno encontrado" }}
      rowActions={canManage ? (aluno) => (
        <>
          <AlunoFormDialog
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
        </>
      ) : undefined}
    />
  )
}
