import path from "path"
import { lstat, mkdir, readdir, unlink } from "fs/promises"
import { resolveUploadsDir } from "@/lib/uploads-path"

const DOCUMENT_PATH = /^\/uploads\/matriculas\/([A-Za-z0-9._-]+)$/

function filenameFromDocumentUrl(value: string): string | null {
  const match = DOCUMENT_PATH.exec(value)
  if (!match || match[1] === "." || match[1] === "..") return null
  return match[1]
}

export function parseMatriculaDocuments(value: string | null | undefined): string[] {
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is string => (
      typeof item === "string" && filenameFromDocumentUrl(item) !== null
    ))
  } catch {
    return []
  }
}

function documentFile(url: string): string | null {
  const filename = filenameFromDocumentUrl(url)
  if (!filename) return null
  return path.join(/* turbopackIgnore: true */ resolveUploadsDir("matriculas"), filename)
}

export async function deleteMatriculaDocuments(value: string | null | undefined): Promise<number> {
  let removed = 0
  for (const url of parseMatriculaDocuments(value)) {
    const file = documentFile(url)
    if (!file) continue
    try {
      await unlink(file)
      removed++
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
    }
  }
  return removed
}

export async function deleteOrphanMatriculaDocuments(
  referencedValues: Array<string | null>,
  olderThan: Date,
): Promise<number> {
  const uploadDir = resolveUploadsDir("matriculas")
  await mkdir(uploadDir, { recursive: true, mode: 0o700 })
  const referenced = new Set(
    referencedValues.flatMap(parseMatriculaDocuments).map(filenameFromDocumentUrl).filter((name): name is string => Boolean(name)),
  )
  let removed = 0
  for (const entry of await readdir(uploadDir, { withFileTypes: true })) {
    if (referenced.has(entry.name) || (!entry.isFile() && !entry.isSymbolicLink())) continue
    const file = path.join(uploadDir, entry.name)
    const stats = await lstat(file)
    if (stats.mtime >= olderThan) continue
    await unlink(file)
    removed++
  }
  return removed
}
