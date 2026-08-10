import { beforeEach, describe, expect, it, vi } from "vitest"
import type { NextRequest } from "next/server"

import { GET } from "../route"

const fetchMock = vi.fn<typeof fetch>()
vi.stubGlobal("fetch", fetchMock)

function makeRequest(target?: string): NextRequest {
  const nextUrl = new URL("http://localhost/api/escudo")
  if (target !== undefined) nextUrl.searchParams.set("u", target)
  return { nextUrl } as NextRequest
}

function imageResponse(size = 64, contentType = "image/png"): Response {
  return new Response(new Uint8Array(size), {
    status: 200,
    headers: { "Content-Type": contentType },
  })
}

beforeEach(() => {
  fetchMock.mockReset()
})

describe("GET /api/escudo", () => {
  it("exige uma URL absoluta válida", async () => {
    const missing = await GET(makeRequest())
    const invalid = await GET(makeRequest("não é uma URL"))

    expect(missing.status).toBe(400)
    expect(invalid.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    "https://127.0.0.1/assets/images/foto/escudo/1.png",
    "https://admfutsal.com.br.evil.test/assets/images/foto/escudo/1.png",
    "https://user:password@admfutsal.com.br/assets/images/foto/escudo/1.png",
    "https://admfutsal.com.br:8443/assets/images/foto/escudo/1.png",
    "file://admfutsal.com.br/assets/images/foto/escudo/1.png",
    "https://logodetimes.com/times/../admin/logo-secret.png",
    "https://upload.wikimedia.org/not-wikipedia/logo.png",
    "https://admfutsal.com.br/assets/images/foto/escudo%2F..%2Fsecret.png",
  ])("bloqueia destino fora da origem e do caminho permitidos: %s", async (target) => {
    const response = await GET(makeRequest(target))

    expect(response.status).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    [
      "http://www.admfutsal.com.br/assets/images/foto/escudo/1.png",
      "https://admfutsal.com.br/assets/images/foto/escudo/1.png",
    ],
    [
      "https://eventos.admfutsal.com.br/images/foto/escudo/2.png",
      "https://eventos.admfutsal.com.br/images/foto/escudo/2.png",
    ],
    [
      "https://logodetimes.com/times/corinthians/logo-corinthians-256.png",
      "https://logodetimes.com/times/corinthians/logo-corinthians-256.png",
    ],
    [
      "https://upload.wikimedia.org/wikipedia/commons/a/a1/escudo.png",
      "https://upload.wikimedia.org/wikipedia/commons/a/a1/escudo.png",
    ],
  ])("busca escudo permitido em origem HTTPS fixa: %s", async (target, expected) => {
    fetchMock.mockResolvedValueOnce(imageResponse())

    const response = await GET(makeRequest(target))

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledWith(
      expected,
      expect.objectContaining({ redirect: "manual" }),
    )
    expect(response.headers.get("x-content-type-options")).toBe("nosniff")
  })

  it("mantém caminho e query após codificação canônica", async () => {
    fetchMock.mockResolvedValueOnce(imageResponse())

    const response = await GET(
      makeRequest(
        "https://logodetimes.com/times/são-paulo/logo-são-paulo-256.png?size=120&format=png",
      ),
    )

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledWith(
      "https://logodetimes.com/times/s%C3%A3o-paulo/logo-s%C3%A3o-paulo-256.png?size=120&format=png",
      expect.any(Object),
    )
  })

  it("não segue redirecionamento para destino não permitido", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { Location: "http://127.0.0.1/admin" },
      }),
    )

    const response = await GET(
      makeRequest("https://admfutsal.com.br/assets/images/foto/escudo/1.png"),
    )

    expect(response.status).toBe(502)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it("segue redirecionamento relativo somente após revalidar o destino", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { Location: "/assets/images/foto/escudo/2.png" },
        }),
      )
      .mockResolvedValueOnce(imageResponse())

    const response = await GET(
      makeRequest("https://admfutsal.com.br/assets/images/foto/escudo/1.png"),
    )

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "https://admfutsal.com.br/assets/images/foto/escudo/2.png",
    )
  })

  it("rejeita HTML, SVG ativo ou resposta que exceda o limite", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("conteúdo", { headers: { "Content-Type": "text/html" } }))
      .mockResolvedValueOnce(new Response("<svg><script>alert(1)</script></svg>", {
        headers: { "Content-Type": "image/svg+xml" },
      }))
      .mockResolvedValueOnce(
        new Response(null, {
          headers: {
            "Content-Type": "image/png",
            "Content-Length": String(5 * 1024 * 1024 + 1),
          },
        }),
      )

    const target = "https://admfutsal.com.br/assets/images/foto/escudo/1.png"
    expect((await GET(makeRequest(target))).status).toBe(502)
    expect((await GET(makeRequest(target))).status).toBe(502)
    expect((await GET(makeRequest(target))).status).toBe(502)
  })
})
