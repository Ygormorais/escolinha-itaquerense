import path from "path"

export function resolveUploadsDir(subdir: "fotos" | "matriculas"): string {
  const base = process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads")
  return path.join(base, subdir)
}
