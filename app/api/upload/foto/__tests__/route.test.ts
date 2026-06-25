import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("fs/promises", () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/db", () => ({
  db: {
    aluno: { findUnique: vi.fn(), update: vi.fn() },
  },
}))

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}))

vi.mock("@/lib/upload-foto", () => ({
  validateFotoUpload: vi.fn(),
}))

vi.mock("@/lib/uploads-path", () => ({
  resolveUploadsDir: vi.fn().mockReturnValue("/data/uploads/fotos"),
}))

import { POST, DELETE } from "../route"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { validateFotoUpload } from "@/lib/upload-foto"
import { writeFile, mkdir } from "fs/promises"

const mockDb = db as unknown as {
  aluno: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
}
const mockGetSession = getSession as ReturnType<typeof vi.fn>
const mockValidate = validateFotoUpload as ReturnType<typeof vi.fn>
const mockWriteFile = writeFile as ReturnType<typeof vi.fn>

// JPEG magic bytes
const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array(100).fill(0)])

function makeFormData(alunoId: number, file?: File) {
  const fd = new FormData()
  fd.append("alunoId", String(alunoId))
  if (file) fd.append("foto", file)
  return fd
}

function makeFile(name = "foto.jpg", bytes = JPEG_BYTES) {
  return new File([bytes], name, { type: "image/jpeg" })
}

function makePostRequest(formData: FormData) {
  return new Request("http://localhost/api/upload/foto", {
    method: "POST",
    body: formData,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetSession.mockResolvedValue({ authenticated: true, user: "admin" })
  mockDb.aluno.findUnique.mockResolvedValue({ id: 1, foto: null })
  mockDb.aluno.update.mockResolvedValue({})
  mockValidate.mockReturnValue({ ok: true, extension: "jpg" })
  mockWriteFile.mockResolvedValue(undefined)
})

describe("POST /api/upload/foto", () => {
  it("retorna 401 sem sessão", async () => {
    mockGetSession.mockResolvedValue({ authenticated: false })
    const res = await POST(makePostRequest(makeFormData(1, makeFile())))
    expect(res.status).toBe(401)
  })

  it("retorna 400 quando validação falha", async () => {
    mockValidate.mockReturnValue({ ok: false, error: "Arquivo inválido", status: 400 })
    const res = await POST(makePostRequest(makeFormData(1, makeFile())))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("Arquivo inválido")
  })

  it("salva arquivo e atualiza DB retornando URL", async () => {
    const res = await POST(makePostRequest(makeFormData(1, makeFile())))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe("/uploads/fotos/1.jpg")
    expect(mockDb.aluno.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { foto: "/uploads/fotos/1.jpg" } })
    )
    expect(mockWriteFile).toHaveBeenCalledOnce()
  })

  it("retorna 404 quando validação diz aluno não encontrado", async () => {
    mockValidate.mockReturnValue({ ok: false, error: "Aluno não encontrado", status: 404 })
    const res = await POST(makePostRequest(makeFormData(99, makeFile())))
    expect(res.status).toBe(404)
  })
})

describe("DELETE /api/upload/foto", () => {
  it("retorna 401 sem sessão", async () => {
    mockGetSession.mockResolvedValue({ authenticated: false })
    const res = await DELETE(new Request("http://localhost/api/upload/foto?alunoId=1"))
    expect(res.status).toBe(401)
  })

  it("retorna 400 sem alunoId", async () => {
    const res = await DELETE(new Request("http://localhost/api/upload/foto"))
    expect(res.status).toBe(400)
  })

  it("remove foto e limpa DB", async () => {
    mockDb.aluno.findUnique.mockResolvedValue({ foto: "/uploads/fotos/1.jpg" })
    const res = await DELETE(new Request("http://localhost/api/upload/foto?alunoId=1"))
    expect(res.status).toBe(200)
    expect(mockDb.aluno.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { foto: null } })
    )
  })

  it("retorna ok mesmo quando aluno não tem foto", async () => {
    mockDb.aluno.findUnique.mockResolvedValue({ foto: null })
    const res = await DELETE(new Request("http://localhost/api/upload/foto?alunoId=1"))
    expect(res.status).toBe(200)
  })
})
