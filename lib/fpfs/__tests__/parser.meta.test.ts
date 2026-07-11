import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import {
  dataPartidaLocal,
  extractTemporadaMeta,
  normalizeEscudoUrl,
} from "@/lib/fpfs/parser"

const htmlClass = readFileSync(
  join(__dirname, "..", "__fixtures__", "evento-920-classificacao.html"),
  "utf-8",
)

describe("extractTemporadaMeta", () => {
  it("le temporada e categoria do HTML da FPFS", () => {
    const m = extractTemporadaMeta(htmlClass)
    expect(m.temporada).toBe(2026)
    // fixture evento-920: página traz Sub-9 (ou similar) no cabeçalho
    expect(m.categoria).toMatch(/^Sub-\d+$/i)
  })
})

describe("normalizeEscudoUrl", () => {
  it("forca https e aceita hosts FPFS", () => {
    expect(
      normalizeEscudoUrl("http://admfutsal.com.br/assets/images/foto/escudo/1.png"),
    ).toMatch(/^https:\/\/admfutsal\.com\.br\//)
  })
  it("rejeita hosts externos", () => {
    expect(normalizeEscudoUrl("https://evil.example/x.png")).toBeNull()
  })
  it("aceita null/vazio", () => {
    expect(normalizeEscudoUrl(null)).toBeNull()
    expect(normalizeEscudoUrl("")).toBeNull()
  })
})

describe("dataPartidaLocal", () => {
  it("aplica hora HH:mm", () => {
    const d = dataPartidaLocal("2026-04-11", "17:30")
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(3)
    expect(d.getDate()).toBe(11)
    expect(d.getHours()).toBe(17)
    expect(d.getMinutes()).toBe(30)
  })
  it("fallback 12:00 sem hora", () => {
    const d = dataPartidaLocal("2026-04-11", null)
    expect(d.getHours()).toBe(12)
    expect(d.getMinutes()).toBe(0)
  })
})
