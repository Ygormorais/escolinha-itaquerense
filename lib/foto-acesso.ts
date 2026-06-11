// Decisão de acesso às fotos de alunos servidas por app/uploads/fotos/[file].
// Pura (sem IO) para ser testável; o route handler fornece as sessões e o aluno.

export type FotoExt = "jpg" | "png" | "webp"

// Nomes gerados pelo upload: `${alunoId}.${ext}` — qualquer outra coisa
// (traversal, encoding, maiúsculas) é rejeitada antes de tocar o filesystem
const FOTO_NAME = /^(\d+)\.(jpg|png|webp)$/

export function parseFotoFilename(file: string): { alunoId: number; ext: FotoExt } | null {
  const m = FOTO_NAME.exec(file)
  if (!m) return null
  return { alunoId: Number(m[1]), ext: m[2] as FotoExt }
}

export type FotoAccessInput = {
  adminAuthenticated: boolean
  responsavelId: number | null
  /** responsavelId do aluno; null = aluno sem responsável; undefined = aluno não existe */
  alunoResponsavelId: number | null | undefined
}

export function canAccessFoto(input: FotoAccessInput): boolean {
  if (input.adminAuthenticated) return true
  if (input.responsavelId == null) return false
  if (input.alunoResponsavelId == null) return false
  return input.alunoResponsavelId === input.responsavelId
}
