import { beforeEach, describe, expect, it, vi } from "vitest"

const { requireAuthMock } = vi.hoisted(() => ({ requireAuthMock: vi.fn() }))

vi.mock("@/lib/auth", () => ({ requireAuth: requireAuthMock }))
vi.mock("@/lib/db", () => ({ db: {} }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { getCustosRecorrentes, gerarCustosRecorrentes } from "@/app/actions/custos"
import { getLancamentos, getResumoExtrato } from "@/app/actions/extrato"
import { getTransacoes, getResumoMaquina } from "@/app/actions/maquina"
import { getPagamentosPendentes } from "@/app/actions/pagamentos"
import { getHistoricoWhatsApp, getMensagensNaoLidas } from "@/app/actions/whatsapp"
import { getEscalacao } from "@/app/actions/escalacao-partida"
import { listarCampeonatos, getCampeonato } from "@/app/actions/campeonatos"
import { convocarEscalacao } from "@/app/actions/convocacao"

beforeEach(() => {
  vi.clearAllMocks()
  requireAuthMock.mockRejectedValue(new Error("Acesso negado"))
})

describe("Server Actions sensíveis autorizam antes de acessar dados", () => {
  it.each([
    ["custos recorrentes", () => getCustosRecorrentes(), ["admin"]],
    ["geração de custos", () => gerarCustosRecorrentes("2026-08"), ["admin"]],
    ["lançamentos bancários", () => getLancamentos(), ["admin", "secretaria"]],
    ["resumo bancário", () => getResumoExtrato(), ["admin", "secretaria"]],
    ["transações da maquininha", () => getTransacoes(), ["admin", "secretaria"]],
    ["resumo da maquininha", () => getResumoMaquina(), ["admin", "secretaria"]],
    ["pagamentos pendentes", () => getPagamentosPendentes(1), ["admin", "secretaria"]],
    ["histórico de WhatsApp", () => getHistoricoWhatsApp(1), ["admin", "secretaria"]],
    ["mensagens não lidas", () => getMensagensNaoLidas(), ["admin", "secretaria"]],
    ["escalação", () => getEscalacao(1), ["admin", "tecnico"]],
    ["campeonatos", () => listarCampeonatos(), ["admin", "tecnico"]],
    ["detalhe do campeonato", () => getCampeonato(1), ["admin", "tecnico"]],
    ["convocação", () => convocarEscalacao(1), ["admin", "tecnico"]],
  ] as const)("protege %s", async (_nome, action, roles) => {
    await expect(action()).rejects.toThrow("Acesso negado")
    expect(requireAuthMock).toHaveBeenCalledWith([...roles])
  })
})
