import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    aluno: { create: vi.fn() },
    pagamento: { createMany: vi.fn() },
  },
}))
vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn().mockResolvedValue({}) }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/app/actions/log", () => ({ registrarLog: vi.fn() }))

import { importarAlunosCSV } from "@/app/actions/importar"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { registrarLog } from "@/app/actions/log"

const m = db as unknown as {
  aluno: { create: ReturnType<typeof vi.fn> }
  pagamento: { createMany: ReturnType<typeof vi.fn> }
}

const alunoValido = {
  nome: "Lucas Silva",
  dataNascimento: "2015-03-10",
  turma: "Sub-11",
  horario: "Seg/Qua 10h",
  responsavel: "Carlos Silva",
  telefone: "11999990000",
  email: "carlos@test.com",
  dataMatricula: "2026-01-01",
  mensalidade: 150,
}

beforeEach(() => {
  vi.clearAllMocks()
  m.aluno.create.mockResolvedValue({ id: 42 })
  m.pagamento.createMany.mockResolvedValue({ count: 12 })
})

describe("importarAlunosCSV", () => {
  it("fluxo feliz — 2 alunos válidos: importa ambos sem erros", async () => {
    const resultado = await importarAlunosCSV([alunoValido, { ...alunoValido, nome: "Ana Costa" }])

    expect(resultado).toEqual({ importados: 2, erros: [] })
    expect(m.aluno.create).toHaveBeenCalledTimes(2)
    expect(m.pagamento.createMany).toHaveBeenCalledTimes(2)

    // Cada chamada deve conter 12 itens
    const [primeiraChamada] = m.pagamento.createMany.mock.calls
    expect(primeiraChamada[0].data).toHaveLength(12)
    const [, segundaChamada] = m.pagamento.createMany.mock.calls
    expect(segundaChamada[0].data).toHaveLength(12)
  })

  it("linha com nome vazio — retorna erro na linha 2, zero importados", async () => {
    const resultado = await importarAlunosCSV([{ ...alunoValido, nome: "" }])

    expect(resultado).toEqual({
      importados: 0,
      erros: [{ linha: 2, erro: "Nome obrigatório" }],
    })
    expect(m.aluno.create).not.toHaveBeenCalled()
  })

  it("linha com mensalidade 0 (inválida) — captura erro da linha, não lança exceção", async () => {
    const resultado = await importarAlunosCSV([{ ...alunoValido, mensalidade: 0 }])

    expect(resultado).toMatchObject({ importados: 0 })
    const r = resultado as { importados: number; erros: { linha: number; erro: string }[] }
    expect(r.erros).toHaveLength(1)
    expect(r.erros[0].linha).toBe(2)
    expect(r.erros[0].erro).toBeTruthy()
    expect(m.aluno.create).not.toHaveBeenCalled()
  })

  it("mix: 1 válido + 1 inválido (nome vazio) — importa 1, registra erro na linha 3", async () => {
    const resultado = await importarAlunosCSV([
      alunoValido,
      { ...alunoValido, nome: "" },
    ])

    expect(resultado).toEqual({
      importados: 1,
      erros: [{ linha: 3, erro: expect.any(String) }],
    })
    expect(m.aluno.create).toHaveBeenCalledTimes(1)
  })

  it("exige autenticação — requireAuth é sempre chamado", async () => {
    await importarAlunosCSV([alunoValido])

    expect(requireAuth).toHaveBeenCalledTimes(1)
  })

  it("registra log e revalida paths quando pelo menos 1 aluno é importado", async () => {
    await importarAlunosCSV([alunoValido])

    expect(registrarLog).toHaveBeenCalledWith("aluno_novo", expect.stringContaining("importado"))
    expect(revalidatePath).toHaveBeenCalledWith("/alunos")
    expect(revalidatePath).toHaveBeenCalledWith("/")
  })

  it("não registra log quando nenhum aluno é importado", async () => {
    await importarAlunosCSV([{ ...alunoValido, nome: "" }])

    expect(registrarLog).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
