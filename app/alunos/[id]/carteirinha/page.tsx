import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { getConfig } from "@/lib/config"
import { CarteirinhaView } from "./carteirinha-view"
import { format, addYears } from "date-fns"
import { ptBR } from "date-fns/locale"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const aluno = await db.aluno.findUnique({ where: { id: Number(id) }, select: { nome: true } })
  return { title: aluno ? `Carteirinha — ${aluno.nome}` : "Carteirinha — Escolinha Itaquerense" }
}

export default async function CarteirinhaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numId = Number(id)
  if (!Number.isInteger(numId)) notFound()

  const [aluno, config] = await Promise.all([
    db.aluno.findUnique({
      where: { id: numId },
      select: {
        id: true,
        nome: true,
        dataNascimento: true,
        turma: true,
        horario: true,
        responsavel: true,
        telefone: true,
        dataMatricula: true,
        status: true,
        foto: true,
      },
    }),
    Promise.resolve(getConfig()),
  ])

  if (!aluno) notFound()

  const validade = format(addYears(new Date(), 1), "MM/yyyy")
  const emissao = format(new Date(), "dd/MM/yyyy", { locale: ptBR })

  return (
    <CarteirinhaView
      aluno={aluno}
      config={config}
      validade={validade}
      emissao={emissao}
    />
  )
}
