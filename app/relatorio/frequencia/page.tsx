import { db } from "@/lib/db"
import { TURMAS } from "@/lib/constants"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { RelatorioFrequenciaClient } from "./frequencia-client"

export const metadata = { title: "Relatório de Frequência — Escolinha Itaquerense" }

export default async function RelatorioFrequenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const mesSelecionado = params.mes ?? format(now, "yyyy-MM")

  const [anoRef, mesRef] = mesSelecionado.split("-").map(Number)
  const dataRef = new Date(anoRef, mesRef - 1, 1)
  const inicioMes = startOfMonth(dataRef)
  const fimMes = endOfMonth(dataRef)

  const alunos = await db.aluno.findMany({
    where: { status: "Ativo" },
    select: { id: true, nome: true, turma: true },
    orderBy: { nome: "asc" },
  })

  const frequencias = await db.frequencia.findMany({
    where: {
      data: { gte: inicioMes, lte: fimMes },
      alunoId: { in: alunos.map((a) => a.id) },
    },
    select: { alunoId: true, presenca: true },
  })

  const stats = alunos.map((aluno) => {
    const freqs = frequencias.filter((f) => f.alunoId === aluno.id)
    const totalAulas = freqs.length
    const totalPresencas = freqs.filter((f) => f.presenca === "Presente").length
    const percentual = totalAulas > 0 ? Math.round((totalPresencas / totalAulas) * 100) : 0
    return { ...aluno, totalAulas, totalPresencas, percentual }
  })

  const mesLabel = format(dataRef, "MMMM yyyy", { locale: ptBR })

  return (
    <RelatorioFrequenciaClient
      stats={stats}
      turmas={[...TURMAS]}
      mesAtual={mesLabel}
      mesSelecionado={mesSelecionado}
    />
  )
}
