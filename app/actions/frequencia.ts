"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

type ActionResult = { success: true } | { error: string }

export async function salvarFrequencia(
  registros: { alunoId: number; data: string; presenca: string }[]
): Promise<ActionResult> {
  try {
    await Promise.all(
      registros.map((r) =>
        db.frequencia.upsert({
          where: { alunoId_data: { alunoId: r.alunoId, data: new Date(r.data) } },
          update: { presenca: r.presenca },
          create: { alunoId: r.alunoId, data: new Date(r.data), presenca: r.presenca },
        })
      )
    )
    revalidatePath("/frequencia")
    revalidatePath("/")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao salvar frequência" }
  }
}

export async function getFrequenciaPorTurmaData(turma: string, data: string) {
  const alunos = await db.aluno.findMany({
    where: { turma, status: "Ativo" },
    include: {
      frequencias: {
        where: { data: new Date(data) },
      },
    },
    orderBy: { nome: "asc" },
  })

  return alunos.map((a) => ({
    id: a.id,
    nome: a.nome,
    presenca: a.frequencias[0]?.presenca ?? null,
  }))
}

export async function getPresencaPorTurma(mes: string) {
  const [ano, mesNum] = mes.split("-").map(Number)
  const inicio = new Date(ano, mesNum - 1, 1)
  const fim = new Date(ano, mesNum, 0, 23, 59, 59)

  const turmas = ["Sub-7", "Sub-9", "Sub-11", "Sub-13", "Sub-15", "Sub-17"]

  const resultados = await Promise.all(
    turmas.map(async (turma) => {
      const [total, presentes] = await Promise.all([
        db.frequencia.count({ where: { data: { gte: inicio, lte: fim }, aluno: { turma } } }),
        db.frequencia.count({ where: { data: { gte: inicio, lte: fim }, presenca: "Presente", aluno: { turma } } }),
      ])
      return { turma, total, presentes, pct: total > 0 ? Math.round((presentes / total) * 100) : 0 }
    })
  )

  return resultados.filter((r) => r.total > 0)
}

export async function getFrequenciaAluno(alunoId: number) {
  const now = new Date()
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("pt-BR", { month: "short", year: "2-digit" }),
      inicio: new Date(d.getFullYear(), d.getMonth(), 1),
      fim: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
    }
  })

  const results = await Promise.all(
    meses.map(async (m) => {
      const [total, presentes] = await Promise.all([
        db.frequencia.count({ where: { alunoId, data: { gte: m.inicio, lte: m.fim } } }),
        db.frequencia.count({ where: { alunoId, data: { gte: m.inicio, lte: m.fim }, presenca: "Presente" } }),
      ])
      return { label: m.label, total, presentes, pct: total > 0 ? Math.round((presentes / total) * 100) : null }
    })
  )

  return results
}

export async function getResumoFrequenciaMes(turma: string, mes: string) {
  const [ano, mesNum] = mes.split("-").map(Number)
  const inicio = new Date(ano, mesNum - 1, 1)
  const fim = new Date(ano, mesNum, 0, 23, 59, 59)

  const alunos = await db.aluno.findMany({
    where: { turma, status: "Ativo" },
    include: {
      frequencias: {
        where: { data: { gte: inicio, lte: fim } },
      },
    },
    orderBy: { nome: "asc" },
  })

  return alunos.map((a) => {
    const total = a.frequencias.length
    const presentes = a.frequencias.filter((f) => f.presenca === "Presente").length
    const ausentes = a.frequencias.filter((f) => f.presenca === "Ausente").length
    const justificados = a.frequencias.filter((f) => f.presenca === "Justificado").length
    const pct = total > 0 ? Math.round((presentes / total) * 100) : null
    return { id: a.id, nome: a.nome, total, presentes, ausentes, justificados, pct }
  })
}
