import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
}))

vi.mock("@/lib/uploads-path", () => ({
  resolveUploadsDir: vi.fn().mockReturnValue("/data/uploads/matriculas"),
}))

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}))

import { GET } from "../route"
import { readFile } from "fs/promises"
import { getSession } from "@/lib/session"

const mockReadFile = readFile as unknown as ReturnType<typeof vi.fn>
const mockSession = getSession as unknown as ReturnType<typeof vi.fn>

const UUID_PDF = "3f2a9c1e-7b4d-4e2a-9f1c-0a1b2c3d4e5f.pdf"

function chamar(file: string) {
  return GET(new Request(`http://localhost/uploads/matriculas/${file}`), {
    params: Promise.resolve({ file }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSession.mockResolvedValue({ authenticated: true, user: "sec", role: "secretaria" })
  mockReadFile.mockResolvedValue(Buffer.from("%PDF"))
})

describe("GET /uploads/matriculas/[file]", () => {
  it("serve o arquivo com nome UUID gerado pelo upload", async () => {
    const res = await chamar(UUID_PDF)
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("application/pdf")
    expect(mockReadFile).toHaveBeenCalledWith(expect.stringContaining(UUID_PDF))
  })

  it("admin também lê", async () => {
    mockSession.mockResolvedValue({ authenticated: true, user: "adm", role: "admin" })
    const res = await chamar(UUID_PDF)
    expect(res.status).toBe(200)
  })

  it("técnico não lê documentos de matrícula", async () => {
    mockSession.mockResolvedValue({ authenticated: true, user: "tec", role: "tecnico" })
    const res = await chamar(UUID_PDF)
    expect(res.status).toBe(404)
    expect(mockReadFile).not.toHaveBeenCalled()
  })

  it("sem sessão responde 404", async () => {
    mockSession.mockResolvedValue({ authenticated: false })
    const res = await chamar(UUID_PDF)
    expect(res.status).toBe(404)
  })

  it("rejeita nomes fora do padrão", async () => {
    for (const nome of ["../etc.pdf", "123-abc.pdf", "3f2a9c1e-7b4d-4e2a-9f1c-0a1b2c3d4e5f.exe"]) {
      const res = await chamar(nome)
      expect(res.status).toBe(404)
    }
    expect(mockReadFile).not.toHaveBeenCalled()
  })
})
