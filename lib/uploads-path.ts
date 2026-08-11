import path from "path"

export function resolveUploadsBaseDir(): string {
  return process.env.UPLOADS_DIR
    ?? path.join(/* turbopackIgnore: true */ process.cwd(), "uploads")
}

export function resolveUploadsDir(subdir: "fotos" | "matriculas"): string {
  return path.join(/* turbopackIgnore: true */ resolveUploadsBaseDir(), subdir)
}
