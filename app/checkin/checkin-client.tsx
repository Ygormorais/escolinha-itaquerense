"use client"

import { CheckCircle2, XCircle, Users } from "lucide-react"
import Link from "next/link"

type Aluno = { id: number; nome: string }

export function CheckinClient({
  turma,
  data,
  token,
  alunos,
  ok,
  nomeConfirmado,
  jaRegistrado,
  erro,
}: {
  turma: string
  data: string
  token: string
  alunos: Aluno[]
  ok: boolean
  nomeConfirmado: string | null
  jaRegistrado: boolean
  erro: string | null
}) {
  const [dia, mes, ano] = [data.slice(8, 10), data.slice(5, 7), data.slice(0, 4)]
  const dataLabel = `${dia}/${mes}/${ano}`

  if (ok && nomeConfirmado) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
        <CheckCircle2 className={`size-16 ${jaRegistrado ? "text-warning-600" : "text-success-600"}`} />
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {jaRegistrado ? "Presença já registrada" : "Presença confirmada!"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {decodeURIComponent(nomeConfirmado)} — {turma} · {dataLabel}
          </p>
        </div>
        <Link href={`/checkin?token=${token}`} className="text-sm text-brand-700 hover:underline">
          Registrar outro aluno →
        </Link>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
        <XCircle className="size-16 text-destructive" />
        <div>
          <h1 className="font-heading text-2xl font-bold">Aluno não encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">Verifique se o aluno pertence à turma {turma}.</p>
        </div>
        <Link href={`/checkin?token=${token}`} className="text-sm text-brand-700 hover:underline">
          Tentar novamente →
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold">Check-in de Presença</h1>
          <p className="mt-1 text-sm text-muted-foreground">{turma} · {dataLabel}</p>
        </div>

        <div className="divide-y rounded-xl border bg-card">
          {alunos.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Users className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhum aluno ativo nesta turma.</p>
            </div>
          )}
          {alunos.map((a) => (
            <Link
              key={a.id}
              href={`/api/checkin?token=${token}&alunoId=${a.id}`}
              className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted"
            >
              <span className="font-medium">{a.nome}</span>
              <CheckCircle2 className="size-5 text-muted-foreground/30" />
            </Link>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Toque no seu nome para registrar presença
        </p>
      </div>
    </div>
  )
}
