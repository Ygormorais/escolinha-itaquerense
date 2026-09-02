import "server-only"
import { db } from "@/lib/db"

export async function listarTurmasAtivasDesenvolvimento() {
  const rows = await db.aluno.findMany({ where: { status: "Ativo" }, distinct: ["turma"], select: { turma: true }, orderBy: { turma: "asc" } })
  return rows.map((item) => item.turma).filter(Boolean)
}
