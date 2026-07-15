import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from "vitest"
import fs from "fs"
import path from "path"
import { DEFAULT, getConfig, saveConfig, resetConfigCache } from "../config"

const TEST_CONFIG_PATH = path.join(process.cwd(), "club.config.json")
let originalConfig: string | null = null

describe("lib/config", () => {
  beforeAll(() => {
    originalConfig = fs.existsSync(TEST_CONFIG_PATH)
      ? fs.readFileSync(TEST_CONFIG_PATH, "utf-8")
      : null
  })

  beforeEach(() => {
    resetConfigCache()
    if (fs.existsSync(TEST_CONFIG_PATH)) {
      fs.unlinkSync(TEST_CONFIG_PATH)
    }
  })

  afterAll(() => {
    resetConfigCache()

    if (originalConfig === null) {
      if (fs.existsSync(TEST_CONFIG_PATH)) {
        fs.unlinkSync(TEST_CONFIG_PATH)
      }
      return
    }

    fs.writeFileSync(TEST_CONFIG_PATH, originalConfig, "utf-8")
  })

  afterEach(() => {
    if (fs.existsSync(TEST_CONFIG_PATH)) {
      fs.unlinkSync(TEST_CONFIG_PATH)
    }
  })

  it("returns DEFAULT when no config file exists", () => {
    const config = getConfig()
    expect(config).toEqual(DEFAULT)
  })

  it("saves and retrieves config", () => {
    saveConfig({ ...DEFAULT, nome: "Teste FC" })
    const config = getConfig()
    expect(config.nome).toBe("Teste FC")
  })

  it("persists whatsapp field", () => {
    saveConfig({ ...DEFAULT, whatsapp: "5511888888888" })
    const config = getConfig()
    expect(config.whatsapp).toBe("5511888888888")
  })

  it("preserves DEFAULT fields when config is partial", () => {
    fs.writeFileSync(TEST_CONFIG_PATH, JSON.stringify({ nome: "Custom" }))
    const config = getConfig()
    expect(config.nome).toBe("Custom")
    expect(config.whatsapp).toBe(DEFAULT.whatsapp)
    expect(config.capacidadeTurma).toBe(DEFAULT.capacidadeTurma)
  })
})
