import { describe, expect, it } from "vitest"
import { accountKey, getClientIp, getClientIpFromHeaders } from "@/lib/client-ip"

const req = (xff?: string) => new Request("http://localhost", { headers: xff ? { "x-forwarded-for": xff } : {} })

describe("getClientIp", () => {
  it("usa o último valor do X-Forwarded-For (o que o proxy confiável acrescentou)", () => {
    expect(getClientIp(req("9.9.9.9, 1.1.1.1, 203.0.113.7"))).toBe("203.0.113.7")
  })

  it("valor forjado pelo cliente não muda a chave", () => {
    expect(getClientIp(req("aleatorio-1, 203.0.113.7"))).toBe(getClientIp(req("aleatorio-2, 203.0.113.7")))
  })

  it("sem cabeçalho devolve unknown", () => {
    expect(getClientIp(req())).toBe("unknown")
  })
})

describe("getClientIpFromHeaders", () => {
  it("segue a mesma regra de getClientIp para quem só tem os cabeçalhos", () => {
    expect(getClientIpFromHeaders(new Headers({ "x-forwarded-for": "9.9.9.9, 203.0.113.7" }))).toBe("203.0.113.7")
    expect(getClientIpFromHeaders(new Headers())).toBe("unknown")
  })
})

describe("accountKey", () => {
  it("normaliza caixa e espaços; não-string vira vazio", () => {
    expect(accountKey("  Admin@Ex.com ")).toBe("admin@ex.com")
    expect(accountKey(undefined)).toBe("")
    expect(accountKey({})).toBe("")
  })
})
