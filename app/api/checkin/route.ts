import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/checkin?token=<token>&alunoId=<id>
// Token é TURMA:DATA (ex: "Sub-13:2026-06-20") — sem segurança criptográfica, apenas comodidade
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")
  const alunoIdRaw = searchParams.get("alunoId")

  if (!token) {
    return NextResponse.json({ error: "Token inválido" }, { status: 400 })
  }

  const [turma, data] = token.split(":")
  if (!turma || !data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return NextResponse.json({ error: "Token malformado" }, { status: 400 })
  }

  // Se alunoId informado, registra presença diretamente
  if (alunoIdRaw) {
    const alunoId = Number(alunoIdRaw)
    const aluno = await db.aluno.findFirst({
      where: { id: alunoId, turma, status: "Ativo" },
      select: { id: true, nome: true },
    })
    if (!aluno) {
      return NextResponse.redirect(new URL(`/checkin?token=${token}&erro=aluno`, req.url))
    }

    const dataObj = new Date(data + "T12:00:00.000Z")
    const jaRegistrado = await db.frequencia.findFirst({
      where: { alunoId, data: dataObj },
    })
    if (jaRegistrado) {
      return NextResponse.redirect(new URL(`/checkin?token=${token}&ok=1&nome=${encodeURIComponent(aluno.nome)}&ja=1`, req.url))
    }

    await db.frequencia.create({ data: { alunoId, data: dataObj, presenca: "Presente" } })
    return NextResponse.redirect(new URL(`/checkin?token=${token}&ok=1&nome=${encodeURIComponent(aluno.nome)}`, req.url))
  }

  // Sem alunoId: redireciona para a página de seleção
  return NextResponse.redirect(new URL(`/checkin?token=${token}`, req.url))
}
