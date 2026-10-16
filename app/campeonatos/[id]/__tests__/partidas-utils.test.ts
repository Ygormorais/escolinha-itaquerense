import { describe, expect, it } from "vitest"
import type { PartidaCampeonato } from "@/components/campeonatos/types"
import {
  filtrarPartidas,
  formDaPartida,
  formPartidaVazio,
  payloadPartida,
  placarDaPartida,
} from "@/app/campeonatos/[id]/partidas-utils"

function partida(id: number, extra: Partial<PartidaCampeonato> = {}): PartidaCampeonato {
  return {
    id, campeonatoId: 3, rodada: id, data: new Date(2026, 8, id, 12), adversario: `Time ${id}`,
    local: "Casa", golsPro: null, golsContra: null, resultado: null, observacoes: null,
    ...extra,
  }
}

const vitoria = partida(1, { adversario: "Rival FC", golsPro: 2, golsContra: 0, resultado: "Vitoria", observacoes: "Chuva" })
const pendente = partida(2, { adversario: "Outro Rival" })
const zeroAZero = partida(3, { golsPro: 0, golsContra: 0, resultado: "Empate" })

describe("filtrarPartidas", () => {
  const todas = [vitoria, pendente, zeroAZero]

  it("separa realizadas e pendentes", () => {
    expect(filtrarPartidas(todas, "todas", "")).toEqual(todas)
    expect(filtrarPartidas(todas, "realizadas", "")).toEqual([vitoria, zeroAZero])
    expect(filtrarPartidas(todas, "pendentes", "")).toEqual([pendente])
  })

  it("busca o adversário sem diferenciar maiúsculas", () => {
    expect(filtrarPartidas(todas, "todas", "RIVAL")).toEqual([vitoria, pendente])
    expect(filtrarPartidas(todas, "realizadas", "outro")).toEqual([])
  })
})

describe("formulário", () => {
  it("começa na rodada 1, em casa", () => {
    expect(formPartidaVazio()).toEqual({ rodada: "1", data: "", adversario: "", local: "Casa", golsPro: "", golsContra: "", observacoes: "" })
  })

  it("preenche a partir de uma partida, mantendo placar zero", () => {
    expect(formDaPartida(zeroAZero)).toMatchObject({ rodada: "3", data: "2026-09-03", golsPro: "0", golsContra: "0", observacoes: "" })
    expect(formDaPartida(pendente)).toMatchObject({ golsPro: "", golsContra: "" })
  })

  it("converte para a action: gols em branco viram null", () => {
    expect(payloadPartida(formDaPartida(pendente))).toEqual({
      rodada: 2, data: "2026-09-02", adversario: "Outro Rival", local: "Casa",
      golsPro: null, golsContra: null, observacoes: undefined,
    })
    expect(payloadPartida(formDaPartida(vitoria))).toMatchObject({ golsPro: 2, golsContra: 0, observacoes: "Chuva" })
  })
})

describe("placarDaPartida", () => {
  it("usa texto vazio quando o jogo ainda não tem placar", () => {
    expect(placarDaPartida(pendente)).toEqual({ golsPro: "", golsContra: "" })
    expect(placarDaPartida(vitoria)).toEqual({ golsPro: "2", golsContra: "0" })
  })
})
