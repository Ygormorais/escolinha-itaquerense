import { describe, expect, it } from "vitest"
import nextConfig from "../../next.config"

describe("next.config — origens de desenvolvimento", () => {
  it("libera 127.0.0.1 e a rede local; sem isso a página abre sem hidratar", () => {
    const origens = nextConfig.allowedDevOrigins ?? []
    expect(origens).toContain("127.0.0.1")
    expect(origens).toContain("192.168.*.*")
  })
})
