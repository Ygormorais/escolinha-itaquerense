export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"
import { getSession } from "@/lib/session"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { resolveUploadsDir } from "@/lib/uploads-path"

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg", png: "image/png", webp: "image/webp", mp4: "video/mp4", webm: "video/webm",
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const admin = await getSession()
  const responsavel = admin.authenticated ? null : await getResponsavelSession()
  if (!admin.authenticated && !responsavel?.authenticated) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  }

  const { file } = await params
  if (path.basename(file) !== file || !/^[a-f0-9-]+\.(jpg|png|webp|mp4|webm)$/i.test(file)) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  }
  const ext = file.split(".").pop()!.toLowerCase()
  try {
    const bytes = await readFile(path.join(/* turbopackIgnore: true */ resolveUploadsDir("midia"), file))
    return new NextResponse(new Uint8Array(bytes), {
      headers: { "Content-Type": CONTENT_TYPES[ext], "Content-Disposition": "inline", "Cache-Control": "private, max-age=3600" },
    })
  } catch {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  }
}
