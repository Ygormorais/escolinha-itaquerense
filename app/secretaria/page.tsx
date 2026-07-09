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

  const [
    eventosHoje,
    proximoEvento,
    alunosComNascimento,
    matriculasMes,
    inadimplentes,
    alunosAtivos,
    pagamentosHoje,
    preMatriculasPendentes,
    pendenciasDoc,
  ] = await Promise.all([
    db.evento.findMany({
      where: { data: { gte: hojeInicio, lte: hojeFim } },
      orderBy: { horaInicio: "asc" },
    }),
    db.evento.findFirst({
      where: { data: { gt: hojeFim } },
      orderBy: { data: "asc" },
    }),
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
    db.pagamento.findMany({
      where: { dataPagamento: { gte: hojeInicio, lte: hojeFim } },
      include: { aluno: { select: { nome: true, turma: true } } },
      orderBy: { dataPagamento: "desc" },
    }),
    db.preMatricula.findMany({
      where: { status: "pendente" },
      orderBy: { createdAt: "desc" },
    }),
    db.aluno.findMany({
      where: {
        status: "Ativo",
        OR: [
          { foto: null },
          { telefone: "" },
          { email: "" },
        ],
      },
      select: { id: true, nome: true, turma: true, foto: true, telefone: true, email: true },
      orderBy: { nome: "asc" },
    }),
  ])

  const aniversariantes = alunosComNascimento
    .filter((a) => a.dataNascimento.getMonth() === now.getMonth())
    .sort((a, b) => a.dataNascimento.getDate() - b.dataNascimento.getDate())

  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <PageHeader
        title="Secretaria"
        description="Visão geral do dia para a secretaria"
      />
      <SecretariaClient
        eventosHoje={eventosHoje}
        proximoEvento={proximoEvento}
        aniversariantes={aniversariantes}
        matriculasMes={matriculasMes}
        inadimplentes={inadimplentes}
        alunosAtivos={alunosAtivos}
        pagamentosHoje={pagamentosHoje}
        preMatriculasPendentes={preMatriculasPendentes}
        pendenciasDoc={pendenciasDoc}
      />
    </div>
  )
}
