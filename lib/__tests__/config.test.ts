import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from "vitest"
import fs from "fs"
import os from "os"
import path from "path"
import {
  DEFAULT,
  getConfig,
  saveConfig,
  resetConfigCache,
  resolveClubConfigPath,
} from "../config"

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

  it("persists config in the path selected for the hosting volume", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "escolinha-config-"))
    const configuredPath = path.join(tempDir, "settings", "club.config.json")
    const previousPath = process.env.CLUB_CONFIG_PATH

    try {
      process.env.CLUB_CONFIG_PATH = configuredPath
      resetConfigCache()
      saveConfig({ ...DEFAULT, nome: "Config persistente" })

      expect(resolveClubConfigPath()).toBe(configuredPath)
      expect(JSON.parse(fs.readFileSync(configuredPath, "utf-8")).nome).toBe("Config persistente")
    } finally {
      if (previousPath === undefined) delete process.env.CLUB_CONFIG_PATH
      else process.env.CLUB_CONFIG_PATH = previousPath
      resetConfigCache()
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })
})
