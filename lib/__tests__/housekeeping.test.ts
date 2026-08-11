import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  deleteDocumentos: vi.fn().mockResolvedValue(1),
  deleteOrfaos: vi.fn().mockResolvedValue(2),
  preDelete: vi.fn().mockResolvedValue({}),
  preFindMany: vi.fn(),
}))

vi.mock("@/lib/matricula-files", () => ({
  deleteMatriculaDocuments: mocks.deleteDocumentos,
  deleteOrphanMatriculaDocuments: mocks.deleteOrfaos,
}))

vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn() } }))

vi.mock("@/lib/db", () => ({
  db: {
    log: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
    whatsAppMensagem: { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) },
    resetToken: { deleteMany: vi.fn().mockResolvedValue({ count: 3 }) },
    solicitacao: {
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    classificacaoFpfs: { deleteMany: vi.fn().mockResolvedValue({ count: 4 }) },
    preMatricula: { findMany: mocks.preFindMany, delete: mocks.preDelete },
  },
}))

import { runHousekeeping } from "../housekeeping"

beforeEach(() => {
  vi.clearAllMocks()
  mocks.deleteDocumentos.mockResolvedValue(1)
  mocks.deleteOrfaos.mockResolvedValue(2)
})

describe("housekeeping de pré-matrículas", () => {
  it("aplica os prazos por status, remove anexos e limpa órfãos", async () => {
    const now = Date.now()
    const daysAgo = (days: number) => new Date(now - days * 86_400_000)
    mocks.preFindMany.mockResolvedValue([
      { id: 1, status: "pendente", createdAt: daysAgo(91), decididoEm: null, documentos: '["/uploads/matriculas/pendente.pdf"]' },
      { id: 2, status: "recusada", createdAt: daysAgo(60), decididoEm: daysAgo(31), documentos: '["/uploads/matriculas/recusada.pdf"]' },
      { id: 3, status: "aprovada", createdAt: daysAgo(100), decididoEm: daysAgo(89), documentos: '["/uploads/matriculas/mantida.pdf"]' },
    ])

    const result = await runHousekeeping()

    expect(mocks.preDelete).toHaveBeenCalledTimes(2)
    expect(mocks.preDelete).toHaveBeenCalledWith({ where: { id: 1 } })
    expect(mocks.preDelete).toHaveBeenCalledWith({ where: { id: 2 } })
    expect(mocks.deleteDocumentos).toHaveBeenCalledTimes(2)
    expect(mocks.deleteOrfaos).toHaveBeenCalledWith(
      ['["/uploads/matriculas/mantida.pdf"]'],
      expect.any(Date),
    )
    expect(result).toMatchObject({
      preMatriculasRemovidas: 2,
      documentosOrfaosRemovidos: 2,
      classificacoesInvalidasRemovidas: 4,
    })
  })
})
