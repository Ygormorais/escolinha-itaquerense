export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { validateFotoUpload } from "@/lib/upload-foto"
import { resolveUploadsDir } from "@/lib/uploads-path"

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
  const uploadDir = resolveUploadsDir("fotos")

  if (aluno!.foto) {
    const oldFilename = path.basename(aluno!.foto)
    await unlink(path.join(/* turbopackIgnore: true */ uploadDir, oldFilename)).catch(() => {})
    // legado: fotos antigas viviam em public/uploads/fotos/
    await unlink(
      path.join(/* turbopackIgnore: true */ process.cwd(), "public", "uploads", "fotos", oldFilename),
    ).catch(() => {})
  }

  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(/* turbopackIgnore: true */ uploadDir, filename), Buffer.from(bytes))

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
    const oldFilename = path.basename(aluno.foto)
    const uploadDir = resolveUploadsDir("fotos")
    await unlink(path.join(/* turbopackIgnore: true */ uploadDir, oldFilename)).catch(() => {})
    await unlink(
      path.join(/* turbopackIgnore: true */ process.cwd(), "public", "uploads", "fotos", oldFilename),
    ).catch(() => {})
  }

  await db.aluno.update({ where: { id: alunoId }, data: { foto: null } })
  return NextResponse.json({ ok: true })
}
