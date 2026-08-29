import { NextResponse } from "next/server"
import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"
import { getSession } from "@/lib/session"
import { resolveUploadsDir } from "@/lib/uploads-path"

const TIPOS: Record<string, { ext: string; max: number }> = {
  "image/jpeg": { ext: "jpg", max: 10 * 1024 * 1024 },
  "image/png": { ext: "png", max: 10 * 1024 * 1024 },
  "image/webp": { ext: "webp", max: 10 * 1024 * 1024 },
  "video/mp4": { ext: "mp4", max: 100 * 1024 * 1024 },
  "video/webm": { ext: "webm", max: 100 * 1024 * 1024 },
}

function correspondeAoFormato(bytes: Uint8Array, mime: string) {
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (mime === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  if (mime === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  if (mime === "video/mp4") return String.fromCharCode(...bytes.slice(4, 8)) === "ftyp"
  if (mime === "video/webm") return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3
  return false
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session.authenticated || !["admin", "secretaria"].includes(session.role ?? "")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const formData = await request.formData()
  const arquivo = formData.get("arquivo")
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return NextResponse.json({ error: "Selecione um arquivo" }, { status: 400 })
  }

  const regra = TIPOS[arquivo.type]
  if (!regra) {
    return NextResponse.json({ error: "Formato não permitido. Use JPG, PNG, WebP, MP4 ou WebM." }, { status: 400 })
  }
  if (arquivo.size > regra.max) {
    const limite = regra.max / 1024 / 1024
    return NextResponse.json({ error: `Arquivo muito grande. Limite de ${limite} MB.` }, { status: 400 })
  }

  const bytes = new Uint8Array(await arquivo.arrayBuffer())
  if (!correspondeAoFormato(bytes, arquivo.type)) {
    return NextResponse.json({ error: "O conteúdo do arquivo não corresponde ao formato informado." }, { status: 400 })
  }

  const nome = `${randomUUID()}.${regra.ext}`
  const dir = resolveUploadsDir("midia")
  await mkdir(dir, { recursive: true, mode: 0o750 })
  await writeFile(path.join(/* turbopackIgnore: true */ dir, nome), Buffer.from(bytes), { flag: "wx", mode: 0o640 })
  return NextResponse.json({ url: `/uploads/midia/${nome}`, nomeOriginal: arquivo.name })
}
