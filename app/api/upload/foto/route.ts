export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { validateFotoUpload } from "@/lib/upload-foto"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session.authenticated) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("foto") as File | null
  const alunoId = Number(formData.get("alunoId"))

  const aluno = alunoId && !Number.isNaN(alunoId)
    ? await db.aluno.findUnique({ where: { id: alunoId }, select: { id: true, foto: true } })
    : null

  const bytes = file ? await file.arrayBuffer() : new ArrayBuffer(0)
  const validation = validateFotoUpload({
    file,
    alunoId,
    alunoExists: !!aluno,
    buffer: new Uint8Array(bytes),
  })

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status })
  }

  const ext = validation.extension
  const filename = `${alunoId}.${ext}`
  const uploadDir = path.join(process.cwd(), "public", "uploads", "fotos")

  if (aluno!.foto) {
    const oldPath = path.join(process.cwd(), "public", aluno!.foto.replace(/^\//, ""))
    await unlink(oldPath).catch(() => {})
  }

  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), Buffer.from(bytes))

  const fotoUrl = `/uploads/fotos/${filename}`
  await db.aluno.update({ where: { id: alunoId }, data: { foto: fotoUrl } })

  return NextResponse.json({ url: fotoUrl })
}

export async function DELETE(request: Request) {
  const session = await getSession()
  if (!session.authenticated) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const alunoId = Number(searchParams.get("alunoId"))
  if (!alunoId) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  const aluno = await db.aluno.findUnique({ where: { id: alunoId }, select: { foto: true } })
  if (aluno?.foto) {
    const filePath = path.join(process.cwd(), "public", aluno.foto.replace(/^\//, ""))
    await unlink(filePath).catch(() => {})
  }

  await db.aluno.update({ where: { id: alunoId }, data: { foto: null } })
  return NextResponse.json({ ok: true })
}
