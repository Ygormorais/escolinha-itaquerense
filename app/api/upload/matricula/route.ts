export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

const MAX_BYTES = 5 * 1024 * 1024

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("documento") as File | null

  if (!file) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Arquivo muito grande (máx. 5MB)" }, { status: 400 })
  }

  const allowed = ["application/pdf", "image/jpeg", "image/png"]
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Formato não permitido (PDF, JPEG, PNG)" }, { status: 400 })
  }

  const ext = path.extname(file.name)
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
  const uploadDir = path.join(process.cwd(), "public", "uploads", "matriculas")
  await mkdir(uploadDir, { recursive: true })

  const bytes = await file.arrayBuffer()
  await writeFile(path.join(uploadDir, safeName), Buffer.from(bytes))

  return NextResponse.json({ url: `/uploads/matriculas/${safeName}`, name: file.name })
}
