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

describe("Permissions-Policy", () => {
  it.each(["/", "/frequencia", "/frequencia/scanner/extra"])(
    "nega câmera fora da rota exata do scanner: %s",
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
})
