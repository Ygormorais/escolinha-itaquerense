export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { checkRateLimit } from "@/lib/rate-limit"
import { rateLimitResponse } from "@/lib/rate-limit-response"

const MAX_BYTES = 5 * 1024 * 1024

// Extensões permitidas — validadas no servidor independentemente do MIME declarado
const ALLOWED_EXTS = new Set([".pdf", ".jpg", ".jpeg", ".png"])

// Valida pelo conteúdo real (magic bytes) para evitar bypass de MIME type
function detectExtByMagic(buf: Uint8Array): string | null {
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return ".pdf"
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return ".jpg"
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return ".png"
  return null
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown"
  const limit = checkRateLimit(`upload-matricula:${ip}`, 10)
  if (!limit.ok) return rateLimitResponse(limit.retryAfterMs)

  const formData = await request.formData()
  const file = formData.get("documento") as File | null

  if (!file) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Arquivo muito grande (máx. 5MB)" }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buf = new Uint8Array(bytes)

  // Valida extensão declarada E magic bytes do conteúdo real
  const extDeclarada = path.extname(file.name).toLowerCase()
  const extReal = detectExtByMagic(buf)

  if (!ALLOWED_EXTS.has(extDeclarada) || extReal === null) {
    return NextResponse.json({ error: "Formato não permitido (PDF, JPEG, PNG)" }, { status: 400 })
  }

  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${extReal}`
  const uploadDir = path.join(process.cwd(), "public", "uploads", "matriculas")
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, safeName), Buffer.from(bytes))

  return NextResponse.json({ url: `/uploads/matriculas/${safeName}`, name: file.name })
}
