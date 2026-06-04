import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { SecretariaClient } from "./secretaria-client"
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns"

export const metadata = { title: "Secretaria — Escolinha Itaquerense" }

export default async function SecretariaPage() {
  const now = new Date()
  const hojeInicio = startOfDay(now)
  const hojeFim = endOfDay(now)
  const mesInicio = startOfMonth(now)
  const mesFim = endOfMonth(now)

  const [eventosHoje, aniversariantes, matriculasMes, inadimplentes, alunosAtivos] = await Promise.all([
    db.evento.findMany({
      where: { data: { gte: hojeInicio, lte: hojeFim } },
      orderBy: { horaInicio: "asc" },
    }),
    db.aluno.findMany({
      where: {
        status: "Ativo",
        dataNascimento: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
          lte: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        },
      },
      select: { id: true, nome: true, dataNascimento: true, turma: true },
      orderBy: { dataNascimento: "asc" },
    }),
    db.aluno.count({
      where: { dataMatricula: { gte: mesInicio, lte: mesFim } },
    }),
    db.pagamento.count({
      where: {
        mesReferencia: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
        dataPagamento: null,
      },
    }),
    db.aluno.count({ where: { status: "Ativo" } }),
  ])

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Secretaria"
        description="Visão geral do dia para a secretaria"
      />
      <SecretariaClient
        eventosHoje={eventosHoje}
        aniversariantes={aniversariantes}
        matriculasMes={matriculasMes}
        inadimplentes={inadimplentes}
        alunosAtivos={alunosAtivos}
      />
    </div>
  )
}
