import { describe, expect, it } from "vitest"
import { unstable_getResponseFromNextConfig } from "next/experimental/testing/server"
import nextConfig from "../next.config"

async function getPermissionsPolicy(path: string) {
  const response = await unstable_getResponseFromNextConfig({
    url: `https://escolinha.test${path}`,
    nextConfig,
  })

  return response.headers.get("Permissions-Policy")
}

async function getHeader(path: string, name: string) {
  const response = await unstable_getResponseFromNextConfig({
    url: `https://escolinha.test${path}`,
    nextConfig,
  })
  return response.headers.get(name)
}

describe("cabeçalhos de segurança", () => {
  it("HSTS sem preload (decisão irreversível, só depois de confirmar o domínio)", async () => {
    const hsts = await getHeader("/", "Strict-Transport-Security")
    expect(hsts).toContain("max-age=")
    expect(hsts).not.toMatch(/preload/i)
  })

  it("isola a janela com COOP same-origin", async () => {
    await expect(getHeader("/", "Cross-Origin-Opener-Policy")).resolves.toBe("same-origin")
  })

  it("CSP está em modo Report-Only (não bloqueia) e não há CSP imposta ainda", async () => {
    await expect(getHeader("/", "Content-Security-Policy")).resolves.toBeNull()
    const csp = await getHeader("/horarios", "Content-Security-Policy-Report-Only")
    expect(csp).not.toBeNull()
    for (const trecho of [
      "default-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "report-uri /api/csp-report",
    ]) {
      expect(csp).toContain(trecho)
    }
  })
})

describe("Permissions-Policy", () => {
  it.each(["/", "/frequencia", "/frequencia/scanner/extra", "/alunos", "/alunos/12/carteirinha"])(
    "nega câmera fora das rotas exatas do scanner e da ficha do aluno: %s",
    async (path) => {
      await expect(getPermissionsPolicy(path)).resolves.toBe(
        "camera=(), microphone=(), geolocation=()",
      )
    },
  )

  it("libera a câmera somente para a própria origem na rota do scanner", async () => {
    await expect(
      getPermissionsPolicy("/frequencia/scanner?data=2026-08-10"),
    ).resolves.toBe(
      "camera=(self), microphone=(), geolocation=()",
    )
  })

  it("mantém microfone e geolocalização bloqueados no scanner", async () => {
    const policy = await getPermissionsPolicy("/frequencia/scanner")

    expect(policy).toContain("microphone=()")
    expect(policy).toContain("geolocation=()")
    expect(policy).not.toBe(
      "camera=(), microphone=(), geolocation=()",
    )
  })

  it("libera a câmera na ficha do aluno para tirar a foto", async () => {
    await expect(getPermissionsPolicy("/alunos/12")).resolves.toBe(
      "camera=(self), microphone=(), geolocation=()",
    )
  })
})
