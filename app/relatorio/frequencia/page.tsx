import { db } from "@/lib/db"
import { TURMAS } from "@/lib/constants"
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns"
import { RelatorioFrequenciaClient } from "./frequencia-client"

export const metadata = { title: "Relatório de Frequência — Escolinha Itaquerense" }

export default async function RelatorioFrequenciaPage() {
  const now = new Date()
  const inicioMes = startOfMonth(now)
  const fimMes = endOfMonth(now)

  const alunos = await db.aluno.findMany({
    where: { status: "Ativo" },
    select: { id: true, nome: true, turma: true },
    orderBy: { nome: "asc" },
  })

  const frequencias = await db.frequencia.findMany({
    where: {
      data: { gte: subMonths(inicioMes, 2), lte: fimMes },
      alunoId: { in: alunos.map((a) => a.id) },
    },
    select: {
      alunoId: true,
      data: true,
      presenca: true,
    },
  })

  const stats = alunos.map((aluno) => {
    const freqs = frequencias.filter((f) => f.alunoId === aluno.id)
    const totalAulas = freqs.length
    const totalPresencas = freqs.filter((f) => f.presenca === "Presente").length
    const percentual = totalAulas > 0 ? Math.round((totalPresencas / totalAulas) * 100) : 0
    return { ...aluno, totalAulas, totalPresencas, percentual }
  })

  return (
    <RelatorioFrequenciaClient
      stats={stats}
      turmas={[...TURMAS]}
      mesAtual={format(now, "MMMM yyyy")}
    />
  )
}
