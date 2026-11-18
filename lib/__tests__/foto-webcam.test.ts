import { describe, expect, it } from "vitest"
import { recorteRetrato34, tamanhoSaida } from "@/lib/foto-webcam"

describe("recorteRetrato34", () => {
  it("webcam 16:9 corta as laterais e centraliza", () => {
    expect(recorteRetrato34(1280, 720)).toEqual({ sx: 370, sy: 0, sw: 540, sh: 720 })
  })
  it("quadro já em 3×4 não corta nada", () => {
    expect(recorteRetrato34(600, 800)).toEqual({ sx: 0, sy: 0, sw: 600, sh: 800 })
  })
  it("quadro mais estreito que 3×4 corta em cima e embaixo", () => {
    expect(recorteRetrato34(480, 960)).toEqual({ sx: 0, sy: 160, sw: 480, sh: 640 })
  })
  it("quadro vazio devolve recorte vazio", () => {
    expect(recorteRetrato34(0, 0)).toEqual({ sx: 0, sy: 0, sw: 0, sh: 0 })
  })
})

describe("tamanhoSaida", () => {
  it("limita a altura a 800 mantendo 3×4", () => {
    expect(tamanhoSaida({ sx: 0, sy: 0, sw: 1620, sh: 2160 })).toEqual({ largura: 600, altura: 800 })
  })
  it("não amplia recortes pequenos", () => {
    expect(tamanhoSaida({ sx: 0, sy: 0, sw: 360, sh: 480 })).toEqual({ largura: 360, altura: 480 })
  })
})
