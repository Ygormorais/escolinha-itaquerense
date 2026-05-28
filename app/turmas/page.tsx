import { db } from "@/lib/db"
import { TurmasClient } from "./turmas-client"
import { TURMAS } from "@/lib/constants"
import { getConfig } from "@/lib/config"

export default async function TurmasPage() {
  const config = getConfig()

  const alunos = await db.aluno.findMany({
    select: {
      id: true,
      nome: true,
      turma: true,
      horario: true,
      telefone: true,
      responsavel: true,
      status: true,
      mensalidade: true,
      pagamentos: {
        where: { dataPagamento: null, dataVencimento: { lt: new Date() } },
        select: { id: true },
      },
    },
    orderBy: { nome: "asc" },
  })

  return <TurmasClient alunos={alunos} turmas={TURMAS} capacidade={config.capacidadeTurma} />
}
