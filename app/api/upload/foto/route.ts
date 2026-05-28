import { NextResponse } from "next/server"
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { detectImageKind, extensionForKind } from "@/lib/image-magic"

const MAX_BYTES = 5 * 1024 * 1024

export async function POST(request: Request) {
  const session = await getSession()
  if (!session.authenticated) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("foto") as File | null
  const alunoId = Number(formData.get("alunoId"))

  if (!file || !alunoId || Number.isNaN(alunoId)) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Imagem muito grande (máx. 5MB)" }, { status: 400 })
  }

  const aluno = await db.aluno.findUnique({ where: { id: alunoId }, select: { id: true, foto: true } })
  if (!aluno) {
    return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = new Uint8Array(bytes)
  const kind = detectImageKind(buffer)
  if (!kind) {
    return NextResponse.json({ error: "Arquivo não é uma imagem JPEG, PNG ou WebP válida" }, { status: 400 })
  }

  const ext = extensionForKind(kind)
  const filename = `${alunoId}.${ext}`
  const uploadDir = path.join(process.cwd(), "public", "uploads", "fotos")

  if (aluno.foto) {
    const oldPath = path.join(process.cwd(), "public", aluno.foto.replace(/^\//, ""))
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
