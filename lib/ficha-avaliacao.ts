import { db } from "@/lib/db"
import { getConfig } from "@/lib/config"

export type DadosFichaAvaliacao = {
  aluno: { nome: string; turma: string; responsavel: string }
  avaliacao: {
    periodo: string
    notaTecnica: number | null
    notaFisica: number | null
    notaComportamento: number | null
    media: number | null
    frequencia: number | null
    observacoes: string | null
  }
  clube: { nome: string; cidade: string }
}

export function calcularMedia(
  notaTecnica: number | null,
  notaFisica: number | null,
  notaComportamento: number | null
): number | null {
  const notas = [notaTecnica, notaFisica, notaComportamento].filter(
    (n): n is number => n !== null
  )
  if (notas.length === 0) return null
  return Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10
}

export async function buscarDadosFicha(
  alunoId: number,
  periodo: string,
  responsavelId: number
): Promise<DadosFichaAvaliacao | null> {
  const aluno = await db.aluno.findUnique({
    where: { id: alunoId },
    select: {
      nome: true,
      turma: true,
      responsavel: true,
      responsavelId: true,
      avaliacoes: {
        where: { periodo },
        take: 1,
      },
    },
  })

  if (!aluno || aluno.responsavelId !== responsavelId) return null
  if (aluno.avaliacoes.length === 0) return null

  const av = aluno.avaliacoes[0]
  const config = getConfig()

  return {
    aluno: { nome: aluno.nome, turma: aluno.turma, responsavel: aluno.responsavel },
    avaliacao: {
      periodo: av.periodo,
      notaTecnica: av.notaTecnica,
      notaFisica: av.notaFisica,
      notaComportamento: av.notaComportamento,
      media: calcularMedia(av.notaTecnica, av.notaFisica, av.notaComportamento),
      frequencia: av.frequencia,
      observacoes: av.observacoes ?? null,
    },
    clube: { nome: config.nome, cidade: config.cidade },
  }
}
