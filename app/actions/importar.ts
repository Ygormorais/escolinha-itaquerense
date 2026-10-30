"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { addMonths, setDate } from "date-fns"
import { registrarLog } from "@/app/actions/log"
import { requireAuth } from "@/lib/auth"
import { valorDevidoDoAluno } from "@/lib/valor-devido"

type AlunoCSV = {
  nome: string
  dataNascimento: string
  turma: string
  horario: string
  responsavel: string
  telefone: string
  email: string
  dataMatricula: string
  mensalidade: number
  status?: string
  observacoes?: string
}

type ImportResult = { importados: number; erros: { linha: number; erro: string }[] }

const MAX_IMPORT_BYTES = 5 * 1024 * 1024

function parseCSV(text: string): AlunoCSV[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const header = lines[0].split(/[;,]/).map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase())
  return lines.slice(1).filter((line) => line.trim() !== "").map((line) => {
    const cols = line.split(/[;,]/).map((c) => c.trim().replace(/^"|"$/g, ""))
    const row: Record<string, string> = {}
    header.forEach((h, i) => { row[h] = cols[i] ?? "" })
    return {
      nome: row.nome ?? "",
      dataNascimento: row.datanascimento ?? row["data nascimento"] ?? "",
      turma: row.turma ?? "",
      horario: row.horario ?? "",
      responsavel: row.responsavel ?? "",
      telefone: row.telefone ?? "",
      email: row.email ?? "",
      dataMatricula: row.datamatricula ?? row["data matricula"] ?? "",
      mensalidade: parseFloat(row.mensalidade?.replace(",", ".") ?? "0"),
      status: row.status || "Ativo",
      observacoes: row.observacoes,
    }
  })
}

export async function importarAlunosCSV(csvText: string): Promise<ImportResult | { error: string }> {
  await requireAuth(["admin", "secretaria"])
  if (Buffer.byteLength(csvText, "utf8") > MAX_IMPORT_BYTES) {
    return { error: "Arquivo excede o limite de 5MB" }
  }
  try {
    const alunos = parseCSV(csvText)
    const erros: { linha: number; erro: string }[] = []
    let importados = 0

    for (let i = 0; i < alunos.length; i++) {
      const a = alunos[i]
      try {
        if (!a.nome?.trim()) throw new Error("Nome obrigatório")
        if (!a.dataNascimento) throw new Error("Data de nascimento obrigatória")
        if (!a.turma?.trim()) throw new Error("Turma obrigatória")
        if (!a.dataMatricula) throw new Error("Data de matrícula obrigatória")
        if (!a.mensalidade || isNaN(Number(a.mensalidade))) throw new Error("Mensalidade inválida")

        const aluno = await db.aluno.create({
          data: {
            nome: a.nome.trim(),
            dataNascimento: new Date(a.dataNascimento),
            turma: a.turma.trim(),
            horario: (a.horario ?? "").trim(),
            responsavel: (a.responsavel ?? "").trim(),
            telefone: (a.telefone ?? "").trim(),
            email: (a.email ?? "").trim(),
            dataMatricula: new Date(a.dataMatricula),
            mensalidade: Number(a.mensalidade),
            status: a.status ?? "Ativo",
            observacoes: a.observacoes?.trim() ?? null,
          },
        })

        const baseDate = new Date(a.dataMatricula)
        const pagamentos = Array.from({ length: 12 }, (_, idx) => {
          const month = addMonths(baseDate, idx)
          return {
            alunoId: aluno.id,
            valorDevido: valorDevidoDoAluno({ mensalidade: Number(a.mensalidade), desconto: 0 }),
            mesReferencia: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
            dataVencimento: setDate(month, 10),
          }
        })
        await db.pagamento.createMany({ data: pagamentos })
        importados++
      } catch (e) {
        erros.push({ linha: i + 2, erro: e instanceof Error ? e.message : "Erro desconhecido" })
      }
    }

    if (importados > 0) {
      await registrarLog("aluno_novo", `${importados} aluno(s) importado(s) via CSV`)
      revalidatePath("/alunos")
      revalidatePath("/dashboard")
    }

    return { importados, erros }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro na importação" }
  }
}
