import { NextResponse } from "next/server"
import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"
import { getSession } from "@/lib/session"
import { resolveUploadsDir } from "@/lib/uploads-path"

/**
 * Upload de banner de publicidade. Diferente de /uploads/midia (só para quem está
 * logado), estes arquivos são servidos a qualquer visitante em /uploads/publicidade.
 * Por isso aceita apenas imagens, conferindo os bytes do formato.
 */
const TIPOS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }
const LIMITE = 5 * 1024 * 1024

function correspondeAoFormato(bytes: Uint8Array, mime: string) {
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (mime === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  if (mime === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
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
    return NextResponse.json({ error: "Selecione uma imagem" }, { status: 400 })
  }
  const ext = TIPOS[arquivo.type]
  if (!ext) return NextResponse.json({ error: "Formato não permitido. Use JPG, PNG ou WebP." }, { status: 400 })
  if (arquivo.size > LIMITE) return NextResponse.json({ error: "Imagem muito grande. Limite de 5 MB." }, { status: 400 })

  const bytes = new Uint8Array(await arquivo.arrayBuffer())
  if (!correspondeAoFormato(bytes, arquivo.type)) {
    return NextResponse.json({ error: "O conteúdo do arquivo não corresponde ao formato informado." }, { status: 400 })
  }

  const nome = `${randomUUID()}.${ext}`
  const dir = resolveUploadsDir("publicidade")
  await mkdir(dir, { recursive: true, mode: 0o750 })
  await writeFile(path.join(/* turbopackIgnore: true */ dir, nome), Buffer.from(bytes), { flag: "wx", mode: 0o640 })
  return NextResponse.json({ url: `/uploads/publicidade/${nome}` })
}
