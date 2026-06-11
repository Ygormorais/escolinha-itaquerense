export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { parseFotoFilename, canAccessFoto } from "@/lib/foto-acesso"

// Serve as fotos de alunos gravadas fora de public/. A rota está na allowlist
// do proxy.ts (o responsável não tem o cookie admin), então TODA a autorização
// acontece aqui: admin vê qualquer foto; responsável só vê aluno vinculado.

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params

  const parsed = parseFotoFilename(file)
  if (!parsed) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  }

  const session = await getSession()
  let allowed = session.authenticated

  if (!allowed) {
    const resp = await getResponsavelSession()
    if (resp.authenticated && resp.responsavelId != null) {
      const aluno = await db.aluno.findUnique({
        where: { id: parsed.alunoId },
        select: { responsavelId: true },
      })
      allowed = canAccessFoto({
        adminAuthenticated: false,
        responsavelId: resp.responsavelId,
        alunoResponsavelId: aluno === null ? undefined : aluno.responsavelId,
      })
    }
  }

  // 404 (não 401/403) para não revelar existência de foto a quem não pode vê-la
  if (!allowed) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  }

  const filePath = path.join(process.cwd(), "uploads", "fotos", file)

  try {
    const buf = await readFile(filePath)
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": CONTENT_TYPES[parsed.ext],
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
      },
    })
  } catch {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  }
}
