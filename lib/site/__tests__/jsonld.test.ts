/* eslint-disable @typescript-eslint/no-explicit-any -- inspeção de JSON-LD arbitrário nos testes */
import { describe, expect, it } from "vitest"
import { DEFAULT } from "@/lib/config"
import {
  montarJsonLdClube,
  montarJsonLdPartidas,
  partesDaCidade,
  serializarJsonLd,
  telefoneE164,
} from "@/lib/site/jsonld"
import type { PartidaLinha } from "@/lib/site/partidas"

const BASE = "https://escolinha.example.com/"

describe("telefoneE164", () => {
  it("normaliza celular com e sem DDI", () => {
    expect(telefoneE164("5511958686579")).toBe("+5511958686579")
    expect(telefoneE164("(11) 95868-6579")).toBe("+5511958686579")
  })
  it("usa o primeiro número válido e devolve null se nenhum serve", () => {
    expect(telefoneE164("", "11958686579")).toBe("+5511958686579")
    expect(telefoneE164("123", undefined)).toBeNull()
  })
})

describe("partesDaCidade", () => {
  it("separa bairro, cidade e UF", () => {
    expect(partesDaCidade("Itaquera — São Paulo/SP")).toEqual({ bairro: "Itaquera", cidade: "São Paulo", uf: "SP" })
    expect(partesDaCidade("Guarulhos/SP")).toEqual({ bairro: undefined, cidade: "Guarulhos", uf: "SP" })
    expect(partesDaCidade("")).toEqual({})
  })
})

describe("montarJsonLdClube", () => {
  it("monta SportsClub com endereço, telefone e imagens absolutas", () => {
    const ld = montarJsonLdClube(DEFAULT, BASE) as Record<string, any>
    expect(ld["@type"]).toEqual(["SportsClub", "SportsActivityLocation"])
    expect(ld.url).toBe("https://escolinha.example.com")
    expect(ld.logo).toBe("https://escolinha.example.com/logo.png")
    expect(ld.image).toBe("https://escolinha.example.com/opengraph-image")
    expect(ld.telephone).toBe("+5511958686579")
    expect(ld.address).toMatchObject({
      streetAddress: "R. Augusto Carlos Baumann, 588",
      addressLocality: "São Paulo",
      addressRegion: "SP",
      addressCountry: "BR",
    })
  })

  it("omite geo e sameAs quando não configurados e inclui quando configurados", () => {
    const sem = montarJsonLdClube(DEFAULT, BASE) as Record<string, any>
    expect(sem.geo).toBeUndefined()
    expect(sem.sameAs).toBeUndefined()

    const com = montarJsonLdClube(
      { ...DEFAULT, latitude: "-23.54", longitude: "-46.45", instagram: "https://instagram.com/clube", facebook: "javascript:alert(1)", youtube: "http://inseguro.example" },
      BASE,
    ) as Record<string, any>
    expect(com.geo).toEqual({ "@type": "GeoCoordinates", latitude: -23.54, longitude: -46.45 })
    expect(com.sameAs).toEqual(["https://instagram.com/clube"])
  })

  it("não carrega dados de alunos ou responsáveis", () => {
    const texto = JSON.stringify(montarJsonLdClube(DEFAULT, BASE))
    expect(texto).not.toMatch(/chavePix|ygorcamisa|template/i)
  })
})

function partida(sobre: Partial<PartidaLinha>): PartidaLinha {
  return {
    id: 1,
    data: "2030-05-10T14:00:00.000Z",
    categoria: "Sub-13",
    competicao: "Copa",
    local: "Casa",
    nosCasa: true,
    casa: "Itaquerense",
    fora: "Rival",
    placar: null,
    resultado: "Proximo",
    escudosAdversario: [],
    href: "/partidas",
    externo: false,
    temSumula: false,
    ...sobre,
  }
}

describe("montarJsonLdPartidas", () => {
  const agora = new Date("2030-01-01T00:00:00Z")

  it("emite SportsEvent só para próximos jogos em casa", () => {
    const eventos = montarJsonLdPartidas(
      [
        partida({ id: 1 }),
        partida({ id: 2, nosCasa: false, local: "Fora" }),
        partida({ id: 3, resultado: "Vitoria", placar: [2, 1] }),
        partida({ id: 4, data: "2029-01-01T00:00:00Z" }),
      ],
      DEFAULT,
      BASE,
      { agora },
    ) as Record<string, any>[]
    expect(eventos).toHaveLength(1)
    expect(eventos[0]["@type"]).toBe("SportsEvent")
    expect(eventos[0].homeTeam.name).toBe("Itaquerense")
    expect(eventos[0].location.address.streetAddress).toContain("Baumann")
  })

  it("respeita o limite e ordena pela data", () => {
    const lista = [3, 1, 2].map((d) => partida({ id: d, data: `2030-0${d}-10T14:00:00.000Z` }))
    const eventos = montarJsonLdPartidas(lista, DEFAULT, BASE, { agora, limite: 2 }) as Record<string, any>[]
    expect(eventos.map((e) => e.startDate)).toEqual(["2030-01-10T14:00:00.000Z", "2030-02-10T14:00:00.000Z"])
  })
})

describe("serializarJsonLd", () => {
  it("escapa < para não fechar o script", () => {
    expect(serializarJsonLd({ a: "</script><b>" })).not.toContain("<")
  })
})
