import path from "path"

/**
 * Resolve o caminho do arquivo SQLite a partir de DATABASE_URL (file:...),
 * relativo ao cwd quando não for absoluto. Fallback: prisma/dev.db.
 * Deve bater com a resolução usada pelo prisma migrate (prisma.config.ts).
 */
export function resolveDbPath(): string {
  const url = process.env.DATABASE_URL
  if (url?.startsWith("file:")) {
    const p = url.slice("file:".length)
    return path.isAbsolute(p) ? p : path.join(process.cwd(), p)
  }
  return path.join(process.cwd(), "prisma", "dev.db")
}
