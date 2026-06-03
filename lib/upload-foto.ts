import { detectImageKind, extensionForKind, type ImageKind } from "@/lib/image-magic"

export const MAX_FOTO_BYTES = 5 * 1024 * 1024

export type FotoUploadInput = {
  file: { size: number } | null
  alunoId: number
  alunoExists: boolean
  buffer: Uint8Array
}

export type FotoUploadSuccess = {
  ok: true
  kind: ImageKind
  extension: string
}

export type FotoUploadFailure = {
  ok: false
  error: string
  status: 400 | 404
}

export type FotoUploadResult = FotoUploadSuccess | FotoUploadFailure

export function validateFotoUpload(input: FotoUploadInput): FotoUploadResult {
  if (!input.file || !input.alunoId || Number.isNaN(input.alunoId)) {
    return { ok: false, error: "Dados inválidos", status: 400 }
  }

  if (input.file.size > MAX_FOTO_BYTES) {
    return { ok: false, error: "Imagem muito grande (máx. 5MB)", status: 400 }
  }

  if (!input.alunoExists) {
    return { ok: false, error: "Aluno não encontrado", status: 404 }
  }

  const kind = detectImageKind(input.buffer)
  if (!kind) {
    return {
      ok: false,
      error: "Arquivo não é uma imagem JPEG, PNG ou WebP válida",
      status: 400,
    }
  }

  return { ok: true, kind, extension: extensionForKind(kind) }
}
