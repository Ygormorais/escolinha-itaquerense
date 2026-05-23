import { NextResponse } from "next/server"
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session.authenticated) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("foto") as File | null
  const alunoId = Number(formData.get("alunoId"))

  if (!file || !alunoId) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Apenas imagens são permitidas" }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Imagem muito grande (máx. 5MB)" }, { status: 400 })
  }

  const ext = file.type === "image/png" ? "png" : "jpg"
  const filename = `${alunoId}.${ext}`
  const uploadDir = path.join(process.cwd(), "public", "uploads", "fotos")

  await mkdir(uploadDir, { recursive: true })
  const bytes = await file.arrayBuffer()
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
    const filePath = path.join(process.cwd(), "public", aluno.foto)
    await unlink(filePath).catch(() => {})
  }

  await db.aluno.update({ where: { id: alunoId }, data: { foto: null } })
  return NextResponse.json({ ok: true })
}
