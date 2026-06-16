import path from "path"

export function resolveUploadsDir(subdir: "fotos" | "matriculas"): string {
  const base = process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads")
  // Se base vem de UPLOADS_DIR (env var), usa / como separador (posix path)
  // Se base vem de path.join, já está normalizado para o OS
  if (process.env.UPLOADS_DIR) {
    return `${base}/${subdir}`
  }
  return path.join(base, subdir)
}
