import { db } from "@/lib/db"
import { CheckinClient } from "./checkin-client"
import { notFound } from "next/navigation"

export const metadata = { title: "Check-in — Escolinha Itaquerense" }

export default async function CheckinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; ok?: string; nome?: string; ja?: string; erro?: string }>
}) {
  const params = await searchParams
  const token = params.token

  if (!token) notFound()

  const [turma, data] = token.split(":")
  if (!turma || !data) notFound()

  const alunos = await db.aluno.findMany({
    where: { turma, status: "Ativo" },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  })

  return (
    <CheckinClient
      turma={turma}
      data={data}
      token={token}
      alunos={alunos}
      ok={!!params.ok}
      nomeConfirmado={params.nome ?? null}
      jaRegistrado={!!params.ja}
      erro={params.erro ?? null}
    />
  )
}
