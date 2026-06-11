import { describe, it, expect } from "vitest"
import { parseFotoFilename, canAccessFoto } from "../foto-acesso"

describe("parseFotoFilename", () => {
  it("aceita nome gerado pelo upload (alunoId.ext)", () => {
    expect(parseFotoFilename("12.jpg")).toEqual({ alunoId: 12, ext: "jpg" })
    expect(parseFotoFilename("3.png")).toEqual({ alunoId: 3, ext: "png" })
    expect(parseFotoFilename("7.webp")).toEqual({ alunoId: 7, ext: "webp" })
  })

  it("rejeita path traversal e encoding", () => {
    expect(parseFotoFilename("../1.jpg")).toBeNull()
    expect(parseFotoFilename("..%2F1.jpg")).toBeNull()
    expect(parseFotoFilename("1.jpg/../../x")).toBeNull()
    expect(parseFotoFilename("1%2Ejpg")).toBeNull()
  })

  it("rejeita extensões e formatos não gerados pelo upload", () => {
    expect(parseFotoFilename("1.jpeg")).toBeNull()
    expect(parseFotoFilename("1.svg")).toBeNull()
    expect(parseFotoFilename("1.jpg.exe")).toBeNull()
    expect(parseFotoFilename("abc.jpg")).toBeNull()
    expect(parseFotoFilename("1.JPG")).toBeNull()
    expect(parseFotoFilename("")).toBeNull()
  })
})

describe("canAccessFoto", () => {
  it("admin acessa qualquer foto", () => {
    expect(canAccessFoto({ adminAuthenticated: true, responsavelId: null, alunoResponsavelId: 99 })).toBe(true)
    expect(canAccessFoto({ adminAuthenticated: true, responsavelId: null, alunoResponsavelId: null })).toBe(true)
  })

  it("responsável acessa apenas aluno vinculado a ele", () => {
    expect(canAccessFoto({ adminAuthenticated: false, responsavelId: 5, alunoResponsavelId: 5 })).toBe(true)
    expect(canAccessFoto({ adminAuthenticated: false, responsavelId: 5, alunoResponsavelId: 6 })).toBe(false)
    expect(canAccessFoto({ adminAuthenticated: false, responsavelId: 5, alunoResponsavelId: null })).toBe(false)
  })

  it("aluno inexistente nega mesmo para responsável autenticado", () => {
    expect(canAccessFoto({ adminAuthenticated: false, responsavelId: 5, alunoResponsavelId: undefined })).toBe(false)
  })

  it("sem nenhuma sessão nega", () => {
    expect(canAccessFoto({ adminAuthenticated: false, responsavelId: null, alunoResponsavelId: 5 })).toBe(false)
  })
})
