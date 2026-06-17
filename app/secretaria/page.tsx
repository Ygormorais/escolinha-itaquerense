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

  const [eventosHoje, alunosComNascimento, matriculasMes, inadimplentes, alunosAtivos] = await Promise.all([
    db.evento.findMany({
      where: { data: { gte: hojeInicio, lte: hojeFim } },
      orderBy: { horaInicio: "asc" },
    }),
    // Aniversariantes do mês: o nascimento é de anos passados, então filtramos pelo
    // mês (ignorando o ano) em JS — comparar o range de datas deste ano nunca casaria.
    db.aluno.findMany({
      where: { status: "Ativo" },
      select: { id: true, nome: true, dataNascimento: true, turma: true, telefone: true },
    }),
    db.aluno.count({
      where: { dataMatricula: { gte: mesInicio, lte: mesFim } },
    }),
    db.pagamento.findMany({
      where: {
        dataVencimento: { lt: now },
        dataPagamento: null,
        aluno: { status: "Ativo" },
      },
      select: { alunoId: true },
      distinct: ["alunoId"],
    }).then((rows) => rows.length),
    db.aluno.count({ where: { status: "Ativo" } }),
  ])

  const aniversariantes = alunosComNascimento
    .filter((a) => a.dataNascimento.getMonth() === now.getMonth())
    .sort((a, b) => a.dataNascimento.getDate() - b.dataNascimento.getDate())

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
