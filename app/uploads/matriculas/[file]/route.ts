export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

// Serve os documentos de matrícula gravados fora de public/. A rota não está
// na allowlist do proxy.ts, então só passa com sessão admin válida.

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".png": "image/png",
}

// Nomes gerados pelo upload: `${Date.now()}-${rand36}${ext}` — qualquer outra
// coisa (path traversal, encoding) é rejeitada antes de tocar o filesystem
const SAFE_NAME = /^\d+-[a-z0-9]+\.(pdf|jpg|png)$/

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params

  if (!SAFE_NAME.test(file)) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  }

  const filePath = path.join(process.cwd(), "uploads", "matriculas", file)

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
