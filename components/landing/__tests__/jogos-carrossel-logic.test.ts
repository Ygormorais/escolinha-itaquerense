import { describe, it, expect } from "vitest"
import { proximoFoco } from "@/components/landing/jogos-carrossel-logic"

const tamanhos = [2, 3]

describe("proximoFoco", () => {
  it("avança para o próximo card na mesma aba", () => {
    expect(proximoFoco({ aba: 0, card: 0 }, tamanhos)).toEqual({ aba: 0, card: 1 })
  })
  it("passa para a próxima aba ao terminar a aba atual", () => {
    expect(proximoFoco({ aba: 0, card: 1 }, tamanhos)).toEqual({ aba: 1, card: 0 })
  })
  it("volta ao início após a última aba", () => {
    expect(proximoFoco({ aba: 1, card: 2 }, tamanhos)).toEqual({ aba: 0, card: 0 })
  })
  it("lida com lista vazia sem quebrar", () => {
    expect(proximoFoco({ aba: 0, card: 0 }, [])).toEqual({ aba: 0, card: 0 })
  })
})
