import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("fs/promises", () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({ ok: true }),
}))

vi.mock("@/lib/rate-limit-response", () => ({
  rateLimitResponse: vi.fn().mockReturnValue(
    new Response(JSON.stringify({ error: "rate limited" }), { status: 429 })
  ),
}))

vi.mock("@/lib/uploads-path", () => ({
  resolveUploadsDir: vi.fn().mockReturnValue("/data/uploads/matriculas"),
}))

import { POST } from "../route"
import { checkRateLimit } from "@/lib/rate-limit"
import { writeFile } from "fs/promises"

const mockRateLimit = checkRateLimit as ReturnType<typeof vi.fn>
const mockWriteFile = writeFile as ReturnType<typeof vi.fn>

// Magic bytes para cada tipo
const JPEG_MAGIC = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array(100).fill(0)])
const PNG_MAGIC = new Uint8Array([0x89, 0x50, 0x4e, 0x47, ...new Array(100).fill(0)])
const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46, ...new Array(100).fill(0)])
const INVALID_MAGIC = new Uint8Array([0x00, 0x00, 0x00, 0x00, ...new Array(100).fill(0)])

function makeFile(name: string, bytes: Uint8Array) {
  return new File([bytes.buffer as ArrayBuffer], name, { type: "application/octet-stream" })
}

function makeRequest(file?: File) {
  const fd = new FormData()
  if (file) fd.append("documento", file)
  return new Request("http://localhost/api/upload/matricula", {
    method: "POST",
    headers: { "x-forwarded-for": "1.2.3.4" },
    body: fd,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRateLimit.mockReturnValue({ ok: true })
  mockWriteFile.mockResolvedValue(undefined)
})

describe("POST /api/upload/matricula", () => {
  it("retorna 400 sem arquivo", async () => {
    const res = await POST(makeRequest())
    expect(res.status).toBe(400)
  })

  it("aceita JPEG válido por magic bytes e retorna URL", async () => {
    const res = await POST(makeRequest(makeFile("doc.jpg", JPEG_MAGIC)))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toMatch(/^\/uploads\/matriculas\//)
    expect(body.name).toBe("doc.jpg")
    expect(mockWriteFile).toHaveBeenCalledOnce()
  })

  it("aceita PNG válido por magic bytes", async () => {
    const res = await POST(makeRequest(makeFile("doc.png", PNG_MAGIC)))
    expect(res.status).toBe(200)
  })

  it("aceita PDF válido por magic bytes", async () => {
    const res = await POST(makeRequest(makeFile("doc.pdf", PDF_MAGIC)))
    expect(res.status).toBe(200)
  })

  it("rejeita arquivo com magic bytes inválidos mesmo com extensão .jpg", async () => {
    const res = await POST(makeRequest(makeFile("malicious.jpg", INVALID_MAGIC)))
    expect(res.status).toBe(400)
    expect(mockWriteFile).not.toHaveBeenCalled()
  })

  it("rejeita extensão não permitida (.exe) mesmo com magic bytes JPEG", async () => {
    const res = await POST(makeRequest(makeFile("virus.exe", JPEG_MAGIC)))
    expect(res.status).toBe(400)
    expect(mockWriteFile).not.toHaveBeenCalled()
  })

  it("rejeita arquivo maior que 5MB", async () => {
    const bigFile = new File([new Uint8Array(6 * 1024 * 1024)], "big.pdf", { type: "application/pdf" })
    const res = await POST(makeRequest(bigFile))
    expect(res.status).toBe(400)
  })

  it("retorna 429 quando rate limit excedido", async () => {
    mockRateLimit.mockReturnValue({ ok: false, retryAfterMs: 60_000 })
    const res = await POST(makeRequest(makeFile("doc.pdf", PDF_MAGIC)))
    expect(res.status).toBe(429)
  })
})
