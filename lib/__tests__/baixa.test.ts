import { describe, expect, it } from "vitest"
import { cancelarRecibosDoPagamento, emitirReciboDaBaixa, type ClienteRecibo } from "@/lib/baixa"

type ReciboFake = Record<string, unknown> & { id: number; pagamentoId: number | null; canceladoAt: Date | null }

function fake(responsavelRef: { nome: string } | null = { nome: "Marta Souza" }) {
  const recibos: ReciboFake[] = []
  const client = {
    pagamento: {
      findUniqueOrThrow: async ({ where }: { where: { id: number } }) => ({
        id: where.id,
        alunoId: 3,
        mesReferencia: "2026-10",
        aluno: { nome: "Ana Souza", responsavel: "Marta (digitado)", responsavelRef },
      }),
    },
    recibo: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const r = { id: recibos.length + 1, canceladoAt: null, ...data } as ReciboFake
        recibos.push(r)
        return r
      },
      updateMany: async ({ where, data }: { where: { pagamentoId: number; canceladoAt: null }; data: Record<string, unknown> }) => {
        const alvo = recibos.filter((r) => r.pagamentoId === where.pagamentoId && r.canceladoAt === null)
        alvo.forEach((r) => Object.assign(r, data))
        return { count: alvo.length }
      },
    },
  }
  return { client: client as unknown as ClienteRecibo, recibos }
}

const baixa = { pagamentoId: 7, valor: 100, formaPagamento: "PIX", dataPagamento: new Date("2026-10-10T12:00:00"), emitidoPor: "sec" }

describe("emitirReciboDaBaixa", () => {
  it("cria recibo ligado ao pagamento e ao aluno, com hash", async () => {
    const { client, recibos } = fake()
    const r = await emitirReciboDaBaixa(client, baixa)
    expect(recibos[0]).toMatchObject({
      pagamentoId: 7, alunoId: 3, valor: 100, mesReferencia: "2026-10",
      responsavel: "Marta Souza", alunoNome: "Ana Souza", emitidoPor: "sec", formaPagamento: "PIX",
    })
    expect(recibos[0].hashIntegridade).toHaveLength(64)
    expect(r.numero).toBe(recibos[0].numero)
    expect(r.codigoVerificacao).toBe(recibos[0].codigoVerificacao)
  })

  it("sem responsável cadastrado usa o nome digitado no aluno", async () => {
    const { client, recibos } = fake(null)
    await emitirReciboDaBaixa(client, baixa)
    expect(recibos[0].responsavel).toBe("Marta (digitado)")
  })
})

describe("cancelarRecibosDoPagamento", () => {
  it("cancela só os recibos ativos do pagamento", async () => {
    const { client, recibos } = fake()
    await emitirReciboDaBaixa(client, baixa)
    await emitirReciboDaBaixa(client, { ...baixa, pagamentoId: 8 })
    expect(await cancelarRecibosDoPagamento(client, 7, "adm")).toBe(1)
    expect(recibos.filter((r) => r.canceladoAt)).toHaveLength(1)
    expect(recibos.find((r) => r.pagamentoId === 7)).toMatchObject({ canceladoPor: "adm" })
  })
})
