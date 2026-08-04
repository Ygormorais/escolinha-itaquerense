import path from "path"

export function resolveUploadsDir(subdir: "fotos" | "matriculas"): string {
  const base = process.env.UPLOADS_DIR
    ?? path.join(/* turbopackIgnore: true */ process.cwd(), "uploads")
  return path.join(/* turbopackIgnore: true */ base, subdir)
}
