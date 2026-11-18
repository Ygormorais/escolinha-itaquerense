import { describe, expect, it } from "vitest"
import { coordenadasDoLocal, enderecoEmUmaLinha, rotasDoLocal } from "@/lib/site/mapas"

describe("rotasDoLocal", () => {
  it("usa o endereço em texto quando não há coordenadas", () => {
    const rotas = rotasDoLocal({ endereco: "R. Augusto Carlos Baumann, 588", cidade: "Itaquera — São Paulo/SP" })
    expect(rotas).not.toBeNull()
    const destino = encodeURIComponent("R. Augusto Carlos Baumann, 588, Itaquera — São Paulo/SP")
    expect(rotas!.googleMaps).toBe(`https://www.google.com/maps/dir/?api=1&destination=${destino}`)
    expect(rotas!.waze).toBe(`https://waze.com/ul?q=${destino}&navigate=yes`)
  })

  it("prefere as coordenadas e aceita vírgula decimal", () => {
    const rotas = rotasDoLocal({ endereco: "x", latitude: "-23,5395", longitude: "-46.4571" })
    expect(rotas!.googleMaps).toContain("destination=-23.5395%2C-46.4571")
    expect(rotas!.waze).toBe("https://waze.com/ul?ll=-23.5395%2C-46.4571&navigate=yes")
  })

  it("ignora coordenadas inválidas ou fora do intervalo e cai no endereço", () => {
    const rotas = rotasDoLocal({ endereco: "Rua A, 1", latitude: "abc", longitude: "-46" })
    expect(rotas!.waze).toContain("q=Rua%20A%2C%201")
    expect(coordenadasDoLocal({ latitude: "91", longitude: "0" })).toBeNull()
    expect(coordenadasDoLocal({ latitude: "0", longitude: "181" })).toBeNull()
  })

  it("retorna null sem endereço nem coordenadas", () => {
    expect(rotasDoLocal({ endereco: "  ", cidade: "" })).toBeNull()
    expect(rotasDoLocal({})).toBeNull()
  })

  it("monta o endereço em uma linha sem partes vazias", () => {
    expect(enderecoEmUmaLinha({ endereco: "Rua A, 1", cidade: "" })).toBe("Rua A, 1")
    expect(enderecoEmUmaLinha({ endereco: " ", cidade: "São Paulo/SP" })).toBe("São Paulo/SP")
  })
})
