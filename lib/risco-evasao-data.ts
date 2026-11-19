import { cache } from "react"
import { subDays } from "date-fns"
import { db } from "@/lib/db"
import { getConfig } from "@/lib/config"
import { montarListaAtencao, type AlunoAtencao } from "@/lib/risco-evasao"

const JANELA_DIAS = 60
const CHAMADAS_CONSIDERADAS = 8

/** Lista "Atenção": alunos ativos com faltas seguidas e/ou mensalidades em atraso. Só admin e secretaria. */
export const carregarAtencaoEvasao = cache(async (): Promise<AlunoAtencao[]> => {
  const agora = new Date()
  const config = getConfig()
  const alunos = await db.aluno.findMany({
    where: { status: "Ativo" },
    select: {
      id: true,
      nome: true,
      turma: true,
      responsavel: true,
      telefone: true,
      frequencias: {
        where: { data: { gte: subDays(agora, JANELA_DIAS) } },
        orderBy: { data: "desc" },
        take: CHAMADAS_CONSIDERADAS,
        select: { data: true, presenca: true },
      },
      pagamentos: { where: { dataPagamento: null, dataVencimento: { lt: agora } }, select: { id: true } },
    },
  })
  return montarListaAtencao(
    alunos.map((a) => ({
      id: a.id,
      nome: a.nome,
      turma: a.turma,
      responsavel: a.responsavel,
      telefone: a.telefone,
      presencas: a.frequencias.map((f) => ({ data: f.data, presenca: f.presenca })),
      mensalidadesAtrasadas: a.pagamentos.length,
    })),
    { clube: config.nome, modelos: config.modelosMensagem },
  )
})
