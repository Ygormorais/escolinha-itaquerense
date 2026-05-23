"use client"

import { PencilIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AlunoFormDialog } from "@/app/alunos/alunos-client"

type Aluno = {
  id: number
  nome: string
  dataNascimento: Date
  turma: string
  horario: string
  responsavel: string
  telefone: string
  email: string
  dataMatricula: Date
  mensalidade: number
  desconto: number
  status: string
  observacoes: string | null
}

export function EditarAlunoButton({ aluno }: { aluno: Aluno }) {
  return (
    <AlunoFormDialog
      aluno={aluno}
      trigger={
        <Button variant="outline" size="sm">
          <PencilIcon className="size-4" />
          Editar
        </Button>
      }
    />
  )
}
