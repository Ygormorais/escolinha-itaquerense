import fs from "fs"
import os from "os"
import path from "path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const tempDirs: string[] = []

beforeEach(() => {
  vi.resetModules()
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "matricula-files-test-"))
  tempDirs.push(root)
  process.env.UPLOADS_DIR = path.join(root, "uploads")
})

afterEach(() => {
  delete process.env.UPLOADS_DIR
  for (const root of tempDirs.splice(0)) fs.rmSync(root, { recursive: true, force: true })
})

describe("documentos de pré-matrícula", () => {
  it("aceita somente URLs internas sem travessia de diretório", async () => {
    const { parseMatriculaDocuments } = await import("../matricula-files")
    expect(parseMatriculaDocuments(JSON.stringify([
      "/uploads/matriculas/documento.pdf",
      "/uploads/matriculas/..",
      "/uploads/matriculas/../../segredo",
      "https://example.com/documento.pdf",
    ]))).toEqual(["/uploads/matriculas/documento.pdf"])
  })

  it("remove anexos referenciados e ignora arquivos já ausentes", async () => {
    const { deleteMatriculaDocuments } = await import("../matricula-files")
    const dir = path.join(process.env.UPLOADS_DIR!, "matriculas")
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, "documento.pdf"), "conteúdo")
    await expect(deleteMatriculaDocuments(JSON.stringify([
      "/uploads/matriculas/documento.pdf",
      "/uploads/matriculas/ausente.pdf",
    ]))).resolves.toBe(1)
    expect(fs.existsSync(path.join(dir, "documento.pdf"))).toBe(false)
  })

  it("remove só órfãos mais antigos que o limite", async () => {
    const { deleteOrphanMatriculaDocuments } = await import("../matricula-files")
    const dir = path.join(process.env.UPLOADS_DIR!, "matriculas")
    fs.mkdirSync(dir, { recursive: true })
    for (const file of ["referenciado.pdf", "orfao-antigo.pdf", "orfao-recente.pdf"]) {
      fs.writeFileSync(path.join(dir, file), file)
    }
    const antigo = new Date("2026-08-01T00:00:00Z")
    fs.utimesSync(path.join(dir, "referenciado.pdf"), antigo, antigo)
    fs.utimesSync(path.join(dir, "orfao-antigo.pdf"), antigo, antigo)

    const count = await deleteOrphanMatriculaDocuments(
      [JSON.stringify(["/uploads/matriculas/referenciado.pdf"])],
      new Date("2026-08-10T00:00:00Z"),
    )
    expect(count).toBe(1)
    expect(fs.existsSync(path.join(dir, "referenciado.pdf"))).toBe(true)
    expect(fs.existsSync(path.join(dir, "orfao-antigo.pdf"))).toBe(false)
    expect(fs.existsSync(path.join(dir, "orfao-recente.pdf"))).toBe(true)
  })
})
