import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn().mockResolvedValue({ role: "secretaria" }) }))
vi.mock("@/lib/db", () => ({
  db: {
    aluno: { findMany: vi.fn().mockResolvedValue([]) },
    pagamento: { findMany: vi.fn().mockResolvedValue([]) },
  },
}))

import { requireAuth } from "@/lib/auth"
import { getAlunosRelatorioCompleto, getPagamentosRelatorioCompleto } from "@/app/relatorio/export-actions"

describe("exportação completa de relatórios", () => {
  beforeEach(() => vi.clearAllMocks())

  it("protege a exportação de alunos", async () => {
    await getAlunosRelatorioCompleto({
      q: "", turma: "todas", status: "ativos", faixa: "todas", sort: "nome", dir: "asc", page: 1,
    })
    expect(requireAuth).toHaveBeenCalledWith(["admin", "secretaria"])
  })

  it("protege a exportação de pagamentos", async () => {
    await getPagamentosRelatorioCompleto({
      ano: 2026, q: "", turma: "todas", status: "todos", canal: "todos", page: 1,
    })
    expect(requireAuth).toHaveBeenCalledWith(["admin", "secretaria"])
  })
})
