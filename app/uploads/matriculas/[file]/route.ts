export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"
import { resolveUploadsDir } from "@/lib/uploads-path"
import { getSession } from "@/lib/session"

// Serve os documentos de matrícula gravados fora de public/. O proxy exige
// sessão de equipe; aqui só admin e secretaria leem (o técnico não).
const PERFIS_PERMITIDOS = new Set(["admin", "secretaria"])

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".png": "image/png",
}

// Nomes gerados pelo upload: `${randomUUID()}${ext}` — qualquer outra
// coisa (path traversal, encoding) é rejeitada antes de tocar o filesystem
const SAFE_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|jpg|png)$/

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const session = await getSession()
  if (!session.authenticated || !PERFIS_PERMITIDOS.has(session.role ?? "")) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  }

  const { file } = await params

  if (!SAFE_NAME.test(file)) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  }

  const filePath = path.join(resolveUploadsDir("matriculas"), file)

  try {
    const buf = await readFile(filePath)
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": CONTENT_TYPES[path.extname(file)] ?? "application/octet-stream",
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
      },
    })
  } catch {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  }
}
